import imageManifest from './image-manifest.json';
export function eventsFor(data) {
  if (data.events?.length) return data.events;
  const invitation = data.invitation || {};
  return [
    { id: 'lao-cai', name: 'Lào Cai', date: invitation.date || '', lunarDate: invitation.lunarDate || '', venue: invitation.location || '', address: invitation.groomAddress || '', mapUrl: data.mapUrl || '', itinerary: data.itinerary || invitation.itinerary || [] },
    { id: 'thanh-hoa', name: 'Thanh Hóa', date: '', lunarDate: '', venue: '', address: '', mapUrl: '', itinerary: [] },
    { id: 'ha-noi', name: 'Hà Nội', date: '', lunarDate: '', venue: '', address: '', mapUrl: '', itinerary: [] },
  ];
}

export function publicWedding(data) {
  // Never serialize guest links or attendance records to visitors.
  const image = url => {
    if (!url) return url;
    if (imageManifest[url]) return imageManifest[url];
    // Google Drive/Photos links (lh3.googleusercontent.com/...=s4000) default to huge originals.
    if (/^https:\/\/lh\d\.googleusercontent\.com\//.test(url)) return url.replace(/=[swh]\d+(-[a-z0-9-]+)?$/i, '') + '=w1600';
    return url;
  };
  const invitation = { ...data.invitation };
  for (const key of ['heroBgUrl', 'groomAvatarUrl', 'brideAvatarUrl', 'guestbookPhotoUrl']) invitation[key] = image(invitation[key]);
  return { invitation, albums: (data.albums || []).map(image), stories: (data.stories || []).map(story => ({ ...story, imageUrl: image(story.imageUrl) })),
    texts: data.texts || {}, events: eventsFor(data),
    rsvps: (data.rsvps || []).filter(r => r.message?.trim()).map(r => ({ id: r.id, name: r.name, message: r.message })),
  };
}

export function guestRows(data) {
  const events = eventsFor(data);
  const responses = data.rsvps || [];
  const linked = new Set();
  const rows = (data.links || []).map(guest => {
    const response = responses.find(r => r.guestId === guest.id || r.id === guest.id);
    if (response) linked.add(response.id);
    const eventIdStr = response?.eventId || guest.eventId || events[0]?.id || '';
    const eventIds = typeof eventIdStr === 'string' ? eventIdStr.split(',').filter(Boolean) : [];
    const location = eventIds.map(id => events.find(e => e.id === id)?.name).filter(Boolean).join(' + ') || response?.location || 'Chưa rõ';
    const giftAmount = Number(guest.giftAmount || 0);
    const giftMethod = guest.giftMethod || 'cash';
    const giftNote = guest.giftNote || '';
    const hasGift = Boolean(giftAmount > 0 || giftNote.trim());
    return {
      ...response,
      guestId: guest.id,
      slug: guest.slug,
      guestNameOrig: guest.guestName,
      guestEventId: guest.eventId || '',
      name: response?.name || guest.guestName,
      group: guest.group || '',
      sent: Boolean(guest.sent),
      giftAmount,
      giftMethod,
      giftNote,
      hasGift,
      eventIds,
      location,
      attending: response?.attending || 'pending',
      count: response?.count || 0
    };
  });
  for (const r of responses) {
    if (linked.has(r.id)) continue;
    const eventIds = typeof r.eventId === 'string' ? r.eventId.split(',').filter(Boolean) : [];
    const location = eventIds.map(id => events.find(e => e.id === id)?.name).filter(Boolean).join(' + ') || r.location || 'Chưa rõ';
    rows.push({
      ...r,
      eventIds,
      location,
      group: '',
      sent: true,
      giftAmount: 0,
      giftMethod: 'cash',
      giftNote: '',
      hasGift: false,
      legacy: !r.guestId
    });
  }
  return rows;
}

const formatMethodLabel = (method) => {
  if (method === 'transfer') return 'Chuyển khoản';
  if (method === 'gold') return 'Vàng / Hiện vật';
  return 'Tiền mặt (Phong bì)';
};

export function csvFor(rows) {
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [
    ['Khách mời', 'Nhóm', 'Tiệc', 'Đã gửi thiệp', 'Trạng thái', 'Số người', 'Tiền mừng (VNĐ)', 'Hình thức mừng', 'Ghi chú quà', 'Lời chúc', 'Mã Link'],
    ...rows.map(r => [
      r.name,
      r.group || 'Chưa phân nhóm',
      r.location,
      r.sent ? 'Đã gửi' : 'Chưa gửi',
      r.attending === 'yes' ? 'Tham dự' : r.attending === 'no' ? 'Không tham dự' : 'Chưa phản hồi',
      r.count,
      r.giftAmount || 0,
      r.hasGift ? formatMethodLabel(r.giftMethod) : '',
      r.giftNote || '',
      r.message || '',
      r.slug ? `/invite/${r.slug}` : 'Thiệp chung'
    ])
  ].map(row => row.map(cell).join(',')).join('\r\n');
}

export function giftCsvFor(rows) {
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const totalMoney = rows.reduce((s, r) => s + Number(r.giftAmount || 0), 0);
  const totalCash = rows.filter(r => (r.giftMethod || 'cash') === 'cash').reduce((s, r) => s + Number(r.giftAmount || 0), 0);
  const totalTransfer = rows.filter(r => r.giftMethod === 'transfer').reduce((s, r) => s + Number(r.giftAmount || 0), 0);
  return '\uFEFF' + [
    ['STT', 'Khách mời', 'Nhóm', 'Tiệc', 'Tham dự', 'Số tiền mừng (VNĐ)', 'Hình thức', 'Ghi chú / Quà hiện vật'],
    ...rows.map((r, idx) => [
      idx + 1,
      r.name,
      r.group || 'Chưa phân nhóm',
      r.location,
      r.attending === 'yes' ? `Đi (${r.count || 1} người)` : r.attending === 'no' ? 'Báo vắng' : 'Chưa phản hồi',
      r.giftAmount || 0,
      r.hasGift ? formatMethodLabel(r.giftMethod) : 'Chưa ghi nhận',
      r.giftNote || ''
    ]),
    ['', 'TỔNG CỘNG', '', '', '', totalMoney, `Tiền mặt: ${totalCash} | CK: ${totalTransfer}`, '']
  ].map(row => row.map(cell).join(',')).join('\r\n');
}
