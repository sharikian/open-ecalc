import { describe, expect, it } from 'vitest';
import { calculateLegacyExcel } from './legacy';
import type { LegacyInput } from './types';

const currentPerMotorA = [26.6, 35.2, 47.8, 65.7, 88.5, 107.8, 146.1];
const heavy: LegacyInput = {
  emptyMassG: 24_000,
  payloadMassG: 15_000,
  batteryMassG: 11_700,
  batteryParallel: 2,
  cellCapacityAh: 30,
  rotorCount: 4,
  speedMps: 10,
  currentPerMotorA
};
const light: LegacyInput = { ...heavy, emptyMassG: 11_700, payloadMassG: 5_000, batteryMassG: 5_600, cellCapacityAh: 16 };

describe('legacy workbook model', () => {
  it('calculates the 5000 mAh browser regression scenario with Ah internally', () => {
    const result = calculateLegacyExcel({ emptyMassG: 850, payloadMassG: 0, batteryMassG: 300,
      batteryParallel: 1, cellCapacityAh: 5, rotorCount: 4, speedMps: 10, currentPerMotorA: [10] });
    expect(result.points[0].usableTimeMin).toBeCloseTo(5.8536585366);
    expect(result.points[0].rangeKm * 0.8).toBeCloseTo(3.5121951219);
  });

  it('rejects non-finite and empty operating points', () => {
    expect(() => calculateLegacyExcel({ ...heavy, cellCapacityAh: NaN })).toThrow(RangeError);
    expect(() => calculateLegacyExcel({ ...heavy, currentPerMotorA: [] })).toThrow(RangeError);
  });
  it('matches the three repeated workbook sheets', () => {
    const sheets = ['Z30 - X11 plus ', 'G620 - X9 PLUS', 'X9'].map(() => calculateLegacyExcel(heavy));
    expect(sheets[1]).toEqual(sheets[0]);
    expect(sheets[2]).toEqual(sheets[0]);
    expect(sheets[0].takeoffMassG).toBe(62_400);
    expect(sheets[0].packCapacityAh).toBe(60);
    expect(sheets[0].points[0]).toEqual({
      totalCurrentA: 106.4,
      rawTimeMin: 33.5195530726257,
      usableTimeMin: 26.81564245810056,
      rangeKm: 20.111731843575416
    });
    expect(sheets[0].points[3].usableTimeMin).toBeCloseTo(10.917361637604245, 12);
  });

  it('matches the different S10-X8 workbook sheet', () => {
    const result = calculateLegacyExcel(light);
    expect(result.takeoffMassG).toBe(27_900);
    expect(result.packCapacityAh).toBe(32);
    expect(result.points[0].rawTimeMin).toBeCloseTo(17.877094972067038, 12);
    expect(result.points[2].usableTimeMin).toBeCloseTo(7.991675338189386, 12);
    expect(result.points[3].rangeKm).toBeCloseTo(4.366944655041698, 12);
  });
});
