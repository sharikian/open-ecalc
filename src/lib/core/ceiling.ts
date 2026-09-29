import { airDensity, airPressureAtAltitude, loadedBatteryVoltage, maximumLoadedOperatingPoint } from './physics';
import { resolvePressure } from './linked-inputs';
import type { CeilingResult, MissionInput } from './types';

const GRAVITY = 9.80665;
const MAX_MODEL_ALTITUDE_M = 10_000;

function takeoffMass(input: MissionInput): number {
  return input.airframe.takeoffMassKg ?? (
    input.airframe.emptyMassKg +
    input.airframe.payloadMassKg +
    input.battery.massKg * input.battery.parallel +
    (input.motor.massKg + input.esc.massKg) * input.airframe.rotorCount
  );
}

export function availableThrustAtAltitude(input: MissionInput, altitudeM: number): number {
  const stationPressure = resolvePressure(input.environment);
  const pressure = stationPressure * airPressureAtAltitude(altitudeM) / airPressureAtAltitude(input.environment.altitudeM);
  const density = airDensity(altitudeM, input.environment.temperatureC, pressure);
  if (input.propeller.curve?.length) {
    const maximum = [...input.propeller.curve].sort((a, b) => b.thrustN - a.thrustN)[0];
    const referenceDensity = airDensity(input.environment.altitudeM, input.environment.temperatureC, input.environment.pressurePa);
    const loadedVoltage = loadedBatteryVoltage(input.battery, maximum.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA);
    const voltageFactor = loadedVoltage / Math.max(maximum.voltageV, 0.1);
    return maximum.thrustN * (density / referenceDensity) * voltageFactor ** 2 * input.airframe.rotorCount;
  }

  return maximumLoadedOperatingPoint(input, density).thrustN * input.airframe.rotorCount;
}

function solveCeiling(input: MissionInput, requiredMargin: number): number | null {
  const requiredThrustN = takeoffMass(input) * GRAVITY * requiredMargin;
  const start = Math.max(-500, input.environment.altitudeM);
  if (start > MAX_MODEL_ALTITUDE_M) return null;
  if (availableThrustAtAltitude(input, start) < requiredThrustN) return null;
  if (availableThrustAtAltitude(input, MAX_MODEL_ALTITUDE_M) >= requiredThrustN) return MAX_MODEL_ALTITUDE_M;

  let lower = start;
  let upper = MAX_MODEL_ALTITUDE_M;
  for (let iteration = 0; iteration < 32; iteration += 1) {
    const middle = (lower + upper) / 2;
    if (availableThrustAtAltitude(input, middle) >= requiredThrustN) lower = middle;
    else upper = middle;
  }
  return Math.round(lower);
}

export function estimateCeiling(input: MissionInput, targetMargin = 1.2): CeilingResult {
  const safeMargin = Math.max(1, targetMargin);
  const hoverCeilingM = solveCeiling(input, 1);
  const suggestedCeilingM = solveCeiling(input, safeMargin);
  return {
    hoverCeilingM,
    suggestedCeilingM,
    targetMargin: safeMargin,
    limited: hoverCeilingM === MAX_MODEL_ALTITUDE_M || suggestedCeilingM === MAX_MODEL_ALTITUDE_M
  };
}
