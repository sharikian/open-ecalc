export interface FlightLocation {
  id: string;
  nameFa: string;
  nameEn: string;
  provinceFa?: string;
  provinceEn?: string;
  descriptionFa?: string;
  descriptionEn?: string;
  terrain?: string;
  imageUrl?: string;
  altitudeM: number;
  temperatureC: number;
  pressurePa: number;
  sourceUrl: string;
  licenseSpdx: string;
  retrievedAt: string;
  sourceHash: string;
  quality: 'verified' | 'community' | 'estimated';
}

interface LocationDatasetV1 { schemaVersion: 1; records: FlightLocation[]; }
const CUSTOM_KEY = 'open-ecalc.custom-locations';
const OVERRIDE_KEY = 'open-ecalc.location-overrides';
const HIDDEN_KEY = 'open-ecalc.hidden-locations';

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; }
}

let records: FlightLocation[] = [];
let promise: Promise<FlightLocation[]> | undefined;

export function initializeLocationCatalog(): Promise<FlightLocation[]> {
  promise ??= fetch('/data/locations.v1.json?v=2026.09')
    .then((response) => { if (!response.ok) throw new Error(`Location dataset unavailable (${response.status})`); return response.json() as Promise<LocationDatasetV1>; })
    .then((dataset) => {
      const hidden = new Set(read<string[]>(HIDDEN_KEY, []));
      records = [...dataset.records, ...read<FlightLocation[]>(CUSTOM_KEY, [])].filter((item) => !hidden.has(item.id));
      return records;
    });
  return promise;
}

function applyOverride(record: FlightLocation): FlightLocation { return { ...record, ...(read<Record<string, Partial<FlightLocation>>>(OVERRIDE_KEY, {})[record.id] ?? {}) }; }
export function queryLocations(text = ''): FlightLocation[] {
  const needle = text.trim().toLocaleLowerCase('fa');
  return records.map(applyOverride).filter((record) => !needle || `${record.nameFa} ${record.nameEn} ${record.provinceFa} ${record.provinceEn}`.toLocaleLowerCase('fa').includes(needle));
}
export function getLocation(id: string): FlightLocation | undefined { const record = records.find((item) => item.id === id); return record ? applyOverride(record) : undefined; }
export function saveLocationOverride(id: string, values: Partial<FlightLocation>): void {
  const all = read<Record<string, Partial<FlightLocation>>>(OVERRIDE_KEY, {}); all[id] = { ...(all[id] ?? {}), ...values }; localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
}
export function saveCustomLocation(record: FlightLocation): void {
  const all = read<FlightLocation[]>(CUSTOM_KEY, []).filter((item) => item.id !== record.id); all.push(record); localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
  records = [...records.filter((item) => item.id !== record.id), record];
}
export function hideLocation(id: string): void {
  const all = read<string[]>(HIDDEN_KEY, []); if (!all.includes(id)) all.push(id); localStorage.setItem(HIDDEN_KEY, JSON.stringify(all)); records = records.filter((item) => item.id !== id);
}
