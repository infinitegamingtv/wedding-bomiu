'use client';
import styles from '@/app/admin/admin.module.css';
export default function EventEditor({ events, onChange }) {
  const change = (id, field, value) => onChange(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  return <section className={styles.section}><h2 className={styles.sectionTitle}>Thông tin từng tiệc</h2>
    <p className={styles.hint}>Mỗi tiệc có giờ, địa chỉ, bản đồ và lịch trình riêng. Để trống giờ nếu chưa chốt; thiệp sẽ ghi “Thời gian sẽ được thông báo”.</p>
    {events.map(event => <fieldset className={styles.eventEditor} key={event.id}><legend>{event.name}</legend><div className={styles.grid}>
      {[['name', 'Tên tiệc', 'text'], ['date', 'Ngày và giờ', 'datetime-local'], ['lunarDate', 'Ngày âm lịch', 'text'], ['venue', 'Tên địa điểm / sảnh', 'text'], ['address', 'Địa chỉ tổ chức', 'text'], ['mapUrl', 'Link Google Maps hoặc mã nhúng', 'text']].map(([field, label, type]) => <label className={styles.formGroup} key={field}>{label}<input className={styles.input} type={type} value={event[field] || ''} onInput={type === 'datetime-local' ? e => change(event.id, field, e.currentTarget.value) : undefined} onChange={e => change(event.id, field, e.target.value)} /></label>)}
    </div><h3>Lịch trình</h3>{(event.itinerary || []).map((item, index) => <div className={styles.scheduleRow} key={item.id || index}><label>Giờ<input type="time" className={styles.input} value={item.time || ''} onChange={e => change(event.id, 'itinerary', event.itinerary.map((row, i) => i === index ? { ...row, time: e.target.value } : row))} /></label><label>Hoạt động<input className={styles.input} value={item.event || item.label || ''} onChange={e => change(event.id, 'itinerary', event.itinerary.map((row, i) => i === index ? { ...row, event: e.target.value } : row))} /></label><button className={styles.buttonSecondary} onClick={() => change(event.id, 'itinerary', event.itinerary.filter((_, i) => i !== index))}>Xóa mốc</button></div>)}<button className={styles.buttonSecondary} onClick={() => change(event.id, 'itinerary', [...(event.itinerary || []), { id: crypto.randomUUID(), time: '', event: '' }])}>Thêm mốc lịch trình</button></fieldset>)}
  </section>;
}
