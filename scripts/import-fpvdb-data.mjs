import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceCommit = '5333aba81229e1d0e7b1585e165136fd1187174c';
const retrievedAt = '2026-09-29T12:58:39.000Z';
const snapshotName = '2026-09-29';
const rawDir = path.join(root, 'data/raw/fpvdb', snapshotName);
const componentsPath = path.join(root, 'static/data/components.v1.json');
const aircraftPath = path.join(root, 'static/data/aircraft.v1.json');
const normalizedPath = path.join(root, 'data/normalized/components.v1.json');
const manufacturerSupplementPath = path.join(root, 'data/supplements/manufacturer-specifications.v1.json');
const brandProductsPath = path.join(root, 'data/supplements/known-brand-products.v1.json');
const fpvFiles = ['motors.json', 'batteries.json', 'props.json', 'stacks.json', 'quads.json'];
const supportFiles = ['LICENSE', 'README.md', 'manifest.json'];
const expectedCounts = { motors: 206, batteries: 326, props: 207, stacks: 112, quads: 101 };
const licenseSpdx = 'CC-BY-4.0';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const optionalPositive = (value, scale = 1) => finite(value) && value > 0 ? value * scale : undefined;

async function fetchPinnedSnapshot() {
  fs.mkdirSync(rawDir, { recursive: true });
  for (const filename of [...fpvFiles, ...supportFiles]) {
    const url = `https://raw.githubusercontent.com/fpvdb/fpv-db-data/${sourceCommit}/${filename}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`FPV-DB snapshot fetch failed (${response.status}): ${filename}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(path.join(rawDir, filename), bytes);
  }
}

function parseSeries(value) {
  const match = typeof value === 'string' && value.trim().match(/^(\d+)\s*S$/i);
  return match ? Number(match[1]) : undefined;
}

function parseContinuousC(value) {
  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*C$/i);
  return match ? Number(match[1]) : undefined;
}

function parseResistanceOhm(value) {
  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(?:mΩ|mohm)$/i);
  return match ? Number(match[1]) / 1000 : undefined;
}

function parseThrottlePercent(value) {
  if (finite(value)) return { throttlePercent: value };
  if (typeof value !== 'string') return {};
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*%$/);
  return match ? { throttlePercent: Number(match[1]), throttleSourceValue: value } : { throttleSourceValue: value };
}

function productSources(item, category) {
  const sourceUrls = Array.isArray(item.sources) ? item.sources.filter((url) => typeof url === 'string' && url.length > 0) : [];
  const sourceFile = `https://github.com/fpvdb/fpv-db-data/blob/${sourceCommit}/${category}.json`;
  return { sourceUrl: sourceUrls[0] ?? sourceFile, sourceUrls };
}

function baseProduct(item, category, kind, productType, rawEntry) {
  const { sourceUrl, sourceUrls } = productSources(item, category);
  return {
    id: `fpvdb-${kind}-${item.slug}`,
    kind,
    productType,
    manufacturer: item.brand,
    model: item.model,
    tags: ['fpvdb', productType],
    sourceUrl,
    sourceUrls,
    licenseSpdx,
    retrievedAt,
    sourceHash: sha256(JSON.stringify(rawEntry)),
    sourceCommit,
    quality: 'community'
  };
}

function motorCurves(item) {
  if (!Array.isArray(item.specs?.thrust_table)) return undefined;
  const grouped = new Map();
  item.specs.thrust_table.forEach((point, sourcePointIndex) => {
    if (!finite(point.kv) || typeof point.prop !== 'string' || typeof point.cells !== 'string') return;
    const key = JSON.stringify([point.kv, point.prop, point.cells]);
    const curve = grouped.get(key) ?? { kv: point.kv, propeller: point.prop, cells: point.cells, points: [] };
    curve.points.push(omitUndefined({
      sourcePointIndex,
      ...parseThrottlePercent(point.throttle),
      voltageV: finite(point.voltage_v) ? point.voltage_v : undefined,
      currentA: finite(point.current_a) ? point.current_a : undefined,
      rpm: finite(point.rpm) ? point.rpm : undefined,
      thrustG: finite(point.thrust_g) ? point.thrust_g : undefined,
      thrustN: finite(point.thrust_g) ? point.thrust_g * 0.00980665 : undefined,
      efficiencyGPerW: finite(point.efficiency_gw) ? point.efficiency_gw : undefined
    }));
    grouped.set(key, curve);
  });
  return [...grouped.values()].map((curve) => ({
    ...curve,
    conditions: item.specs.thrust_conditions
  }));
}

