import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import manifest from '../../../data/supplements/catalog-images.v1.json';
import dataset from '../../../static/data/components.v1.json';

describe('generated catalog illustrations', () => {
  it('bundles five compact transparent assets with pinned hashes and saved prompts', async () => {
    expect(manifest.assets).toHaveLength(5);
    for (const asset of manifest.assets) {
      const path = new URL(`../../../static${asset.imageUrl}`, import.meta.url);
      const bytes = fs.readFileSync(path);
      expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(bytes.byteLength).toBeLessThan(40000);
      expect(asset.prompt).toContain('not an exact manufacturer model');
      const metadata = await sharp(bytes).metadata();
      expect(metadata.hasAlpha).toBe(true);
      expect(metadata.width).toBe(256);
      expect(metadata.height).toBe(256);
    }
  });
  it('marks generated thumbnails separately from manufacturer product evidence', () => {
    const records = dataset.records.filter(record => /^(fpvdb|brand|popular)-/.test(record.id));
    for (const record of records) {
      expect(record.imageType).toBe('illustration');
      const key = record.productType === 'fc-esc-stack' ? 'stack' : record.kind;
      expect(record.imageUrl).toBe(manifest.assets.find(asset => asset.key === key)?.imageUrl);
    }
  });
});
