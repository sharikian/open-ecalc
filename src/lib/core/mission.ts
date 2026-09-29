import { estimateCeiling, availableThrustAtAltitude } from './ceiling';
import { interpolateOperatingPoint } from './curve';
import {
  airDensity,
  coefficientOperatingPoint,
  electricalLosses,
  findCoefficientOperatingPoint,
  loadedBatteryVoltage,
  maximumLoadedOperatingPoint,
  nominalPackVoltage,
  packCapacityAh
} from './physics';
import type { CurrentScenarioResult, MissionInput, MissionPoint, MissionResult, OperatingPoint } from './types';
import { resolvePressure, takeoffMass } from './linked-inputs';
import { collectWarnings } from './warnings';

const GRAVITY = 9.80665;

function pointAtThrust(input: MissionInput, targetThrustN: number, density: number, voltageV: number): OperatingPoint | null {
  if (input.propeller.curve?.length) return interpolateOperatingPoint(input.propeller.curve, targetThrustN, 'thrustN');
  return findCoefficientOperatingPoint(input.propeller, input.motor, input.esc, density, voltageV, targetThrustN);
}

function stabilizePoint(input: MissionInput, targetThrustN: number, density: number): OperatingPoint | null {
  const nominal = nominalPackVoltage(input.battery);
  if (input.propeller.curve?.length) {
    const point = pointAtThrust(input, targetThrustN, density, nominal);
    if (!point) return null;
    const voltage = loadedBatteryVoltage(input.battery, point.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA);
    // A test at another supply voltage is not automatically valid at this one.
    if (Math.abs(voltage / point.voltageV - 1) > 0.1) throw new RangeError('Measured curve voltage differs from battery voltage');
    return { ...point, voltageV: voltage };
  }
  let lower = 0;
  let upper = nominal;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const voltage = (lower + upper) / 2;
    const point = pointAtThrust(input, targetThrustN, density, voltage);
    if (!point) { lower = voltage; continue; }
    const loaded = loadedBatteryVoltage(input.battery, point.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA);
    if (voltage > loaded) upper = voltage;
    else lower = voltage;
  }
  const point = pointAtThrust(input, targetThrustN, density, upper);
  if (!point) return null;
  const loaded = loadedBatteryVoltage(input.battery, point.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA);
  return Math.abs(upper - loaded) < 0.001 ? { ...point, voltageV: loaded } : null;
}

function asMissionPoint(input: MissionInput, point: OperatingPoint, name: MissionPoint['name']): MissionPoint {
  const totalCurrentA = point.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA;
  return { ...point, name, totalCurrentA, totalPowerW: point.voltageV * totalCurrentA };
}

