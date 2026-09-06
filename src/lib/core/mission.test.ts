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

