export interface Airframe {
  emptyMassKg: number;
  payloadMassKg: number;
  takeoffMassKg?: number;
  rotorCount: number;
  layout: 'flat' | 'coaxial';
  frameSizeM: number;
}

export interface Environment {
  altitudeM: number;
  temperatureC: number;
  pressurePa?: number;
  pressureMode?: 'auto' | 'manual';
}

export interface Battery {
  chemistry: 'LiPo' | 'Li-ion' | 'LiFePO4';
  capacityAh: number;
  series: number;
  parallel: number;
  nominalCellVoltageV: number;
  internalResistanceOhm: number;
  continuousC: number;
  burstC?: number;
  massKg: number;
  usableFraction: number;
}

export interface ESC {
  continuousCurrentA: number;
  burstCurrentA: number;
  resistanceOhm: number;
  efficiency: number;
  massKg: number;
}

export interface Motor {
  kv: number;
  noLoadCurrentA: number;
  resistanceOhm: number;
  maxCurrentA: number;
  maxPowerW: number;
  maxCurrentDurationS?: number;
  maxPowerDurationS?: number;
  noLoadCurrentTestVoltageV?: number;
  massKg: number;
  poles?: number;
  thermalResistanceCPerW?: number;
}

export interface Propeller {
  diameterM: number;
  pitchM: number;
  bladeCount: number;
  thrustCoefficient?: number;
  powerCoefficient?: number;
  curve?: OperatingPoint[];
}

export interface OperatingPoint {
  throttle: number;
  thrustN: number;
  currentA: number;
  voltageV: number;
  rpm: number;
  efficiency?: number;
}

export interface MissionInput {
  airframe: Airframe;
  environment: Environment;
  battery: Battery;
  esc: ESC;
  motor: Motor;
  propeller: Propeller;
  cruiseSpeedMps: number;
  auxiliaryCurrentA: number;
  targetThrustMargin: number;
  currentScenariosA?: number[];
}

export interface CurrentScenarioResult {
  currentPerMotorA: number;
  totalCurrentA: number;
  loadedVoltageV: number;
  flightTimeMin: number;
  rangeKm: number;
  warnings: CalculationWarning[];
}

export type WarningCode =
  | 'battery-continuous-current'
  | 'battery-burst-current'
  | 'esc-continuous-current'
  | 'esc-burst-current'
  | 'motor-current'
  | 'motor-power'
  | 'propeller-clearance'
  | 'voltage-sag'
  | 'insufficient-thrust'
  | 'curve-range'
  | 'missing-thermal-data';

export interface CalculationWarning {
  code: WarningCode;
  severity: 'info' | 'warning' | 'critical';
  value?: number;
  limit?: number;
}

export interface MissionPoint extends OperatingPoint {
  name: 'hover' | 'cruise' | 'climb';
  totalPowerW: number;
  totalCurrentA: number;
}

export interface PowerBreakdown {
  propulsiveW: number;
  motorLossW: number;
  escLossW: number;
  batteryLossW: number;
  auxiliaryW: number;
}

export interface SpeedProfilePoint {
  speedMps: number;
  flightTimeMin: number;
  rangeKm: number;
}

export interface AltitudeProfilePoint {
  altitudeM: number;
  availableThrustN: number;
  thrustMargin: number;
}

export interface MissionResult {
  takeoffMassKg: number;
  airDensityKgM3: number;
  loadedVoltageV: number;
  flightTimeMin: number;
  rangeKm: number;
  ceilingM: number | null;
  hoverCeilingM: number | null;
  thrustToWeight: number;
  thrustMargin: number;
  specificThrustGPerW: number;
  totalPowerW: number;
  motorTemperatureC: number | null;
  points: MissionPoint[];
  speedProfile: SpeedProfilePoint[];
  altitudeProfile: AltitudeProfilePoint[];
  power: PowerBreakdown;
  warnings: CalculationWarning[];
  currentScenarios: CurrentScenarioResult[];
}

export interface LegacyInput {
  emptyMassG: number;
  payloadMassG: number;
  batteryMassG: number;
  batteryParallel: number;
  cellCapacityAh: number;
  rotorCount: number;
  speedMps: number;
  currentPerMotorA: number[];
}

export interface LegacyPointResult {
  totalCurrentA: number;
  rawTimeMin: number;
  usableTimeMin: number;
  rangeKm: number;
}

export interface LegacyResult {
  takeoffMassG: number;
  packCapacityAh: number;
  speedKmh: number;
  cruiseThrustG: number;
  climbThrustG: number;
  emergencyThrustG: number;
  points: LegacyPointResult[];
}

export interface CeilingResult {
  hoverCeilingM: number | null;
  suggestedCeilingM: number | null;
  targetMargin: number;
  limited: boolean;
}

export interface ProjectFileV1 {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  units: 'metric' | 'imperial';
  input: MissionInput;
}
