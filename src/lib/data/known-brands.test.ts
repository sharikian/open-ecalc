import { describe, expect, it } from 'vitest';
import dataset from '../../../static/data/components.v1.json';
import snapshot from '../../../data/supplements/known-brand-products.v1.json';
import manifest from '../../../static/data/source-manifest.json';
import { validateComponentRecords } from './validation';
import { applyComponent } from '../ui/component-selection';
import { DEFAULT_MISSION_INPUT } from '../core/presets';
import type { ComponentRecord, EscComponent } from './types';

const products = dataset.records.filter(record => record.id.startsWith('brand-')) as EscComponent[];

describe('known manufacturer product facts', () => {
  it('bundles twelve distinct named ESCs with field sources and honest rights metadata', () => {
    expect(products).toHaveLength(12);
    expect(products.filter(record => record.manufacturer === 'Hobbywing')).toHaveLength(4);
    expect(products.filter(record => record.manufacturer === 'APD')).toHaveLength(5);
    expect(products.filter(record => record.manufacturer === 'T-Motor')).toHaveLength(3);
    expect(validateComponentRecords(products)).toEqual([]);
    expect(new Set(products.map(record => `${record.manufacturer}|${record.model}`)).size).toBe(products.length);
    for (const product of products) {
      expect(product).toMatchObject({ kind: 'esc', productType: 'standalone-esc', licenseSpdx: 'NOASSERTION', quality: 'manufacturer' });
      expect(product.sourceHash).toMatch(/^[a-f0-9]{64}$/);
      expect(product.referenceOnly).not.toBe(true);
      expect(product.imageType).toBe('illustration');
      expect(product.imageUrl).toMatch(/^\/data\/images\/generated-catalog-v2\//);
      const source = snapshot.records.find(record => record.id === product.id)!;
      for (const field of Object.keys(source.values)) expect(product.specificationSources?.[field]?.sourceUrl).toBe(source.sourceUrl);
    }
    expect(manifest.sources.find(source => source.id === 'known-brand-product-facts')?.recordCount).toBe(12);
  });

  it('does not infer continuous current from model names or invent missing solver fields', () => {
    const h80 = products.find(record => record.id === 'brand-esc-hobbywing-xrotor-pro-h80a-14s-foc')!;
    const h110 = products.find(record => record.id === 'brand-esc-hobbywing-xrotor-pro-h110a-14s-bldc')!;
    expect(h80).toMatchObject({ continuousCurrentA: 40, burstCurrentA: 100, burstDurationS: 3, massKg: .087 });
    expect(h110).toMatchObject({ continuousCurrentA: 50, burstCurrentA: 110, burstDurationS: 15 });
    expect(h110.specificationSources?.continuousCurrentA?.condition).toContain('7 m/s');
    const apd = products.find(record => record.model === '120F3[X]')!;
    expect(apd).toMatchObject({ continuousCurrentA: 120, burstCurrentA: 200, continuousDurationS: 60, massKg: .02 });
    expect(apd.specificationSources?.continuousCurrentA?.condition).toContain('33 m/s');
    expect(apd.maxCells).toBeUndefined();
    for (const product of products) {
      expect(product.resistanceOhm).toBeUndefined();
      expect(product.efficiency).toBeUndefined();
    }
    const selected = applyComponent(structuredClone(DEFAULT_MISSION_INPUT), h80 as ComponentRecord);
    expect(selected.esc.continuousCurrentA).toBe(40);
    expect(Number.isNaN(selected.esc.resistanceOhm)).toBe(true);
    expect(Number.isNaN(selected.esc.efficiency)).toBe(true);
  });
});
