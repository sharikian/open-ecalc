import type { ComponentDatasetV1, ComponentRecord } from './types';

export const COMPONENT_SCHEMA_VERSION = 1 as const;

const componentKinds = ['battery', 'esc', 'motor', 'propeller'] as const;
const productTypes = ['battery-pack', 'motor', 'propeller', 'standalone-esc', 'fc-esc-stack'] as const;

function isSpecificationSources(value: unknown): boolean {
  return typeof value === 'object' && value !== null && Object.values(value as Record<string, unknown>).every((source) =>
    !!source && typeof source === 'object' && typeof (source as Record<string, unknown>).sourceUrl === 'string' && ((source as Record<string, unknown>).condition === undefined || typeof (source as Record<string, unknown>).condition === 'string')
  );
}

export function isComponentRecord(value: unknown): value is ComponentRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    componentKinds.includes(String(record.kind) as (typeof componentKinds)[number]) &&
    typeof record.manufacturer === 'string' &&
    typeof record.model === 'string' &&
    Array.isArray(record.tags) &&
    record.tags.every((tag) => typeof tag === 'string') &&
    typeof record.sourceUrl === 'string' &&
    typeof record.licenseSpdx === 'string' &&
    typeof record.retrievedAt === 'string' &&
    typeof record.sourceHash === 'string' &&
    ['verified', 'manufacturer', 'community', 'estimated'].includes(String(record.quality)) &&
    (record.productType === undefined || productTypes.includes(String(record.productType) as (typeof productTypes)[number])) &&
    (record.sourceUrls === undefined || (Array.isArray(record.sourceUrls) && record.sourceUrls.every((url) => typeof url === 'string'))) &&
    (record.referenceOnly === undefined || typeof record.referenceOnly === 'boolean') &&
    (record.specificationSources === undefined || isSpecificationSources(record.specificationSources)) &&
    (record.kvSpecifications === undefined || (record.kind === 'motor' && Array.isArray(record.kvSpecifications) && record.kvSpecifications.every((variant) => {
      if (!variant || typeof variant !== 'object') return false;
      const spec = variant as Record<string, unknown>;
      const optionalNumbers = ['noLoadCurrentA', 'noLoadCurrentTestVoltageV', 'resistanceOhm', 'maxCurrentA', 'maxCurrentDurationS', 'maxPowerW', 'maxPowerDurationS'];
      return typeof spec.kv === 'number' && Number.isFinite(spec.kv) && spec.kv > 0 &&
        optionalNumbers.every((field) => spec[field] === undefined || (typeof spec[field] === 'number' && Number.isFinite(spec[field]) && (spec[field] as number) > 0)) &&
        (spec.specificationSources === undefined || isSpecificationSources(spec.specificationSources));
    }))) &&
    (record.supplementHash === undefined || typeof record.supplementHash === 'string')
  );
}

export function isComponentDatasetV1(value: unknown): value is ComponentDatasetV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ComponentDatasetV1>;
  return candidate.schemaVersion === 1 && Array.isArray(candidate.records) && candidate.records.every(isComponentRecord);
}
