import { describe, expect, it } from 'vitest';
import { validateComponentRecords, validatePowertrainCompatibility } from './validation';
import type { BatteryComponent, EscComponent, MotorComponent, PropellerComponent } from './types';

const provenance = {
  sourceUrl: 'https://example.test/source',
  licenseSpdx: 'MIT',
  retrievedAt: '2026-09-06T00:00:00.000Z',
  sourceHash: 'abc',
  quality: 'verified' as const,
  manufacturer: 'Test',
  tags: []
};

describe('component validation', () => {
  it('rejects unordered propeller test curves', () => {
    const propeller: PropellerComponent = {
      ...provenance,
      id: 'p1', model: 'P', kind: 'propeller', diameterM: 0.3, pitchM: 0.1, bladeCount: 2,
      testCurve: [
        { rpm: 6000, thrustCoefficient: 0.1, powerCoefficient: 0.04 },
        { rpm: 5000, thrustCoefficient: 0.1, powerCoefficient: 0.04 }
      ]
    };
    expect(validateComponentRecords([propeller])).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'unordered-curve' })
    ]));
  });

  it('checks battery and esc current limits', () => {
    const battery: BatteryComponent = { ...provenance, id: 'b', model: 'B', kind: 'battery', chemistry: 'LiPo', capacityAh: 5, nominalVoltageV: 22.2, continuousC: 10, internalResistanceOhm: 0.01, massKg: 0.5 };
    const esc: EscComponent = { ...provenance, id: 'e', model: 'E', kind: 'esc', continuousCurrentA: 30, burstCurrentA: 40, resistanceOhm: 0.002, efficiency: 0.96, massKg: 0.06 };
    const motor: MotorComponent = { ...provenance, id: 'm', model: 'M', kind: 'motor', kv: 500, noLoadCurrentA: 1, resistanceOhm: 0.05, maxCurrentA: 40, maxPowerW: 900, massKg: 0.15 };
    expect(validatePowertrainCompatibility(battery, esc, motor, 4).issues).toEqual([
      'motor-current-exceeds-esc', 'system-current-exceeds-battery'
    ]);
  });
});
