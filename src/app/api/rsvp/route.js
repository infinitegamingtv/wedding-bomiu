import { randomUUID } from 'node:crypto';
import { getWeddingData, saveResponse } from '@/lib/data';
import { VISITOR_COOKIE, readToken, signToken, cookieOptions, sameOrigin, requireAdmin, limitRequests, clientAddress } from '@/lib/auth';
import { json, failure, invalid, readJson } from '@/lib/http';
function identity(request, data, slug) {
  if (slug) {
    const guest = data.links?.find(g => g.slug === slug);
    if (!guest) throw Object.assign(new Error('Không tìm thấy thiệp mời.'), { status: 404 });
    return { id: 'guest:' + guest.id, guestId: guest.id };
  }
  const subject = readToken(request.cookies.get(VISITOR_COOKIE)?.value);
  return { id: subject?.startsWith('visitor:') ? subject : 'visitor:' + randomUUID(), guestId: null };
}
export async function GET(request) {
  try {
    const data = await getWeddingData();
    const who = identity(request, data, new URL(request.url).searchParams.get('slug'));
    const record = data.rsvps.find(r => r.id === who.id);
    const response = json({ rsvp: record || null });
    if (!who.guestId) response.cookies.set(VISITOR_COOKIE, signToken(who.id, 365 * 86400), cookieOptions(request, 365 * 86400));
    return response;
  } catch (error) { return failure(error); }
}
export async function POST(request) {
  try {
    sameOrigin(request);
    await limitRequests('rsvp:' + clientAddress(request), 300, 60);
    const body = await readJson(request, 12000);
    const data = await getWeddingData();
    const who = identity(request, data, body.slug);
    if (!who.guestId && !readToken(request.cookies.get(VISITOR_COOKIE)?.value)) invalid('Vui lòng tải lại thiệp để gửi phản hồi.');
    await limitRequests('reply:' + who.id, 20, 60);
    const eventIds = typeof body.eventId === 'string' ? body.eventId.split(',').filter(Boolean) : (Array.isArray(body.eventId) ? body.eventId : []);
    if (!eventIds.length) invalid('Vui lòng chọn tiệc.');
    const eventObjects = eventIds.map(id => data.events.find(e => e.id === id));
    if (eventObjects.some(e => !e)) invalid('Mã tiệc không hợp lệ.');
    
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120) invalid('Tên khách phải có từ 1 đến 120 ký tự.');
    if (!['yes', 'no'].includes(body.attending)) invalid('Vui lòng chọn trạng thái tham dự.');
    if (body.attending === 'yes' && (!Number.isInteger(body.count) || body.count < 1 || body.count > 10)) invalid('Số người tham dự phải từ 1 đến 10.');
    if (typeof body.message !== 'string' || body.message.length > 2000) invalid('Lời chúc tối đa 2.000 ký tự.');
    const previous = data.rsvps.find(r => r.id === who.id);
    const record = { ...who, name: body.name.trim(), attending: body.attending, eventId: eventIds.join(','), location: eventObjects.map(e => e.name).join(' + '), count: body.attending === 'yes' ? body.count : 0, message: body.message.trim(), submittedAt: previous?.submittedAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    await saveResponse(record);
    return json({ success: true, rsvp: record, wish: { id: record.id, name: record.name, message: record.message } });
  } catch (error) { return failure(error); }
}
export async function DELETE(request) {
  try {
    requireAdmin(request); sameOrigin(request);
    const body = await readJson(request, 2048);
    if (typeof body.id !== 'string' || body.id.length > 200) invalid('Phản hồi không hợp lệ.');
    await saveResponse({ id: body.id, deleted: true });
    return json({ success: true });
  } catch (error) { return failure(error); }
}
