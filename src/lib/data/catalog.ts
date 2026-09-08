import { loadSeedDataset } from './seed';
import type { ComponentFilter, ComponentRecord, ComponentSummary, DataQuality } from './types';
import { applyComponentOverride, customComponents } from './overrides';

const qualityRank: Record<DataQuality, number> = {
  estimated: 0,
  community: 1,
  manufacturer: 2,
  verified: 3
};

let records: ComponentRecord[] = [];

export async function initializeComponentCatalog(): Promise<ComponentRecord[]> {
  records = [...(await loadSeedDataset()).records, ...customComponents()];
  return records;
}

export function replaceComponentCatalog(next: ComponentRecord[]): void {
  records = [...next];
}

export function getComponent(id: string): ComponentRecord | undefined {
  const record = records.find((item) => item.id === id);
  return record ? applyComponentOverride(record) : undefined;
}

export function queryComponentRecords(filter: ComponentFilter = {}): ComponentRecord[] {
  const needle = filter.text?.trim().toLocaleLowerCase('en-US');
  const minimumRank = filter.minQuality ? qualityRank[filter.minQuality] : -1;
  return records.filter((record) => {
    if (filter.kind && record.kind !== filter.kind) return false;
    if (filter.manufacturer && record.manufacturer !== filter.manufacturer) return false;
    if (qualityRank[record.quality] < minimumRank) return false;
    if (!needle) return true;
    return [record.manufacturer, record.model, record.kind, ...record.tags]
      .join(' ')
      .toLocaleLowerCase('en-US')
      .includes(needle);
  });
}

export function queryComponents(filter: ComponentFilter = {}): ComponentSummary[] {
  return queryComponentRecords(filter).map(({ id, kind, manufacturer, model, quality, licenseSpdx, imageUrl }) => ({
    id,
    kind,
    manufacturer,
    model,
    quality,
    licenseSpdx,
    imageUrl
  }));
}

export function componentKinds(): Array<{ kind: ComponentRecord['kind']; count: number }> {
  return (['battery', 'esc', 'motor', 'propeller'] as const).map((kind) => ({
    kind,
    count: records.filter((record) => record.kind === kind).length
  }));
}
