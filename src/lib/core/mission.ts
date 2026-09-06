import { estimateCeiling, availableThrustAtAltitude } from './ceiling';
import { interpolateOperatingPoint } from './curve';
import {
  airDensity,
  coefficientOperatingPoint,
  electricalLosses,
  findCoefficientOperatingPoint,
  loadedBatteryVoltage,
  nominalPackVoltage,
  packCapacityAh
} from './physics';
import type { MissionInput, MissionPoint, MissionResult, OperatingPoint } from './types';
import { collectWarnings } from './warnings';

const GRAVITY = 9.80665;

function mass(input: MissionInput): number {
  return input.airframe.takeoffMassKg ?? (
    input.airframe.emptyMassKg + input.airframe.payloadMassKg +
    input.battery.massKg * input.battery.parallel +
    (input.motor.massKg + input.esc.massKg) * input.airframe.rotorCount
  );
}

function pointAtThrust(input: MissionInput, targetThrustN: number, density: number, voltageV: number): OperatingPoint | null {
  if (input.propeller.curve?.length) return interpolateOperatingPoint(input.propeller.curve, targetThrustN, 'thrustN');
  return findCoefficientOperatingPoint(input.propeller, input.motor, input.esc, density, voltageV, targetThrustN);
}

function stabilizePoint(input: MissionInput, targetThrustN: number, density: number): OperatingPoint | null {
  let voltage = nominalPackVoltage(input.battery);
  let point = pointAtThrust(input, targetThrustN, density, voltage);
  for (let iteration = 0; point && iteration < 3; iteration += 1) {
    voltage = loadedBatteryVoltage(input.battery, point.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA);
    point = pointAtThrust(input, targetThrustN, density, voltage);
  }
  return point ? { ...point, voltageV: voltage } : null;
}

function asMissionPoint(input: MissionInput, point: OperatingPoint, name: MissionPoint['name']): MissionPoint {
  const totalCurrentA = point.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA;
  return { ...point, name, totalCurrentA, totalPowerW: point.voltageV * totalCurrentA };
}

export function calculateMission(input: MissionInput): MissionResult {
  const takeoffMassKg = mass(input);
  const density = airDensity(input.environment.altitudeM, input.environment.temperatureC, input.environment.pressurePa);
  const weightN = takeoffMassKg * GRAVITY;
  const thrustPerRotorN = weightN / input.airframe.rotorCount;
  const maximumOpen = input.propeller.curve?.length
    ? [...input.propeller.curve].sort((a, b) => b.thrustN - a.thrustN)[0]
    : coefficientOperatingPoint(input.propeller, input.motor, input.esc, density, nominalPackVoltage(input.battery), 1);
  const maximumLoadedVoltage = loadedBatteryVoltage(input.battery, maximumOpen.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA);
  const maximum = input.propeller.curve?.length
    ? { ...maximumOpen, voltageV: maximumLoadedVoltage }
    : coefficientOperatingPoint(input.propeller, input.motor, input.esc, density, maximumLoadedVoltage, 1);

  const definitions: Array<[MissionPoint['name'], number]> = [['hover', 1], ['cruise', 1.15], ['climb', 1.5]];
  const points = definitions.map(([name, multiplier]) => {
    const resolved = stabilizePoint(input, thrustPerRotorN * multiplier, density) ?? maximum;
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
    power: { propulsiveW, ...losses, auxiliaryW },
    warnings
  };
}

