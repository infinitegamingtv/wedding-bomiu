'use client';
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useMemo } from 'react';
import styles from './admin.module.css';
import EventEditor from '@/components/EventEditor';
import GuestDashboard from '@/components/GuestDashboard';

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeroBg, setUploadingHeroBg] = useState(false);
  
  const [newAlbumUrl, setNewAlbumUrl] = useState('');
  const [bulkGuestNames, setBulkGuestNames] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');

  const [notice, setNotice] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [bulkEventId, setBulkEventId] = useState('');

  const isDirty = useMemo(() => {
    if (!data || !originalData) return false;
    // RSVP data is refreshed and saved separately from editable invitation content.
    const current = { ...data, rsvps: undefined };
    const original = { ...JSON.parse(originalData), rsvps: undefined };
    return JSON.stringify(current) !== JSON.stringify(original);
  }, [data, originalData]);

  useEffect(() => {
    let active = true;
    fetch('/api/auth').then(res => res.json()).then(async session => {
      if (!session.authenticated) return;
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Không tải được dữ liệu.');
      const value = await res.json();
      if (active) { setData(value); setOriginalData(JSON.stringify(value)); setAuth(true); }
    }).catch(err => { if (active) setNotice(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleLogin = async e => {
    e.preventDefault(); setLoginBusy(true); setNotice('');
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Không đăng nhập được.');
      const dataResponse = await fetch('/api/data');
      if (!dataResponse.ok) throw new Error('Không tải được dữ liệu.');
      const fetchedData = await dataResponse.json();
      setData(fetchedData); setOriginalData(JSON.stringify(fetchedData)); setPassword(''); setAuth(true); setLoading(false);
    } catch (err) { setNotice(err.message); }
    finally { setLoginBusy(false); }
  };
  const logout = async () => {
    try {
      const res = await fetch('/api/auth', { method: 'DELETE' });
      if (!res.ok) throw new Error('Chưa đăng xuất được.');
      setAuth(false); setData(null); setNotice('');
    } catch (err) { setNotice(err.message); }
  };

  if (!auth) {
    return (
      <div className={styles.container} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
        <form onSubmit={handleLogin} className={styles.section} style={{maxWidth: '400px', width: '100%', textAlign: 'center'}}>
          <h2 style={{marginBottom: '20px', color: '#5C5346'}}>Đăng nhập Quản trị</h2>
          <label htmlFor="admin-password" className={styles.label}>Mật khẩu quản trị</label><input id="admin-password" autoComplete="current-password" required type="password" placeholder="Nhập mật khẩu" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} style={{marginBottom: '15px'}} />
          <button type="submit" className={styles.button} style={{marginTop: '0'}} disabled={loginBusy || loading}>{loginBusy ? 'Đang đăng nhập…' : loading ? 'Đang kiểm tra…' : 'Đăng nhập'}</button>{notice && <p role="alert" className={styles.error}>{notice}</p>}
        </form>
      </div>
    );
  }

  const handleInputChange = (e, field, subfield = null) => {
    const value = e.target.value;
    setData(prev => {
      const newData = { ...prev };
      if (subfield !== null) {
        const newArray = [...newData.invitation[field]];
        newArray[subfield] = value;
        newData.invitation[field] = newArray;
      } else {
        newData.invitation[field] = value;
      }
      return newData;
    });
  };

  const handleTextChange = (e, field) => {
    setData(prev => ({ ...prev, texts: { ...prev.texts, [field]: e.target.value } }));
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const result = await res.json();
    if (result.url) return result.url;
    throw new Error(result.error || 'Upload failed');
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadFile(file);
      setData(prev => ({ ...prev, invitation: { ...prev.invitation, logoUrl: url } }));
      alert('Tải logo thành công!');
    } catch(err) { alert('Lỗi tải logo.'); }
    setUploadingLogo(false);
  };

  const handleHeroBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingHeroBg(true);
    try {
      const url = await uploadFile(file);
      setData(prev => ({ ...prev, invitation: { ...prev.invitation, heroBgUrl: url } }));
      alert('Tải ảnh nền thành công!');
    } catch(err) { alert('Lỗi tải ảnh nền.'); }
    setUploadingHeroBg(false);
  };

  const handleAddMusicUrl = () => {
    const url = prompt('Nhập link nhạc (URL, kết thúc bằng .mp3 hoặc định dạng audio hợp lệ):');
    if (!url) return;
    const name = prompt('Nhập tên bài hát (không bắt buộc):') || 'Bài hát mới';
    setData(prev => ({
      ...prev,
      invitation: {
        ...prev.invitation,
        musicTracks: [...(prev.invitation.musicTracks || []), { name, url }]
      }
    }));
  };

  const handleMusicUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploadingAudio(true);
    const newTracks = [];
    for (const file of files) {
      try {
        const url = await uploadFile(file);
        const name = file.name.replace(/\.[^.]+$/, '');
        newTracks.push({ name, url });
      } catch(err) { 
        alert('Lỗi tải tệp ' + file.name + ': ' + err.message);
        console.error('Failed to upload:', file.name, err);
      }
    }
    setData(prev => ({
      ...prev,
      invitation: {
        ...prev.invitation,
        musicTracks: [...(prev.invitation.musicTracks || []), ...newTracks]
      }
    }));
    alert(`Đã tải lên thành công ${newTracks.length} bài nhạc!`);
    setUploadingAudio(false);
    e.target.value = '';
  };

  const removeTrack = (index) => {
    setData(prev => {
      const newTracks = [...(prev.invitation.musicTracks || [])];
      newTracks.splice(index, 1);
      return { ...prev, invitation: { ...prev.invitation, musicTracks: newTracks } };
    });
  };

  const handleStoryChange = (index, field, value) => {
    setData(prev => {
      const newStories = [...prev.stories];
      newStories[index] = { ...newStories[index], [field]: value };
      return { ...prev, stories: newStories };
    });
  };

  const addStory = () => setData(prev => ({ ...prev, stories: [...(prev.stories || []), { id: Date.now().toString(), date: 'Thời gian mới', title: 'Tiêu đề', content: 'Nội dung...', imageUrl: '' }] }));
  const removeStory = (index) => setData(prev => { const newStories = [...prev.stories]; newStories.splice(index, 1); return { ...prev, stories: newStories }; });

  const addAlbum = () => {
    if (newAlbumUrl.trim() === '') return;
    setData(prev => ({ ...prev, albums: [...prev.albums, newAlbumUrl.trim()] }));
    setNewAlbumUrl('');
  };
  const removeAlbum = (index) => setData(prev => { const newAlbums = [...prev.albums]; newAlbums.splice(index, 1); return { ...prev, albums: newAlbums }; });

  const handleAlbumImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const urls = [];
    for (const file of files) {
      try { urls.push(await uploadFile(file)); } catch(err) {}
    }
    setData(prev => ({ ...prev, albums: [...prev.albums, ...urls] }));
    alert(`Đã tải lên thành công ${urls.length} ảnh!`);
    e.target.value = '';
  };

  const handleStoryImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      handleStoryChange(index, 'imageUrl', url);
    } catch(err) { alert('Lỗi tải ảnh.'); }
  };

  const addBulkGuests = () => {
    if (bulkGuestNames.trim() === '') return;
    const names = bulkGuestNames.split('\n').map(n => n.trim()).filter(n => n !== '');
    const newLinks = names.map(name => {
      const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + '-' + crypto.randomUUID();
      return { id: crypto.randomUUID(), guestName: name, slug, eventId: bulkEventId || data.events[0].id };
    });
    
    setData(prev => ({ ...prev, links: [...prev.links, ...newLinks] }));
    setBulkGuestNames('');
    alert(`Đã tạo thành công ${newLinks.length} link mời!`);
  };

  const removeGuestLink = (index) => setData(prev => { const newLinks = [...prev.links]; newLinks.splice(index, 1); return { ...prev, links: newLinks }; });
  
  const toggleGuestLinkInvited = (index) => {
    setData(prev => {
      const newLinks = [...prev.links];
      newLinks[index] = { ...newLinks[index], isInvited: !newLinks[index].isInvited };
      return { ...prev, links: newLinks };
    });
  };
  
  const deleteRsvp = async id => {
    if (!confirm('Xóa phản hồi này ngay? Khách vẫn có thể gửi lại xác nhận.')) return;
    try {
      const res = await fetch('/api/rsvp', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setData(prev => ({ ...prev, rsvps: prev.rsvps.filter(r => r.id !== id) }));
    } catch (err) { setNotice(err.message); }
  };
  const refreshResponses = async () => {
    const res = await fetch('/api/data'); const fresh = await res.json();
    if (!res.ok) throw new Error(fresh.error || 'Không tải được phản hồi.');
    setData(prev => ({ ...prev, rsvps: fresh.rsvps }));
  };
  const handlePublish = async () => {
    setSaving(true); setNotice('');
    try {
      const payload = { ...data }; delete payload.rsvps;
      const response = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không lưu được dữ liệu.');
      setData(result); setOriginalData(JSON.stringify(result)); setNotice('Đã lưu nội dung thiệp. Các phản hồi mới của khách được giữ nguyên.');
    } catch (err) { setNotice(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className={styles.container}>Đang tải dữ liệu...</div>;
  if (!data) return <div className={styles.container}>Lỗi tải dữ liệu</div>;

  const tabs = [
    { id: 'general', label: 'Thông tin chung' },
    { id: 'events', label: 'Các tiệc cưới' },
    { id: 'texts', label: 'Tùy chỉnh Văn bản' },
    { id: 'links', label: 'Khách mời' },
    { id: 'stories', label: 'Chuyện tình yêu' },
    { id: 'gallery', label: 'Ảnh Album' },
    { id: 'rsvp', label: 'RSVP' }
  ];

  return (
    <div className={styles.container}>
      {isDirty && (
        <button type="button" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%', background: '#f57c00', color: 'white', textAlign: 'center', padding: '16px', fontWeight: 'bold', zIndex: 100, boxShadow: '0 -4px 12px rgba(0,0,0,0.15)', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
          ⚠️ CẢNH BÁO: Dữ liệu bị thay đổi chưa được lưu! Bấm vào đây hoặc kéo xuống dưới cùng ấn &ldquo;Lưu &amp; Publish&rdquo;.
        </button>
      )}
      <h1 className={styles.title}>Quản Lý Thiệp Cưới</h1><div className={styles.toolbar}><a className={styles.buttonSecondary} href="/" target="_blank" rel="noreferrer">Xem thiệp ↗</a><button className={styles.buttonSecondary} onClick={logout}>Đăng xuất</button></div>{notice && <p role="status" className={styles.notice}>{notice}</p>}
      
      <div className={styles.tabsContainer}>
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <fieldset disabled={saving} className={styles.editorFields}>
      {activeTab === 'events' && <EventEditor events={data.events} onChange={events => setData(prev => ({ ...prev, events }))} />}

      {activeTab === 'texts' && <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tùy chỉnh Văn bản</h2>
        <div className={styles.grid}>
          <div className={styles.formGroup}><label className={styles.label}>Phụ đề trang chủ</label><input className={styles.input} value={data.texts?.heroSubtitle || ''} onChange={e => handleTextChange(e, 'heroSubtitle')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Lời mời</label><input className={styles.input} value={data.texts?.inviteTitle || ''} onChange={e => handleTextChange(e, 'inviteTitle')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Dòng chào mừng</label><input className={styles.input} value={data.texts?.inviteGreeting || ''} onChange={e => handleTextChange(e, 'inviteGreeting')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Chữ &ldquo;Nhà Trai&rdquo;</label><input className={styles.input} value={data.texts?.groomParentsTitle || ''} onChange={e => handleTextChange(e, 'groomParentsTitle')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Chữ &ldquo;Nhà Gái&rdquo;</label><input className={styles.input} value={data.texts?.brideParentsTitle || ''} onChange={e => handleTextChange(e, 'brideParentsTitle')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Tiền tố địa điểm (VD: TẠI)</label><input className={styles.input} value={data.texts?.locationPrefix || ''} onChange={e => handleTextChange(e, 'locationPrefix')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Lịch Trình</label><input className={styles.input} value={data.texts?.itineraryTitle || ''} onChange={e => handleTextChange(e, 'itineraryTitle')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Chuyện Tình Yêu</label><input className={styles.input} value={data.texts?.storyTitle || ''} onChange={e => handleTextChange(e, 'storyTitle')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Khoảnh Khắc</label><input className={styles.input} value={data.texts?.galleryTitle || ''} onChange={e => handleTextChange(e, 'galleryTitle')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Lưu Bút</label><input className={styles.input} value={data.texts?.guestbookTitle || ''} onChange={e => handleTextChange(e, 'guestbookTitle')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Xác Nhận</label><input className={styles.input} value={data.texts?.rsvpTitle || ''} onChange={e => handleTextChange(e, 'rsvpTitle')} /></div>
          <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Gửi Tặng</label><input className={styles.input} value={data.texts?.giftTitle || ''} onChange={e => handleTextChange(e, 'giftTitle')} /></div>
        </div>
      </div>}
      
      {activeTab === 'general' && <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Thông tin chung</h2>
        <div className={styles.grid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên Chú Rể</label>
            <input className={styles.input} value={data.invitation.groom} onChange={e => handleInputChange(e, 'groom')} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên Cô Dâu</label>
            <input className={styles.input} value={data.invitation.bride} onChange={e => handleInputChange(e, 'bride')} />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Bố Chú Rể</label>
            <input className={styles.input} value={data.invitation.groomParents[0]} onChange={e => handleInputChange(e, 'groomParents', 0)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Mẹ Chú Rể</label>
            <input className={styles.input} value={data.invitation.groomParents[1]} onChange={e => handleInputChange(e, 'groomParents', 1)} />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Bố Cô Dâu</label>
            <input className={styles.input} value={data.invitation.brideParents[0]} onChange={e => handleInputChange(e, 'brideParents', 0)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Mẹ Cô Dâu</label>
            <input className={styles.input} value={data.invitation.brideParents[1]} onChange={e => handleInputChange(e, 'brideParents', 1)} />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Địa chỉ Nhà Trai</label>
            <input className={styles.input} value={data.invitation.groomAddress} onChange={e => handleInputChange(e, 'groomAddress')} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Địa chỉ Nhà Gái</label>
            <input className={styles.input} value={data.invitation.brideAddress} onChange={e => handleInputChange(e, 'brideAddress')} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Link Ảnh Chú Rể (Avatar)</label>
            <input className={styles.input} value={data.invitation.groomAvatarUrl || ''} onChange={e => handleInputChange(e, 'groomAvatarUrl')} placeholder="Nhập link ảnh chân dung chú rể..." />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Link Ảnh Cô Dâu (Avatar)</label>
            <input className={styles.input} value={data.invitation.brideAvatarUrl || ''} onChange={e => handleInputChange(e, 'brideAvatarUrl')} placeholder="Nhập link ảnh chân dung cô dâu..." />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Giới thiệu ngắn về Chú rể</label>
            <textarea className={styles.textarea} value={data.invitation.groomBio || ''} onChange={e => handleInputChange(e, 'groomBio')} placeholder="Chàng trai ấm áp..." />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Giới thiệu ngắn về Cô dâu</label>
            <textarea className={styles.textarea} value={data.invitation.brideBio || ''} onChange={e => handleInputChange(e, 'brideBio')} placeholder="Cô gái dịu dàng..." />
          </div>

          <div className={styles.formGroup + ' ' + styles.full}>
            <label className={styles.label}>Thông điệp (Lời cảm ơn)</label>
            <textarea className={styles.textarea} value={data.invitation.message || ''} onChange={e => handleInputChange(e, 'message')} />
          </div>
          
          <div className={styles.formGroup + ' ' + styles.full}>
            <label className={styles.label}>Ảnh minh họa phần Sổ Lưu Bút</label>
            <input className={styles.input} value={data.invitation.guestbookPhotoUrl || ''} onChange={e => handleInputChange(e, 'guestbookPhotoUrl')} placeholder="Nhập link ảnh (Hiển thị đầu sổ lưu bút)" />
          </div>

          <div className={styles.formGroup + ' ' + styles.full}>
            <label className={styles.label}>Logo (Hình ảnh trên Bìa)</label>
            <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
              <input className={styles.input} style={{flex: 1}} value={data.invitation.logoUrl || ''} onChange={e => handleInputChange(e, 'logoUrl')} placeholder="Nhập link logo (hoặc tải file lên bên cạnh)" />
              <label className={styles.button} style={{cursor: 'pointer'}}>
                {uploadingLogo ? 'Đang tải...' : 'Tải Logo lên (PNG/JPG)'}
                <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
            </div>
            {data.invitation.logoUrl && <img src={data.invitation.logoUrl} alt="Logo Preview" style={{marginTop: '10px', height: '60px', objectFit: 'contain'}} />}
          </div>

          <div className={styles.formGroup + ' ' + styles.full}>
            <label className={styles.label}>Ảnh nền (Hero Background)</label>
            <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
              <input className={styles.input} style={{flex: 1}} value={data.invitation.heroBgUrl || ''} onChange={e => handleInputChange(e, 'heroBgUrl')} placeholder="Nhập link ảnh nền (hoặc tải file lên bên cạnh)" />
              <label className={styles.button} style={{cursor: 'pointer'}}>
                {uploadingHeroBg ? 'Đang tải...' : 'Tải Ảnh nền lên'}
                <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleHeroBgUpload} disabled={uploadingHeroBg} />
              </label>
            </div>
            {data.invitation.heroBgUrl && <img src={data.invitation.heroBgUrl} alt="Bg Preview" style={{marginTop: '10px', height: '60px', objectFit: 'contain'}} />}
          </div>

          <div className={styles.formGroup + ' ' + styles.full}>
            <label className={styles.label}>Danh sách Nhạc Nền (Playlist)</label>
            <div style={{display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px'}}>
              <label className={styles.button} style={{cursor: 'pointer'}}>
                {uploadingAudio ? 'Đang tải...' : '🎵 Tải nhiều bài nhạc (.mp3)'}
                <input type="file" accept="audio/*" multiple style={{display: 'none'}} onChange={handleMusicUpload} disabled={uploadingAudio} />
              </label>
              <button className={styles.buttonSecondary} onClick={handleAddMusicUrl}>Hoặc gắn link URL</button>
              <span style={{color: '#888', fontSize: '0.85rem'}}>Chọn file hoặc dán link nhạc</span>
            </div>
            {(data.invitation.musicTracks || []).length > 0 && (
              <ul style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {data.invitation.musicTracks.map((track, i) => (
                  <li key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eaeaea', boxShadow: '0 2px 8px rgba(197,168,128,0.1)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <span style={{color: '#C5A880', fontWeight: 'bold'}}>♫</span>
                      <span>{track.name || `Bài ${i+1}`}</span>
                    </div>
                    <button className={`${styles.buttonSecondary} ${styles.buttonDanger}`} style={{padding: '4px 10px'}} onClick={() => removeTrack(i)}>Xóa</button>
                  </li>
                ))}
              </ul>
            )}
            {(data.invitation.musicTracks || []).length === 0 && data.invitation.musicUrl && (
              <p style={{color: '#888', fontSize: '0.85rem'}}>Đang dùng: {data.invitation.musicUrl}</p>
            )}
          </div>
          
          <div className={styles.formGroup + ' ' + styles.full}>
            <label className={styles.label}>Link ảnh Mã QR Mừng Cưới</label>
            <input className={styles.input} value={data.invitation.qrCodeUrl || ''} onChange={e => handleInputChange(e, 'qrCodeUrl')} placeholder="https://..." />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên Ngân hàng / Ví</label>
            <input className={styles.input} value={data.invitation.bankName || ''} onChange={e => handleInputChange(e, 'bankName')} placeholder="Ví dụ: Vietcombank, Momo..." />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên Tài khoản</label>
            <input className={styles.input} value={data.invitation.accountName || ''} onChange={e => handleInputChange(e, 'accountName')} placeholder="Ví dụ: NGUYEN VAN A" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Số Tài khoản</label>
            <input className={styles.input} value={data.invitation.accountNumber || ''} onChange={e => handleInputChange(e, 'accountNumber')} placeholder="Ví dụ: 0123456789" />
          </div>
        </div>
      </div>}
      
      {activeTab === 'links' && <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quản lý Link Mời Khách Hàng Loạt</h2>
        <p style={{marginBottom: '10px', color: '#666'}}>Nhập danh sách tên khách mời, mỗi tên một dòng (ví dụ: Anh Tùng, Chị Hoa...). Hệ thống sẽ tạo hàng loạt link.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
          <textarea className={styles.textarea} style={{minHeight: '100px'}} placeholder="Anh A&#10;Chị B&#10;Bạn C..." value={bulkGuestNames} onChange={e => setBulkGuestNames(e.target.value)} />
          <label className={styles.label}>Tiệc mặc định cho nhóm khách mới<select className={styles.input} value={bulkEventId || data.events[0].id} onChange={e => setBulkEventId(e.target.value)}>{data.events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label><button className={styles.button} onClick={addBulkGuests}>Tạo Link Hàng Loạt</button>
        </div>
        <ul className={styles.list}>
          {data.links.map((link, i) => {
            const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${link.slug}`;
            return (
              <li key={link.id} className={styles.listItem}>
                <div className={styles.flexRow}>
                  <strong>{link.guestName}</strong><label>Tiệc mời<select className={styles.input} value={link.eventId || data.events[0].id} onChange={e => setData(prev => ({ ...prev, links: prev.links.map((g, index) => index === i ? { ...g, eventId: e.target.value } : g) }))}>{data.events.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>
                  <input className={styles.linkBox} value={fullUrl} readOnly />
                </div>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem', color: link.isInvited ? 'green' : 'var(--color-text-main)'}}>
                    <input type="checkbox" checked={!!link.isInvited} onChange={() => toggleGuestLinkInvited(i)} /> Đã mời
                  </label>
                  <button className={styles.buttonSecondary} onClick={() => navigator.clipboard.writeText(fullUrl)}>Copy</button>
                  <button className={`${styles.buttonSecondary} ${styles.buttonDanger}`} onClick={() => removeGuestLink(i)}>Xóa</button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>}

      {activeTab === 'stories' && <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Chuyện Tình Yêu (Stories)</h2>
        <button className={styles.button} style={{marginBottom: '15px'}} onClick={addStory}>+ Thêm Câu Chuyện</button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(data.stories || []).map((story, i) => (
            <div key={story.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Thời gian</label>
                  <input className={styles.input} value={story.date} onChange={e => handleStoryChange(i, 'date', e.target.value)} />
                </div>
                <div style={{ flex: 2 }}>
                  <label className={styles.label}>Tiêu đề</label>
                  <input className={styles.input} value={story.title} onChange={e => handleStoryChange(i, 'title', e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label className={styles.label}>Ảnh minh họa</label>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <input className={styles.input} style={{flex: 1}} value={story.imageUrl || ''} onChange={e => handleStoryChange(i, 'imageUrl', e.target.value)} placeholder="URL hoặc tải ảnh lên..." />
                  <label className={styles.buttonSecondary} style={{cursor: 'pointer', padding: '8px 14px', whiteSpace: 'nowrap'}}>
                    Tải ảnh
                    <input type="file" accept="image/*" style={{display: 'none'}} onChange={e => handleStoryImageUpload(e, i)} />
                  </label>
                </div>
                {story.imageUrl && <img src={story.imageUrl} alt="Preview" style={{height: '80px', marginTop: '8px', borderRadius: '6px', objectFit: 'cover'}} />}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label className={styles.label}>Nội dung</label>
                <textarea className={styles.textarea} style={{minHeight: '60px'}} value={story.content} onChange={e => handleStoryChange(i, 'content', e.target.value)} />
              </div>
              <button className={`${styles.buttonSecondary} ${styles.buttonDanger}`} onClick={() => removeStory(i)}>Xóa mốc này</button>
            </div>
          ))}
        </div>
      </div>}
      
      {activeTab === 'rsvp' && <GuestDashboard data={data} onDelete={deleteRsvp} onRefresh={refreshResponses} />}

      {activeTab === 'gallery' && <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quản lý Ảnh Album</h2>
        <div style={{display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap'}}>
          <label className={styles.button} style={{cursor: 'pointer'}}>
            📷 Tải nhiều ảnh từ máy tính
            <input type="file" accept="image/*" multiple style={{display: 'none'}} onChange={handleAlbumImageUpload} />
          </label>
        </div>
        <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
          <input className={styles.input} placeholder="Hoặc nhập URL hình ảnh..." value={newAlbumUrl} onChange={e => setNewAlbumUrl(e.target.value)} />
          <button className={styles.button} onClick={addAlbum}>Thêm</button>
        </div>
        <ul className={styles.list}>
          {data.albums.map((url, i) => (
            <li key={i} className={styles.listItem}>
              <div className={styles.flexRow}>
                <img src={url} alt="Album img" className={styles.imagePreview} />
                <span style={{wordBreak: 'break-all'}}>{url}</span>
              </div>
              <button className={`${styles.buttonSecondary} ${styles.buttonDanger}`} onClick={() => removeAlbum(i)}>Xóa</button>
            </li>
          ))}
        </ul>
      </div>}

      </fieldset>
      <div className={styles.publishBtnContainer}>
        <button className={`${styles.button} ${styles.publishBtn}`} onClick={handlePublish} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu & Publish'}
        </button>
      </div>
    </div>
  );
}
