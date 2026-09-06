import { isComponentDatasetV1, isComponentRecord } from './schema';
import type {
  ComponentRecord,
  DatasetSource,
  ImportIssue,
  ImportReport,
  PropellerComponent,
  PropellerTestPoint,
  Provenance
} from './types';

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) {
      cells.push(value.trim());
      value = '';
    } else value += character;
  }
  cells.push(value.trim());
  return cells;
}

function parseScalar(value: string): string | number | boolean {
  if (value === 'true' || value === 'false') return value === 'true';
  const number = Number(value);
  return value !== '' && Number.isFinite(number) ? number : value;
}

function provenance(source: DatasetSource, sourceHash: string): Provenance {
  return {
    sourceUrl: source.sourceUrl,
    licenseSpdx: source.licenseSpdx,
    retrievedAt: source.retrievedAt ?? new Date().toISOString(),
    sourceHash,
    quality: source.quality ?? 'community'
  };
}

async function sha256(content: string): Promise<string> {
  const encoded = new TextEncoder().encode(content.replace(/\r\n/g, '\n'));
  if (globalThis.crypto?.subtle) {
    const result = await globalThis.crypto.subtle.digest('SHA-256', encoded);
    return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  let hash = 2166136261;
  for (const byte of encoded) hash = Math.imul(hash ^ byte, 16777619);
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function parseJson(content: string): unknown[] {
  const value: unknown = JSON.parse(content);
  if (isComponentDatasetV1(value)) return value.records;
  return Array.isArray(value) ? value : [value];
}

function parseCsv(content: string): unknown[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith('#'));
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) =>
    Object.fromEntries(splitCsvLine(line).map((cell, index) => [headers[index], parseScalar(cell)]))
  );
}

function parseUiucDat(source: DatasetSource, sourceHash: string): PropellerComponent[] {
  const points: PropellerTestPoint[] = [];
  for (const line of source.content.split(/\r?\n/)) {
    const columns = line.trim().split(/\s+/).map(Number);
    if (columns.length < 4 || columns.some((value) => !Number.isFinite(value))) continue;
    const [rpm, advanceRatio, thrustCoefficient, powerCoefficient] = columns;
    points.push({ rpm, advanceRatio, thrustCoefficient, powerCoefficient });
  }
  const defaults = source.defaults as Partial<PropellerComponent> | undefined;
  return [{
    id: defaults?.id ?? `prop-${sourceHash.slice(0, 12)}`,
    kind: 'propeller',
    manufacturer: defaults?.manufacturer ?? 'Imported',
    model: defaults?.model ?? 'UIUC DAT',
    tags: defaults?.tags ?? ['imported', 'uiuc-format'],
    diameterM: defaults?.diameterM ?? 0,
    pitchM: defaults?.pitchM ?? 0,
    bladeCount: defaults?.bladeCount ?? 2,
    testCurve: points,
    ...provenance(source, sourceHash)
  }];
}

export async function importComponentDataset(source: DatasetSource): Promise<ImportReport> {
  const issues: ImportIssue[] = [];
  const sourceHash = await sha256(source.content);
  let rows: unknown[];
  try {
    rows = source.format === 'json'
      ? parseJson(source.content)
      : source.format === 'uiuc-dat'
        ? parseUiucDat(source, sourceHash)
        : parseCsv(source.content);
  } catch (error) {
    return { accepted: [], rejected: 1, issues: [{ code: 'invalid', message: String(error) }] };
  }

  const accepted: ComponentRecord[] = [];
  rows.forEach((row, index) => {
    const candidate = { ...(source.defaults ?? {}), ...(row as object), ...provenance(source, sourceHash) };
    if (isComponentRecord(candidate)) accepted.push(candidate);
    else issues.push({ row: index + 1, code: 'invalid', message: 'Record does not match the component schema' });
  });
  return { accepted, rejected: rows.length - accepted.length, issues };
}
