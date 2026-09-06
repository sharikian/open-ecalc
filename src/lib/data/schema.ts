import type { ComponentDatasetV1, ComponentRecord } from './types';

export const COMPONENT_SCHEMA_VERSION = 1 as const;

export function isComponentRecord(value: unknown): value is ComponentRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    ['battery', 'esc', 'motor', 'propeller'].includes(String(record.kind)) &&
    typeof record.manufacturer === 'string' &&
    typeof record.model === 'string' &&
    Array.isArray(record.tags) &&
    typeof record.sourceUrl === 'string' &&
    typeof record.licenseSpdx === 'string' &&
    typeof record.retrievedAt === 'string' &&
    typeof record.sourceHash === 'string' &&
    ['verified', 'manufacturer', 'community', 'estimated'].includes(String(record.quality))
  );
}

export function isComponentDatasetV1(value: unknown): value is ComponentDatasetV1 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ComponentDatasetV1>;
  return candidate.schemaVersion === 1 && Array.isArray(candidate.records) && candidate.records.every(isComponentRecord);
}
