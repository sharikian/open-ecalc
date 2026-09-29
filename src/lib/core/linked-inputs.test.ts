import { describe, expect, it } from 'vitest';
import { pressureMode, resolvePressure, setPackVoltage, nominalCellVoltage } from './linked-inputs';
import { airPressureAtAltitude } from './physics';

describe('linked inputs', () => {
  it('derives station pressure and never silently clamps altitude', () => {
    expect(resolvePressure({ altitudeM: 0, temperatureC: 25, pressureMode: 'auto', pressurePa: 500 })).toBe(101325);
    expect(resolvePressure({ altitudeM: 1000, temperatureC: 25, pressureMode: 'auto' })).toBeCloseTo(89874.6, 0);
    expect(() => airPressureAtAltitude(11001)).toThrow(RangeError);
    expect(() => airPressureAtAltitude(NaN)).toThrow(RangeError);
  });
  it('preserves manual pressure as altitude changes and reads old projects', () => {
    expect(pressureMode({ altitudeM: 0, temperatureC: 25, pressurePa: 90000 })).toBe('manual');
    expect(pressureMode({ altitudeM: 0, temperatureC: 25 })).toBe('auto');
    expect(resolvePressure({ altitudeM: 2500, temperatureC: 25, pressureMode: 'manual', pressurePa: 90000 })).toBe(90000);
    expect(() => resolvePressure({ altitudeM: 0, temperatureC: 25, pressureMode: 'manual' })).toThrow();
  });
  it('links nominal pack voltage to cells without guessing series', () => {
    const battery = { series: 6 } as Parameters<typeof setPackVoltage>[0];
    expect(setPackVoltage(battery, 22.2).nominalCellVoltageV).toBeCloseTo(3.7);
    expect(Number.isNaN(setPackVoltage({ ...battery, series: NaN }, 22.2).nominalCellVoltageV)).toBe(true);
    expect(nominalCellVoltage('LiFePO4')).toBe(3.2);
    expect(nominalCellVoltage('Li-ion')).toBe(3.6);
  });
});
