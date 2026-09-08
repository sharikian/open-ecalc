import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const inputPath = new URL('../data/raw/opendronelist/list.csv', import.meta.url);
const outputPath = new URL('../static/data/aircraft.v1.json', import.meta.url);
const csv = await readFile(inputPath, 'utf8');
const [header, ...lines] = csv.trim().split(/\r?\n/);
const columns = header.split(',');
const snapshotHash = createHash('sha256').update(csv).digest('hex');
const retrievedAt = '2026-09-08T00:00:00.000Z';

const official = {
  'DJI|Mavic 2 Pro': {
    sourceUrl: 'https://www.dji.com/mavic-2/info',
    quality: 'manufacturer',
    maxFlightDistanceKm: 18,
    maxServiceCeilingM: 6000,
    battery: 'LiPo 4S · 3850 mAh · 15.4 V'
  },
  'DJI|Mavic 3': {
    sourceUrl: 'https://www.dji.com/support/product/mavic-3',
    quality: 'manufacturer',
    maxFlightDistanceKm: 30,
    maxServiceCeilingM: 6000,
    battery: 'Li-ion 4S · 5000 mAh · 15.4 V'
  }
};

function parseValue(value) {
  if (value === undefined || value === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const records = lines.filter(Boolean).map((line) => {
  const values = line.split(',');
  const row = Object.fromEntries(columns.map((column, index) => [column, parseValue(values[index])]));
  const key = `${row.manufacturer}|${row.name}`;
  const details = official[key] ?? {};
  return {
    id: `aircraft-${slug(`${row.manufacturer}-${row.name}`)}`,
    manufacturer: row.manufacturer,
    model: row.name,
    classLabel: row.class ?? 'none',
    massKg: typeof row.weight === 'number' ? row.weight / 1000 : null,
    maxTakeoffMassKg: typeof row.max_takeoff === 'number' ? row.max_takeoff / 1000 : null,
    enduranceMin: row.endurance,
    hasCamera: row.has_camera,
    isToy: row.is_toy,
    sourceUrl: details.sourceUrl ?? 'https://github.com/dronetag/opendronelist',
    licenseSpdx: details.quality === 'manufacturer' ? 'NOASSERTION' : 'MIT',
    retrievedAt,
    sourceHash: snapshotHash,
    quality: details.quality ?? 'community',
    imageUrl: '/data/images/aircraft-catalog-grid.png',
    maxFlightDistanceKm: details.maxFlightDistanceKm ?? null,
    maxServiceCeilingM: details.maxServiceCeilingM ?? null,
    battery: details.battery ?? null
  };
});

await mkdir(new URL('../static/data/', import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({
  schemaVersion: 1,
  name: 'Open aircraft profiles',
  version: '2026.09',
  generatedAt: retrievedAt,
  source: 'OpenDroneList with official DJI overrides for Mavic 2 Pro and Mavic 3',
  records
}, null, 2)}\n`);
console.log(`wrote ${records.length} aircraft profiles`);
