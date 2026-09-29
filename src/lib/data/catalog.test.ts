import { describe, expect, it } from 'vitest';
import components from '../../../static/data/components.v1.json';
import manifest from '../../../data/manifests/fpvdb-snapshot.v1.json';
import { componentKinds, queryComponentRecords, replaceComponentCatalog } from './catalog';
import type { BatteryComponent, ComponentRecord, MotorComponent } from './types';

describe('FPV-DB bundled dataset', () => {
  it('matches the pinned source counts and attribution metadata', () => {
    const records = components.records as ComponentRecord[];
    expect(manifest.sourceCommit).toBe('5333aba81229e1d0e7b1585e165136fd1187174c');
    expect(manifest.licenseSpdx).toBe('CC-BY-4.0');
    expect(records.filter((record) => record.id.startsWith('fpvdb-motor-'))).toHaveLength(206);
    expect(records.filter((record) => record.id.startsWith('fpvdb-battery-'))).toHaveLength(326);
    expect(records.filter((record) => record.id.startsWith('fpvdb-propeller-'))).toHaveLength(207);
    expect(records.filter((record) => record.id.startsWith('fpvdb-esc-'))).toHaveLength(112);
    expect(records.filter((record) => record.referenceOnly)).toHaveLength(732);
    expect(records.filter((record) => record.id.startsWith('fpvdb-')).every((record) =>
      record.licenseSpdx === 'CC-BY-4.0' && record.sourceCommit === manifest.sourceCommit && record.sourceHash
    )).toBe(true);
  });

  it('keeps missing battery voltage absent, preserves KV variants and identifies combined stacks', () => {
    const records = components.records as ComponentRecord[];
    const battery = records.find((record): record is BatteryComponent => record.kind === 'battery' && record.id.startsWith('fpvdb-battery-'));
    const motors = records.filter((record): record is MotorComponent => record.kind === 'motor' && record.id.startsWith('fpvdb-motor-'));
    const motorWithVariants = motors.find((record) => (record.kvOptions?.length ?? 0) > 1);
    const stack = records.find((record) => record.id.startsWith('fpvdb-esc-'));
    expect(battery).not.toHaveProperty('nominalVoltageV');
    expect(battery).not.toHaveProperty('nominalCellVoltageV');
    expect(motorWithVariants).toBeDefined();
    expect(stack?.productType).toBe('fc-esc-stack');
    expect(motors.filter((record) => (record.benchCurves?.length ?? 0) > 0).length).toBeGreaterThan(0);
  });
});

describe('component catalog reference visibility', () => {
  it('hides estimated reference-only rows by default without hiding custom records', () => {
    const records = components.records as ComponentRecord[];
    const custom: ComponentRecord = {
      id: 'user-private-test', kind: 'motor', productType: 'motor', manufacturer: 'User', model: 'Custom',
      sourceUrl: 'user://local', licenseSpdx: 'CC0-1.0', retrievedAt: '2026-09-29T00:00:00.000Z',
      sourceHash: 'user', quality: 'estimated', tags: []
    };
    replaceComponentCatalog([...records, custom]);
    const visible = queryComponentRecords();
    expect(visible.some((record) => record.referenceOnly)).toBe(false);
    expect(visible.some((record) => record.id === custom.id)).toBe(true);
    expect(queryComponentRecords({ includeReference: true }).filter((record) => record.referenceOnly)).toHaveLength(732);
    expect(componentKinds().reduce((sum, entry) => sum + entry.count, 0)).toBe(852);
    expect(componentKinds({ includeReference: true }).reduce((sum, entry) => sum + entry.count, 0)).toBe(1584);
  });
});