function importMotor(item) {
  const specs = item.specs ?? {};
  const kvOptions = Array.isArray(specs.kv_options) ? specs.kv_options.filter((kv) => finite(kv) && kv > 0) : [];
  const record = {
    ...baseProduct(item, 'motors', 'motor', 'motor', item),
    kv: kvOptions.length === 1 ? kvOptions[0] : undefined,
    kvOptions,
    stator: typeof specs.stator === 'string' ? specs.stator : undefined,
    maxCells: typeof specs.max_cells === 'string' ? specs.max_cells : undefined,
    massKg: optionalPositive(specs.weight_g, 0.001),
    resistanceOhm: parseResistanceOhm(specs.resistance_mohm),
    resistanceMohmText: typeof specs.resistance_mohm === 'string' ? specs.resistance_mohm : undefined,
    maxThrustN: optionalPositive(specs.max_thrust_g, 0.00980665),
    benchCurves: motorCurves(item),
    sourceNote: typeof item.note === 'string' ? item.note : undefined,
    statorDimensions: typeof specs.dimensions_mm === 'string' ? specs.dimensions_mm : undefined,
    shaft: typeof specs.shaft === 'string' ? specs.shaft : undefined,
    mount: typeof specs.mount_mm === 'string' ? specs.mount_mm : undefined,
    configuration: typeof specs.configuration === 'string' ? specs.configuration : undefined,
    recommendedProps: typeof specs.recommended_props === 'string' ? specs.recommended_props : undefined
  };
  return omitUndefined(record);
}

function importBattery(item) {
  const specs = item.specs ?? {};
  const sourceChemistry = typeof specs.chemistry === 'string' ? specs.chemistry : undefined;
  return omitUndefined({
    ...baseProduct(item, 'batteries', 'battery', 'battery-pack', item),
    chemistry: sourceChemistry === 'LiHV' ? 'LiPo' : sourceChemistry,
    chemistryLabel: sourceChemistry === 'LiHV' ? sourceChemistry : undefined,
    series: parseSeries(specs.cells),
    cells: typeof specs.cells === 'string' ? specs.cells : undefined,
    capacityAh: optionalPositive(specs.capacity_mah, 0.001),
    continuousC: parseContinuousC(specs.c_rating),
    cRatingText: typeof specs.c_rating === 'string' ? specs.c_rating : undefined,
    massKg: optionalPositive(specs.weight_g, 0.001),
    energyWh: optionalPositive(specs.energy_wh),
    connector: typeof specs.connector === 'string' ? specs.connector : undefined,
    dimensionsMm: typeof specs.dimensions_mm === 'string' ? specs.dimensions_mm : undefined,
    sourceNote: typeof item.note === 'string' ? item.note : undefined
  });
}

function importProp(item) {
  const specs = item.specs ?? {};
  return omitUndefined({
    ...baseProduct(item, 'props', 'propeller', 'propeller', item),
    diameterM: optionalPositive(specs.diameter_in, 0.0254),
    pitchM: optionalPositive(specs.pitch_in, 0.0254),
    bladeCount: optionalPositive(specs.blades),
    massKg: optionalPositive(specs.weight_g, 0.001),
    mount: typeof specs.mount === 'string' ? specs.mount : undefined,
    material: typeof specs.material === 'string' ? specs.material : undefined,
    suitedMotors: Array.isArray(specs.suited_motors) ? specs.suited_motors.filter((value) => typeof value === 'string') : undefined,
    sourceNote: typeof item.note === 'string' ? item.note : undefined
  });
}

