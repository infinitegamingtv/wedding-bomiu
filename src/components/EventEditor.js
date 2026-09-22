'use client';
import styles from '@/app/admin/admin.module.css';
export default function EventEditor({ events, onChange }) {
  const change = (id, field, value) => onChange(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  return <section className={styles.section}><h2 className={styles.sectionTitle}>Thông tin từng tiệc</h2>
    <p className={styles.hint}>Mỗi tiệc có giờ, địa chỉ, bản đồ và lịch trình riêng. Lịch sự kiện phụ (nếu có) cũng được chỉnh sửa tại đây.</p>
    {events.map(event => (
      <fieldset className={styles.eventEditor} key={event.id}>
        <legend>{event.name}</legend>
        <div className={styles.grid}>
          {[['name', 'Tên tiệc', 'text'], ['date', 'Ngày và giờ', 'datetime-local'], ['lunarDate', 'Ngày âm lịch', 'text'], ['venue', 'Tên địa điểm / sảnh', 'text'], ['address', 'Địa chỉ tổ chức', 'text'], ['mapUrl', 'Link Google Maps hoặc mã nhúng', 'text']].map(([field, label, type]) => (
            <label className={styles.formGroup} key={field}>{label}<input className={styles.input} type={type} value={event[field] || ''} onInput={type === 'datetime-local' ? e => change(event.id, field, e.currentTarget.value) : undefined} onChange={e => change(event.id, field, e.target.value)} /></label>
          ))}
        </div>
        
        {event.subEvents && event.subEvents.length > 0 && (
          <div style={{ marginTop: '24px', padding: '20px', background: '#f9f6f0', borderRadius: '12px', border: '1px solid #e0d4c2' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', color: '#7c6240' }}>Các sự kiện phụ (Sub-Events)</h3>
            {event.subEvents.map((sub, sIndex) => (
              <div key={sub.id || sIndex} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: sIndex < event.subEvents.length - 1 ? '1px dashed #d6c6b0' : 'none' }}>
                <h4 style={{ marginBottom: '12px', color: '#59472d' }}>{sub.name || `Sự kiện ${sIndex + 1}`}</h4>
                <div className={styles.grid}>
                  {[['name', 'Tên sự kiện phụ', 'text'], ['date', 'Ngày và giờ', 'datetime-local'], ['lunarDate', 'Ngày âm lịch', 'text'], ['venue', 'Tên địa điểm / sảnh', 'text'], ['address', 'Địa chỉ tổ chức', 'text'], ['mapUrl', 'Link Google Maps', 'text']].map(([field, label, type]) => (
                    <label className={styles.formGroup} key={field}>{label}<input className={styles.input} type={type} value={sub[field] || ''} onInput={type === 'datetime-local' ? e => {
                      const newSubEvents = [...event.subEvents];
                      newSubEvents[sIndex] = { ...sub, [field]: e.currentTarget.value };
                      change(event.id, 'subEvents', newSubEvents);
                    } : undefined} onChange={e => {
                      const newSubEvents = [...event.subEvents];
                      newSubEvents[sIndex] = { ...sub, [field]: e.target.value };
                      change(event.id, 'subEvents', newSubEvents);
                    }} /></label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 style={{ marginTop: '24px' }}>Lịch trình</h3>
        {(event.itinerary || []).map((item, index) => (
          <div className={styles.scheduleRow} key={item.id || index}>
            <label>Giờ<input type="time" className={styles.input} value={item.time || ''} onChange={e => change(event.id, 'itinerary', event.itinerary.map((row, i) => i === index ? { ...row, time: e.target.value } : row))} /></label>
            <label>Hoạt động<input className={styles.input} value={item.event || item.label || ''} onChange={e => change(event.id, 'itinerary', event.itinerary.map((row, i) => i === index ? { ...row, event: e.target.value } : row))} /></label>
            <button className={styles.buttonSecondary} onClick={() => change(event.id, 'itinerary', event.itinerary.filter((_, i) => i !== index))}>Xóa mục</button>
          </div>
        ))}
        <button className={styles.buttonSecondary} onClick={() => change(event.id, 'itinerary', [...(event.itinerary || []), { id: crypto.randomUUID(), time: '', event: '' }])}>Thêm mốc lịch trình</button>
      </fieldset>
    ))}
  </section>;
}
