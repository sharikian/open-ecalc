import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type AircraftDataset = {
  schemaVersion: number;
  records: Array<{
    id: string; manufacturer: string; model: string; massKg: number | null; enduranceMin: number | null;
    sourceUrl: string; sourceHash: string; sourceUrls?: string[];
    sourceProvenance?: Array<{ sourceUrl: string; licenseSpdx: string; attribution: string; sourceCommit?: string; sourceHash?: string }>;
  }>;
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

  it('merges exact ODL/FPV-DB aircraft names once while retaining both source licenses and hashes', () => {
    expect(dataset.records).toHaveLength(257);
    const normalizedNames = dataset.records.map((record) => `${record.manufacturer}|${record.model}`.normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' '));
    expect(new Set(normalizedNames).size).toBe(dataset.records.length);
    for (const [model, sourceUrl] of [
      ['Avata', 'https://www.dji.com/support/product/avata'],
      ['Avata 2', 'https://www.dji.com/avata-2/specs'],
      ['Neo', 'https://www.dji.com/neo/specs']
    ]) {
      const matches = dataset.records.filter((record) => record.manufacturer === 'DJI' && record.model === model);
      expect(matches).toHaveLength(1);
      expect(matches[0].sourceUrls).toContain(sourceUrl);
      expect(matches[0].sourceProvenance).toEqual(expect.arrayContaining([
        expect.objectContaining({ licenseSpdx: 'MIT', attribution: expect.stringContaining('OpenDroneList') }),
        expect.objectContaining({ licenseSpdx: 'CC-BY-4.0', attribution: 'FPV-DB — https://fpv-db.com', sourceCommit: '5333aba81229e1d0e7b1585e165136fd1187174c', sourceHash: expect.any(String) })
      ]));
    }
  });
});
