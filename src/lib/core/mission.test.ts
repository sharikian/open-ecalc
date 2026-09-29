import { describe, expect, it } from 'vitest';
import { estimateCeiling } from './ceiling';
import { CurveRangeError, interpolateOperatingPoint } from './curve';
import { calculateMission } from './mission';
import { DEFAULT_MISSION_INPUT } from './presets';
import type { MissionInput } from './types';

function mission(change: (input: MissionInput) => void = () => {}): MissionInput {
  const input = structuredClone(DEFAULT_MISSION_INPUT);
  change(input);
  return input;
}

describe('mission properties', () => {
  it('matches eCalc endurance using the observed hover operating point', () => {
    const input = mission(value => {
      value.airframe.takeoffMassKg = 0.85;
      value.battery.capacityAh = 5;
      value.battery.usableFraction = 0.85;
      value.battery.series = 3;
      value.auxiliaryCurrentA = 0;
      value.propeller.curve = [
        { throttle: 0.1, thrustN: 0.1, currentA: 0.2, voltageV: 11.02, rpm: 1000 },
        { throttle: 0.48, thrustN: 0.85 * 9.80665 / 4, currentA: 8.39 / 4, voltageV: 11.02, rpm: 4047 },
        { throttle: 1, thrustN: 6.25, currentA: 10.78, voltageV: 10.68, rpm: 7883 }
      ];
    });
    expect(calculateMission(input).flightTimeMin).toBeCloseTo(30.4, 1);
  });

  it('does not return a flight duration for an aircraft that cannot hover', () => {
    expect(() => calculateMission(mission(value => { value.airframe.payloadMassKg = 1000; }))).toThrow(/Insufficient/);
  });

  it('rejects a usable fraction entered as a percentage rather than a ratio', () => {
    expect(() => calculateMission(mission(value => { value.battery.usableFraction = 80; }))).toThrow(RangeError);
  });
  it('never reduces endurance when capacity grows at fixed mass', () => {
    const base = calculateMission(mission());
    const larger = calculateMission(mission((input) => { input.battery.capacityAh *= 1.5; }));
    expect(larger.flightTimeMin).toBeGreaterThanOrEqual(base.flightTimeMin);
  });

  it('does not improve ceiling when payload grows', () => {
    const base = calculateMission(mission());
    const heavy = calculateMission(mission((input) => { input.airframe.payloadMassKg += 1; }));
    expect(heavy.ceilingM ?? -1).toBeLessThanOrEqual(base.ceilingM ?? -1);
    expect(heavy.flightTimeMin).toBeLessThanOrEqual(base.flightTimeMin);
  });

  it('produces finite non-negative scalar results', () => {
    const result = calculateMission(mission());
    for (const value of [result.takeoffMassKg, result.airDensityKgM3, result.loadedVoltageV, result.flightTimeMin, result.rangeKm, result.totalPowerW]) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns engineering profiles for speed and altitude charts', () => {
    const result = calculateMission(mission());
    expect(result.speedProfile).toHaveLength(4);
    expect(result.speedProfile[0].speedMps).toBe(0);
    expect(result.speedProfile.every((point) => point.flightTimeMin >= 0 && point.rangeKm >= 0)).toBe(true);
    expect(result.altitudeProfile).toHaveLength(6);
    expect(result.altitudeProfile[0].altitudeM).toBeLessThan(result.altitudeProfile.at(-1)!.altitudeM);
    expect(result.altitudeProfile.every((point) => Number.isFinite(point.availableThrustN) && Number.isFinite(point.thrustMargin))).toBe(true);
  });

  it('rejects a point beyond a measured curve', () => {
    const curve = [
      { throttle: 0.4, thrustN: 4, currentA: 2, voltageV: 12, rpm: 4000 },
      { throttle: 0.8, thrustN: 10, currentA: 8, voltageV: 11, rpm: 7600 }
    ];
    expect(() => interpolateOperatingPoint(curve, 11)).toThrow(CurveRangeError);
  });
});

describe('ceiling solver', () => {
  it('returns ordered hover and recommended ceilings', () => {
    const result = estimateCeiling(mission(), 1.2);
    expect(result.hoverCeilingM).not.toBeNull();
    expect(result.suggestedCeilingM).not.toBeNull();
    expect(result.suggestedCeilingM!).toBeLessThanOrEqual(result.hoverCeilingM!);
  });

  it('accounts for hot and high conditions', () => {
    const normal = estimateCeiling(mission(), 1.2);
    const hot = estimateCeiling(mission((input) => { input.environment.temperatureC = 45; }), 1.2);
    expect(hot.suggestedCeilingM ?? -1).toBeLessThanOrEqual(normal.suggestedCeilingM ?? -1);
  });

  it('returns null when hover thrust is insufficient', () => {
    const result = estimateCeiling(mission((input) => { input.airframe.payloadMassKg = 100; }), 1.2);
    expect(result.hoverCeilingM).toBeNull();
    expect(result.suggestedCeilingM).toBeNull();
  });
});
