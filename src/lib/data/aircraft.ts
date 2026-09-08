import { applyAircraftOverride } from './overrides';

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
  maxFlightDistanceKm: number | null;
  maxServiceCeilingM: number | null;
  battery: string | null;
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
      aircraft = dataset.records;
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
