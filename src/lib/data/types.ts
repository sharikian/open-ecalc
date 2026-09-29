export type ComponentKind = 'battery' | 'esc' | 'motor' | 'propeller';
export type DataQuality = 'verified' | 'manufacturer' | 'community' | 'estimated';
export type ComponentProductType = 'battery-pack' | 'motor' | 'propeller' | 'standalone-esc' | 'fc-esc-stack';

export interface Provenance {
  sourceUrl: string;
  licenseSpdx: string;
  retrievedAt: string;
  sourceHash: string;
  quality: DataQuality;
  /** The first upstream URL remains the canonical link for older consumers. */
  sourceUrls?: string[];
  sourceCommit?: string;
  /** Reference-only presets remain available by explicit opt-in, not normal catalog search. */
  referenceOnly?: boolean;
  sourceNote?: string;
  /** Field-level primary-source attribution; facts may have distinct conditions. */
  specificationSources?: Record<string, SpecificationSource>;
  supplementHash?: string;
}

export interface SpecificationSource {
  sourceUrl: string;
  condition?: string;
}

export interface ComponentBase extends Provenance {
  id: string;
  kind: ComponentKind;
  /** Optional for older V1 records; explicit product categories distinguish stacks from ESCs. */
  productType?: ComponentProductType;
  manufacturer: string;
  model: string;
  tags: string[];
  /** Optional local asset; only set when the source licence allows bundling. */
  imageUrl?: string;
  /** Generated category illustration, not a photograph of this exact model. */
  imageType?: 'illustration';
}

export interface BatteryComponent extends ComponentBase {
  kind: 'battery';
  chemistry?: string;
  chemistryLabel?: string;
  capacityAh?: number;
  nominalVoltageV?: number;
  nominalCellVoltageV?: number;
  series?: number;
  cells?: string;
  continuousC?: number;
  burstC?: number;
  internalResistanceOhm?: number;
  massKg?: number;
  cRatingText?: string;
  energyWh?: number;
  connector?: string;
  dimensionsMm?: string;
}

export interface EscComponent extends ComponentBase {
  kind: 'esc';
  continuousCurrentA?: number;
  burstCurrentA?: number;
  resistanceOhm?: number;
  efficiency?: number;
  massKg?: number;
  maxCells?: string;
  escFirmware?: string;
  mcu?: string;
  productNote?: string;
  burstDurationS?: number;
  continuousDurationS?: number;
  minInputVoltageV?: number;
  maxInputVoltageV?: number;
}

export interface MotorComponent extends ComponentBase {
  kind: 'motor';
  kv?: number;
  kvOptions?: number[];
  stator?: string;
  maxCells?: string;
  noLoadCurrentA?: number;
  noLoadCurrentTestVoltageV?: number;
  resistanceOhm?: number;
  resistanceMohmText?: string;
  maxCurrentA?: number;
  maxPowerW?: number;
  massKg?: number;
  poles?: number;
  thermalResistanceCPerW?: number;
  maxThrustN?: number;
  benchCurves?: MotorBenchCurve[];
  statorDimensions?: string;
  shaft?: string;
  mount?: string;
  configuration?: string;
  recommendedProps?: string;
  kvSpecifications?: MotorKvSpecification[];
}

export interface MotorKvSpecification {
  kv: number;
  noLoadCurrentA?: number;
  noLoadCurrentTestVoltageV?: number;
  resistanceOhm?: number;
  maxCurrentA?: number;
  maxCurrentDurationS?: number;
  maxPowerW?: number;
  maxPowerDurationS?: number;
  specificationSources?: Record<string, SpecificationSource>;
}

export interface MotorBenchCurve {
  kv: number;
  propeller: string;
  cells: string;
  conditions?: string;
  points: MotorBenchPoint[];
}

export interface MotorBenchPoint {
  sourcePointIndex: number;
  throttlePercent?: number;
  throttleSourceValue?: string;
  voltageV?: number;
  currentA?: number;
  rpm?: number;
  thrustG?: number;
  thrustN?: number;
  efficiencyGPerW?: number;
}

export interface PropellerComponent extends ComponentBase {
  kind: 'propeller';
  diameterM?: number;
  pitchM?: number;
  bladeCount?: number;
  thrustCoefficient?: number;
  powerCoefficient?: number;
  testCurve?: PropellerTestPoint[];
  massKg?: number;
  mount?: string;
  material?: string;
  suitedMotors?: string[];
}

export interface PropellerTestPoint {
  rpm: number;
  advanceRatio?: number;
  thrustCoefficient: number;
  powerCoefficient: number;
}

export type ComponentRecord = BatteryComponent | EscComponent | MotorComponent | PropellerComponent;

export interface ComponentDatasetV1 {
  schemaVersion: 1;
  name: string;
  version: string;
  generatedAt: string;
  records: ComponentRecord[];
}

export interface ImportIssue {
  row?: number;
  field?: string;
  code: 'invalid' | 'missing' | 'duplicate' | 'unordered-curve' | 'unsupported';
  message: string;
}

export interface ImportReport {
  accepted: ComponentRecord[];
  rejected: number;
  issues: ImportIssue[];
}

export interface ComponentFilter {
  kind?: ComponentKind;
  text?: string;
  manufacturer?: string;
  minQuality?: DataQuality;
  /** Opt into generated reference presets that are excluded from normal searches. */
  includeReference?: boolean;
}

export interface ComponentSummary {
  id: string;
  kind: ComponentKind;
  productType?: ComponentProductType;
  manufacturer: string;
  model: string;
  quality: DataQuality;
  licenseSpdx: string;
  imageUrl?: string;
  imageType?: 'illustration';
}

export type DatasetFormat = 'json' | 'csv' | 'uiuc-dat' | 'test-stand';

export interface DatasetSource {
  format: DatasetFormat;
  content: string;
  sourceUrl: string;
  licenseSpdx: string;
  retrievedAt?: string;
  quality?: DataQuality;
  defaults?: Partial<ComponentRecord>;
}
