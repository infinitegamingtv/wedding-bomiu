'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import styles from './admin.module.css';
import EventEditor from '@/components/EventEditor';
import { guestRows, csvFor, giftCsvFor } from '@/lib/wedding';
import { LogOut, LayoutDashboard, Users, PenTool, Image as ImageIcon, Save, Link as LinkIcon, Download, Plus, Trash2, MessageCircle, Copy, Check, Heart } from 'lucide';
import { MorphIcon } from 'morphicons/react';

const Icon = ({ icon, size = 18, ...props }) => <MorphIcon icon={icon} size={size} {...props} />;

const DEFAULT_GROUPS = ['Bạn bè', 'Nhà Trai', 'Nhà Gái', 'Đồng nghiệp', 'Họ hàng', 'Khách Bố Mẹ', 'Khách VIP'];
const DEFAULT_TEMPLATE = 'Thân mời {name} tới dự bữa tiệc chung vui cùng gia đình chúng mình nhé! Xem thiệp mời tại: {link}';
const QUICK_AMOUNTS = [
  { label: '300k', value: 300000 },
  { label: '500k', value: 500000 },
  { label: '1M', value: 1000000 },
  { label: '1.5M', value: 1500000 },
  { label: '2M', value: 2000000 },
  { label: '3M', value: 3000000 },
  { label: '5M', value: 5000000 },
];

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newImageUrl, setNewImageUrl] = useState('');

  // CRM & Filter States
  const [bulkGuestNames, setBulkGuestNames] = useState('');
  const [bulkEventId, setBulkEventId] = useState('');
  const [bulkGroup, setBulkGroup] = useState('Bạn bè');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSent, setFilterSent] = useState('all');

  // Gift Registry (Sổ Tiền Mừng) States
  const [hideMoney, setHideMoney] = useState(false);
  const [giftSearch, setGiftSearch] = useState('');
  const [giftFilterGroup, setGiftFilterGroup] = useState('all');
  const [giftFilterEvent, setGiftFilterEvent] = useState('all');
  const [giftFilterMethod, setGiftFilterMethod] = useState('all'); // 'all' | 'gifted' | 'ungifted' | 'cash' | 'transfer' | 'gold'

  // Walk-in Envelope Form (Khách mừng phát sinh ngoài danh sách link)
  const [walkInName, setWalkInName] = useState('');
  const [walkInGroup, setWalkInGroup] = useState('Khách Bố Mẹ');
  const [walkInEventId, setWalkInEventId] = useState('');
  const [walkInAmount, setWalkInAmount] = useState('');
  const [walkInMethod, setWalkInMethod] = useState('cash');
  const [walkInNote, setWalkInNote] = useState('');

  // Table Estimation & Share Template
  const [seatsPerTable, setSeatsPerTable] = useState(10);
  const [inviteTemplate, setInviteTemplate] = useState(DEFAULT_TEMPLATE);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  // Modal State: { scope: 'all' | eventId, tab: 'yes' | 'pending' | 'no' | 'unsent' | 'sent' | 'all' }
  const [guestModal, setGuestModal] = useState(null);
  const [modalSearch, setModalSearch] = useState('');

  // Inline Edit State
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [editForm, setEditForm] = useState({ guestName: '', group: '', eventId: '' });

  // Auto-Save Queue Refs & State
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const dataRef = useRef(null);
  const inFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const savedBadgeTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSeats = localStorage.getItem('wedding_seats_per_table');
      if (savedSeats && [6, 8, 10, 12].includes(Number(savedSeats))) {
        setSeatsPerTable(Number(savedSeats));
      }
      const savedTpl = localStorage.getItem('wedding_invite_template');
      if (savedTpl) setInviteTemplate(savedTpl);
      const savedHide = localStorage.getItem('wedding_hide_money');
      if (savedHide === '1') setHideMoney(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/auth').then(res => res.json()).then(async session => {
      if (!session.authenticated) {
        if (active) { setAuth(false); setLoading(false); }
        return;
      }
      const dataRes = await fetch('/api/data');
      if (!dataRes.ok) throw new Error('Không tải được dữ liệu.');
      const value = await dataRes.json();
      if (active) {
        setData(value);
        dataRef.current = value;
        setOriginalData(JSON.stringify(value));
        if (value.texts?.inviteShareTemplate) {
          setInviteTemplate(value.texts.inviteShareTemplate);
        }
        setAuth(true);
        setLoading(false);
      }
    }).catch(err => {
      if (active) { setNotice(err.message); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (data) dataRef.current = data;
  }, [data]);

  const flushAutoSave = async () => {
    if (!dataRef.current) return;
    if (inFlightRef.current) {
      pendingSaveRef.current = true;
      return;
    }
    inFlightRef.current = true;
    pendingSaveRef.current = false;
    setAutoSaveStatus('saving');

    try {
      const payload = { ...dataRef.current };
      delete payload.rsvps;
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Lỗi tự động lưu');

      const nextMerged = pendingSaveRef.current
        ? { ...dataRef.current, revision: result.revision, rsvps: result.rsvps }
        : result;

      dataRef.current = nextMerged;
      setData(nextMerged);

      if (!pendingSaveRef.current) {
        setOriginalData(JSON.stringify(nextMerged));
        setAutoSaveStatus('saved');
        if (savedBadgeTimerRef.current) clearTimeout(savedBadgeTimerRef.current);
        savedBadgeTimerRef.current = setTimeout(() => setAutoSaveStatus('idle'), 2500);
      }
    } catch (err) {
      console.error('Auto-save error:', err);
      setAutoSaveStatus('error');
    } finally {
      inFlightRef.current = false;
      if (pendingSaveRef.current) {
        flushAutoSave();
      }
    }
  };

  const queueAutoSave = (updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      dataRef.current = next;
      return next;
    });
    setAutoSaveStatus('saving');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      flushAutoSave();
    }, 350);
  };

  const handleLogin = async e => {
    e.preventDefault(); setLoginBusy(true); setNotice('');
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Không đăng nhập được.');
      const dataResponse = await fetch('/api/data');
      if (!dataResponse.ok) throw new Error('Không tải được dữ liệu.');
      const fetchedData = await dataResponse.json();
      setData(fetchedData);
      dataRef.current = fetchedData;
      setOriginalData(JSON.stringify(fetchedData));
      setPassword('');
      setAuth(true);
      setLoading(false);
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

  const isDirty = useMemo(() => {
    if (!data || !originalData) return false;
    const current = { ...data, rsvps: undefined, revision: undefined };
    const original = { ...JSON.parse(originalData), rsvps: undefined, revision: undefined };
    return JSON.stringify(current) !== JSON.stringify(original);
  }, [data, originalData]);

  const handlePublish = async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSaving(true); setNotice('');
    try {
      const payload = { ...dataRef.current }; delete payload.rsvps;
      const response = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Lỗi lưu dữ liệu.');
      setData(result);
      dataRef.current = result;
      setOriginalData(JSON.stringify(result));
      setAutoSaveStatus('saved');
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
      return {
        id,
        slug: id.slice(0, 8),
        guestName: name,
        group: bulkGroup || 'Bạn bè',
        eventId: bulkEventId || data.events[0]?.id || '',
        sent: false,
        giftAmount: 0,
        giftMethod: 'cash',
        giftNote: '',
        isInvited: true
      };
    });
    queueAutoSave(prev => ({ ...prev, links: [...(prev.links || []), ...newLinks] }));
    setBulkGuestNames('');
  };

  // Add Walk-in Gift Envelope (Khách mừng phát sinh)
  const addWalkInGift = (e) => {
    if (e) e.preventDefault();
    const name = walkInName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    const cleanAmount = Number(String(walkInAmount).replace(/[^0-9]/g, '')) || 0;
    const newGuest = {
      id,
      slug: id.slice(0, 8),
      guestName: name,
      group: walkInGroup || 'Khách Bố Mẹ',
      eventId: walkInEventId || data.events[0]?.id || '',
      sent: true,
      giftAmount: cleanAmount,
      giftMethod: walkInMethod || 'cash',
      giftNote: walkInNote.trim(),
      isInvited: true
    };
    queueAutoSave(prev => ({ ...prev, links: [newGuest, ...(prev.links || [])] }));
    setWalkInName('');
    setWalkInAmount('');
    setWalkInNote('');
  };

  // Update Gift Data on any row (including legacy RSVP rows)
  const updateGuestGift = (row, patch) => {
    queueAutoSave(prev => {
      const links = [...(prev.links || [])];
      const targetId = row.guestId || row.id;
      const idx = links.findIndex(l => l.id === targetId);
      if (idx !== -1) {
        links[idx] = { ...links[idx], ...patch };
      } else {
        // Legacy RSVP without a link entry yet -> create link entry to store gift
        const newId = targetId || crypto.randomUUID();
        const safeSlug = 'g-' + String(newId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) + '-' + Math.floor(100 + Math.random() * 899);
        links.push({
          id: newId,
          slug: safeSlug,
          guestName: row.name || 'Khách mời',
          group: row.group || 'Bạn bè',
          eventId: row.eventIds?.[0] || prev.events?.[0]?.id || '',
          sent: true,
          giftAmount: Number(row.giftAmount || 0),
          giftMethod: row.giftMethod || 'cash',
          giftNote: row.giftNote || '',
          ...patch
        });
      }
      return { ...prev, links };
    });
  };

  const removeGuestLink = (id) => {
    if (!confirm('Bạn có chắc muốn xóa khách mời này?')) return;
    queueAutoSave(prev => ({ ...prev, links: prev.links.filter(g => g.id !== id) }));
  };

  const toggleGuestSent = (guestId, forceValue = undefined) => {
    queueAutoSave(prev => ({
      ...prev,
      links: (prev.links || []).map(link =>
        link.id === guestId
          ? { ...link, sent: forceValue !== undefined ? forceValue : !link.sent }
          : link
      )
    }));
  };

  const startEditGuest = (row) => {
    const linkObj = (data.links || []).find(l => l.id === row.guestId);
    if (!linkObj) return;
    setEditingGuestId(row.guestId);
    setEditForm({
      guestName: linkObj.guestName || row.name || '',
      group: linkObj.group || 'Bạn bè',
      eventId: linkObj.eventId || ''
    });
  };

  const saveEditGuest = (guestId) => {
    const trimmedName = editForm.guestName.trim();
    if (!trimmedName) return;
    queueAutoSave(prev => ({
      ...prev,
      links: (prev.links || []).map(link =>
        link.id === guestId
          ? { ...link, guestName: trimmedName, group: editForm.group.trim(), eventId: editForm.eventId }
          : link
      )
    }));
    setEditingGuestId(null);
  };

  const getGuestUrl = (row) => {
    const slug = row.slug || data?.links?.find(l => l.id === row.guestId)?.slug;
    if (!slug) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/invite/${slug}`;
  };

  const copyInviteMessage = (row) => {
    const url = getGuestUrl(row);
    if (!url) return;
    const msg = (inviteTemplate || DEFAULT_TEMPLATE)
      .replaceAll('{name}', row.name)
      .replaceAll('{link}', url);
    navigator.clipboard.writeText(msg);
    setCopiedKey(`msg-${row.guestId}`);
    setTimeout(() => setCopiedKey(''), 2000);
    if (!row.sent && row.guestId) {
      toggleGuestSent(row.guestId, true);
    }
  };

  const copyRawLink = (row) => {
    const url = getGuestUrl(row);
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedKey(`link-${row.guestId}`);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const shareZalo = (row) => {
    const url = getGuestUrl(row);
    if (!url) return;
    const msg = (inviteTemplate || DEFAULT_TEMPLATE)
      .replaceAll('{name}', row.name)
      .replaceAll('{link}', url);
    navigator.clipboard.writeText(msg);
    if (!row.sent && row.guestId) {
      toggleGuestSent(row.guestId, true);
    }
    window.open(`https://zalo.me/share?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  };

  const deleteRsvp = async id => {
    if (!confirm('Xóa phản hồi này?')) return;
    try {
      const res = await fetch('/api/rsvp', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Lỗi xóa');
      setData(prev => ({ ...prev, rsvps: prev.rsvps.filter(r => r.id !== id) }));
    } catch (err) { alert(err.message); }
  };

  const formatTables = (peopleCount) => {
    if (!peopleCount || peopleCount <= 0) return '0 bàn';
    const tables = (peopleCount / seatsPerTable).toFixed(1).replace(/\.0$/, '');
    return `≈ ${tables} bàn (${seatsPerTable} người/bàn)`;
  };

  const formatVND = (amount) => {
    if (hideMoney) return '•••,••• đ';
    return Number(amount || 0).toLocaleString('vi-VN') + ' đ';
  };

  const togglePrivacy = () => {
    setHideMoney(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('wedding_hide_money', next ? '1' : '0');
      return next;
    });
  };

  if (loading) {
    return (
      <div className={styles.adminLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLogo}>BOMIUX ADMIN</div>
          <div className={styles.navMenu}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`${styles.skeleton}`} style={{height: 40, marginBottom: 8}}></div>
            ))}
          </div>
        </aside>
        <main className={styles.mainContent} aria-busy="true">
           <div className={`${styles.skeleton} ${styles.skeletonTitle}`}></div>
           <div className={styles.statsGrid}>
              {[1, 2, 3, 4].map(i => <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`}></div>)}
           </div>
           <div className={`${styles.skeleton} ${styles.skeletonTable}`}></div>
        </main>
      </div>
    );
  }

  if (!auth) {
    return (
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5'}}>
        <form onSubmit={handleLogin} style={{background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center'}}>
          <h2 style={{marginBottom: '20px', color: '#333'}}>Đăng nhập Quản trị</h2>
          <div style={{marginBottom: '15px', textAlign: 'left'}}>
            <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Mật khẩu</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}} required />
          </div>
          <button type="submit" disabled={loginBusy} style={{width: '100%', padding: '12px', background: '#000', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>
            {loginBusy ? 'Đang kiểm tra...' : 'Đăng nhập'}
          </button>
          {notice && <p style={{color: 'red', marginTop: '16px'}}>{notice}</p>}
        </form>
      </div>
    );
  }

  if (!data) return <div style={{padding: '50px', textAlign: 'center'}}>Lỗi tải dữ liệu. <button onClick={logout}>Đăng xuất / Tải lại</button></div>;

  const allRows = guestRows(data);

  // Collect all unique groups for filtering
  const availableGroups = Array.from(new Set([...DEFAULT_GROUPS, ...allRows.map(r => r.group).filter(Boolean)]));

  const crmRows = allRows.filter(r =>
    (filterGroup === 'all' || r.group === filterGroup) &&
    (filterEvent === 'all' || (r.eventIds && r.eventIds.includes(filterEvent))) &&
    (filterStatus === 'all' || r.attending === filterStatus) &&
    (filterSent === 'all' || (filterSent === 'sent' ? r.sent : !r.sent)) &&
    (r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.group && r.group.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Gift Registry Rows & Filtering
  const giftRows = allRows.filter(r => {
    const groupMatch = giftFilterGroup === 'all' || r.group === giftFilterGroup;
    const eventMatch = giftFilterEvent === 'all' || (r.eventIds && r.eventIds.includes(giftFilterEvent));
    const methodMatch =
      giftFilterMethod === 'all' ? true :
      giftFilterMethod === 'gifted' ? r.hasGift :
      giftFilterMethod === 'ungifted' ? !r.hasGift :
      (r.hasGift && r.giftMethod === giftFilterMethod);
    const q = giftSearch.trim().toLowerCase();
    const searchMatch = !q ||
      r.name.toLowerCase().includes(q) ||
      (r.group && r.group.toLowerCase().includes(q)) ||
      (r.giftNote && r.giftNote.toLowerCase().includes(q));
    return groupMatch && eventMatch && methodMatch && searchMatch;
  });

  // Gift Statistics
  const giftedRows = allRows.filter(r => r.hasGift);
  const totalGiftMoney = allRows.reduce((s, r) => s + Number(r.giftAmount || 0), 0);
  const cashRows = allRows.filter(r => r.hasGift && (r.giftMethod || 'cash') === 'cash');
  const totalCashMoney = cashRows.reduce((s, r) => s + Number(r.giftAmount || 0), 0);
  const transferRows = allRows.filter(r => r.hasGift && r.giftMethod === 'transfer');
  const totalTransferMoney = transferRows.reduce((s, r) => s + Number(r.giftAmount || 0), 0);
  const goldRows = allRows.filter(r => r.hasGift && (r.giftMethod === 'gold' || (r.giftNote && /chỉ|cây|vàng|nhẫn|kiềng|lắc|dây/i.test(r.giftNote))));

  // Overall Stats
  const totalAttending = allRows.filter(r => r.attending === 'yes').reduce((s, r) => s + Number(r.count || 0), 0);
  const totalPending = allRows.filter(r => r.attending === 'pending').length;
  const totalDeclined = allRows.filter(r => r.attending === 'no').length;

  const linkRows = allRows.filter(r => Boolean(r.guestId));
  const totalLinksCount = linkRows.length;
  const sentLinksCount = linkRows.filter(r => r.sent).length;
  const unsentLinksCount = totalLinksCount - sentLinksCount;
  const sentPercent = totalLinksCount > 0 ? Math.round((sentLinksCount / totalLinksCount) * 100) : 0;

  // Dynamic modal rows
  const modalScopedRows = guestModal
    ? allRows.filter(r => guestModal.scope === 'all' || (r.eventIds && r.eventIds.includes(guestModal.scope)))
    : [];

  const modalCounts = {
    yes: modalScopedRows.filter(r => r.attending === 'yes').length,
    yesHeadcount: modalScopedRows.filter(r => r.attending === 'yes').reduce((s, r) => s + Number(r.count || 0), 0),
    pending: modalScopedRows.filter(r => r.attending === 'pending').length,
    no: modalScopedRows.filter(r => r.attending === 'no').length,
    unsent: modalScopedRows.filter(r => r.guestId && !r.sent).length,
    sent: modalScopedRows.filter(r => r.guestId && r.sent).length,
    all: modalScopedRows.length,
  };

  const modalFilteredList = modalScopedRows.filter(r => {
    if (!guestModal) return false;
    const t = guestModal.tab;
    const tabMatch =
      t === 'all' ? true :
      t === 'yes' ? r.attending === 'yes' :
      t === 'pending' ? r.attending === 'pending' :
      t === 'no' ? r.attending === 'no' :
      t === 'unsent' ? (r.guestId && !r.sent) :
      t === 'sent' ? (r.guestId && r.sent) : true;
    const q = modalSearch.trim().toLowerCase();
    const searchMatch = !q || r.name.toLowerCase().includes(q) || (r.group && r.group.toLowerCase().includes(q));
    return tabMatch && searchMatch;
  });

  const modalScopeName = guestModal
    ? (guestModal.scope === 'all'
        ? 'Tất cả các tiệc'
        : (data.events.find(e => e.id === guestModal.scope)?.name || 'Chi tiết tiệc'))
    : '';

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>BOMIUX ADMIN</div>
        <div className={styles.navMenu}>
          <button className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span style={{display: 'inline-flex', width: 20}}><Icon icon={LayoutDashboard} size={18} /></span> Tổng quan
          </button>
          <button className={`${styles.navItem} ${activeTab === 'crm' ? styles.active : ''}`} onClick={() => setActiveTab('crm')}>
            <span style={{display: 'inline-flex', width: 20}}><Icon icon={Users} size={18} /></span> Khách & RSVP
          </button>
          <button className={`${styles.navItem} ${activeTab === 'gifts' ? styles.active : ''}`} onClick={() => setActiveTab('gifts')}>
            <span style={{display: 'inline-flex', width: 20}}>💰</span> Sổ Tiền Mừng
          </button>
          <button className={`${styles.navItem} ${activeTab === 'content' ? styles.active : ''}`} onClick={() => setActiveTab('content')}>
            <span style={{display: 'inline-flex', width: 20}}><Icon icon={PenTool} size={18} /></span> Nội dung thiệp
          </button>
          <button className={`${styles.navItem} ${activeTab === 'gallery' ? styles.active : ''}`} onClick={() => setActiveTab('gallery')}>
            <span style={{display: 'inline-flex', width: 20}}><Icon icon={ImageIcon} size={18} /></span> Ảnh Album
          </button>
        </div>
        <div style={{marginTop: 'auto', padding: '16px'}}>
          <a href="/" target="_blank" className={styles.buttonSecondary} style={{display: 'block', textAlign: 'center', marginBottom: '8px', textDecoration: 'none'}}>Xem thiệp &rarr;</a>
          <button className={styles.buttonSecondary} style={{width: '100%', display: 'flex', justifyContent: 'center', gap: '8px'}} onClick={logout}><Icon icon={LogOut} size={18} /> Đăng xuất</button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {/* Top Auto-Save Status Indicator */}
        {autoSaveStatus !== 'idle' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            {autoSaveStatus === 'saving' && (
              <span className={`${styles.autoSaveBadge} ${styles.autoSaveSaving}`}>⏳ Đang tự động lưu...</span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className={`${styles.autoSaveBadge} ${styles.autoSaveSaved}`}>✓ Đã tự động lưu</span>
            )}
            {autoSaveStatus === 'error' && (
              <span className={`${styles.autoSaveBadge} ${styles.autoSaveError}`}>⚠️ Lỗi tự động lưu — Hãy bấm Lưu thay đổi</span>
            )}
          </div>
        )}

        {notice && <div className={styles.notice}><span>{notice}</span><button onClick={() => setNotice('')} style={{background:'transparent',border:'none',cursor:'pointer'}}>✕</button></div>}
        
        {activeTab === 'dashboard' && (
          <div>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>Tổng quan</h1>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`${styles.privacyBtn} ${hideMoney ? styles.privacyBtnActive : ''}`}
                  onClick={togglePrivacy}
                >
                  {hideMoney ? '🙈 Đang ẩn số tiền' : '👁️ Hiện số tiền'}
                </button>
                <div className={styles.seatsSelector}>
                  <span>Quy chuẩn mâm cỗ:</span>
                  <select
                    value={seatsPerTable}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setSeatsPerTable(val);
                      if (typeof window !== 'undefined') localStorage.setItem('wedding_seats_per_table', String(val));
                    }}
                  >
                    <option value={6}>6 người / mâm</option>
                    <option value={8}>8 người / mâm</option>
                    <option value={10}>10 người / mâm</option>
                    <option value={12}>12 người / mâm</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div 
                className={`${styles.statCard} ${styles.highlight} ${styles.clickableCard}`}
                onClick={() => { setModalSearch(''); setGuestModal({ scope: 'all', tab: 'yes' }); }}
                title="Bấm để xem danh sách khách tham dự"
              >
                <h3>{totalAttending}</h3>
                <p>Khách tham dự</p>
                <span className={styles.tableEstBadge}>🍽️ {formatTables(totalAttending)}</span>
                <span className={styles.cardHint}>👉 Bấm xem chi tiết khách</span>
              </div>

              <div 
                className={`${styles.statCard} ${styles.clickableCard}`}
                onClick={() => { setModalSearch(''); setGuestModal({ scope: 'all', tab: unsentLinksCount > 0 ? 'unsent' : 'sent' }); }}
                title="Bấm để xem danh sách khách chưa gửi / đã gửi thiệp"
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <h3>{sentLinksCount}<span style={{ fontSize: '1.25rem', color: '#999', fontWeight: 500 }}>/{totalLinksCount}</span></h3>
                  <strong style={{ color: '#2e7d32', fontSize: '1rem' }}>{sentPercent}%</strong>
                </div>
                <p>Tiến độ gửi thiệp</p>
                <div className={styles.progressBarTrack}>
                  <div className={styles.progressBarFill} style={{ width: `${sentPercent}%` }} />
                </div>
                <span className={styles.cardHint}>
                  {unsentLinksCount > 0 ? `👉 Còn ${unsentLinksCount} khách chưa gửi link` : '✓ Đã gửi đủ 100% khách'}
                </span>
              </div>

              <div 
                className={`${styles.statCard} ${styles.clickableCard}`}
                onClick={() => setActiveTab('gifts')}
                title="Bấm để mở Sổ Tiền Mừng chi tiết"
              >
                <h3 style={{ fontSize: '1.75rem', color: '#2e7d32' }}>{formatVND(totalGiftMoney)}</h3>
                <p>Tổng tiền mừng ({giftedRows.length} phong bì)</p>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  💵 Mặt: {formatVND(totalCashMoney)} • 🏦 CK: {formatVND(totalTransferMoney)}
                </span>
                <span className={styles.cardHint}>👉 Mở Sổ Tiền Mừng & nhập nhanh</span>
              </div>

              <div 
                className={`${styles.statCard} ${styles.clickableCard}`}
                onClick={() => { setModalSearch(''); setGuestModal({ scope: 'all', tab: 'pending' }); }}
                title="Bấm để xem danh sách khách chờ phản hồi"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3>{totalPending}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#999' }}>Vắng: {totalDeclined}</span>
                </div>
                <p>Đang chờ phản hồi</p>
                <span className={styles.cardHint}>👉 Bấm xem & copy link nhắc lịch</span>
              </div>
            </div>
            
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span>Thống kê theo tiệc & Dự kiến số bàn</span>
                <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'normal' }}>Bấm vào từng mục để lọc nhanh danh sách khách</span>
              </h2>
              <div className={styles.statsGrid} style={{marginBottom: 0}}>
                {data.events.map(event => {
                  const evtRows = allRows.filter(r => r.eventIds && r.eventIds.includes(event.id));
                  const attendingRows = evtRows.filter(r => r.attending === 'yes');
                  const pendingRows = evtRows.filter(r => r.attending === 'pending');
                  const declinedRows = evtRows.filter(r => r.attending === 'no');
                  const evtLinkRows = evtRows.filter(r => Boolean(r.guestId));
                  const evtSentCount = evtLinkRows.filter(r => r.sent).length;
                  const evtAttending = attendingRows.reduce((s, r) => s + Number(r.count || 0), 0);
                  const evtSentPct = evtLinkRows.length > 0 ? Math.round((evtSentCount / evtLinkRows.length) * 100) : 0;
                  const evtGiftMoney = evtRows.reduce((s, r) => s + Number(r.giftAmount || 0), 0);
                  const evtGiftCount = evtRows.filter(r => r.hasGift).length;

                  return (
                    <div 
                      key={event.id} 
                      className={`${styles.statCard} ${styles.clickableCard}`} 
                      style={{padding: '20px'}}
                      onClick={() => { setModalSearch(''); setGuestModal({ scope: event.id, tab: 'yes' }); }}
                      title="Bấm để xem chi tiết khách của tiệc này"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{margin: 0, fontSize: '1.15rem', color: '#222'}}>{event.name}</h4>
                        <span className={styles.tableEstBadge}>🍽️ ≈ {(evtAttending / seatsPerTable).toFixed(1).replace(/\.0$/, '')} bàn</span>
                      </div>

                      <div
                        style={{display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6, background: '#fdfaf5', marginBottom: '4px', fontSize: '0.95rem'}}
                        onClick={e => { e.stopPropagation(); setModalSearch(''); setGuestModal({ scope: event.id, tab: 'yes' }); }}
                      >
                        <span style={{color: '#555'}}>✓ Tham dự ({attendingRows.length} đơn):</span> 
                        <strong style={{color: '#C5A880', fontSize: '1.05rem'}}>{evtAttending} người</strong>
                      </div>

                      <div
                        style={{display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, color: '#666', fontSize: '0.88rem'}}
                        onClick={e => { e.stopPropagation(); setModalSearch(''); setGuestModal({ scope: event.id, tab: 'pending' }); }}
                      >
                        <span>⏳ Chờ phản hồi:</span> 
                        <strong>{pendingRows.length} khách</strong>
                      </div>

                      <div
                        style={{display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, color: '#888', fontSize: '0.88rem'}}
                        onClick={e => { e.stopPropagation(); setModalSearch(''); setGuestModal({ scope: event.id, tab: 'no' }); }}
                      >
                        <span>✕ Báo vắng:</span> 
                        <strong>{declinedRows.length} khách</strong>
                      </div>

                      <div
                        style={{display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, color: '#2e7d32', fontSize: '0.88rem', background: '#f4fbf5', marginTop: 2}}
                        onClick={e => { e.stopPropagation(); setGiftFilterEvent(event.id); setActiveTab('gifts'); }}
                      >
                        <span>💰 Tiền mừng ({evtGiftCount} khách):</span> 
                        <strong>{formatVND(evtGiftMoney)}</strong>
                      </div>

                      <div
                        style={{marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #eee', fontSize: '0.82rem', color: '#666'}}
                        onClick={e => { e.stopPropagation(); setModalSearch(''); setGuestModal({ scope: event.id, tab: 'unsent' }); }}
                      >
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                          <span>📨 Đã gửi thiệp:</span>
                          <strong>{evtSentCount}/{evtLinkRows.length} ({evtSentPct}%)</strong>
                        </div>
                        <div className={styles.progressBarTrack} style={{height: 6, marginTop: 2}}>
                          <div className={styles.progressBarFill} style={{width: `${evtSentPct}%`}} />
                        </div>
                      </div>

                      <span className={styles.cardHint} style={{marginTop: '10px'}}>👉 Bấm để mở danh sách & lọc chi tiết</span>
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
                        <td><span className={`${styles.badge} ${r.attending === 'yes' ? styles.success : styles.danger}`}>{r.attending === 'yes' ? `Tham dự (${r.count || 1} người)` : 'Không đi'}</span></td>
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

        {/* POPUP MODAL HIỂN THỊ CHI TIẾT KHÁCH */}
        {guestModal && (
          <div className={styles.modalBackdrop} onClick={() => setGuestModal(null)}>
            <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Danh sách khách: {modalScopeName}</h3>
                  <p className={styles.modalSubtitle}>
                    Tham dự: <strong>{modalCounts.yesHeadcount} người</strong> ({formatTables(modalCounts.yesHeadcount)}) • Chờ phản hồi: <strong>{modalCounts.pending}</strong> • Chưa gửi link: <strong>{modalCounts.unsent}</strong>
                  </p>
                </div>
                <button className={styles.modalCloseBtn} onClick={() => setGuestModal(null)} aria-label="Đóng popup">✕</button>
              </div>

              <div className={styles.modalControls}>
                <div className={styles.modalTabs}>
                  <button
                    type="button"
                    className={`${styles.modalTab} ${guestModal.tab === 'yes' ? styles.modalTabActive : ''}`}
                    onClick={() => setGuestModal(prev => ({ ...prev, tab: 'yes' }))}
                  >
                    Tham dự ({modalCounts.yes} đơn · {modalCounts.yesHeadcount} người)
                  </button>
                  <button
                    type="button"
                    className={`${styles.modalTab} ${guestModal.tab === 'pending' ? styles.modalTabActive : ''}`}
                    onClick={() => setGuestModal(prev => ({ ...prev, tab: 'pending' }))}
                  >
                    Chờ phản hồi ({modalCounts.pending})
                  </button>
                  <button
                    type="button"
                    className={`${styles.modalTab} ${guestModal.tab === 'unsent' ? styles.modalTabActive : ''}`}
                    onClick={() => setGuestModal(prev => ({ ...prev, tab: 'unsent' }))}
                  >
                    Chưa gửi link ({modalCounts.unsent})
                  </button>
                  <button
                    type="button"
                    className={`${styles.modalTab} ${guestModal.tab === 'sent' ? styles.modalTabActive : ''}`}
                    onClick={() => setGuestModal(prev => ({ ...prev, tab: 'sent' }))}
                  >
                    Đã gửi link ({modalCounts.sent})
                  </button>
                  <button
                    type="button"
                    className={`${styles.modalTab} ${guestModal.tab === 'no' ? styles.modalTabActive : ''}`}
                    onClick={() => setGuestModal(prev => ({ ...prev, tab: 'no' }))}
                  >
                    Báo vắng ({modalCounts.no})
                  </button>
                  <button
                    type="button"
                    className={`${styles.modalTab} ${guestModal.tab === 'all' ? styles.modalTabActive : ''}`}
                    onClick={() => setGuestModal(prev => ({ ...prev, tab: 'all' }))}
                  >
                    Tất cả ({modalCounts.all})
                  </button>
                </div>
                <input
                  type="text"
                  className={styles.modalSearchInput}
                  placeholder="🔍 Tìm nhanh tên khách hoặc nhóm trong danh sách này..."
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                />
              </div>

              <div className={styles.modalBody}>
                {modalFilteredList.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '30px 0' }}>Không có khách nào trong mục này.</p>
                ) : (
                  <div>
                    {modalFilteredList.map((guest, idx) => (
                      <div key={guest.id || guest.guestId || idx} className={styles.guestItem} style={{ gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 220px' }}>
                          <div className={styles.guestName}>
                            {guest.name}
                            {guest.group && <span className={styles.groupBadge}>{guest.group}</span>}
                          </div>
                          <div className={styles.guestMeta}>
                            {guest.location && <span>Tiệc: <strong>{guest.location}</strong> • </span>}
                            {guest.message ? <span>Lời chúc: &quot;{guest.message}&quot;</span> : <span>Chưa có lời chúc</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {guest.guestId && (
                            <>
                              <label className={`${styles.sentToggle} ${guest.sent ? styles.sentTrue : styles.sentFalse}`} title="Tick đã gửi hoặc chưa gửi (Tự động lưu)">
                                <input
                                  type="checkbox"
                                  checked={!!guest.sent}
                                  onChange={() => toggleGuestSent(guest.guestId)}
                                />
                                <span>{guest.sent ? 'Đã gửi' : 'Chưa gửi'}</span>
                              </label>
                              <button
                                type="button"
                                className={`${styles.buttonCopyInvite} ${copiedKey === `msg-${guest.guestId}` ? styles.buttonCopySuccess : ''}`}
                                onClick={() => copyInviteMessage(guest)}
                                title="Copy câu mời kèm link và tự động đánh dấu Đã gửi"
                              >
                                <Icon icon={copiedKey === `msg-${guest.guestId}` ? Check : Copy} size={13} />
                                {copiedKey === `msg-${guest.guestId}` ? 'Đã chép lời mời!' : 'Copy lời mời'}
                              </button>
                            </>
                          )}

                          {guest.attending === 'yes' && (
                            <span className={`${styles.badge} ${styles.success}`}>
                              Đi {guest.count || 1} người
                            </span>
                          )}
                          {guest.attending === 'pending' && (
                            <span className={`${styles.badge} ${styles.warning}`}>
                              Chờ phản hồi
                            </span>
                          )}
                          {guest.attending === 'no' && (
                            <span className={`${styles.badge} ${styles.danger}`}>
                              Báo bận
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB MỚI: SỔ TIỀN MỪNG & QUÀ CƯỚI (GÓI A) */}
        {activeTab === 'gifts' && (
          <div>
            <div className={styles.header}>
              <div>
                <h1 className={styles.pageTitle}>💰 Sổ Tiền Mừng & Quà Cưới</h1>
                <p style={{ color: '#777', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                  Nhập số tiền mừng 1 chạm, phân loại Tiền mặt / Chuyển khoản / Vàng và tự động lưu ngay lập tức.
                </p>
              </div>
              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={`${styles.privacyBtn} ${hideMoney ? styles.privacyBtnActive : ''}`}
                  onClick={togglePrivacy}
                  title="Ẩn/Hiện số tiền để tránh người bên cạnh nhìn thấy"
                >
                  {hideMoney ? '🙈 Đang ẩn số tiền (Bấm để hiện)' : '👁️ Ẩn số tiền'}
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    const url = URL.createObjectURL(new Blob([giftCsvFor(giftRows)], { type: 'text/csv;charset=utf-8' }));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'so-tien-mung-dam-cuoi.csv';
                    a.click();
                  }}
                >
                  <Icon icon={Download} size={16} /> Xuất Sổ Tiền Mừng ({giftRows.length})
                </button>
              </div>
            </div>

            {/* 4 Thẻ Tổng thu Tiền mừng */}
            <div className={styles.statsGrid}>
              <div
                className={`${styles.statCard} ${styles.highlight} ${styles.clickableCard}`}
                onClick={() => setGiftFilterMethod(giftFilterMethod === 'gifted' ? 'all' : 'gifted')}
              >
                <h3 style={{ fontSize: '1.85rem', color: '#2e7d32' }}>{formatVND(totalGiftMoney)}</h3>
                <p>Tổng tiền mừng thu được</p>
                <span style={{ fontSize: '0.82rem', color: '#666' }}>
                  Đã ghi nhận: <strong>{giftedRows.length} / {allRows.length}</strong> khách
                </span>
                <span className={styles.cardHint}>👉 Bấm để lọc những khách đã mừng</span>
              </div>

              <div
                className={`${styles.statCard} ${styles.clickableCard}`}
                onClick={() => setGiftFilterMethod(giftFilterMethod === 'cash' ? 'all' : 'cash')}
              >
                <h3 style={{ fontSize: '1.75rem', color: '#2e7d32' }}>{formatVND(totalCashMoney)}</h3>
                <p>💵 Tiền mặt (Phong bì)</p>
                <span style={{ fontSize: '0.82rem', color: '#666' }}>
                  Số lượng: <strong>{cashRows.length} phong bì</strong>
                </span>
                <span className={styles.cardHint}>👉 Bấm để đối chiếu tiền mặt trong thùng</span>
              </div>

              <div
                className={`${styles.statCard} ${styles.clickableCard}`}
                onClick={() => setGiftFilterMethod(giftFilterMethod === 'transfer' ? 'all' : 'transfer')}
              >
                <h3 style={{ fontSize: '1.75rem', color: '#1565c0' }}>{formatVND(totalTransferMoney)}</h3>
                <p>🏦 Chuyển khoản (QR Bank)</p>
                <span style={{ fontSize: '0.82rem', color: '#666' }}>
                  Số lượng: <strong>{transferRows.length} lượt CK</strong>
                </span>
                <span className={styles.cardHint}>👉 Bấm để đối chiếu sao kê ngân hàng</span>
              </div>

              <div
                className={`${styles.statCard} ${styles.clickableCard}`}
                onClick={() => setGiftFilterMethod(giftFilterMethod === 'gold' ? 'all' : 'gold')}
              >
                <h3 style={{ fontSize: '1.75rem', color: '#f57f17' }}>{goldRows.length} phần quà</h3>
                <p>💍 Vàng & Quà Hiện Vật</p>
                <span style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {goldRows.length > 0 ? goldRows.map(r => `${r.name} (${r.giftNote || 'Vàng'})`).slice(0, 2).join(', ') : 'Chưa ghi nhận quà vàng'}
                </span>
                <span className={styles.cardHint}>👉 Bấm để xem danh sách mừng vàng/quà</span>
              </div>
            </div>

            {/* Thống kê tiền mừng theo Nhóm & Tiệc */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span>Thống kê Tiền mừng theo Nhóm khách & Tiệc</span>
                {(giftFilterGroup !== 'all' || giftFilterEvent !== 'all' || giftFilterMethod !== 'all') && (
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                    onClick={() => { setGiftFilterGroup('all'); setGiftFilterEvent('all'); setGiftFilterMethod('all'); }}
                  >
                    ✕ Xóa bộ lọc đang chọn
                  </button>
                )}
              </h2>
              <div className={styles.giftMiniGrid}>
                {availableGroups.map(grp => {
                  const grpRows = allRows.filter(r => r.group === grp);
                  if (!grpRows.length) return null;
                  const grpGifted = grpRows.filter(r => r.hasGift).length;
                  const grpSum = grpRows.reduce((s, r) => s + Number(r.giftAmount || 0), 0);
                  const active = giftFilterGroup === grp;
                  return (
                    <div
                      key={grp}
                      className={`${styles.giftMiniCard} ${active ? styles.giftMiniCardActive : ''}`}
                      onClick={() => setGiftFilterGroup(active ? 'all' : grp)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ fontSize: '0.92rem', color: '#333' }}>{grp}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#777' }}>{grpGifted}/{grpRows.length} khách</span>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2e7d32' }}>
                        {formatVND(grpSum)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thêm nhanh phong bì khách phát sinh ngoài danh sách Link */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span>+ Thêm nhanh phong bì phát sinh (Khách của Bố Mẹ / Khách ngoài danh sách Link)</span>
                <span style={{ fontSize: '0.8rem', color: '#2e7d32', fontWeight: 500 }}>✓ Tự động lưu ngay</span>
              </h2>
              <form onSubmit={addWalkInGift}>
                <div className={styles.formGrid} style={{ gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr 1fr 1.4fr auto', gap: 10, alignItems: 'start' }}>
                  <div>
                    <input
                      className={styles.input}
                      style={{ padding: '9px 12px', fontSize: '0.9rem' }}
                      placeholder="Tên người mừng (VD: Bác Hùng bạn Bố) *"
                      value={walkInName}
                      onChange={e => setWalkInName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <select className={styles.select} style={{ padding: '9px 10px', fontSize: '0.9rem' }} value={walkInGroup} onChange={e => setWalkInGroup(e.target.value)}>
                      {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <select className={styles.select} style={{ padding: '9px 10px', fontSize: '0.9rem' }} value={walkInEventId} onChange={e => setWalkInEventId(e.target.value)}>
                      {data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="10000"
                      min="0"
                      className={styles.input}
                      style={{ padding: '9px 12px', fontSize: '0.9rem', fontWeight: 700, color: '#2e7d32' }}
                      placeholder="Số tiền (VNĐ)"
                      value={walkInAmount}
                      onChange={e => setWalkInAmount(e.target.value)}
                    />
                    <div className={styles.presetGroup}>
                      {QUICK_AMOUNTS.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          className={`${styles.presetChip} ${Number(walkInAmount) === p.value ? styles.presetChipActive : ''}`}
                          onClick={() => setWalkInAmount(String(p.value))}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <select className={styles.select} style={{ padding: '9px 10px', fontSize: '0.9rem' }} value={walkInMethod} onChange={e => setWalkInMethod(e.target.value)}>
                      <option value="cash">💵 Tiền mặt</option>
                      <option value="transfer">🏦 Chuyển khoản</option>
                      <option value="gold">💍 Vàng / Quà</option>
                    </select>
                  </div>
                  <div>
                    <input
                      className={styles.input}
                      style={{ padding: '9px 12px', fontSize: '0.9rem' }}
                      placeholder="Ghi chú (VD: 1 chỉ vàng / Gửi hộ)"
                      value={walkInNote}
                      onChange={e => setWalkInNote(e.target.value)}
                    />
                  </div>
                  <button type="submit" className={styles.buttonPrimary} style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    + Lưu phong bì
                  </button>
                </div>
              </form>
            </div>

            {/* Bảng nhập và tra cứu Sổ Tiền Mừng */}
            <div className={styles.card}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <input
                  className={styles.input}
                  style={{ flex: '1 1 220px' }}
                  placeholder="🔍 Tìm tên khách, nhóm hoặc ghi chú quà..."
                  value={giftSearch}
                  onChange={e => setGiftSearch(e.target.value)}
                />
                <select className={styles.select} style={{ width: '165px' }} value={giftFilterGroup} onChange={e => setGiftFilterGroup(e.target.value)}>
                  <option value="all">Tất cả nhóm</option>
                  {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className={styles.select} style={{ width: '165px' }} value={giftFilterEvent} onChange={e => setGiftFilterEvent(e.target.value)}>
                  <option value="all">Tất cả tiệc</option>
                  {data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <select className={styles.select} style={{ width: '185px' }} value={giftFilterMethod} onChange={e => setGiftFilterMethod(e.target.value)}>
                  <option value="all">Mọi trạng thái mừng</option>
                  <option value="gifted">✓ Đã mừng ({giftedRows.length})</option>
                  <option value="ungifted">⏳ Chưa ghi nhận ({allRows.length - giftedRows.length})</option>
                  <option value="cash">💵 Tiền mặt ({cashRows.length})</option>
                  <option value="transfer">🏦 Chuyển khoản ({transferRows.length})</option>
                  <option value="gold">💍 Vàng / Hiện vật ({goldRows.length})</option>
                </select>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Khách mời & Nhóm</th>
                      <th>Số tiền mừng (VNĐ) — Bấm chọn nhanh 1 chạm</th>
                      <th>Hình thức mừng</th>
                      <th>Ghi chú trả lễ / Quà hiện vật</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {giftRows.map((row, i) => {
                      const amt = Number(row.giftAmount || 0);
                      const methodClass =
                        row.giftMethod === 'transfer' ? styles.methodTransfer :
                        row.giftMethod === 'gold' ? styles.methodGold :
                        styles.methodCash;

                      return (
                        <tr key={row.guestId || row.id || i} style={{ background: row.hasGift ? '#fafdf9' : undefined }}>
                          <td style={{ minWidth: 190 }}>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                              <strong>{row.name}</strong>
                              {row.group && <span className={styles.groupBadge}>{row.group}</span>}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#777', marginTop: 3 }}>
                              {row.location} •{' '}
                              {row.attending === 'yes' ? (
                                <span style={{ color: '#2e7d32', fontWeight: 600 }}>Đi {row.count || 1} người</span>
                              ) : row.attending === 'no' ? (
                                <span style={{ color: '#c62828' }}>Báo vắng</span>
                              ) : (
                                <span>Chờ phản hồi</span>
                              )}
                            </div>
                          </td>

                          <td style={{ minWidth: 310 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {hideMoney ? (
                                <span style={{ fontWeight: 700, color: amt > 0 ? '#2e7d32' : '#999', fontSize: '0.95rem', minWidth: 130 }}>
                                  {amt > 0 ? '•••,••• đ' : 'Chưa nhập'}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  step="50000"
                                  min="0"
                                  className={styles.moneyInput}
                                  placeholder="0 đ"
                                  value={amt > 0 ? amt : ''}
                                  onChange={e => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    updateGuestGift(row, { giftAmount: val });
                                  }}
                                />
                              )}
                              {!hideMoney && amt > 0 && (
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2e7d32', whiteSpace: 'nowrap' }}>
                                  = {amt.toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>
                            <div className={styles.presetGroup}>
                              {QUICK_AMOUNTS.map(preset => (
                                <button
                                  key={preset.value}
                                  type="button"
                                  className={`${styles.presetChip} ${amt === preset.value ? styles.presetChipActive : ''}`}
                                  onClick={() => updateGuestGift(row, { giftAmount: preset.value })}
                                >
                                  {preset.label}
                                </button>
                              ))}
                              {amt > 0 && (
                                <button
                                  type="button"
                                  className={styles.presetChipClear}
                                  title="Xóa số tiền về 0"
                                  onClick={() => updateGuestGift(row, { giftAmount: 0 })}
                                >
                                  ✕ 0đ
                                </button>
                              )}
                            </div>
                          </td>

                          <td style={{ minWidth: 150 }}>
                            <select
                              className={`${styles.methodSelect} ${row.hasGift ? methodClass : ''}`}
                              value={row.giftMethod || 'cash'}
                              onChange={e => updateGuestGift(row, { giftMethod: e.target.value })}
                            >
                              <option value="cash">💵 Phong bì (Mặt)</option>
                              <option value="transfer">🏦 Chuyển khoản</option>
                              <option value="gold">💍 Vàng / Hiện vật</option>
                            </select>
                          </td>

                          <td style={{ minWidth: 220 }}>
                            <input
                              type="text"
                              className={styles.giftNoteInput}
                              placeholder="VD: 1 chỉ vàng / Trước mình mừng 1M..."
                              value={row.giftNote || ''}
                              onChange={e => updateGuestGift(row, { giftNote: e.target.value })}
                            />
                          </td>

                          <td>
                            {row.guestId && (
                              <button
                                type="button"
                                title="Xóa khách này"
                                className={`${styles.buttonSecondary} ${styles.buttonDanger}`}
                                style={{ padding: '6px 10px' }}
                                onClick={() => removeGuestLink(row.guestId)}
                              >
                                <Icon icon={Trash2} size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!giftRows.length && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#888', padding: '24px' }}>
                          Không tìm thấy khách mời phù hợp với bộ lọc.
                        </td>
                      </tr>
                    )}
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
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => setShowTemplateEditor(v => !v)}
                >
                  ✉️ {showTemplateEditor ? 'Ẩn mẫu câu mời' : 'Tùy chỉnh câu mời mẫu'}
                </button>
                <button className={styles.buttonSecondary} style={{display: 'flex', alignItems: 'center', gap: '6px'}} onClick={() => {
                   const url = URL.createObjectURL(new Blob([csvFor(crmRows)], { type: 'text/csv;charset=utf-8' }));
                   const a = document.createElement('a'); a.href = url; a.download = 'khach-moi.csv'; a.click();
                }}><Icon icon={Download} size={16} /> Xuất Excel ({crmRows.length})</button>
              </div>
            </div>

            {showTemplateEditor && (
              <div className={styles.templateBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.9rem', color: '#59472d' }}>
                    Mẫu câu mời khi bấm nút &quot;Copy Lời mời&quot; (Dùng <code>{'{name}'}</code> cho tên khách và <code>{'{link}'}</code> cho đường dẫn thiệp):
                  </strong>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    onClick={() => {
                      setInviteTemplate(DEFAULT_TEMPLATE);
                      if (typeof window !== 'undefined') localStorage.setItem('wedding_invite_template', DEFAULT_TEMPLATE);
                      queueAutoSave(prev => ({ ...prev, texts: { ...prev.texts, inviteShareTemplate: DEFAULT_TEMPLATE } }));
                    }}
                  >
                    Khôi phục mặc định
                  </button>
                </div>
                <textarea
                  className={styles.textarea}
                  style={{ minHeight: 68 }}
                  value={inviteTemplate}
                  onChange={e => {
                    const val = e.target.value;
                    setInviteTemplate(val);
                    if (typeof window !== 'undefined') localStorage.setItem('wedding_invite_template', val);
                    queueAutoSave(prev => ({ ...prev, texts: { ...prev.texts, inviteShareTemplate: val } }));
                  }}
                />
              </div>
            )}

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span>Tạo Link Mời Hàng Loạt</span>
                <span style={{ fontSize: '0.8rem', color: '#2e7d32', fontWeight: 500 }}>✓ Tự động lưu ngay khi tạo</span>
              </h2>
              <div className={styles.formGrid} style={{gridTemplateColumns: '2fr 1fr 1fr auto'}}>
                <textarea
                  className={styles.textarea}
                  placeholder="Nhập tên khách (mỗi người 1 dòng)&#10;VD:&#10;Vợ chồng Anh Tuấn&#10;Gia đình Chị Lan"
                  value={bulkGuestNames}
                  onChange={e => setBulkGuestNames(e.target.value)}
                  style={{minHeight: '52px', height: '52px'}}
                />
                <select className={styles.select} value={bulkGroup} onChange={e => setBulkGroup(e.target.value)}>
                  {DEFAULT_GROUPS.map(g => <option key={g} value={g}>Nhóm: {g}</option>)}
                </select>
                <select className={styles.select} value={bulkEventId} onChange={e => setBulkEventId(e.target.value)}>
                  <option value="">-- Mặc định ({data.events[0]?.name || 'Tất cả tiệc'}) --</option>
                  {data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <button className={styles.buttonPrimary} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap'}} onClick={addBulkGuests}>
                  <Icon icon={Plus} size={16} /> Tạo link
                </button>
              </div>
            </div>

            <div className={styles.card}>
              <div style={{display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap'}}>
                <input className={styles.input} style={{flex: '1 1 200px'}} placeholder="🔍 Tìm tên khách hoặc nhóm..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <select className={styles.select} style={{width: '165px'}} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
                  <option value="all">Tất cả nhóm</option>
                  {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className={styles.select} style={{width: '175px'}} value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
                  <option value="all">Tất cả tiệc</option>
                  {data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <select className={styles.select} style={{width: '155px'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">Mọi phản hồi</option>
                  <option value="pending">Chờ phản hồi</option>
                  <option value="yes">Tham dự</option>
                  <option value="no">Không đi</option>
                </select>
                <select className={styles.select} style={{width: '155px'}} value={filterSent} onChange={e => setFilterSent(e.target.value)}>
                  <option value="all">Tất cả gửi thiệp</option>
                  <option value="unsent">Chưa gửi link ({unsentLinksCount})</option>
                  <option value="sent">Đã gửi link ({sentLinksCount})</option>
                </select>
              </div>
              
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Khách mời & Nhóm</th>
                      <th style={{textAlign: 'center'}}>Đã gửi link?</th>
                      <th>Gửi Thiệp Nhanh</th>
                      <th>Phản hồi</th>
                      <th>Chi tiết RSVP & Tiền mừng</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crmRows.map((row, i) => {
                      const isEditing = editingGuestId === row.guestId && Boolean(row.guestId);
                      const guestUrl = getGuestUrl(row);
                      return (
                        <tr key={row.id || row.guestId || i}>
                          <td style={{ minWidth: 210 }}>
                            {isEditing ? (
                              <div className={styles.inlineEditBox}>
                                <input
                                  className={styles.inlineInput}
                                  value={editForm.guestName}
                                  onChange={e => setEditForm(prev => ({ ...prev, guestName: e.target.value }))}
                                  placeholder="Tên khách mời..."
                                  onKeyDown={e => e.key === 'Enter' && saveEditGuest(row.guestId)}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <select
                                    className={styles.inlineSelect}
                                    value={editForm.group}
                                    onChange={e => setEditForm(prev => ({ ...prev, group: e.target.value }))}
                                  >
                                    {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                  </select>
                                  <select
                                    className={styles.inlineSelect}
                                    value={editForm.eventId}
                                    onChange={e => setEditForm(prev => ({ ...prev, eventId: e.target.value }))}
                                  >
                                    {data.events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                                  </select>
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                                  <button type="button" className={styles.buttonPrimary} style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => saveEditGuest(row.guestId)}>✓ Lưu</button>
                                  <button type="button" className={styles.buttonSecondary} style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setEditingGuestId(null)}>Hủy</button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                  <strong>{row.name}</strong>
                                  {row.group && <span className={styles.groupBadge}>{row.group}</span>}
                                  {row.legacy && <span className={`${styles.badge} ${styles.neutral}`}>Tự RSVP</span>}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 3 }}>
                                  Tiệc mời: {row.location}
                                </div>
                              </div>
                            )}
                          </td>

                          <td style={{textAlign: 'center'}}>
                            {row.guestId ? (
                              <label className={`${styles.sentToggle} ${row.sent ? styles.sentTrue : styles.sentFalse}`} title="Bấm để tick đã gửi hoặc chưa gửi (Tự động lưu)">
                                <input 
                                  type="checkbox" 
                                  checked={!!row.sent} 
                                  onChange={() => toggleGuestSent(row.guestId)} 
                                />
                                <span>{row.sent ? 'Đã gửi' : 'Chưa gửi'}</span>
                              </label>
                            ) : (
                              <span style={{color: '#bbb', fontSize: '0.8rem'}}>—</span>
                            )}
                          </td>

                          <td>
                            {row.guestId ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className={`${styles.buttonCopyInvite} ${copiedKey === `msg-${row.guestId}` ? styles.buttonCopySuccess : ''}`}
                                    onClick={() => copyInviteMessage(row)}
                                    title="Copy câu mời kèm link và tự động đánh dấu Đã gửi"
                                  >
                                    <Icon icon={copiedKey === `msg-${row.guestId}` ? Check : Copy} size={14} />
                                    {copiedKey === `msg-${row.guestId}` ? 'Đã copy lời mời!' : 'Copy Lời mời + Link'}
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.buttonZalo}
                                    onClick={() => shareZalo(row)}
                                    title="Copy lời mời và mở chia sẻ Zalo"
                                  >
                                    <Icon icon={MessageCircle} size={14} /> Zalo
                                  </button>
                                </div>
                                <div className={styles.linkBox}>
                                  <input className={styles.linkInput} readOnly value={guestUrl} />
                                  <button
                                    type="button"
                                    className={styles.buttonSecondary}
                                    style={{padding: '5px 9px', fontSize: '0.78rem', whiteSpace: 'nowrap'}}
                                    onClick={() => copyRawLink(row)}
                                    title="Chỉ copy đường dẫn URL"
                                  >
                                    {copiedKey === `link-${row.guestId}` ? '✓ Đã chép' : <Icon icon={LinkIcon} size={13} />}
                                  </button>
                                </div>
                              </div>
                            ) : <span style={{color: '#999', fontSize: '0.85rem'}}>N/A (Thiệp chung)</span>}
                          </td>

                          <td>
                            <span className={`${styles.badge} ${row.attending === 'yes' ? styles.success : row.attending === 'no' ? styles.danger : styles.warning}`}>
                              {row.attending === 'yes' ? 'Tham dự' : row.attending === 'no' ? 'Không đi' : 'Chờ phản hồi'}
                            </span>
                          </td>

                          <td>
                            <div style={{fontSize: '0.85rem'}}>
                              {row.attending !== 'pending' && (
                                <>
                                  <div>{row.location ? row.location.split(' + ').map((loc, idx) => <span key={idx} className={styles.locationBadge}>{loc}</span>) : ''}</div>
                                  {row.attending === 'yes' && <div style={{marginTop: '4px'}}><strong>Đi:</strong> {row.count} người</div>}
                                  {row.message && <div style={{marginTop: '4px', color: '#666', fontStyle: 'italic'}}>&quot;{row.message}&quot;</div>}
                                </>
                              )}
                              {row.hasGift && (
                                <div style={{ marginTop: 4, color: '#2e7d32', fontWeight: 600 }}>
                                  💰 Mừng: {row.giftAmount > 0 ? formatVND(row.giftAmount) : ''} {row.giftNote ? `(${row.giftNote})` : ''}
                                </div>
                              )}
                            </div>
                          </td>

                          <td>
                            <div style={{display: 'flex', gap: '6px'}}>
                              {row.guestId && (
                                <button
                                  type="button"
                                  title="Sửa tên khách / nhóm / tiệc mời"
                                  className={styles.iconBtn}
                                  onClick={() => startEditGuest(row)}
                                >
                                  ✏️
                                </button>
                              )}
                              {row.id && <button title="Xóa phản hồi RSVP" className={`${styles.buttonSecondary} ${styles.buttonDanger}`} style={{padding: '6px 10px'}} onClick={() => deleteRsvp(row.id)}><Icon icon={Trash2} size={14} /></button>}
                              {row.guestId && <button title="Xóa Link khách mời" className={`${styles.buttonSecondary} ${styles.buttonDanger}`} style={{padding: '6px 10px'}} onClick={() => removeGuestLink(row.guestId)}><Icon icon={Trash2} size={14} /></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!crmRows.length && <tr><td colSpan="6" style={{textAlign: 'center'}}>Không có dữ liệu phù hợp.</td></tr>}
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
                <div className={styles.formGroup}><label className={styles.label}>Link ảnh QR Mừng cưới</label><input className={styles.input} value={data.invitation.qrCodeUrl || ''} onChange={e => handleInputChange(e, 'qrCodeUrl')} placeholder="VD: https://..." /></div>
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
            {saving ? <><span className={styles.spinner} role="status" aria-label="Đang lưu"></span> Đang lưu...</> : <><Icon icon={Save} size={16} /> Lưu thay đổi</>}
          </button>
        </div>
      )}
    </div>
  );
}
