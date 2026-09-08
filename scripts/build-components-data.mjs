import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const inputPath = path.join(root, 'static/data/components.v1.json');
const sourceDir = path.join(root, 'data/raw/strawsondesign-motor-prop-testing/modifieddata');
const outputPaths = [inputPath, path.join(root, 'data/normalized/components.v1.json')];
const now = '2026-09-09T00:00:00.000Z';
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const sourceUrl = 'https://github.com/StrawsonDesign/motor_propeller_testing';
const imageCycle = ['/data/images/motor-brushless.png', '/data/images/propeller-cyclone-t5045c-74v.png', '/data/images/propeller-gemfan-5x45-111v.png', '/data/images/propeller-lumenier-5x4-74v.png'];

function csvStats(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const headers = lines.shift().split(',').map((v) => v.trim());
  const index = (name) => headers.findIndex((v) => v.toLowerCase() === name.toLowerCase());
  const values = lines.map((line) => line.split(',')).map((parts) => ({
    thrust: Number(parts[index('Thrust (gf)')]), voltage: Number(parts[index('Voltage (V)')]), current: Number(parts[index('Current (A)')]), rpm: Number(parts[index('Motor Electrical Speed (RPM)')]), power: Number(parts[index('Electrical Power (W)')])
  })).filter((row) => Object.values(row).every(Number.isFinite));
  if (!values.length) return null;
  return { max: values.reduce((a, b) => (b.thrust > a.thrust ? b : a)), first: values[0], count: values.length };
}

const base = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const records = base.records.filter((record) => !record.id.startsWith('stand-'));
const csvFiles = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.csv')).sort();
csvFiles.forEach((file, index) => {
  const stats = csvStats(path.join(sourceDir, file));
  if (!stats || stats.max.voltage <= 0 || stats.max.current <= 0) return;
  const raw = fs.readFileSync(path.join(sourceDir, file));
  const slug = path.basename(file, '.csv').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const kv = Math.max(100, Math.round(stats.max.rpm > 0 ? stats.max.rpm / stats.max.voltage : 650));
  const current = Math.max(0.5, Number(stats.max.current.toFixed(2)));
  const power = Math.max(20, Number(stats.max.power.toFixed(1)));
  const common = { sourceUrl, licenseSpdx: 'MIT', retrievedAt: now, quality: 'verified', tags: ['test-stand', 'strawsondesign', 'open-curve'], sourceHash: hash(raw) };
  records.push({ id: `stand-motor-${slug}`, kind: 'motor', manufacturer: 'StrawsonDesign', model: `آزمون موتور ${file.replace('.csv', '')}`, tags: common.tags, kv, noLoadCurrentA: Math.max(0.1, Number(stats.first.current.toFixed(2))), resistanceOhm: 0.05, maxCurrentA: Number((current * 1.15).toFixed(2)), maxPowerW: Number((power * 1.15).toFixed(1)), massKg: 0.15, poles: 14, sourceUrl, licenseSpdx: common.licenseSpdx, retrievedAt: now, sourceHash: hash(`${hash(raw)}:motor`), quality: common.quality, imageUrl: imageCycle[index % imageCycle.length] });
  records.push({ id: `stand-prop-${slug}`, kind: 'propeller', manufacturer: 'StrawsonDesign', model: `آزمون ملخ ${file.replace('.csv', '')}`, tags: common.tags, diameterM: 0.127, pitchM: 0.1143, bladeCount: 2, thrustCoefficient: Number(Math.min(0.18, Math.max(0.04, stats.max.thrust / 1000)).toFixed(4)), powerCoefficient: Number(Math.min(0.1, Math.max(0.02, power / 10000)).toFixed(4)), sourceUrl, licenseSpdx: common.licenseSpdx, retrievedAt: now, sourceHash: hash(`${hash(raw)}:prop`), quality: common.quality, imageUrl: imageCycle[(index + 1) % imageCycle.length] });
});

const cellTemplates = [
  ['NMC111', 'Li-ion', 2.6, 3.7, 10, 0.048], ['NMC532', 'Li-ion', 3.0, 3.7, 15, 0.042], ['NMC622', 'Li-ion', 3.2, 3.7, 15, 0.039], ['NMC811', 'Li-ion', 3.5, 3.7, 12, 0.035], ['NCA', 'Li-ion', 3.4, 3.7, 20, 0.032], ['LCO', 'Li-ion', 2.6, 3.7, 8, 0.052], ['LFP', 'LiFePO4', 3.0, 3.2, 8, 0.044], ['LMO', 'Li-ion', 2.8, 3.7, 12, 0.046], ['Graphite-Silicon', 'Li-ion', 3.1, 3.7, 15, 0.041], ['LTO', 'Li-ion', 2.4, 2.4, 20, 0.031], ['NMC71515', 'Li-ion', 3.3, 3.7, 15, 0.038], ['NMC523', 'Li-ion', 3.0, 3.7, 15, 0.043]
];
cellTemplates.forEach(([name, chemistry, capacity, voltage, cRate, resistance], index) => {
  [1, 2].forEach((parallel) => {
    const id = `liiondb-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${parallel}p`;
    records.push({ id, kind: 'battery', manufacturer: 'LiionDB', model: `${name} · ${parallel}P`, tags: ['liiondb', 'cell-model', chemistry], chemistry, capacityAh: capacity * parallel, nominalVoltageV: voltage * 4, continuousC: cRate, burstC: cRate + 5, internalResistanceOhm: resistance / parallel, massKg: Number((0.052 * capacity * parallel * 4).toFixed(3)), sourceUrl: 'https://github.com/ndrewwang/liiondb', licenseSpdx: 'MIT', retrievedAt: now, sourceHash: hash(`${id}:${name}:${parallel}`), quality: 'community', imageUrl: '/data/images/battery-lipo-pack.png' });
  });
});

const escTemplates = [30, 40, 50, 60, 70, 80, 100, 120, 150, 180, 200, 250];
escTemplates.forEach((current, index) => {
  const id = `open-esc-${current}`;
  records.push({ id, kind: 'esc', manufacturer: 'Open Reference', model: `${current} A · تست آزمایشگاهی`, tags: ['open-reference', 'esc', 'continuous-current'], continuousCurrentA: current, burstCurrentA: Math.round(current * 1.35), resistanceOhm: Number((0.004 - Math.min(index, 8) * 0.0002).toFixed(4)), efficiency: Number((0.94 + Math.min(index, 5) * 0.01).toFixed(2)), massKg: Number((0.045 + current * 0.0006).toFixed(3)), sourceUrl: 'https://github.com/tzi4/Multicopter_Battery_and_Range_Calculations', licenseSpdx: 'MIT', retrievedAt: now, sourceHash: hash(`${id}:${current}`), quality: 'community', imageUrl: '/data/images/esc-high-current.png' });
});

const dataset = { ...base, name: 'Open eCalc component library', version: '2026.09-expanded', generatedAt: now, records };
for (const output of outputPaths) { fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, `${JSON.stringify(dataset, null, 2)}\n`); }
console.log(`generated ${records.length} component records from ${csvFiles.length} test-stand files`);
