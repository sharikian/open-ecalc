import { describe, expect, it } from 'vitest';
import components from '../../../static/data/components.v1.json';
import manifest from '../../../data/manifests/fpvdb-snapshot.v1.json';
import sourceMotors from '../../../data/raw/fpvdb/2026-09-29/motors.json';
import manufacturerSupplement from '../../../data/supplements/manufacturer-specifications.v1.json';
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

  it('preserves every thrust-table row with stable combination identity and source ordering', () => {
    const records = components.records as ComponentRecord[];
    const motors = records.filter((record): record is MotorComponent => record.kind === 'motor' && record.id.startsWith('fpvdb-motor-'));
    const sourceItems = sourceMotors.items as Array<{ slug: string; specs: { thrust_table?: Array<Record<string, unknown>> } }>;
    const sourcePointCount = sourceItems.reduce((sum, motor) => sum + (motor.specs.thrust_table?.length ?? 0), 0);
    const curves = motors.flatMap((motor) => motor.benchCurves ?? []);
    const points = curves.flatMap((curve) => curve.points);

    expect(sourcePointCount).toBe(4557);
    expect(curves).toHaveLength(795);
    expect(points).toHaveLength(sourcePointCount);
    expect(points.filter((point) => point.rpm === undefined)).toHaveLength(928);
    expect(points.filter((point) => point.throttlePercent === undefined)).toHaveLength(539);
    expect(points.filter((point) => point.throttleSourceValue !== undefined)).toHaveLength(295);
    expect(new Set(motors.map((motor) => motor.id)).size).toBe(206);
    for (const curve of curves) {
      const throttles = curve.points.flatMap((point) => point.throttlePercent === undefined ? [] : [point.throttlePercent]);
      expect(throttles).toEqual([...throttles].sort((a, b) => a - b));
      expect(new Set(throttles).size).toBe(throttles.length);
      expect(curve.points.map((point) => point.sourcePointIndex)).toEqual([...curve.points.map((point) => point.sourcePointIndex)].sort((a, b) => a - b));
    }
  });

  it('attaches manufacturer facts to the exact KV variant and field-level source', () => {
    const records = components.records as ComponentRecord[];
    const f60 = records.find((record): record is MotorComponent => record.id === 'fpvdb-motor-t-motor-f60-pro-v-2207-5');
    const f1507 = records.find((record): record is MotorComponent => record.id === 'fpvdb-motor-t-motor-f1507');
    const f1408 = records.find((record): record is MotorComponent => record.id === 'fpvdb-motor-t-motor-f1408-ii-1408');
    const battery = records.find((record): record is BatteryComponent => record.id === 'fpvdb-battery-tattu-r-line-version-5-0-1550mah-6s');
    const f60_2020 = f60?.kvSpecifications?.find((variant) => variant.kv === 2020);
    const f1507_2700 = f1507?.kvSpecifications?.find((variant) => variant.kv === 2700);

    expect(f60_2020).toMatchObject({ maxCurrentA: 52.7, maxCurrentDurationS: 10, maxPowerW: 1297, maxPowerDurationS: 10, noLoadCurrentA: 1.25, noLoadCurrentTestVoltageV: 10 });
    expect(f60_2020?.specificationSources?.maxCurrentA?.sourceUrl).toBe('https://store.tmotor.com/product/f60prov-fpv-motor.html');
    expect(f1507_2700).toMatchObject({ maxCurrentA: 22, maxPowerW: 519, resistanceOhm: 0.131, noLoadCurrentA: 0.6, noLoadCurrentTestVoltageV: 5 });
    expect(f1408).toMatchObject({ maxCurrentA: 22.4, maxPowerW: 371, resistanceOhm: 0.088, noLoadCurrentA: 0.86, noLoadCurrentTestVoltageV: 10 });
    expect(f1408?.specificationSources?.maxCurrentA?.condition).toContain('60 s');
    expect(battery?.nominalVoltageV).toBe(22.2);
    expect(battery?.nominalCellVoltageV).toBeUndefined();
    expect(battery?.specificationSources?.nominalVoltageV?.sourceUrl).toContain('genstattu.com');
    expect(records.filter((record) => record.supplementHash)).toHaveLength(manufacturerSupplement.records.length);
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
    expect(componentKinds().reduce((sum, entry) => sum + entry.count, 0)).toBe(864);
    expect(componentKinds({ includeReference: true }).reduce((sum, entry) => sum + entry.count, 0)).toBe(1596);
  });
});
