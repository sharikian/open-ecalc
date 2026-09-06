export type ComponentKind = 'battery' | 'esc' | 'motor' | 'propeller';
export type DataQuality = 'verified' | 'manufacturer' | 'community' | 'estimated';

export interface Provenance {
  sourceUrl: string;
  licenseSpdx: string;
  retrievedAt: string;
  sourceHash: string;
  quality: DataQuality;
}

export interface ComponentBase extends Provenance {
  id: string;
  kind: ComponentKind;
  manufacturer: string;
  model: string;
  tags: string[];
}

export interface BatteryComponent extends ComponentBase {
  kind: 'battery';
  chemistry: 'LiPo' | 'Li-ion' | 'LiFePO4';
  capacityAh: number;
  nominalVoltageV: number;
  continuousC: number;
  burstC?: number;
  internalResistanceOhm: number;
  massKg: number;
}

export interface EscComponent extends ComponentBase {
  kind: 'esc';
  continuousCurrentA: number;
  burstCurrentA: number;
  resistanceOhm: number;
  efficiency: number;
  massKg: number;
}

export interface MotorComponent extends ComponentBase {
  kind: 'motor';
  kv: number;
  noLoadCurrentA: number;
  resistanceOhm: number;
  maxCurrentA: number;
  maxPowerW: number;
  massKg: number;
  poles?: number;
  thermalResistanceCPerW?: number;
}

export interface PropellerComponent extends ComponentBase {
  kind: 'propeller';
  diameterM: number;
  pitchM: number;
  bladeCount: number;
  thrustCoefficient?: number;
  powerCoefficient?: number;
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
}

export interface ComponentSummary {
  id: string;
  kind: ComponentKind;
  manufacturer: string;
  model: string;
  quality: DataQuality;
  licenseSpdx: string;
}

