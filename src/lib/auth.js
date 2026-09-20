import { createHmac, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { redis } from './data';
const scrypt = promisify(scryptCallback);
const attempts = new Map();
export const ADMIN_COOKIE = 'wedding_admin';
export const VISITOR_COOKIE = 'wedding_visitor';

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw Object.assign(new Error('Chưa cấu hình đăng nhập trên máy chủ.'), { status: 503 });
  return value;
}
export function signToken(subject, seconds) {
  const payload = Buffer.from(JSON.stringify({ subject, exp: Date.now() + seconds * 1000, nonce: randomUUID() })).toString('base64url');
  return payload + '.' + createHmac('sha256', secret()).update(payload).digest('base64url');
}
export function readToken(token) {
  if (!token || token.length > 2048) return null;
  try {
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) return null;
    const expected = createHmac('sha256', secret()).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return value.exp > Date.now() && typeof value.subject === 'string' ? value.subject : null;
  } catch { return null; }
}
export function isAdmin(request) { return readToken(request.cookies.get(ADMIN_COOKIE)?.value) === 'admin'; }
export function requireAdmin(request) {
  if (!isAdmin(request)) throw Object.assign(new Error('Vui lòng đăng nhập quản trị.'), { status: 401 });
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  try { if (origin && new URL(origin).host === request.headers.get('host')) return; } catch {}
  throw Object.assign(new Error('Yêu cầu không hợp lệ.'), { status: 403 });
}
export function cookieOptions(request, maxAge) {
  return { httpOnly: true, sameSite: 'strict', secure: new URL(request.url).protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https', path: '/', maxAge };
}
export async function verifyPassword(password) {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored || !process.env.SESSION_SECRET) throw Object.assign(new Error('Chưa cấu hình đăng nhập trên máy chủ.'), { status: 503 });
  if (typeof password !== 'string' || password.length > 256) return false;
  const [salt, hex] = stored.split(':');
  if (!salt || !/^[a-f0-9]{128}$/.test(hex || '')) throw Object.assign(new Error('Cấu hình mật khẩu không hợp lệ.'), { status: 503 });
  const hash = await scrypt(password, salt, 64);
  return timingSafeEqual(hash, Buffer.from(hex, 'hex'));
}
export async function limitRequests(key, limit, seconds) {
  let count;
  if (redis) {
    count = await redis.eval(`local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return n`, ['wedding:limit:' + key], [seconds]);
  } else {
    const now = Date.now();
    for (const [id, item] of attempts) if (item.until < now) attempts.delete(id);
    const item = attempts.get(key) || { count: 0, until: now + seconds * 1000 };
    count = ++item.count; attempts.set(key, item);
  }
  if (count > limit) throw Object.assign(new Error('Bạn thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.'), { status: 429 });
}
export function clientAddress(request) {
  // Only trust the platform's address header on Vercel.
  return process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for') || 'shared' : 'shared';
}
