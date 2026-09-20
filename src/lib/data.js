import { Redis } from '@upstash/redis';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { eventsFor } from './wedding';

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const root = process.env.WEDDING_DATA_DIR || process.cwd();
const contentPath = path.join(root, 'data.json');
const responsePath = path.join(root, 'rsvps.json');
const parse = value => typeof value === 'string' ? JSON.parse(value) : value;

async function readFile(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
async function rawContent() {
  if (process.env.VERCEL && !redis) {
    const keys = Object.keys(process.env).filter(k => k.includes('UPSTASH') || k.includes('KV')).join(', ');
    throw Object.assign(new Error(\`Chưa cấu hình kho dữ liệu. Có URL: \${!!redisUrl}, Có Token: \${!!redisToken}. Các biến hiện có: \${keys}\`), { status: 503 });
  }
  // Remote outages must not silently fall back to stale local data.
  if (redis) {
    const remote = await redis.get('wedding-data');
    if (remote) return parse(remote);
    const initial = await readFile(contentPath, null);
    if (initial) await redis.set('wedding-data', initial, { nx: true });
    return parse(await redis.get('wedding-data'));
  }
  return readFile(contentPath, null);
}
async function withFileLock(file, action) {
  const lock = file + '.lock';
  const deadline = Date.now() + 5000;
  for (;;) {
    try { await fs.mkdir(lock); break; }
    catch (error) {
      if (error.code !== 'EEXIST' || Date.now() > deadline) throw error;
      await new Promise(resolve => setTimeout(resolve, 35));
    }
  }
  try { return await action(); } finally { await fs.rmdir(lock); }
}
async function writeAtomic(file, value) {
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2), 'utf8');
    // Windows may briefly hold the destination while another request reads it.
    for (let attempt = 0; ; attempt++) {
      try { await fs.rename(temporary, file); break; }
      catch (error) {
        if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt >= 20) throw error;
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }
  }
  finally { await fs.unlink(temporary).catch(() => {}); }
}
export async function getWeddingData() {
  const data = await rawContent();
  if (!data) return null;
  const overlays = redis ? await redis.hgetall('wedding:rsvps:v2') || {} : await readFile(responsePath, {});
  const merged = new Map((data.rsvps || []).map(r => [r.id, r]));
  for (const [id, stored] of Object.entries(overlays)) {
    const record = parse(stored);
    if (record.deleted) merged.delete(id); else merged.set(id, record);
  }
  return { ...data, revision: data.revision || 0, events: eventsFor(data), rsvps: [...merged.values()] };
}
export async function saveResponse(record) {
  if (redis) return redis.hset('wedding:rsvps:v2', { [record.id]: JSON.stringify(record) });
  return withFileLock(responsePath, async () => {
    const responses = await readFile(responsePath, {});
    responses[record.id] = record;
    await writeAtomic(responsePath, responses);
  });
}
export async function setWeddingData(input) {
  const fields = ['invitation', 'albums', 'stories', 'itinerary', 'mapUrl', 'texts', 'links', 'events', 'dressCode'];
  const patch = Object.fromEntries(fields.filter(key => key in input).map(key => [key, input[key]]));
  // Legacy replies stay untouched; new replies live in a separate file/hash.
  if (redis) {
    await rawContent();
    const result = await redis.eval(`
      local current = cjson.decode(redis.call('GET', KEYS[1]))
      if (current.revision or 0) ~= tonumber(ARGV[1]) then return 0 end
      local patch = cjson.decode(ARGV[2])
      for key, value in pairs(patch) do current[key] = value end
      current.revision = (current.revision or 0) + 1
      redis.call('SET', KEYS[1], cjson.encode(current))
      return 1`, ['wedding-data'], [input.revision, JSON.stringify(patch)]);
    if (!result) throw Object.assign(new Error('Nội dung đã thay đổi ở phiên khác. Hãy tải lại trước khi lưu.'), { status: 409 });
  } else {
    await withFileLock(contentPath, async () => {
      const current = await rawContent();
      if ((current?.revision || 0) !== input.revision) throw Object.assign(new Error('Nội dung đã thay đổi ở phiên khác. Hãy tải lại trước khi lưu.'), { status: 409 });
      await writeAtomic(contentPath, { ...current, ...patch, revision: input.revision + 1 });
    });
  }
}
