import type { Battery, ESC, MissionInput, Motor, OperatingPoint, Propeller } from './types';

const STANDARD_PRESSURE_PA = 101_325;
const STANDARD_TEMPERATURE_K = 288.15;
const LAPSE_RATE_K_PER_M = 0.0065;
const GRAVITY = 9.80665;
const AIR_GAS_CONSTANT = 287.05287;

export function airPressureAtAltitude(altitudeM: number): number {
  if (!Number.isFinite(altitudeM) || altitudeM < -500 || altitudeM > 11000) throw new RangeError('Altitude outside atmosphere model');
  return STANDARD_PRESSURE_PA * Math.pow(
    1 - (LAPSE_RATE_K_PER_M * altitudeM) / STANDARD_TEMPERATURE_K,
    GRAVITY / (AIR_GAS_CONSTANT * LAPSE_RATE_K_PER_M)
  );
}

export function airDensity(altitudeM: number, temperatureC: number, pressurePa?: number): number {
  const pressure = pressurePa && pressurePa > 0 ? pressurePa : airPressureAtAltitude(altitudeM);
  const temperatureK = Math.max(150, temperatureC + 273.15);
  return pressure / (AIR_GAS_CONSTANT * temperatureK);
}

export function nominalPackVoltage(battery: Battery): number {
  return battery.nominalCellVoltageV * battery.series;
}

export function packCapacityAh(battery: Battery): number {
  return battery.capacityAh * battery.parallel;
}

export function batteryCurrentLimitA(battery: Battery, burst = false): number {
  const rating = burst ? (battery.burstC ?? battery.continuousC) : battery.continuousC;
  return packCapacityAh(battery) * rating;
}

export function loadedBatteryVoltage(battery: Battery, totalCurrentA: number): number {
  const resistance = battery.internalResistanceOhm / Math.max(1, battery.parallel);
  return Math.max(0, nominalPackVoltage(battery) - totalCurrentA * resistance);
}

export function electricalLosses(
  battery: Battery,
  esc: ESC,
  motor: Motor,
  currentPerMotorA: number,
  rotorCount: number
): { batteryLossW: number; escLossW: number; motorLossW: number } {
  const totalCurrentA = currentPerMotorA * rotorCount;
  return {
    batteryLossW: totalCurrentA ** 2 * (battery.internalResistanceOhm / Math.max(1, battery.parallel)),
    escLossW: currentPerMotorA ** 2 * esc.resistanceOhm * rotorCount,
    motorLossW: currentPerMotorA ** 2 * motor.resistanceOhm * rotorCount
  };
}

export function coefficientOperatingPoint(
  propeller: Propeller,
  motor: Motor,
  esc: ESC,
  densityKgM3: number,
  voltageV: number,
  throttle: number
): OperatingPoint {
  const boundedThrottle = Math.max(0, Math.min(1, throttle));
  const rpm = motor.kv * voltageV * boundedThrottle;
  const revolutionsPerSecond = rpm / 60;
  const diameter = propeller.diameterM;
  const thrustCoefficient = propeller.thrustCoefficient ?? 0.1;
  const powerCoefficient = propeller.powerCoefficient ?? 0.05;
  const thrustN = thrustCoefficient * densityKgM3 * revolutionsPerSecond ** 2 * diameter ** 4;
  const shaftPowerW = powerCoefficient * densityKgM3 * revolutionsPerSecond ** 3 * diameter ** 5;
  const electricalPowerW = shaftPowerW / Math.max(0.5, esc.efficiency);
  const currentA = voltageV > 0 ? electricalPowerW / voltageV + motor.noLoadCurrentA * boundedThrottle : 0;
  const efficiency = electricalPowerW > 0 ? thrustN / electricalPowerW : 0;
  return { throttle: boundedThrottle, thrustN, currentA, voltageV, rpm, efficiency };
}

export function findCoefficientOperatingPoint(
  propeller: Propeller,
  motor: Motor,
  esc: ESC,
  densityKgM3: number,
  voltageV: number,
  targetThrustN: number
): OperatingPoint | null {
  const maximum = coefficientOperatingPoint(propeller, motor, esc, densityKgM3, voltageV, 1);
  if (targetThrustN < 0 || targetThrustN > maximum.thrustN) return null;
  const throttle = maximum.thrustN > 0 ? Math.sqrt(targetThrustN / maximum.thrustN) : 0;
  return coefficientOperatingPoint(propeller, motor, esc, densityKgM3, voltageV, throttle);
}

/** Solve terminal voltage and maximum-load current together, rather than using open-circuit current once. */
export function maximumLoadedOperatingPoint(input: MissionInput, densityKgM3: number): OperatingPoint {
  let lower = 0;
  let upper = nominalPackVoltage(input.battery);
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const voltage = (lower + upper) / 2;
    const point = coefficientOperatingPoint(input.propeller, input.motor, input.esc, densityKgM3, voltage, 1);
    const loaded = loadedBatteryVoltage(input.battery, point.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA);
    if (voltage > loaded) upper = voltage;
    else lower = voltage;
  }
  return coefficientOperatingPoint(input.propeller, input.motor, input.esc, densityKgM3, (lower + upper) / 2, 1);
}
