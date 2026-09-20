import { getWeddingData, setWeddingData } from '@/lib/data';
import { requireAdmin, sameOrigin } from '@/lib/auth';
import { json, failure, readJson, invalid } from '@/lib/http';
export async function GET(request) {
  try { requireAdmin(request); return json(await getWeddingData()); }
  catch (error) { return failure(error); }
}
export async function POST(request) {
  try {
    requireAdmin(request); sameOrigin(request);
    const body = await readJson(request);
    if (!body || !Number.isInteger(body.revision) || !body.invitation || !Array.isArray(body.events) || !body.events.length || body.events.length > 20 || !Array.isArray(body.links)) invalid('Thông tin thiệp chưa đầy đủ.');
    const ids = new Set();
    for (const event of body.events) {
      if (!event || !/^[a-zA-Z0-9-]{1,80}$/.test(event.id) || ids.has(event.id) || typeof event.name !== 'string' || !event.name.trim() || event.name.length > 120) invalid('Tên hoặc mã tiệc không hợp lệ.');
      if (event.date && (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d)?$/.test(event.date) || !Number.isFinite(new Date(event.date).getTime()))) invalid('Ngày giờ tiệc không hợp lệ.');
      ids.add(event.id);
    }
    const slugs = new Set(); const guestIds = new Set();
    for (const guest of body.links) {
      if (!guest || typeof guest.id !== 'string' || guestIds.has(guest.id) || typeof guest.guestName !== 'string' || !guest.guestName.trim() || guest.guestName.length > 120 || typeof guest.slug !== 'string' || !/^[a-zA-Z0-9-]{1,180}$/.test(guest.slug) || slugs.has(guest.slug) || (guest.eventId && !ids.has(guest.eventId))) invalid('Khách mời hoặc tiệc được chọn không hợp lệ.');
      guestIds.add(guest.id); slugs.add(guest.slug);
    }
    for (const key of ['albums', 'stories']) if (!Array.isArray(body[key])) invalid('Danh sách ảnh hoặc câu chuyện không hợp lệ.');
    await setWeddingData(body);
    return json(await getWeddingData());
  } catch (error) { return failure(error); }
}