export function calculateMission(input: MissionInput): MissionResult {
  input = { ...input, environment: { ...input.environment, pressurePa: resolvePressure(input.environment) } };
  if (![input.battery.capacityAh, input.battery.series, input.battery.parallel,
    input.battery.nominalCellVoltageV, input.airframe.rotorCount, input.motor.kv,
    input.propeller.diameterM].every(value => Number.isFinite(value) && value > 0)
    || !Number.isInteger(input.airframe.rotorCount)
    || !Number.isInteger(input.battery.series) || !Number.isInteger(input.battery.parallel)
    || !Number.isFinite(input.battery.usableFraction) || input.battery.usableFraction <= 0 || input.battery.usableFraction > 1
    || !Number.isFinite(input.cruiseSpeedMps) || input.cruiseSpeedMps < 0
    || !Number.isFinite(input.auxiliaryCurrentA) || input.auxiliaryCurrentA < 0) {
    throw new RangeError('Invalid mission inputs or battery units');
  }
  const takeoffMassKg = takeoffMass(input);
  if (!Number.isFinite(takeoffMassKg) || takeoffMassKg <= 0) throw new RangeError('Invalid takeoff mass');
  const density = airDensity(input.environment.altitudeM, input.environment.temperatureC, input.environment.pressurePa);
  const weightN = takeoffMassKg * GRAVITY;
  const thrustPerRotorN = weightN / input.airframe.rotorCount;
  const maximumOpen = input.propeller.curve?.length
    ? [...input.propeller.curve].sort((a, b) => b.thrustN - a.thrustN)[0]
    : coefficientOperatingPoint(input.propeller, input.motor, input.esc, density, nominalPackVoltage(input.battery), 1);
  const maximum = input.propeller.curve?.length
    ? { ...maximumOpen, voltageV: loadedBatteryVoltage(input.battery, maximumOpen.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA) }
    : maximumLoadedOperatingPoint(input, density);
  const maximumLoadedVoltage = maximum.voltageV;

  const definitions: Array<[MissionPoint['name'], number]> = [['hover', 1], ['cruise', 1.15], ['climb', 1.5]];
  const points = definitions.map(([name, multiplier]) => {
    const resolved = stabilizePoint(input, thrustPerRotorN * multiplier, density);
    if (!resolved || resolved.voltageV <= 0 || resolved.currentA <= 0) {
      throw new RangeError(`Insufficient thrust or battery voltage for ${name}`);
    }
    return asMissionPoint(input, resolved, name);
  });
  const hover = points[0];
  const cruise = points[1];
  const loadedVoltageV = hover.voltageV;
  const usableAh = packCapacityAh(input.battery) * Math.min(1, Math.max(0, input.battery.usableFraction));
  const flightTimeMin = hover.totalCurrentA > 0 ? usableAh / hover.totalCurrentA * 60 : 0;
  const cruiseHours = cruise.totalCurrentA > 0 ? usableAh / cruise.totalCurrentA : 0;
  const rangeKm = cruiseHours * input.cruiseSpeedMps * 3.6;
  const totalAvailableThrustN = availableThrustAtAltitude(input, input.environment.altitudeM);
  const thrustToWeight = totalAvailableThrustN / weightN;
  const losses = electricalLosses(input.battery, input.esc, input.motor, hover.currentA, input.airframe.rotorCount);
  const auxiliaryW = input.auxiliaryCurrentA * loadedVoltageV;
  const propulsiveW = Math.max(0, hover.totalPowerW - losses.batteryLossW - losses.escLossW - losses.motorLossW - auxiliaryW);
  const motorLossPerMotorW = losses.motorLossW / input.airframe.rotorCount;
  const motorTemperatureC = input.motor.thermalResistanceCPerW == null
    ? null
    : input.environment.temperatureC + motorLossPerMotorW * input.motor.thermalResistanceCPerW;
  const ceiling = estimateCeiling(input, input.targetThrustMargin);
  const warnings = collectWarnings(input, maximum, maximumLoadedVoltage, totalAvailableThrustN, weightN * input.targetThrustMargin);
  const speedProfile = [0, 0.5, 1, 1.5].map((factor) => {
    const speedMps = input.cruiseSpeedMps * factor;
    const currentA = factor === 0 ? hover.totalCurrentA : cruise.totalCurrentA;
    const timeMin = currentA > 0 ? usableAh / currentA * 60 : 0;
    return { speedMps, flightTimeMin: Math.max(0, timeMin), rangeKm: Math.max(0, timeMin / 60 * speedMps * 3.6) };
  });
  const profileStart = Math.max(-500, input.environment.altitudeM);
  const profileEnd = Math.max(profileStart + 1, Math.min(10_000, ceiling.hoverCeilingM ?? profileStart + 3000));
  const altitudeProfile = Array.from({ length: 6 }, (_, index) => {
    const altitudeM = profileStart + (profileEnd - profileStart) * index / 5;
    const available = availableThrustAtAltitude(input, altitudeM);
    return { altitudeM, availableThrustN: Math.max(0, available), thrustMargin: weightN > 0 ? available / weightN - 1 : 0 };
  });

  return {
    takeoffMassKg,
    airDensityKgM3: density,
    loadedVoltageV,
    flightTimeMin: Math.max(0, flightTimeMin),
    rangeKm: Math.max(0, rangeKm),
    ceilingM: ceiling.suggestedCeilingM,
    hoverCeilingM: ceiling.hoverCeilingM,
    thrustToWeight,
    thrustMargin: thrustToWeight - 1,
    specificThrustGPerW: hover.totalPowerW > 0 ? takeoffMassKg * 1000 / hover.totalPowerW : 0,
    totalPowerW: hover.totalPowerW,
    motorTemperatureC,
    points,
    speedProfile,
    altitudeProfile,
    power: { propulsiveW, ...losses, auxiliaryW },
    warnings,
    currentScenarios: calculateCurrentScenarios(input)
  };
}

/** Constant-current comparisons; these never replace the aerodynamic operating points. */
export function calculateCurrentScenarios(input: MissionInput): CurrentScenarioResult[] {
  return (input.currentScenariosA ?? []).map(currentPerMotorA => {
    if (!Number.isFinite(currentPerMotorA) || currentPerMotorA <= 0) throw new RangeError('Invalid motor scenario current');
    const totalCurrentA = currentPerMotorA * input.airframe.rotorCount + input.auxiliaryCurrentA;
    const loadedVoltageV = loadedBatteryVoltage(input.battery, totalCurrentA);
    const usableAh = packCapacityAh(input.battery) * input.battery.usableFraction;
    const flightTimeMin = loadedVoltageV > 0 ? usableAh / totalCurrentA * 60 : 0;
    const point: OperatingPoint = { currentA: currentPerMotorA, voltageV: loadedVoltageV, thrustN: 0, throttle: 0, rpm: 0 };
    const warnings = collectWarnings(input, point, loadedVoltageV, Infinity, 0)
      .filter(warning => ['battery-continuous-current', 'battery-burst-current', 'esc-continuous-current', 'esc-burst-current', 'motor-current', 'motor-power', 'voltage-sag'].includes(warning.code));
    return { currentPerMotorA, totalCurrentA, loadedVoltageV, flightTimeMin, rangeKm: flightTimeMin / 60 * input.cruiseSpeedMps * 3.6, warnings };
  });
}
