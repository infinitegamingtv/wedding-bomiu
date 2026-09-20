import { put } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { requireAdmin, sameOrigin } from '@/lib/auth';
import { json, failure, invalid } from '@/lib/http';

const MAX_SIZE = 25 * 1024 * 1024;
export async function POST(request) {
  try {
    requireAdmin(request); sameOrigin(request);
    const reader = request.body?.getReader();
    if (!reader) invalid('Chưa chọn tệp.');
    const chunks = []; let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SIZE + 65536) { await reader.cancel(); invalid('Tệp tối đa 25 MB.'); }
      chunks.push(Buffer.from(value));
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function' || file.size > MAX_SIZE) invalid('Tệp không hợp lệ hoặc lớn hơn 25 MB.');
    let buffer = Buffer.from(await file.arrayBuffer());
    let extension; let contentType;
    if (file.type.startsWith('image/')) {
      try {
        const input = sharp(buffer, { limitInputPixels: 60000000 });
        const meta = await input.metadata();
        if (!['jpeg', 'png', 'webp', 'avif', 'heif'].includes(meta.format)) invalid('Chọn ảnh JPG, PNG, WebP hoặc AVIF.');
        buffer = await input.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
        extension = 'webp'; contentType = 'image/webp';
      } catch (error) { if (error.status) throw error; invalid('Không đọc được ảnh. Chọn ảnh JPG, PNG hoặc WebP khác.'); }
    } else {
      const head = buffer.subarray(0, 12);
      if (head.subarray(0, 3).toString() === 'ID3' || (head[0] === 255 && (head[1] & 224) === 224)) { extension = 'mp3'; contentType = 'audio/mpeg'; }
      else if (head.subarray(0, 4).toString() === 'RIFF' && head.subarray(8, 12).toString() === 'WAVE') { extension = 'wav'; contentType = 'audio/wav'; }
      else if (head.subarray(0, 4).toString() === 'OggS') { extension = 'ogg'; contentType = 'audio/ogg'; }
      else invalid('Chỉ nhận ảnh và nhạc MP3, WAV, OGG.');
    }
    const filename = randomUUID() + '.' + extension;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, buffer, { access: 'public', contentType });
      return json({ url: blob.url });
    }
    if (process.env.VERCEL) throw Object.assign(new Error('Chưa cấu hình kho tệp trên hosting.'), { status: 503 });
    const directory = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, filename), buffer);
    return json({ url: '/uploads/' + filename });
  } catch (error) { return failure(error); }
}
