import { NextResponse } from 'next/server';
export function json(value, status = 200) { return NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } }); }
export function failure(error) {
  if (!error.status) console.error('Wedding request failed:', error.code || error.name);
  return json({ error: error.status ? error.message : 'Không thể lưu hoặc tải dữ liệu. Vui lòng thử lại.' }, error.status || 500);
}
export function invalid(message) { throw Object.assign(new Error(message), { status: 400 }); }
export async function readJson(request, maxBytes = 512000) {
  const reader = request.body?.getReader();
  if (!reader) invalid('Thiếu dữ liệu.');
  const chunks = []; let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); invalid('Dữ liệu quá lớn.'); }
    chunks.push(Buffer.from(value));
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { invalid('Dữ liệu không hợp lệ.'); }
}