function importStack(item) {
  const specs = item.specs ?? {};
  return omitUndefined({
    ...baseProduct(item, 'stacks', 'esc', 'fc-esc-stack', item),
    continuousCurrentA: optionalPositive(specs.esc_current_a),
    maxCells: typeof specs.max_cells === 'string' ? specs.max_cells : undefined,
    massKg: optionalPositive(specs.weight_g, 0.001),
    escFirmware: typeof specs.esc_firmware === 'string' ? specs.esc_firmware : undefined,
    mcu: typeof specs.mcu === 'string' ? specs.mcu : undefined,
    mount: typeof specs.mount_mm === 'string' ? specs.mount_mm : undefined,
    productNote: typeof item.note === 'string' ? item.note : undefined
  });
}

function omitUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));
}

function referenceRecord(record) {
  const productType = record.productType ?? ({ battery: 'battery-pack', esc: 'standalone-esc', motor: 'motor', propeller: 'propeller' }[record.kind]);
  return { ...record, productType, quality: 'estimated', referenceOnly: true };
}

function importQuad(item) {
  const specs = item.specs ?? {};
  const { sourceUrl, sourceUrls } = productSources(item, 'quads');
  const recommendedBattery = specs.recommended_battery && typeof specs.recommended_battery === 'object'
    ? omitUndefined({
      cells: typeof specs.recommended_battery.cells === 'string' ? specs.recommended_battery.cells : undefined,
      capacityAh: optionalPositive(specs.recommended_battery.capacity_mah, 0.001),
      capacityRangeAh: typeof specs.recommended_battery.range_mah === 'string' ? specs.recommended_battery.range_mah : undefined,
      connector: typeof specs.recommended_battery.connector === 'string' ? specs.recommended_battery.connector : undefined,
      chemistry: typeof specs.recommended_battery.chemistry === 'string' ? specs.recommended_battery.chemistry : undefined
    })
    : undefined;
  return omitUndefined({
    id: `aircraft-fpvdb-${item.slug}`,
    manufacturer: item.brand,
    model: item.model,
    classLabel: typeof specs.class === 'string' ? specs.class : 'FPV quad',
    massKg: optionalPositive(specs.weight_no_battery_g, 0.001) ?? null,
    maxTakeoffMassKg: null,
    enduranceMin: null,
    hasCamera: typeof specs.camera === 'string' ? true : null,
    isToy: null,
    sourceUrl,
    sourceUrls,
    licenseSpdx,
    retrievedAt,
    sourceHash: sha256(JSON.stringify(item)),
    sourceCommit,
    quality: 'community',
    imageUrl: '/data/images/aircraft-catalog-grid.png',
    productType: 'quad',
    maxFlightDistanceKm: null,
    maxServiceCeilingM: null,
    battery: null,
    recommendedBattery,
    propSizeM: optionalPositive(specs.prop_size_in, 0.0254),
    propMount: typeof specs.prop_mount === 'string' ? specs.prop_mount : undefined,
    wheelbaseM: optionalPositive(specs.wheelbase_mm, 0.001),
    typicalCurrentA: optionalPositive(specs.typical_current_a),
    motorRecommendation: typeof specs.motors === 'string' ? specs.motors : undefined,
    videoSystem: typeof specs.vtx_system === 'string' ? specs.vtx_system : undefined,
    camera: typeof specs.camera === 'string' ? specs.camera : undefined,
    sourceNote: typeof item.note === 'string' ? item.note : undefined
  });
}

