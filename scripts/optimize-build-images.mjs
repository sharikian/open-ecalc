import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

// Optimize distributable copies only. Source images and provenance stay intact.
const root = 'build/data/images';
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (entry.name.endsWith('.png')) result.push(path);
  }
  return result;
}
let before = 0;
let after = 0;
for (const path of await files(root)) {
  const size = (await stat(path)).size;
  // Charts keep their original pixels and colours for readable measurements.
  const chart = /validation|propeller-/.test(path);
  const pipeline = sharp(path);
  if (!chart) pipeline.resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true });
  const buffer = await pipeline.png(chart
    ? { compressionLevel: 9 }
    : { compressionLevel: 9, palette: true, quality: 85, effort: 10 }).toBuffer();
  before += size;
  if (buffer.length < size) {
    await (await import('node:fs/promises')).writeFile(path, buffer);
    after += buffer.length;
  } else after += size;
}
console.log(`Build images: ${(before / 1048576).toFixed(2)} → ${(after / 1048576).toFixed(2)} MiB`);
