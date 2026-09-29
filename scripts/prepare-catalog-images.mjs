import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

// Optimize selected built-in imagegen outputs, retaining their transparent alpha.
const manifestPath = path.resolve(process.argv[2] ?? 'data/supplements/catalog-images.v1.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sourceDirectory = process.argv[3];
if (!sourceDirectory) throw new Error('Supply the directory containing the selected imagegen PNG outputs as the third argument.');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
for (const asset of manifest.assets) {
  const output = path.join(root, 'static', asset.imageUrl);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await sharp(path.join(sourceDirectory, asset.originalFile)).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 88 }).toFile(output);
  asset.sha256 = crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex');
  const info = await sharp(output).metadata();
  if (!info.hasAlpha) throw new Error(`Generated asset lost transparency: ${output}`);
  console.log(`${asset.key}: ${info.width}x${info.height}, ${fs.statSync(output).size} bytes, alpha retained`);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