function readSnapshot() {
  const license = fs.readFileSync(path.join(rawDir, 'LICENSE'), 'utf8');
  if (!license.includes('Creative Commons Attribution 4.0') || !license.includes('FPV-DB')) {
    throw new Error('Pinned FPV-DB snapshot does not carry the expected CC BY 4.0 attribution terms');
  }
  const manifest = readJson(path.join(rawDir, 'manifest.json'));
  for (const [category, count] of Object.entries(expectedCounts)) {
    if (manifest.counts?.[category] !== count) throw new Error(`Unexpected ${category} count in pinned source manifest`);
  }
  const files = Object.fromEntries(fpvFiles.map((filename) => {
    const bytes = fs.readFileSync(path.join(rawDir, filename));
    return [filename, { bytes, sha256: sha256(bytes), dataset: JSON.parse(bytes.toString('utf8')) }];
  }));
  for (const [category, count] of Object.entries(expectedCounts)) {
    const key = `${category}.json`;
    if (files[key].dataset.items?.length !== count) throw new Error(`Unexpected ${category} row count in pinned source file`);
  }
  return { manifest, files };
}

function buildComponents(snapshot, base, manufacturerSupplement) {
  const legacy = base.records.filter((record) => !record.id.startsWith('fpvdb-') && !record.id.startsWith('brand-'));
  const references = legacy.map(referenceRecord);
  const imported = [
    ...snapshot.files['motors.json'].dataset.items.map(importMotor),
    ...snapshot.files['batteries.json'].dataset.items.map(importBattery),
    ...snapshot.files['props.json'].dataset.items.map(importProp),
    ...snapshot.files['stacks.json'].dataset.items.map(importStack)
  ];
  const brandProducts = readJson(brandProductsPath);
  if (brandProducts.schemaVersion !== 1 || !Array.isArray(brandProducts.records)) throw new Error('Invalid brand-product snapshot');
  const brands = brandProducts.records.map(record => ({
    id: record.id, kind: 'esc', productType: 'standalone-esc', manufacturer: record.manufacturer, model: record.model,
    tags: ['manufacturer-facts', 'industrial', record.manufacturer.toLowerCase()],
    sourceUrl: record.sourceUrl, licenseSpdx: brandProducts.licenseSpdx, retrievedAt: brandProducts.retrievedAt,
    sourceHash: sha256(JSON.stringify(record)), quality: 'manufacturer', ...record.values,
    specificationSources: Object.fromEntries(Object.keys(record.values).map(field => [field, { sourceUrl: record.sourceUrl, ...(record.conditions?.[field] ? { condition: record.conditions[field] } : {}) }]))
  }));
  const records = [...references, ...imported, ...brands];
  const identities = new Set();
  for (const record of records) {
    const key = `${record.kind}|${record.manufacturer}|${record.model}`.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
    if (identities.has(key) && !record.referenceOnly) throw new Error(`Duplicate product: ${key}`);
    identities.add(key);
  }
  for (const supplement of manufacturerSupplement.records) {
    const target = records.find((record) => record.id === supplement.id);
    if (!target) throw new Error(`Manufacturer supplement target not found: ${supplement.id}`);
    Object.assign(target, supplement.values ?? {});
    if (supplement.kvSpecifications) target.kvSpecifications = supplement.kvSpecifications;
    if (supplement.specificationSources) target.specificationSources = supplement.specificationSources;
    target.supplementHash = sha256(JSON.stringify(supplement));
  }
  return {
    schemaVersion: 1,
    name: 'Open eCalc component catalog',
    version: `2026.09-fpvdb-${sourceCommit.slice(0, 7)}`,
    generatedAt: retrievedAt,
    records
  };
}

