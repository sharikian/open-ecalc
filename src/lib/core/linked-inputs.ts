import type { Battery, Environment, MissionInput } from './types';
import { airPressureAtAltitude } from './physics';

export function pressureMode(environment: Environment): 'auto' | 'manual' {
  return environment.pressureMode ?? (environment.pressurePa != null ? 'manual' : 'auto');
}

export function resolvePressure(environment: Environment): number {
  if (pressureMode(environment) === 'auto') return airPressureAtAltitude(environment.altitudeM);
  if (!Number.isFinite(environment.pressurePa) || environment.pressurePa! <= 0) throw new RangeError('Invalid station pressure');
  return environment.pressurePa!;
}

export function nominalCellVoltage(chemistry: Battery['chemistry']): number {
  return chemistry === 'LiFePO4' ? 3.2 : chemistry === 'Li-ion' ? 3.6 : 3.7;
}

export function setPackVoltage(battery: Battery, packVoltageV: number): Battery {
  return { ...battery, nominalCellVoltageV: Number.isInteger(battery.series) && battery.series > 0 && Number.isFinite(packVoltageV)
    ? packVoltageV / battery.series : NaN };
}

export function takeoffMass(input: MissionInput): number {
  return input.airframe.takeoffMassKg ?? (input.airframe.emptyMassKg + input.airframe.payloadMassKg
    + input.battery.massKg * input.battery.parallel + (input.motor.massKg + input.esc.massKg) * input.airframe.rotorCount);
}

const positive = (n: number) => Number.isFinite(n) && n > 0;
const nonnegative = (n: number) => Number.isFinite(n) && n >= 0;
const integer = (n: number) => positive(n) && Number.isInteger(n);

export function missionStepReady(input: MissionInput, step: number): boolean {
  if (step === 0) return positive(input.airframe.emptyMassKg) && nonnegative(input.airframe.payloadMassKg)
    && integer(input.airframe.rotorCount) && positive(input.airframe.frameSizeM);
  if (step === 1) {
    try { resolvePressure(input.environment); } catch { return false; }
    return Number.isFinite(input.environment.altitudeM) && input.environment.altitudeM >= -500 && input.environment.altitudeM <= 11000
      && Number.isFinite(input.environment.temperatureC) && input.environment.temperatureC > -273.15 && nonnegative(input.cruiseSpeedMps);
  }
  if (step === 2) return [input.battery.capacityAh, input.battery.nominalCellVoltageV, input.battery.continuousC, input.battery.usableFraction, input.battery.massKg].every(positive)
    && integer(input.battery.series) && integer(input.battery.parallel) && nonnegative(input.battery.internalResistanceOhm) && input.battery.usableFraction <= 1;
  return [input.motor.kv, input.motor.maxCurrentA, input.motor.maxPowerW, input.esc.continuousCurrentA, input.esc.burstCurrentA,
    input.esc.efficiency, input.propeller.diameterM, input.propeller.pitchM, input.motor.massKg, input.esc.massKg].every(positive)
    && [input.motor.noLoadCurrentA, input.motor.resistanceOhm, input.esc.resistanceOhm, input.auxiliaryCurrentA].every(nonnegative)
    && input.esc.efficiency <= 1 && input.esc.burstCurrentA >= input.esc.continuousCurrentA
    && (input.currentScenariosA ?? []).every(positive);
}
