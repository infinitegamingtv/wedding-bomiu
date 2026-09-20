import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const upload = path.resolve('public/uploads');
const output = path.resolve('public/optimized');
await fs.mkdir(output, { recursive: true });
const manifest = {}; let originalBytes = 0; let outputBytes = 0; let count = 0;
for (const name of await fs.readdir(upload)) {
  if (!/\.(jpe?g|png|webp)$/i.test(name)) continue;
  const bytes = await fs.readFile(path.join(upload, name));
  if (bytes.length < 150000) continue;
  const optimized = await sharp(bytes, { limitInputPixels: 60000000 }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  if (optimized.length >= bytes.length) continue;
  const filename = createHash('sha256').update(bytes).digest('hex').slice(0, 24) + '.webp';
  await fs.writeFile(path.join(output, filename), optimized);
  manifest['/uploads/' + name] = '/optimized/' + filename;
  originalBytes += bytes.length; outputBytes += optimized.length; count++;
}
await fs.writeFile('src/lib/image-manifest.json', JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ count, originalBytes, outputBytes, reductionPercent: Math.round(100 * (1 - outputBytes / originalBytes)) }));
