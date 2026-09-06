import type { ComponentRecord } from './types';

export interface ProvenanceProblem {
  id: string;
  field: 'sourceUrl' | 'licenseSpdx' | 'retrievedAt' | 'sourceHash';
}

export function auditProvenance(records: ComponentRecord[]): ProvenanceProblem[] {
  const problems: ProvenanceProblem[] = [];
  for (const record of records) {
    for (const field of ['sourceUrl', 'licenseSpdx', 'retrievedAt', 'sourceHash'] as const) {
      if (!record[field]?.trim()) problems.push({ id: record.id, field });
    }
  }
  return problems;
}

export function sourceFingerprint(record: ComponentRecord): string {
  return [record.sourceUrl, record.licenseSpdx, record.retrievedAt, record.sourceHash].join('|');
}
