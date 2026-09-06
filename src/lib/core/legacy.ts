import type { LegacyInput, LegacyResult } from './types';

const LEGACY_AUXILIARY_CURRENT_A = 1;
const LEGACY_USABLE_FRACTION = 0.8;

export function calculateLegacyExcel(input: LegacyInput): LegacyResult {
  const takeoffMassG = input.emptyMassG + input.payloadMassG + input.batteryMassG * input.batteryParallel;
  const packCapacityAh = input.cellCapacityAh * input.batteryParallel;
  const speedKmh = input.speedMps * 3.6;

  const points = input.currentPerMotorA.map((currentPerMotorA) => {
    const totalCurrentA = currentPerMotorA * input.rotorCount;
    const rawTimeMin = (packCapacityAh / (totalCurrentA + LEGACY_AUXILIARY_CURRENT_A)) * 60;
    return {
      totalCurrentA,
      rawTimeMin,
      usableTimeMin: rawTimeMin * LEGACY_USABLE_FRACTION,
      rangeKm: (packCapacityAh / (totalCurrentA + LEGACY_AUXILIARY_CURRENT_A)) * speedKmh
    };
  });

  return {
    takeoffMassG,
    packCapacityAh,
    speedKmh,
    cruiseThrustG: takeoffMassG * 1.5,
    climbThrustG: takeoffMassG * 2,
    emergencyThrustG: takeoffMassG * 2.2,
    points
  };
}
