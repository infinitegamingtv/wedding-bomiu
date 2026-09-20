import fs from 'node:fs/promises';
import { openSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';
import net from 'node:net';
import { randomBytes, scryptSync } from 'node:crypto';
import assert from 'node:assert/strict';

const root = process.cwd();
const work = await fs.mkdtemp(path.join(os.tmpdir(), 'wedding-test-'));
const fixture = path.join(work, 'test-data-' + Date.now());
await fs.mkdir(fixture, { recursive: true });
const original = JSON.parse(await fs.readFile(path.join(root, 'data.json'), 'utf8'));
const seed = structuredClone(original);
seed.links = [...(seed.links || []), ...Array.from({ length: 14 }, (_, i) => ({ id: 'test-' + i, guestName: 'Khách thử ' + i, slug: 'test-private-link-' + i, eventId: 'lao-cai' }))];
seed.rsvps ||= [];
seed.rsvps.push({ id: 'legacy-test', name: 'Khách cũ kiểm thử', attending: 'yes', count: 1, message: '' });
seed.links.push({ id: 'browser', guestName: 'Khách kiểm tra giao diện', slug: 'kiem-tra-giao-dien', eventId: 'thanh-hoa' });
await fs.writeFile(path.join(fixture, 'data.json'), JSON.stringify(seed));
const password = 'Wedding-Test-Only-2026!';
const salt = randomBytes(16).toString('hex');
const log = openSync(path.join(work, 'test-server.log'), 'w');
const listener = net.createServer();
await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const child = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, detached: true, windowsHide: true, stdio: ['ignore', log, log], env: { ...process.env, VERCEL: '', KV_REST_API_URL: '', KV_REST_API_TOKEN: '', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '', BLOB_READ_WRITE_TOKEN: '', WEDDING_BUILD_DIR: '.next-test', WEDDING_DATA_DIR: fixture, ADMIN_PASSWORD_HASH: salt + ':' + scryptSync(password, salt, 64).toString('hex'), SESSION_SECRET: randomBytes(48).toString('hex') } });
child.unref();
const base = 'http://127.0.0.1:' + port;
await fs.writeFile(path.join(work, 'test-server.json'), JSON.stringify({ pid: child.pid, fixture, base }));
try {
for (let i = 0; i < 45; i++) {
  try { const res = await fetch(base + '/api/auth'); if (res.ok) break; } catch {}
  if (i === 44) throw new Error('Test server did not start');
  await new Promise(resolve => setTimeout(resolve, 1000));
}
let passed = 0;
const ok = name => { passed++; console.log('PASS ' + name); };
const call = (url, { method = 'GET', body, cookie, origin = base } = {}) => fetch(base + url, { method, headers: { ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
const read = async res => { assert.equal(res.status, 200, await res.clone().text()); return res.json(); };
const payload = { name: 'Khách thử', attending: 'yes', count: 2, message: 'Chúc mừng hai bạn!', eventId: 'lao-cai', slug: 'test-private-link-0' };

assert.equal((await call('/api/data')).status, 401);
assert.equal((await call('/api/data', { method: 'POST', body: {} })).status, 401);
assert.equal((await call('/api/upload', { method: 'POST', body: {} })).status, 401);
assert.equal((await call('/api/rsvp', { method: 'DELETE', body: { id: '1' } })).status, 401);
ok('Admin reads, writes, uploads and deletion require a session');

assert.equal((await call('/api/auth', { method: 'POST', body: { password: 'wrong' } })).status, 401);
const login = await call('/api/auth', { method: 'POST', body: { password } });
await read(login);
const cookie = login.headers.get('set-cookie').split(';')[0];
assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
assert.match(login.headers.get('set-cookie'), /SameSite=strict/i);
assert.equal((await read(await call('/api/auth', { cookie }))).authenticated, true);
assert.equal((await call('/api/data', { cookie: cookie + 'tampered' })).status, 401);
ok('Password verification, protected cookie and signature validation');

let admin = await read(await call('/api/data', { cookie }));
assert.equal(admin.events.length, 3);
assert.equal(admin.events.find(e => e.id === 'thanh-hoa').date, '');
assert.equal(admin.events.find(e => e.id === 'lao-cai').date, original.invitation.date);
ok('Migration preserves the known ceremony and leaves unknown dates blank');

assert.equal((await call('/api/rsvp', { method: 'POST', body: payload, origin: 'https://foreign.example' })).status, 403);
assert.equal((await call('/api/data', { method: 'POST', body: admin, cookie, origin: 'https://foreign.example' })).status, 403);
ok('Cross-origin write requests rejected');

for (const change of [{ count: 0 }, { count: 1.5 }, { count: 11 }, { eventId: 'missing' }, { name: '  ' }, { message: 'a'.repeat(2001) }, { attending: 'maybe' }]) {
  assert.equal((await call('/api/rsvp', { method: 'POST', body: { ...payload, ...change } })).status, 400);
}
ok('Server validates attendance, party, headcount, name and message');

const before = admin.rsvps.length;
const first = await read(await call('/api/rsvp', { method: 'POST', body: payload }));
const second = await read(await call('/api/rsvp', { method: 'POST', body: { ...payload, count: 4, eventId: 'thanh-hoa' } }));
assert.equal(first.rsvp.id, second.rsvp.id);
assert.equal(second.rsvp.submittedAt, first.rsvp.submittedAt);
assert.equal((await read(await call('/api/rsvp?slug=test-private-link-0'))).rsvp.count, 4);
assert.equal((await read(await call('/api/data', { cookie }))).rsvps.length, before + 1);
ok('Editing a personalized RSVP updates one record and survives reload');

admin.texts.heroSubtitle = 'Lễ Thành Hôn';
await read(await call('/api/data', { method: 'POST', body: admin, cookie }));
assert.equal((await read(await call('/api/data', { cookie }))).rsvps.find(r => r.id === first.rsvp.id).count, 4);
assert.equal((await call('/api/data', { method: 'POST', body: admin, cookie })).status, 409);
ok('Stale admin saves cannot erase replies; conflicting content edits return 409');

const simultaneous = await Promise.all(Array.from({ length: 12 }, (_, i) => call('/api/rsvp', { method: 'POST', body: { ...payload, slug: 'test-private-link-' + (i + 1) } })));
for (const res of simultaneous) await read(res);
admin = await read(await call('/api/data', { cookie }));
assert.equal(admin.rsvps.length, before + 13);
ok('Twelve simultaneous guests preserve every response');

const guestInit = await call('/api/rsvp'); await read(guestInit);
const visitorCookie = guestInit.headers.get('set-cookie').split(';')[0];
const commonPayload = { ...payload }; delete commonPayload.slug;
const common = await read(await call('/api/rsvp', { method: 'POST', cookie: visitorCookie, body: commonPayload }));
const absent = await read(await call('/api/rsvp', { method: 'POST', cookie: visitorCookie, body: { ...commonPayload, attending: 'no', count: 7 } }));
assert.equal(common.rsvp.id, absent.rsvp.id); assert.equal(absent.rsvp.count, 0);
assert.equal((await read(await call('/api/rsvp', { cookie: visitorCookie }))).rsvp.attending, 'no');
ok('Common invitations remember the browser; declining resets headcount to zero');

const home = await (await call('/')).text();
assert.ok(!home.includes('test-private-link-1'));
assert.ok(!home.includes('guestId'));
assert.ok(home.includes('/optimized/'));
assert.equal((await call('/invite/not-a-valid-guest')).status, 404);
ok('Public pages omit private guest lists and use optimized images');

await read(await call('/api/rsvp', { method: 'DELETE', cookie, body: { id: first.rsvp.id } }));
assert.equal((await read(await call('/api/rsvp?slug=test-private-link-0'))).rsvp, null);
await read(await call('/api/rsvp', { method: 'DELETE', cookie, body: { id: 'legacy-test' } }));
assert.ok(!(await read(await call('/api/data', { cookie }))).rsvps.some(r => r.id === 'legacy-test'));
ok('Deleting new and legacy replies persists without rewriting wedding content');

const malicious = new FormData(); malicious.set('file', new Blob(['<script>alert(1)</script>'], { type: 'text/html' }), 'bad.html');
assert.equal((await fetch(base + '/api/upload', { method: 'POST', headers: { Origin: base, Cookie: cookie }, body: malicious })).status, 400);
ok('Upload rejects executable/non-media files');

const logout = await call('/api/auth', { method: 'DELETE', cookie }); await read(logout);
assert.match(logout.headers.get('set-cookie'), /Max-Age=0/i);
assert.equal((await read(await call('/api/auth'))).authenticated, false);
ok('Logout clears the session cookie');

assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'data.json'), 'utf8')), original);
ok('Real invitation data is unchanged by integration tests');
for (let i = 0; i < 10; i++) await call('/api/auth', { method: 'POST', body: { password: 'wrong' } });
assert.equal((await call('/api/auth', { method: 'POST', body: { password: 'wrong' } })).status, 429);
ok('Repeated login attempts are rate limited');
console.log(`Completed ${passed} groups. Real data was not modified.`);
} finally {
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  else { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
}

