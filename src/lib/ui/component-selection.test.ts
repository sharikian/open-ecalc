import { describe, it, expect } from 'vitest';
import { applyComponent, applyMotorKv } from './component-selection';
import { DEFAULT_MISSION_INPUT } from '$core/presets';
import type { ComponentRecord } from '$data/types';

describe('component selection', () => {
  it('applies every documented KV-specific value and clears unknown variant values', () => {
    const component = { kind: 'motor', massKg: .05, kvSpecifications: [
      { kv: 1750, maxCurrentA: 38, maxPowerW: 930, noLoadCurrentA: .8 },
      { kv: 2550, maxCurrentA: 51, maxPowerW: 1200 }
    ] } as Extract<ComponentRecord, { kind: 'motor' }>;
    const first = applyMotorKv(structuredClone(DEFAULT_MISSION_INPUT), component, 1750);
    expect(first.motor.maxCurrentA).toBe(38);
    expect(first.motor.maxPowerW).toBe(930);
    expect(first.motor.noLoadCurrentA).toBe(.8);
    const next = applyMotorKv(first, component, 2550);
    expect(next.motor.kv).toBe(2550);
    expect(next.motor.maxCurrentA).toBe(51);
    expect(Number.isNaN(next.motor.noLoadCurrentA)).toBe(true);
    expect(Number.isNaN(next.motor.resistanceOhm)).toBe(true);
  });
  it('clears missing motor specs and stale curves rather than carrying previous values', () => {
    const input = structuredClone(DEFAULT_MISSION_INPUT);
    input.propeller.curve = [{ throttle: 1, thrustN: 10, currentA: 5, voltageV: 12, rpm: 1000 }];
    const next = applyComponent(input, { kind: 'motor', kv: 800, massKg: 0.12 } as ComponentRecord);
    expect(next.motor.kv).toBe(800);
    expect(next.motor.massKg).toBe(0.12);
    expect(Number.isNaN(next.motor.resistanceOhm)).toBe(true);
    expect(Number.isNaN(next.motor.maxCurrentA)).toBe(true);
    expect(next.propeller.curve).toBeUndefined();
    expect(input.motor.resistanceOhm).toBe(DEFAULT_MISSION_INPUT.motor.resistanceOhm);
  });
  it('does not guess battery series from a nominal voltage', () => {
    const next = applyComponent(structuredClone(DEFAULT_MISSION_INPUT), { kind: 'battery', chemistry: 'LiPo', nominalVoltageV: 22.2, capacityAh: 5 } as ComponentRecord);
    expect(Number.isNaN(next.battery.series)).toBe(true);
    expect(Number.isNaN(next.battery.internalResistanceOhm)).toBe(true);
  });
  it('derives cell voltage only when pack voltage and cell count are documented', () => {
    const next = applyComponent(structuredClone(DEFAULT_MISSION_INPUT), { kind: 'battery', chemistry: 'LiFePO4', nominalVoltageV: 12.8, series: 4 } as ComponentRecord);
    expect(next.battery.nominalCellVoltageV).toBe(3.2);
  });
});
