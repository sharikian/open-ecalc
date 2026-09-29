import { describe, expect, it } from 'vitest';
import { calculateMission } from './mission';
import { DEFAULT_MISSION_INPUT } from './presets';

describe('public eCalc scenario comparison', () => {
  it('predicts the observed hover point without using a measured curve', () => {
    const input = structuredClone(DEFAULT_MISSION_INPUT);
    input.airframe.takeoffMassKg = 0.85;
    input.airframe.frameSizeM = 0.4;
    input.battery = { ...input.battery, capacityAh: 5, series: 3, parallel: 1,
      internalResistanceOhm: 0.0026 * 3, usableFraction: 0.85, massKg: 0.429 };
    input.motor = { ...input.motor, kv: 862, noLoadCurrentA: 0.83,
      resistanceOhm: 0.131, massKg: 0.061, maxPowerW: 150 };
    input.esc.resistanceOhm = 0.008;
    input.propeller = { diameterM: 0.254, pitchM: 0.11938, bladeCount: 2,
      thrustCoefficient: 0.1, powerCoefficient: 0.05 };
    input.auxiliaryCurrentA = 0;
    const result = calculateMission(input);
    const hover = result.points[0];
    // Independent generic coefficients, not fitted to the eCalc observation.
    // This tolerance applies only to this documented scenario.
    expect(Math.abs(hover.totalCurrentA / 8.39 - 1)).toBeLessThan(0.2);
    expect(Math.abs(hover.rpm / 4047 - 1)).toBeLessThan(0.2);
    expect(Math.abs(result.flightTimeMin / 30.4 - 1)).toBeLessThan(0.2);
    console.info('Independent coefficient benchmark:', JSON.stringify({
      currentA: hover.totalCurrentA, rpm: hover.rpm, flightTimeMin: result.flightTimeMin
    }));
  });
});
