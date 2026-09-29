import { applyAircraftOverride } from './overrides';

const CUSTOM_KEY = 'open-ecalc.custom-airframes';
const HIDDEN_KEY = 'open-ecalc.hidden-components';

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; }
}

export interface AircraftProfile {
  id: string;
  manufacturer: string;
  model: string;
  classLabel: string;
  massKg: number | null;
  maxTakeoffMassKg: number | null;
  enduranceMin: number | null;
  hasCamera: boolean | null;
  isToy: boolean | null;
  sourceUrl: string;
  licenseSpdx: string;
  retrievedAt: string;
  sourceHash: string;
  quality: 'manufacturer' | 'community';
  imageUrl: string;
  productType?: 'airframe' | 'quad';
  sourceUrls?: string[];
  sourceCommit?: string;
  sourceProvenance?: Array<{ sourceUrl: string; licenseSpdx: string; attribution: string; sourceCommit?: string; sourceHash?: string }>;
  maxFlightDistanceKm: number | null;
  maxServiceCeilingM: number | null;
  battery: string | null;
  recommendedBattery?: {
    cells?: string;
    capacityAh?: number;
    capacityRangeAh?: string;
    connector?: string;
    chemistry?: string;
  };
  propSizeM?: number;
  propMount?: string;
  wheelbaseM?: number;
  typicalCurrentA?: number;
  motorRecommendation?: string;
  videoSystem?: string;
  camera?: string;
  sourceNote?: string;
}

interface AircraftDatasetV1 {
  schemaVersion: 1;
  name: string;
  version: string;
  generatedAt: string;
  source: string;
  records: AircraftProfile[];
}

let aircraft: AircraftProfile[] = [];
let aircraftPromise: Promise<AircraftProfile[]> | undefined;

export function initializeAircraftCatalog(): Promise<AircraftProfile[]> {
  aircraftPromise ??= fetch('/data/aircraft.v1.json')
    .then((response) => {
      if (!response.ok) throw new Error(`Aircraft dataset unavailable (${response.status})`);
      return response.json() as Promise<AircraftDatasetV1>;
    })
    .then((dataset) => {
      if (dataset.schemaVersion !== 1 || !Array.isArray(dataset.records)) throw new Error('Aircraft dataset schema is invalid');
      const hidden = new Set(read<string[]>(HIDDEN_KEY, []));
      aircraft = [...dataset.records, ...read<AircraftProfile[]>(CUSTOM_KEY, [])].filter((record) => !hidden.has(record.id));
      return aircraft;
    });
  return aircraftPromise;
}

export function queryAircraft(text = ''): AircraftProfile[] {
  const needle = text.trim().toLocaleLowerCase('fa');
  const source = aircraft.map(applyAircraftOverride);
  if (!needle) return source;
  return source.filter((record) => `${record.manufacturer} ${record.model} ${record.classLabel}`.toLocaleLowerCase('fa').includes(needle));
}

export function getAircraft(id: string): AircraftProfile | undefined {
  const record = aircraft.find((item) => item.id === id);
  return record ? applyAircraftOverride(record) : undefined;
}

export function saveCustomAircraft(record: AircraftProfile): void {
  const all = read<AircraftProfile[]>(CUSTOM_KEY, []).filter((item) => item.id !== record.id);
  all.push(record); localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
  aircraft = [...aircraft.filter((item) => item.id !== record.id), record];
}
