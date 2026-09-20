'use client';
import { useState } from 'react';
import { guestRows, csvFor } from '@/lib/wedding';
import styles from '@/app/admin/admin.module.css';

export default function GuestDashboard({ data, onDelete, onRefresh }) {
  const [query, setQuery] = useState('');
  const [eventId, setEventId] = useState('all');
  const [status, setStatus] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rows = guestRows(data);
  const filtered = rows.filter(r => (eventId === 'all' || r.eventId === eventId) && (status === 'all' || r.attending === status) && r.name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  const total = list => list.filter(r => r.attending === 'yes').reduce((sum, r) => sum + Number(r.count || 0), 0);
  const refresh = async () => {
    setBusy(true); setError('');
    try { await onRefresh(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([csvFor(filtered)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'khach-moi.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className={styles.section}>
    <h2 className={styles.sectionTitle}>Khách mời & phản hồi</h2>
    <div className={styles.statsCard}>
      <div className={styles.statItem}><h3>{total(rows)}</h3><p>Người tham dự</p></div>
      <div className={styles.statItem}><h3>{rows.filter(r => r.attending === 'pending').length}</h3><p>Chưa phản hồi</p></div>
      <div className={styles.statItem}><h3>{rows.filter(r => r.attending === 'no').length}</h3><p>Báo vắng</p></div>
    </div>
    <div className={styles.eventStats}>{data.events.map(event => <article key={event.id}><strong>{event.name}</strong><span>{total(rows.filter(r => r.eventId === event.id))} người</span><small>{rows.filter(r => r.eventId === event.id && r.attending === 'pending').length} lời mời chưa phản hồi</small></article>)}</div>
    <p className={styles.hint}>Phản hồi cũ hoặc từ thiệp chung được ghi riêng; không tự ghép khách chỉ vì trùng tên. Số người bao gồm cả người đi cùng.</p>
    <div className={styles.filters}>
      <label>Tìm khách<input className={styles.input} value={query} onChange={e => setQuery(e.target.value)} placeholder="Nhập tên khách" /></label>
      <label>Tiệc<select className={styles.input} value={eventId} onChange={e => setEventId(e.target.value)}><option value="all">Tất cả tiệc</option>{data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}<option value="">Chưa rõ tiệc</option></select></label>
      <label>Phản hồi<select className={styles.input} value={status} onChange={e => setStatus(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="pending">Chưa phản hồi</option><option value="yes">Tham dự</option><option value="no">Không tham dự</option></select></label>
    </div>
    <div className={styles.toolbar}><button className={styles.buttonSecondary} disabled={busy} onClick={refresh}>{busy ? 'Đang cập nhật…' : 'Cập nhật phản hồi'}</button><button className={styles.buttonSecondary} onClick={exportCsv}>Xuất CSV cho Excel</button><span>{filtered.length} mục · {total(filtered)} người tham dự</span></div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.tableScroll}><table className={styles.guestTable}><thead><tr><th>Khách mời</th><th>Tiệc</th><th>Phản hồi</th><th>Số người</th><th>Lời chúc</th><th>Thao tác</th></tr></thead><tbody>{filtered.map((row, index) => <tr key={row.id || row.guestId || index}><td><strong>{row.name}</strong>{row.legacy && <small className={styles.hint}>Thiệp chung / phản hồi cũ</small>}</td><td>{row.location}</td><td><span className={styles.statusBadge}>{row.attending === 'yes' ? 'Tham dự' : row.attending === 'no' ? 'Không tham dự' : 'Chưa phản hồi'}</span></td><td>{row.count}</td><td>{row.message || '—'}</td><td>{row.id && <button className={styles.buttonSecondary} onClick={() => onDelete(row.id)}>Xóa phản hồi</button>}</td></tr>)}</tbody></table></div>
    {!filtered.length && <p className={styles.hint}>Không có khách phù hợp bộ lọc.</p>}
  </section>;
}
