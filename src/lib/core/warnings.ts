import { batteryCurrentLimitA, nominalPackVoltage } from './physics';
import type { CalculationWarning, MissionInput, OperatingPoint } from './types';

export function collectWarnings(
  input: MissionInput,
  maximum: OperatingPoint,
  loadedVoltageV: number,
  availableThrustN: number,
  requiredThrustN: number
): CalculationWarning[] {
  const warnings: CalculationWarning[] = [];
  const totalCurrentA = maximum.currentA * input.airframe.rotorCount + input.auxiliaryCurrentA;
  const batteryContinuousA = batteryCurrentLimitA(input.battery);
  const batteryBurstA = batteryCurrentLimitA(input.battery, true);
  if (totalCurrentA > batteryContinuousA) warnings.push({ code: 'battery-continuous-current', severity: totalCurrentA > batteryBurstA ? 'critical' : 'warning', value: totalCurrentA, limit: batteryContinuousA });
  if (totalCurrentA > batteryBurstA) warnings.push({ code: 'battery-burst-current', severity: 'critical', value: totalCurrentA, limit: batteryBurstA });
  if (maximum.currentA > input.esc.continuousCurrentA) warnings.push({ code: 'esc-continuous-current', severity: maximum.currentA > input.esc.burstCurrentA ? 'critical' : 'warning', value: maximum.currentA, limit: input.esc.continuousCurrentA });
  if (maximum.currentA > input.esc.burstCurrentA) warnings.push({ code: 'esc-burst-current', severity: 'critical', value: maximum.currentA, limit: input.esc.burstCurrentA });
  if (maximum.currentA > input.motor.maxCurrentA) warnings.push({ code: 'motor-current', severity: 'critical', value: maximum.currentA, limit: input.motor.maxCurrentA });
  const motorPowerW = maximum.currentA * maximum.voltageV;
  if (motorPowerW > input.motor.maxPowerW) warnings.push({ code: 'motor-power', severity: 'critical', value: motorPowerW, limit: input.motor.maxPowerW });
  if (loadedVoltageV < nominalPackVoltage(input.battery) * 0.85) warnings.push({ code: 'voltage-sag', severity: loadedVoltageV < nominalPackVoltage(input.battery) * 0.7 ? 'critical' : 'warning', value: loadedVoltageV, limit: nominalPackVoltage(input.battery) * 0.85 });
  if (availableThrustN < requiredThrustN) warnings.push({ code: 'insufficient-thrust', severity: 'critical', value: availableThrustN, limit: requiredThrustN });

  const spacing = input.airframe.rotorCount === 4
    ? input.airframe.frameSizeM / Math.SQRT2
    : input.airframe.frameSizeM;
  const clearance = spacing - input.propeller.diameterM;
  if (input.airframe.layout === 'flat' && clearance < 0.012) warnings.push({ code: 'propeller-clearance', severity: clearance < 0 ? 'critical' : 'warning', value: clearance, limit: 0.012 });
  if (input.motor.thermalResistanceCPerW == null) warnings.push({ code: 'missing-thermal-data', severity: 'info' });
  return warnings;
}