function buildAircraft(snapshot, base) {
  const existing = base.records.filter((record) => record.productType !== 'quad' || !record.sourceCommit);
  const imported = snapshot.files['quads.json'].dataset.items.map(importQuad);
  const keyFor = (record) => [record.manufacturer, record.model].map((value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ')).join('|');
  const profileProvenance = (record, attribution) => {
    const urls = [...new Set([record.sourceUrl, ...(record.sourceUrls ?? [])].filter((url) => typeof url === 'string' && url.length > 0))];
    return urls.map((sourceUrl) => ({
      sourceUrl,
      licenseSpdx: record.licenseSpdx,
      attribution,
      ...(record.sourceCommit ? { sourceCommit: record.sourceCommit } : {}),
      ...(record.sourceHash ? { sourceHash: record.sourceHash } : {})
    }));
  };
  const merged = new Map();
  for (const record of [...existing, ...imported]) {
    const key = keyFor(record);
    const prior = merged.get(key);
    if (!prior) {
      const attribution = record.sourceCommit ? 'FPV-DB — https://fpv-db.com' : 'OpenDroneList — https://github.com/dronetag/opendronelist';
      merged.set(key, {
        ...record,
        sourceUrls: [...new Set([record.sourceUrl, ...(record.sourceUrls ?? [])].filter(Boolean))],
        sourceProvenance: profileProvenance(record, attribution)
      });
      continue;
    }
    const incomingAttribution = record.sourceCommit ? 'FPV-DB — https://fpv-db.com' : 'OpenDroneList — https://github.com/dronetag/opendronelist';
    const combined = { ...prior };
    for (const [field, value] of Object.entries(record)) {
      if (['id', 'manufacturer', 'model', 'sourceUrl', 'sourceUrls', 'sourceProvenance', 'licenseSpdx', 'sourceCommit', 'sourceHash', 'retrievedAt', 'quality', 'imageUrl'].includes(field)) continue;
      const current = combined[field];
      if ((current === undefined || current === null || current === '') && value !== undefined && value !== null && value !== '') combined[field] = value;
    }
    combined.sourceUrls = [...new Set([...(prior.sourceUrls ?? []), record.sourceUrl, ...(record.sourceUrls ?? [])].filter(Boolean))];
    const provenance = [...(prior.sourceProvenance ?? []), ...profileProvenance(record, incomingAttribution)];
    combined.sourceProvenance = [...new Map(provenance.map((source) => [
      JSON.stringify([source.sourceUrl, source.licenseSpdx, source.sourceCommit, source.sourceHash]), source
    ])).values()];
    merged.set(key, combined);
  }
  return {
    schemaVersion: 1,
    name: 'Open aircraft profiles',
    version: `2026.09-fpvdb-${sourceCommit.slice(0, 7)}`,
    generatedAt: retrievedAt,
    source: 'OpenDroneList plus FPV-DB quad catalog',
    records: [...merged.values()]
  };
}

function writeManifests(snapshot, componentDataset, aircraftDataset) {
  const brandSnapshot = readJson(brandProductsPath);
  const brandSource = {
    id: 'known-brand-product-facts', name: 'Hobbywing / APD / T-Motor selected ESC specifications',
    kind: 'selected-manufacturer-product-facts', licenseSpdx: brandSnapshot.licenseSpdx,
    retrievedAt: brandSnapshot.retrievedAt, status: 'field-attributed-facts', bundle: true, included: true,
    recordCount: brandSnapshot.records.length, sha256: sha256(fs.readFileSync(brandProductsPath)),
    file: 'data/supplements/known-brand-products.v1.json',
    urls: [...new Set(brandSnapshot.records.map(record => record.sourceUrl))],
    note: brandSnapshot.policy
  };
  const sourceUrl = `https://github.com/fpvdb/fpv-db-data/tree/${sourceCommit}`;
  const recordCounts = {
    motors: snapshot.manifest.counts.motors,
    batteries: snapshot.manifest.counts.batteries,
    props: snapshot.manifest.counts.props,
    escStacks: snapshot.manifest.counts.stacks,
    quads: snapshot.manifest.counts.quads
  };
  const files = Object.fromEntries(Object.entries(snapshot.files).map(([name, file]) => [name, file.sha256]));
  const manufacturerSupplement = readJson(manufacturerSupplementPath);
  const manufacturerSupplementHash = sha256(fs.readFileSync(manufacturerSupplementPath));
  const manufacturerSupplementSources = manufacturerSupplement.records.flatMap((record) => [
    ...Object.values(record.specificationSources ?? {}).map((source) => source.sourceUrl),
    ...(record.kvSpecifications ?? []).flatMap((variant) => Object.values(variant.specificationSources ?? {}).map((source) => source.sourceUrl))
  ]);
  const manufacturerSupplementFields = manufacturerSupplement.records.flatMap((record) => [
    ...Object.keys(record.specificationSources ?? {}).map((field) => `${record.id}.${field}`),
    ...(record.kvSpecifications ?? []).flatMap((variant) => Object.keys(variant.specificationSources ?? {}).map((field) => `${record.id}.kv${variant.kv}.${field}`))
  ]);
  const manufacturerSupplementManifest = {
    id: 'manufacturer-specification-supplement',
    kind: 'selected-component-specification-facts',
    urls: [...new Set(manufacturerSupplementSources)],
    licenseSpdx: 'NOASSERTION',
    retrievedAt: manufacturerSupplement.retrievedAt,
    status: 'field-attributed-supplement',
    bundle: true,
    recordCount: manufacturerSupplement.records.length,
    fields: manufacturerSupplementFields,
    supplementSha256: manufacturerSupplementHash,
    note: 'Small set of explicitly attributed factual specifications only; source catalog terms were not evaluated for bulk redistribution. No source text, catalog database, or product images included.'
  };
  const sourceManifestPath = path.join(root, 'data/manifests/sources.v1.json');
  const sourceManifest = readJson(sourceManifestPath);
  sourceManifest.generatedAt = retrievedAt;
  sourceManifest.policy = 'bundled product data requires an explicit redistribution licence; images require separate rights';
  sourceManifest.sources = [
    ...sourceManifest.sources.filter((source) => !['fpvdb-open-dataset', 'manufacturer-specification-supplement', brandSource.id].includes(source.id)).map((source) => {
      if (source.id === 'strawsondesign-motor-prop-testing') return { ...source, status: 'reference-only', bundle: true, recordCount: 408, reason: 'Retained as estimated reference rows; generated scalar defaults are excluded from normal catalog results' };
      if (source.id === 'liiondb') return { ...source, status: 'reference-only', bundle: true, recordCount: componentDataset.records.filter((record) => record.manufacturer === 'LiionDB').length, reason: 'Derived chemistry/parallel presets are reference-only, not named commercial packs' };
      if (source.id === 'uavdb-org') return { ...source, status: 'quarantine', bundle: false, licenseSpdx: 'NOASSERTION', reason: 'Heavy-UAV catalog lead; missing LICENSE file and mixed UIUC-derived data prevent redistribution approval' };
      return source;
    }),
    {
      id: 'fpvdb-open-dataset',
      kind: 'motors-batteries-props-esc-stacks-and-quads',
      url: sourceUrl,
      datasetUrl: 'https://www.fpv-db.com/data/',
      licenseSpdx,
      attribution: 'FPV-DB — https://fpv-db.com',
      sourceCommit,
      retrievedAt,
      status: 'verified',
      quality: 'community',
      bundle: true,
      recordCounts,
      files,
      note: 'CC BY 4.0 dataset snapshot. Product URLs and notes retained; no product images imported. ESC entries are FC/ESC stacks, not standalone ESCs.'
    },
    manufacturerSupplementManifest,
    brandSource
  ];
  writeJson(sourceManifestPath, sourceManifest);

  const runtimePath = path.join(root, 'static/data/source-manifest.json');
  const runtime = readJson(runtimePath);
  runtime.datasetVersion = componentDataset.version;
  runtime.generatedAt = retrievedAt;
  runtime.sources = [
    ...runtime.sources.filter((source) => !['fpvdb-open-dataset', 'manufacturer-specification-supplement', brandSource.id].includes(source.id)),
    {
      id: 'fpvdb-open-dataset',
      name: 'FPV-DB Open Dataset',
      url: sourceUrl,
      datasetUrl: 'https://www.fpv-db.com/data/',
      licenseSpdx,
      attribution: 'FPV-DB — https://fpv-db.com',
      sourceCommit,
      retrievedAt,
      included: true,
      recordCounts,
      files,
      note: 'Brand/model product records and manufacturer-published bench tables. No product images. ESC listings are integrated FC/ESC stacks.'
    },
    {
      ...manufacturerSupplementManifest,
      name: 'Manufacturer field-level specification supplements',
      included: true,
      attribution: 'T-Motor / T-HOBBY and Tattu / GensTattu; see per-field URLs'
    },
    brandSource
  ];
  writeJson(runtimePath, runtime);

  writeJson(path.join(root, 'data/manifests/fpvdb-snapshot.v1.json'), {
    schemaVersion: 1,
    source: sourceUrl,
    datasetUrl: 'https://www.fpv-db.com/data/',
    licenseSpdx,
    attribution: 'FPV-DB — https://fpv-db.com',
    sourceCommit,
    retrievedAt,
    snapshotDate: snapshotName,
    manifestSha256: sha256(fs.readFileSync(path.join(rawDir, 'manifest.json'))),
    sourceFileSha256: files,
    importedCounts: recordCounts,
    bundledRecordCounts: {
      components: componentDataset.records.length,
      aircraft: aircraftDataset.records.length,
      referenceOnlyComponents: componentDataset.records.filter((record) => record.referenceOnly).length
    },
    knownBrandProducts: brandSource,
    manufacturerSupplement: {
      file: 'data/supplements/manufacturer-specifications.v1.json',
      sha256: sha256(fs.readFileSync(manufacturerSupplementPath)),
      recordCount: readJson(manufacturerSupplementPath).records.length,
      records: readJson(manufacturerSupplementPath).records.map(({ id, specificationSources, kvSpecifications }) => ({
        id,
        fields: [...new Set([
          ...Object.keys(specificationSources ?? {}),
          ...(kvSpecifications ?? []).flatMap((variant) => Object.keys(variant.specificationSources ?? {}).map((field) => `kvSpecifications.${variant.kv}.${field}`))
        ])],
        sourceUrls: [...new Set([
          ...Object.values(specificationSources ?? {}).map((source) => source.sourceUrl),
          ...(kvSpecifications ?? []).flatMap((variant) => Object.values(variant.specificationSources ?? {}).map((source) => source.sourceUrl))
        ])]
      }))
    },
    imagePolicy: 'No source product images included; quad profiles use the existing generic project illustration.'
  });
}

if (process.argv.includes('--fetch')) await fetchPinnedSnapshot();
const snapshot = readSnapshot();
const manufacturerSupplement = readJson(manufacturerSupplementPath);
if (manufacturerSupplement.schemaVersion !== 1 || !Array.isArray(manufacturerSupplement.records)) throw new Error('Unsupported manufacturer supplement schema');
const components = buildComponents(snapshot, readJson(componentsPath), manufacturerSupplement);
const aircraft = buildAircraft(snapshot, readJson(aircraftPath));
writeJson(componentsPath, components);
writeJson(normalizedPath, components);
writeJson(aircraftPath, aircraft);
writeManifests(snapshot, components, aircraft);
console.log(JSON.stringify({
  sourceCommit,
  importedCounts: {
    motors: snapshot.manifest.counts.motors,
    batteries: snapshot.manifest.counts.batteries,
    props: snapshot.manifest.counts.props,
    stacks: snapshot.manifest.counts.stacks,
    quads: snapshot.manifest.counts.quads
  },
  bundledComponents: components.records.length,
  referenceOnly: components.records.filter((record) => record.referenceOnly).length,
  aircraftProfiles: aircraft.records.length
}));
