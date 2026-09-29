import { describe, expect, it } from 'vitest';
import dataset from '../../../static/data/components.v1.json';
import snapshot from '../../../data/supplements/popular-brand-products.v1.json';
import manifest from '../../../static/data/source-manifest.json';
import { validateComponentRecords } from './validation';
import { applyMotorKv } from '../ui/component-selection';
import { DEFAULT_MISSION_INPUT } from '../core/presets';
import type { ComponentRecord, MotorComponent } from './types';

const facts = snapshot.records as Array<{ id: string; targetId?: string; targetKv?: number; kind: string; manufacturer: string; sourceUrl: string; values: Record<string, unknown> }>;

describe('reviewed common-brand supplements', () => {
  it('adds only new records, enriches known models and attributes every parameter', () => {
    const added = dataset.records.filter(record => record.id.startsWith('popular-'));
    expect(added).toHaveLength(facts.filter(fact => !fact.targetId).length);
    expect(validateComponentRecords(added as ComponentRecord[])).toEqual([]);
    for (const fact of facts) {
      const record = dataset.records.find(record => record.id === (fact.targetId ?? fact.id)) as unknown as ComponentRecord;
      expect(record).toBeDefined();
      const values = fact.targetKv ? (record as MotorComponent).kvSpecifications?.find(spec => spec.kv === fact.targetKv) : record;
      for (const [field, value] of Object.entries(fact.values)) {
        expect((values as unknown as Record<string, unknown>)[field]).toEqual(value);
        expect(values?.specificationSources?.[field]).toMatchObject({ sourceUrl: fact.sourceUrl, licenseSpdx: 'NOASSERTION' });
      }
    }
    expect(manifest.sources.find(source => source.id === 'popular-brand-product-facts')?.recordCount).toBe(added.length);
  });

  it('selects the exact enriched KV without copying unknown specs from the prior motor', () => {
    const motor = dataset.records.find(record => record.id === 'fpvdb-motor-iflight-xing2-2207') as unknown as MotorComponent;
    expect(motor.kvOptions).toContain(1855);
    expect(motor.kvOptions).toContain(2755);
    const selected = applyMotorKv(structuredClone(DEFAULT_MISSION_INPUT), motor, 2755);
    expect(selected.motor.kv).toBe(2755);
    expect(selected.motor.resistanceOhm).toBe(.0415);
    expect(Number.isNaN(selected.motor.noLoadCurrentA)).toBe(true);
    expect(selected.motor.massKg).toBe(.0316);
  });
});
