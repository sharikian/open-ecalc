import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type AircraftDataset = {
  schemaVersion: number;
  records: Array<{ model: string; massKg: number | null; enduranceMin: number | null; sourceUrl: string; sourceHash: string }>;
};

const dataset = JSON.parse(readFileSync(new URL('../../../static/data/aircraft.v1.json', import.meta.url), 'utf8')) as AircraftDataset;

describe('aircraft dataset', () => {
  it('contains a provenance-bearing profile for every normalized row', () => {
    expect(dataset.schemaVersion).toBe(1);
    expect(dataset.records.length).toBeGreaterThanOrEqual(150);
    expect(dataset.records.every((record) => record.sourceUrl && record.sourceHash)).toBe(true);
  });

  it('keeps the official Mavic 2 Pro and Mavic 3 flight references', () => {
    const mavic2 = dataset.records.find((record) => record.model === 'Mavic 2 Pro');
    const mavic3 = dataset.records.find((record) => record.model === 'Mavic 3');
    expect(mavic2).toMatchObject({ massKg: 0.907, enduranceMin: 31 });
    expect(mavic3).toMatchObject({ massKg: 0.895, enduranceMin: 46 });
  });
});
