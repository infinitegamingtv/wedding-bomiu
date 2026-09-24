'use client';
import { useState, useEffect, useMemo } from 'react';
import styles from './admin.module.css';
import EventEditor from '@/components/EventEditor';
import { guestRows, csvFor } from '@/lib/wedding';
import { LogOut, LayoutDashboard, Users, PenTool, Image as ImageIcon, Save, Link as LinkIcon, Download, Plus, Trash2 } from 'lucide';
import { MorphIcon } from 'morphicons/react';

const Icon = ({ icon, size = 18, ...props }) => <MorphIcon icon={icon} size={size} {...props} />;

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newImageUrl, setNewImageUrl] = useState('');
  
  const [bulkGuestNames, setBulkGuestNames] = useState('');
  const [bulkEventId, setBulkEventId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    let active = true;
    fetch('/api/auth').then(res => res.json()).then(async session => {
      if (!session.authenticated) return;
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Không tải được dữ liệu.');
      const value = await res.json();
      if (active) {
        setData(value);
        setOriginalData(JSON.stringify(value));
        setLoading(false);
      }
    }).catch(err => {
      if (active) { setNotice(err.message); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const logout = () => { document.cookie = 'auth=; Max-Age=0; path=/'; window.location.href = '/admin/login'; };

  const isDirty = useMemo(() => {
    if (!data || !originalData) return false;
    const current = { ...data, rsvps: undefined };
    const original = { ...JSON.parse(originalData), rsvps: undefined };
    return JSON.stringify(current) !== JSON.stringify(original);
  }, [data, originalData]);

  const handlePublish = async () => {
    setSaving(true); setNotice('');
    try {
      const payload = { ...data }; delete payload.rsvps;
      const response = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Lỗi lưu dữ liệu.');
      setData(result); setOriginalData(JSON.stringify(result));
      setNotice('Đã lưu thành công!');
      setTimeout(() => setNotice(''), 3000);
    } catch (err) { setNotice(err.message); }
    finally { setSaving(false); }
  };

  const handleInputChange = (e, field) => setData(prev => ({ ...prev, invitation: { ...prev.invitation, [field]: e.target.value } }));
  const handleTextChange = (e, field) => setData(prev => ({ ...prev, texts: { ...prev.texts, [field]: e.target.value } }));

  const addBulkGuests = () => {
    const names = bulkGuestNames.split('\n').map(n => n.trim()).filter(Boolean);
    if (!names.length) return;
    const newLinks = names.map(name => {
      const id = crypto.randomUUID();
      return { id, slug: id.slice(0, 8), guestName: name, eventId: bulkEventId || data.events[0]?.id || '', isInvited: true };
    });
    setData(prev => ({ ...prev, links: [...(prev.links || []), ...newLinks] }));
    setBulkGuestNames('');
  };
  const removeGuestLink = (id) => setData(prev => ({ ...prev, links: prev.links.filter(g => g.id !== id) }));
  
  const deleteRsvp = async id => {
    if (!confirm('Xóa phản hồi này?')) return;
    try {
      const res = await fetch('/api/rsvp', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Lỗi xóa');
      setData(prev => ({ ...prev, rsvps: prev.rsvps.filter(r => r.id !== id) }));
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Đang tải dữ liệu...</div>;
  if (!data) return <div style={{padding: '50px', textAlign: 'center'}}>Lỗi tải dữ liệu. <button onClick={logout}>Đăng nhập lại</button></div>;

  const allRows = guestRows(data);
  const crmRows = allRows.filter(r => 
    (filterEvent === 'all' || (r.eventIds && r.eventIds.includes(filterEvent))) && 
    (filterStatus === 'all' || r.attending === filterStatus) && 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalAttending = allRows.filter(r => r.attending === 'yes').reduce((s, r) => s + Number(r.count || 0), 0);
  const totalPending = allRows.filter(r => r.attending === 'pending').length;
  const totalDeclined = allRows.filter(r => r.attending === 'no').length;

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>BOMIUX ADMIN</div>
        <div className={styles.navMenu}>
          <button className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}><span style={{display: 'inline-flex', width: 20}}><Icon icon={LayoutDashboard} size={18} /></span> Tổng quan</button>
          <button className={`${styles.navItem} ${activeTab === 'crm' ? styles.active : ''}`} onClick={() => setActiveTab('crm')}><span style={{display: 'inline-flex', width: 20}}><Icon icon={Users} size={18} /></span> Khách & RSVP</button>
          <button className={`${styles.navItem} ${activeTab === 'content' ? styles.active : ''}`} onClick={() => setActiveTab('content')}><span style={{display: 'inline-flex', width: 20}}><Icon icon={PenTool} size={18} /></span> Nội dung thiệp</button>
          <button className={`${styles.navItem} ${activeTab === 'gallery' ? styles.active : ''}`} onClick={() => setActiveTab('gallery')}><span style={{display: 'inline-flex', width: 20}}><Icon icon={ImageIcon} size={18} /></span> Ảnh Album</button>
        </div>
        <div style={{marginTop: 'auto', padding: '16px'}}>
          <a href="/" target="_blank" className={styles.buttonSecondary} style={{display: 'block', textAlign: 'center', marginBottom: '8px', textDecoration: 'none'}}>Xem thiệp &rarr;</a>
          <button className={styles.buttonSecondary} style={{width: '100%', display: 'flex', justifyContent: 'center', gap: '8px'}} onClick={logout}><Icon icon={LogOut} size={18} /> Đăng xuất</button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {notice && <div className={styles.notice}><span>{notice}</span><button onClick={() => setNotice('')} style={{background:'transparent',border:'none',cursor:'pointer'}}>✕</button></div>}
        
        {activeTab === 'dashboard' && (
          <div>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>Tổng quan</h1>
            </div>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.highlight}`}><h3>{totalAttending}</h3><p>Khách tham dự</p></div>
              <div className={styles.statCard}><h3>{totalPending}</h3><p>Đang chờ phản hồi</p></div>
              <div className={styles.statCard}><h3>{totalDeclined}</h3><p>Báo vắng</p></div>
            </div>
            
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thống kê theo tiệc</h2>
              <div className={styles.statsGrid} style={{marginBottom: 0}}>
                {data.events.map(event => {
                  const evtAttending = allRows.filter(r => r.attending === 'yes' && r.eventIds && r.eventIds.includes(event.id)).reduce((s, r) => s + Number(r.count || 0), 0);
                  const evtPending = allRows.filter(r => r.attending === 'pending' && r.eventIds && r.eventIds.includes(event.id)).length;
                  return (
                    <div key={event.id} className={styles.statCard} style={{padding: '16px'}}>
                      <h4 style={{margin: '0 0 8px 0', fontSize: '1.1rem'}}>{event.name}</h4>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}><span>Tham dự:</span> <strong>{evtAttending}</strong></div>
                      <div style={{display: 'flex', justifyContent: 'space-between', color: '#888'}}><span>Chờ báo:</span> <strong>{evtPending}</strong></div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Phản hồi mới nhất</h2>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead><tr><th>Khách mời</th><th>Tiệc</th><th>Trạng thái</th><th>Lời chúc</th></tr></thead>
                  <tbody>
                    {(data.rsvps || []).slice(-5).reverse().map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.location || 'Chưa rõ'}</td>
                        <td><span className={`${styles.badge} ${r.attending === 'yes' ? styles.success : styles.danger}`}>{r.attending === 'yes' ? 'Tham dự' : 'Không đi'}</span></td>
                        <td><small>{r.message}</small></td>
                      </tr>
                    ))}
                    {!(data.rsvps?.length) && <tr><td colSpan="4" style={{textAlign: 'center', color: '#999'}}>Chưa có phản hồi nào</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>Quản lý Khách & RSVP</h1>
              <div className={styles.headerActions}>
                <button className={styles.buttonSecondary} style={{display: 'flex', alignItems: 'center', gap: '6px'}} onClick={() => {
                   const url = URL.createObjectURL(new Blob([csvFor(crmRows)], { type: 'text/csv;charset=utf-8' }));
                   const a = document.createElement('a'); a.href = url; a.download = 'khach-moi.csv'; a.click();
                }}><Icon icon={Download} size={16} /> Xuất Excel</button>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Tạo Link Mời Hàng Loạt</h2>
              <div className={styles.formGrid} style={{gridTemplateColumns: '2fr 1fr 1fr'}}>
                <textarea className={styles.textarea} placeholder="Nhập tên khách (mỗi người 1 dòng)..." value={bulkGuestNames} onChange={e => setBulkGuestNames(e.target.value)} style={{minHeight: '44px', height: '44px'}} />
                <select className={styles.select} value={bulkEventId} onChange={e => setBulkEventId(e.target.value)}>
                  <option value="">-- Mặc định (Tất cả tiệc) --</option>
                  {data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <button className={styles.buttonPrimary} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}} onClick={addBulkGuests}><Icon icon={Plus} size={16} /> Tạo link</button>
              </div>
            </div>

            <div className={styles.card}>
              <div style={{display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap'}}>
                <input className={styles.input} style={{flex: 1, minWidth: '200px'}} placeholder="Tìm tên khách..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <select className={styles.select} style={{width: '200px'}} value={filterEvent} onChange={e => setFilterEvent(e.target.value)}><option value="all">Tất cả tiệc</option>{data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                <select className={styles.select} style={{width: '150px'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">Mọi trạng thái</option><option value="pending">Chờ phản hồi</option><option value="yes">Tham dự</option><option value="no">Không đi</option></select>
              </div>
              
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Khách mời</th>
                      <th>Link Gửi Khách</th>
                      <th>Phản hồi</th>
                      <th>Chi tiết RSVP</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crmRows.map((row, i) => (
                      <tr key={row.id || row.guestId || i}>
                        <td><strong>{row.name}</strong> {row.legacy && <span className={`${styles.badge} ${styles.neutral}`}>Tự RSVP</span>}</td>
                        <td>
                          {row.guestId ? (
                            <div className={styles.linkBox}>
                              <input className={styles.linkInput} readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${data.links.find(l => l.id === row.guestId)?.slug}`} />
                              <button className={styles.buttonSecondary} style={{padding: '6px 10px'}} onClick={() => navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${data.links.find(l => l.id === row.guestId)?.slug}`)}><Icon icon={LinkIcon} size={14} /></button>
                            </div>
                          ) : <span style={{color: '#999', fontSize: '0.85rem'}}>N/A (Thiệp chung)</span>}
                        </td>
                        <td>
                          <span className={`${styles.badge} ${row.attending === 'yes' ? styles.success : row.attending === 'no' ? styles.danger : styles.warning}`}>
                            {row.attending === 'yes' ? 'Tham dự' : row.attending === 'no' ? 'Không đi' : 'Chờ phản hồi'}
                          </span>
                        </td>
                        <td>
                          {row.attending !== 'pending' && (
                            <div style={{fontSize: '0.85rem'}}>
                              <div>{row.location ? row.location.split(' + ').map((loc, i) => <span key={i} className={styles.locationBadge}>{loc}</span>) : ''}</div>
                              {row.attending === 'yes' && <div style={{marginTop: '4px'}}><strong>Đi:</strong> {row.count} người</div>}
                              {row.message && <div style={{marginTop: '4px', color: '#666', fontStyle: 'italic'}}>&quot;{row.message}&quot;</div>}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{display: 'flex', gap: '8px'}}>
                            {row.id && <button title="Xóa phản hồi" className={`${styles.buttonSecondary} ${styles.buttonDanger}`} style={{padding: '6px 10px'}} onClick={() => deleteRsvp(row.id)}><Icon icon={Trash2} size={14} /></button>}
                            {row.guestId && <button title="Xóa Link" className={`${styles.buttonSecondary} ${styles.buttonDanger}`} style={{padding: '6px 10px'}} onClick={() => removeGuestLink(row.guestId)}><Icon icon={Trash2} size={14} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!crmRows.length && <tr><td colSpan="5" style={{textAlign: 'center'}}>Không có dữ liệu phù hợp.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>Nội dung Thiệp</h1>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thông tin chung</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Tên Chú Rể</label><input className={styles.input} value={data.invitation.groom || ''} onChange={e => handleInputChange(e, 'groom')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tên Cô Dâu</label><input className={styles.input} value={data.invitation.bride || ''} onChange={e => handleInputChange(e, 'bride')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tên Chú Rể (Rút gọn)</label><input className={styles.input} value={data.invitation.groomShort || ''} onChange={e => handleInputChange(e, 'groomShort')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tên Cô Dâu (Rút gọn)</label><input className={styles.input} value={data.invitation.brideShort || ''} onChange={e => handleInputChange(e, 'brideShort')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Ngày cưới (Tùy chỉnh)</label><input className={styles.input} value={data.invitation.dateString || ''} onChange={e => handleInputChange(e, 'dateString')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Ngày Âm Lịch</label><input className={styles.input} value={data.invitation.lunarDate || ''} onChange={e => handleInputChange(e, 'lunarDate')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Mô tả Chú rể (Bio)</label><input className={styles.input} value={data.invitation.groomBio || ''} onChange={e => handleInputChange(e, 'groomBio')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Mô tả Cô dâu (Bio)</label><input className={styles.input} value={data.invitation.brideBio || ''} onChange={e => handleInputChange(e, 'brideBio')} /></div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Ảnh chính & Nhận diện</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Link ảnh Logo</label><input className={styles.input} value={data.invitation.logoUrl || ''} onChange={e => handleInputChange(e, 'logoUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Link ảnh nền chính (Hero Background)</label><input className={styles.input} value={data.invitation.heroBgUrl || ''} onChange={e => handleInputChange(e, 'heroBgUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Link ảnh QR Mừng cưới</label><input className={styles.input} value={data.invitation.qrCodeUrl || ''} onChange={e => handleInputChange(e, 'qrCodeUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Link ảnh kỉ niệm (Cạnh sổ lưu bút)</label><input className={styles.input} value={data.invitation.guestbookPhotoUrl || ''} onChange={e => handleInputChange(e, 'guestbookPhotoUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Avatar Chú rể</label><input className={styles.input} value={data.invitation.groomAvatarUrl || ''} onChange={e => handleInputChange(e, 'groomAvatarUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Avatar Cô dâu</label><input className={styles.input} value={data.invitation.brideAvatarUrl || ''} onChange={e => handleInputChange(e, 'brideAvatarUrl')} placeholder="VD: https://..." /></div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản (Tiêu đề các phần)</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề chính (VD: Lễ Thành Hôn)</label><input className={styles.input} value={data.texts?.heroSubtitle || ''} onChange={e => handleTextChange(e, 'heroSubtitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Lời mời (VD: Trân Trọng Kính Mời)</label><input className={styles.input} value={data.texts?.inviteTitle || ''} onChange={e => handleTextChange(e, 'inviteTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Câu chào (VD: Tới dự bữa tiệc...)</label><input className={styles.input} value={data.texts?.inviteGreeting || ''} onChange={e => handleTextChange(e, 'inviteGreeting')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Chữ &quot;Nhà Trai&quot;</label><input className={styles.input} value={data.texts?.groomParentsTitle || ''} onChange={e => handleTextChange(e, 'groomParentsTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Chữ &quot;Nhà Gái&quot;</label><input className={styles.input} value={data.texts?.brideParentsTitle || ''} onChange={e => handleTextChange(e, 'brideParentsTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiền tố địa điểm (VD: TẠI)</label><input className={styles.input} value={data.texts?.locationPrefix || ''} onChange={e => handleTextChange(e, 'locationPrefix')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Lịch Trình</label><input className={styles.input} value={data.texts?.itineraryTitle || ''} onChange={e => handleTextChange(e, 'itineraryTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Chuyện Tình Yêu</label><input className={styles.input} value={data.texts?.storyTitle || ''} onChange={e => handleTextChange(e, 'storyTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Ảnh Album</label><input className={styles.input} value={data.texts?.galleryTitle || ''} onChange={e => handleTextChange(e, 'galleryTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Sổ Lưu Bút</label><input className={styles.input} value={data.texts?.guestbookTitle || ''} onChange={e => handleTextChange(e, 'guestbookTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề RSVP</label><input className={styles.input} value={data.texts?.rsvpTitle || ''} onChange={e => handleTextChange(e, 'rsvpTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Gửi Quà</label><input className={styles.input} value={data.texts?.giftTitle || ''} onChange={e => handleTextChange(e, 'giftTitle')} /></div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thông tin Gia đình</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Bố mẹ Chú rể (cách nhau bởi dấu phẩy)</label><input className={styles.input} value={(data.invitation.groomParents || []).join(', ')} onChange={e => setData(prev => ({...prev, invitation: {...prev.invitation, groomParents: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}}))} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Địa chỉ Nhà Trai</label><input className={styles.input} value={data.invitation.groomAddress || ''} onChange={e => handleInputChange(e, 'groomAddress')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Bố mẹ Cô dâu (cách nhau bởi dấu phẩy)</label><input className={styles.input} value={(data.invitation.brideParents || []).join(', ')} onChange={e => setData(prev => ({...prev, invitation: {...prev.invitation, brideParents: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}}))} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Địa chỉ Nhà Gái</label><input className={styles.input} value={data.invitation.brideAddress || ''} onChange={e => handleInputChange(e, 'brideAddress')} /></div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thông tin Ngân hàng (Mừng cưới)</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Tên Ngân Hàng</label><input className={styles.input} value={data.invitation.bankName || ''} onChange={e => handleInputChange(e, 'bankName')} placeholder="VD: Vietcombank" /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tên Chủ Tài Khoản</label><input className={styles.input} value={data.invitation.accountName || ''} onChange={e => handleInputChange(e, 'accountName')} placeholder="VD: NGUYEN VAN A" /></div>
                <div className={styles.formGroup}><label className={styles.label}>Số Tài Khoản</label><input className={styles.input} value={data.invitation.accountNumber || ''} onChange={e => handleInputChange(e, 'accountNumber')} placeholder="VD: 123456789" /></div>
              </div>
            </div>

            <div className={styles.card}>
              <EventEditor events={data.events} onChange={events => setData(prev => ({ ...prev, events }))} />
            </div>
            
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Chuyện Tình Yêu (Stories)</h2>
              <button className={styles.buttonSecondary} style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px'}} onClick={() => setData(prev => ({ ...prev, stories: [...(prev.stories||[]), {id: crypto.randomUUID(), date: '', title: '', content: ''}] }))}><Icon icon={Plus} size={16} /> Thêm Câu Chuyện</button>
              {(data.stories || []).map((story, i) => (
                <div key={story.id} style={{ padding: '16px', border: '1px solid #eaeaea', borderRadius: '8px', marginBottom: '16px', background: '#fafafa' }}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}><label className={styles.label}>Thời gian</label><input className={styles.input} value={story.date} onChange={e => setData(prev => ({...prev, stories: prev.stories.map((s, idx) => idx === i ? {...s, date: e.target.value} : s)}))} /></div>
                    <div className={styles.formGroup}><label className={styles.label}>Tiêu đề</label><input className={styles.input} value={story.title} onChange={e => setData(prev => ({...prev, stories: prev.stories.map((s, idx) => idx === i ? {...s, title: e.target.value} : s)}))} /></div>
                    <div className={styles.formGroup}><label className={styles.label}>Link ảnh</label><input className={styles.input} value={story.imageUrl || ''} onChange={e => setData(prev => ({...prev, stories: prev.stories.map((s, idx) => idx === i ? {...s, imageUrl: e.target.value} : s)}))} /></div>
                    <div className={`${styles.formGroup} ${styles.full}`}><label className={styles.label}>Nội dung</label><textarea className={styles.textarea} value={story.content} onChange={e => setData(prev => ({...prev, stories: prev.stories.map((s, idx) => idx === i ? {...s, content: e.target.value} : s)}))} /></div>
                  </div>
                  <button className={`${styles.buttonSecondary} ${styles.buttonDanger}`} onClick={() => setData(prev => ({...prev, stories: prev.stories.filter((_, idx) => idx !== i)}))}>Xóa chuyện này</button>
                </div>
              ))}
            </div>
          <div className={styles.card}>
              <h2 className={styles.cardTitle}>Danh Sách Nhạc (Playlist)</h2>
              <button className={styles.buttonSecondary} style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px'}} onClick={() => setData(prev => ({ ...prev, invitation: { ...prev.invitation, musicTracks: [...(prev.invitation.musicTracks || []), { name: '', url: '' }] } }))}><Icon icon={Plus} size={16} /> Thêm Bài Hát</button>
              {(data.invitation.musicTracks || []).map((track, i) => (
                <div key={i} style={{ padding: '16px', border: '1px solid #eaeaea', borderRadius: '8px', marginBottom: '16px', background: '#fafafa' }}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}><label className={styles.label}>Tên Bài Hát</label><input className={styles.input} value={track.name || ''} onChange={e => setData(prev => { const newTracks = [...(prev.invitation.musicTracks || [])]; newTracks[i] = { ...newTracks[i], name: e.target.value }; return { ...prev, invitation: { ...prev.invitation, musicTracks: newTracks } }; })} placeholder="VD: Beautiful In White" /></div>
                    <div className={styles.formGroup}><label className={styles.label}>Link File Nhạc (MP3)</label><input className={styles.input} value={track.url || ''} onChange={e => setData(prev => { const newTracks = [...(prev.invitation.musicTracks || [])]; newTracks[i] = { ...newTracks[i], url: e.target.value }; return { ...prev, invitation: { ...prev.invitation, musicTracks: newTracks } }; })} placeholder="VD: /music/song.mp3 hoặc https://..." /></div>
                  </div>
                  <button className={`${styles.buttonSecondary} ${styles.buttonDanger}`} style={{marginTop: '12px'}} onClick={() => setData(prev => { const newTracks = prev.invitation.musicTracks.filter((_, idx) => idx !== i); return { ...prev, invitation: { ...prev.invitation, musicTracks: newTracks } }; })}>Xóa bài hát</button>
                </div>
              ))}
            </div>

            </div>
        )}

        {activeTab === 'gallery' && (
          <div>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>Quản lý Ảnh Album</h1>
            </div>
            
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thêm ảnh mới</h2>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input 
                  className={styles.input} 
                  placeholder="Nhập đường dẫn URL của ảnh (VD: https://...)" 
                  value={newImageUrl} 
                  onChange={e => setNewImageUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newImageUrl.trim()) {
                      setData(prev => ({ ...prev, albums: [...(prev.albums || []), newImageUrl.trim()] }));
                      setNewImageUrl('');
                    }
                  }}
                />
                <button 
                  className={styles.buttonPrimary} 
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }} 
                  onClick={() => {
                    if (newImageUrl.trim()) {
                      setData(prev => ({ ...prev, albums: [...(prev.albums || []), newImageUrl.trim()] }));
                      setNewImageUrl('');
                    }
                  }}
                >
                  <Icon icon={Plus} size={16} /> Thêm ảnh
                </button>
              </div>
              
              <h2 className={styles.cardTitle}>Danh sách ảnh ({data.albums?.length || 0})</h2>
              <div className={styles.photoGrid}>
                {data.albums?.map((img, i) => (
                  <div key={i} className={styles.photoItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={typeof img === 'string' ? img : img.url} alt="Album" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    <button 
                      title="Xóa ảnh này" 
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa ảnh này khỏi album?')) {
                          setData(prev => ({ ...prev, albums: prev.albums.filter((_, idx) => idx !== i) }));
                        }
                      }}
                      style={{
                        position: 'absolute', top: 8, right: 8, 
                        background: 'rgba(220,53,69,0.9)', color: 'white', 
                        border: 'none', borderRadius: '50%', 
                        width: 28, height: 28, cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Icon icon={Trash2} size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {!(data.albums?.length) && <p style={{color: '#888', textAlign: 'center', padding: '20px'}}>Chưa có ảnh nào trong album.</p>}
            </div>
          </div>
        )}

      </main>

      {isDirty && (
        <div className={styles.floatingSave}>
          <span style={{fontWeight: 600}}>⚠️ Bạn có thay đổi chưa lưu!</span>
          <button className={styles.buttonPrimary} style={{boxShadow: 'none', background: '#fff', color: '#222', display: 'flex', alignItems: 'center', gap: '6px'}} onClick={handlePublish} disabled={saving}>
            {saving ? 'Đang lưu...' : <><Icon icon={Save} size={16} /> Lưu thay đổi</>}
          </button>
        </div>
      )}
    </div>
  );
}
