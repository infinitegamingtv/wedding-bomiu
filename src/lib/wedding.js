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
  const image = url => imageManifest[url] || url;
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
    const response = responses.find(r => r.guestId === guest.id);
    if (response) linked.add(response.id);
    const eventId = response?.eventId || guest.eventId || events[0]?.id;
    return { ...response, guestId: guest.id, name: response?.name || guest.guestName, eventId,
      location: events.find(e => e.id === eventId)?.name || response?.location || 'Chưa rõ',
      attending: response?.attending || 'pending', count: response?.count || 0 };
  });
  for (const r of responses) {
    if (linked.has(r.id)) continue;
    const event = events.find(e => e.id === r.eventId || e.name === r.location);
    rows.push({ ...r, eventId: event?.id || '', location: event?.name || r.location || 'Chưa rõ', legacy: !r.guestId });
  }
  return rows;
}

export function csvFor(rows) {
  const cell = value => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [['Khách mời', 'Tiệc', 'Trạng thái', 'Số người', 'Lời chúc'], ...rows.map(r => [r.name, r.location, r.attending === 'yes' ? 'Tham dự' : r.attending === 'no' ? 'Không tham dự' : 'Chưa phản hồi', r.count, r.message || ''])].map(row => row.map(cell).join(',')).join('\r\n');
}
