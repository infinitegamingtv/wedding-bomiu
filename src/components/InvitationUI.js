'use client';
/* Existing originals are preserved; public photo URLs use generated WebP copies. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import styles from './Invitation.module.css';
import { Mascot } from 'page-mascot';
import { MorphIcon } from "morphicons/react";
import { Music, Pause, X, ArrowUpRight, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, MapPin, Heart, Send, Check, Mail, MailOpen, Navigation, BookHeart, Image as ImageIcon, CalendarCheck, Loader2 } from "lucide";

const flowerItems = Array.from({ length: 8 }, (_, i) => ({ left: `${(i * 13 + 7) % 100}%`, animationDelay: `${i * 2.3}s`, animationDuration: `${22 + i}s` }));
const envDecorations = Array.from({ length: 24 }, (_, i) => ({ left: `${(i * 17 + 5) % 100}%`, animationDelay: `${i * 0.7}s`, animationDuration: `${12 + (i % 5) * 2}s`, fontSize: `${0.8 + (i % 3) * 0.4}rem`, content: i % 2 === 0 ? '✿' : '❤', color: i % 2 === 0 ? '#fcedd9' : '#ff8585' }));
const formatDate = date => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
const formatTime = date => date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
const noOrphan = str => typeof str === 'string' ? str.replace(/ ([^ ]+)$/, '\u00A0$1') : str;

const MountainDeco = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.6 }}>
      <circle cx="200" cy="180" r="60" fill="#fff" filter="blur(16px)">
        <animate attributeName="cy" values="280; 100; 100; 280" dur="20s" repeatCount="indefinite" />
      </circle>
      <circle cx="200" cy="180" r="30" fill="#fcf6ec" filter="blur(4px)">
        <animate attributeName="cy" values="280; 100; 100; 280" dur="20s" repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

const WaveDeco = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', bottom: 0 }}>
      <g fill="#fff" opacity="0.3">
        <path d="M-200 220 Q -150 200, -100 220 T 0 220 T 100 220 T 200 220 T 300 220 T 400 220 T 500 220 T 600 220 L 600 300 L -200 300 Z">
          <animateTransform attributeName="transform" type="translate" values="0,0; 200,0" dur="8s" repeatCount="indefinite" />
        </path>
        <path d="M-200 250 Q -150 240, -100 250 T 0 250 T 100 250 T 200 250 T 300 250 T 400 250 T 500 250 T 600 250 L 600 300 L -200 300 Z" opacity="0.5">
          <animateTransform attributeName="transform" type="translate" values="200,0; 0,0" dur="6s" repeatCount="indefinite" />
        </path>
        <path d="M-200 270 Q -150 260, -100 270 T 0 270 T 100 270 T 200 270 T 300 270 T 400 270 T 500 270 T 600 270 L 600 300 L -200 300 Z" opacity="0.8">
          <animateTransform attributeName="transform" type="translate" values="0,0; 200,0" dur="4s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  </div>
);

function InteractiveIcon({ defaultIcon, hoverIcon, activeIcon, isActive, size = 16, style, ...props }) {
  const [hover, setHover] = useState(false);
  const icon = isActive && activeIcon ? activeIcon : (hover && hoverIcon ? hoverIcon : defaultIcon);
  return (
    <span onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }} {...props}>
      <MorphIcon icon={icon} size={size} />
    </span>
  );
}

function weddingDate(value) {
  // Admin datetime-local values describe the ceremony in Vietnam, regardless of guest timezone.
  if (!value) return new Date(NaN);
  return new Date(/(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value.length === 16 ? `${value}:00` : value}+07:00`);
}

function mapEmbed(value) {
  const source = value?.match(/src=["']([^"']+)["']/)?.[1];
  if (!source) return null;
  try {
    const url = new URL(source.replaceAll('&amp;', '&'));
    return url.protocol === 'https:' && /(^|\.)google\.com$/.test(url.hostname) && url.pathname.startsWith('/maps/embed') ? url.href : null;
  } catch { return null; }
}

function PhotoDialog({ src, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={dialog} className={styles.lightbox} aria-label="Ảnh cưới phóng to" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <button autoFocus className={styles.lightboxClose} onClick={onClose} aria-label="Đóng ảnh"><MorphIcon icon={X} size={24} color="currentColor" /></button>
    <img src={src} alt="Khoảnh khắc ngày cưới" />
  </dialog>;
}

function FadeInSection({ children, id, className = '' }) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    const current = domRef.current;
    if (current) observer.observe(current);
    return () => { if (current) observer.unobserve(current); };
  }, []);
  return (
    <section id={id} ref={domRef} className={`${styles.section} ${className} ${isVisible ? styles.visible : ''}`.trim()}>
      {children}
    </section>
  );
}

const Countdown = ({ date }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    const target = new Date(date).getTime();
    const update = () => {
      const diff = target - new Date().getTime();
      if (diff <= 0) return setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [date]);
  if (!timeLeft || (timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0)) return null;
  return (
    <div className={styles.countdown}>
      <div className={styles.cdBox}><strong>{timeLeft.d}</strong><span>Ngày</span></div>
      <div className={styles.cdBox}><strong>{timeLeft.h}</strong><span>Giờ</span></div>
      <div className={styles.cdBox}><strong>{timeLeft.m}</strong><span>Phút</span></div>
      <div className={styles.cdBox}><strong>{timeLeft.s}</strong><span>Giây</span></div>
    </div>
  );
};

export default function InvitationUI({ data, guestName, guestSlug, initialEventId }) {
  let { invitation, albums = [], stories = [], events = [], rsvps = [], texts = {} } = data;
  const [opened, setOpened] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [track, setTrack] = useState(0);
  
  const tracksCount = invitation.musicTracks?.length || (invitation.musicUrl ? 1 : 0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tracksCount > 1) setTrack(Math.floor(Math.random() * tracksCount));
  }, [tracksCount]);
  
  const [zoom, setZoom] = useState(null);
  const [status, setStatus] = useState('idle');
  const scrollRef = useRef(null);
  const scrollGallery = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 600 : 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  
  const [activeTabId, setActiveTabId] = useState(initialEventId || events[0]?.id || '');
  const [form, setForm] = useState({ name: guestName || '', attending: 'yes', eventIds: [initialEventId || events[0]?.id || ''], count: 1, message: '' });
  
  const [copyStatus, setCopyStatus] = useState('');
  const [replyReady, setReplyReady] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [hasReply, setHasReply] = useState(false);
  const [retryLoad, setRetryLoad] = useState(0);
  const [newWish, setNewWish] = useState(null);
  const audio = useRef(null);
  const rsvpSelectionEdited = useRef(false);
  useEffect(() => {
    const handleInteraction = () => {
      if (!playing && audio.current) setPlaying(true);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [playing]);
  const heading = useRef(null);
  const success = useRef(null);
  const submitting = useRef(false);
  const tracks = invitation.musicTracks?.length ? invitation.musicTracks : invitation.musicUrl ? [{ name: 'Nhạc cưới', url: invitation.musicUrl }] : [];
  const trackUrl = tracks[track]?.url;
  const selectedEvent = events.find(event => event.id === activeTabId) || events[0] || {};
  
  let groomDeco = <MountainDeco />;
  let brideDeco = <WaveDeco />;
  
  if (/thanh h(o|ó)a/i.test(selectedEvent.name || '')) {
    groomDeco = <WaveDeco />;
    brideDeco = <MountainDeco />;
    invitation = {
      ...invitation,
      groom: data.invitation.bride,
      bride: data.invitation.groom,
      groomParents: data.invitation.brideParents,
      brideParents: data.invitation.groomParents,
      groomAddress: data.invitation.brideAddress,
      brideAddress: data.invitation.groomAddress,
      groomBio: data.invitation.brideBio,
      brideBio: data.invitation.groomBio,
      groomAvatarUrl: data.invitation.brideAvatarUrl,
      brideAvatarUrl: data.invitation.groomAvatarUrl,
    };
    texts = {
      ...texts,
      groomParentsTitle: data.texts?.brideParentsTitle || 'Nhà Gái',
      brideParentsTitle: data.texts?.groomParentsTitle || 'Nhà Trai',
      heroSubtitle: 'Lễ Nạp Tài',
    };
  }

  const mapUrl = selectedEvent.mapUrl;
  let mainDateStr = selectedEvent.date;
  if (!mainDateStr && selectedEvent.subEvents?.length) {
    const firstSub = selectedEvent.subEvents.find(s => s.date);
    if (firstSub) mainDateStr = firstSub.date;
  }
  const date = weddingDate(mainDateStr);
  const validDate = Number.isFinite(date.getTime());
  const embed = mapEmbed(mapUrl);
  const directions = mapUrl && /^https?:\/\//.test(mapUrl) && !mapUrl.includes('/embed') ? mapUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedEvent.address || selectedEvent.venue || '')}`;
  const wishes = [...rsvps.filter(item => item.id !== newWish?.id), ...(newWish ? [newWish] : [])].filter(item => item.message?.trim());
  const schedule = selectedEvent.itinerary || [];
  const replyEvents = events.filter(event => form.eventIds.includes(event.id)).map(event => event.name).join(' + ');
  const update = e => setForm(previous => ({ ...previous, [e.target.name]: e.target.value }));

  useEffect(() => {
    let active = true;
    fetch('/api/rsvp' + (guestSlug ? '?slug=' + encodeURIComponent(guestSlug) : ''))
      .then(async res => { const value = await res.json(); if (!res.ok) throw new Error(value.error); return value; })
      .then(({ rsvp }) => {
        if (!active) return;
        if (rsvp) {
          setForm({ name: rsvp.name, attending: rsvp.attending, eventIds: rsvp.eventId ? rsvp.eventId.split(',') : [], count: rsvp.count || 1, message: rsvp.message || '' });
          rsvpSelectionEdited.current = true;
          setHasReply(true); setStatus('success');
        }
        setReplyReady(true); setReplyError('');
      }).catch(err => { if (active) setReplyError(err.message || 'Chưa tải được phản hồi. Vui lòng thử lại.'); });
    return () => { active = false; };
  }, [guestSlug, retryLoad]);

  useEffect(() => { if (opened) heading.current?.focus({ preventScroll: true }); }, [opened]);
  useEffect(() => { if (status === 'success') success.current?.focus(); }, [status]);
  useEffect(() => {
    const player = audio.current;
    if (!player || !trackUrl) return;
    if (playing) player.play().catch(() => setPlaying(false));
    else player.pause();
  }, [playing, trackUrl]);

  const calendarUrl = () => {
    const stamp = value => value.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const params = new URLSearchParams({ action: 'TEMPLATE', text: `Đám cưới ${invitation.groom} & ${invitation.bride} · ${selectedEvent.name}`, dates: `${stamp(date)}/${stamp(new Date(date.getTime() + 4 * 3600000))}`, location: [selectedEvent.venue, selectedEvent.address].filter(Boolean).join(', '), ctz: 'Asia/Ho_Chi_Minh' });
    return `https://calendar.google.com/calendar/render?${params}`;
  };
  const submit = async e => {
    e.preventDefault();
    if (!replyReady || submitting.current || !form.name.trim()) return;
    submitting.current = true;
    setStatus('submitting');
    const payload = { ...form, eventId: form.eventIds.join(','), slug: guestSlug, name: form.name.trim(), message: form.message.trim(), count: form.attending === 'yes' ? Number(form.count) : 0 };
    try {
      const response = await fetch('/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể lưu phản hồi');
      setNewWish(result.wish); setHasReply(true); setReplyError('');
      setStatus('success');
    } catch (err) { setReplyError(err.message); setStatus('error'); }
    finally { submitting.current = false; }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopyStatus('Đã sao chép đường dẫn thiệp.'); }
    catch { setCopyStatus('Chưa sao chép được. Bạn có thể sao chép đường dẫn trên thanh địa chỉ.'); }
  };

  return <div className={styles.wrapper}>
    {trackUrl && <audio ref={audio} autoPlay src={trackUrl} preload="auto" loop={tracksCount === 1} onEnded={() => setTrack(index => tracksCount > 1 ? (index + 1 + Math.floor(Math.random() * (tracksCount - 1))) % tracksCount : 0)} onError={() => setPlaying(false)} />}
    {tracks.length > 0 && <div className={styles.musicControl}>
      <button onClick={() => setPlaying(value => !value)} aria-pressed={playing} aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}><MorphIcon icon={playing ? Pause : Music} size={16} /> {playing ? 'Tắt nhạc' : 'Bật nhạc'}</button>
      {tracks.length > 1 && <select aria-label="Chọn nhạc" value={track} onChange={e => { setTrack(Number(e.target.value)); setPlaying(true); }}>{tracks.map((item, index) => <option key={index} value={index}>{item.name || `Bài ${index + 1}`}</option>)}</select>}
    </div>}
      {/* ENVELOPE OVERLAY */}
      <div className={`${styles.envelopeScreen} ${opened ? styles.isOpened : ''}`} style={invitation.heroBgUrl ? { backgroundImage: `linear-gradient(0deg, #302719a0, #30271960), url("${invitation.heroBgUrl}")` } : undefined}>
        <div className={styles.envFloatingLayer} aria-hidden="true">
          {envDecorations.map((dec, index) => <span key={index} className={styles.envFloatingItem} style={{ left: dec.left, animationDelay: dec.animationDelay, animationDuration: dec.animationDuration, fontSize: dec.fontSize, color: dec.color }}>{dec.content}</span>)}
        </div>
        <div className={styles.envelopeCard}>
          {invitation.logoUrl && <img className={styles.cardLogo} src={invitation.logoUrl} alt="" />}
          <h1 className={styles.envNames}>{invitation.groom?.replace(/ /g, '\u00A0')}<span>&</span>{invitation.bride?.replace(/ /g, '\u00A0')}</h1>
          {validDate && <p className={styles.envelopeDate}>{formatDate(date).replaceAll('/', ' — ')}</p>}
          <div className={styles.envTo}><span>Thân mời</span><strong>{guestName || 'Quý khách'}</strong></div>
          <button className={styles.primaryButton} onClick={() => { 
            setBursting(true); 
            setPlaying(true); 
            setTimeout(() => setOpened(true), 400); 
          }}>Mở thiệp</button>
          
          {bursting && <div className={styles.heartBurst} aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
              <svg key={i} viewBox="0 0 32 32" className={styles.flyingHeart} style={{ '--angle': `${i * 12}deg`, '--delay': `${Math.random() * 0.15}s` }}>
                <path d="M16,28.261c0,0-14-7.926-14-17.046c0-9.356,13.159-10.399,14-0.454c0.84-9.945,14-8.902,14,0.454 C30,20.335,16,28.261,16,28.261z" fill="var(--color-gold)"/>
              </svg>
            ))}
          </div>}
        </div>
      </div>

      {/* MAIN WEBSITE CONTENT */}
      <div style={{ height: opened ? 'auto' : '100vh', overflow: opened ? 'visible' : 'hidden' }}>
        <a className={styles.skipLink} href="#rsvp">Đến phần xác nhận tham dự</a>
        <div className={styles.flowers} aria-hidden="true">{flowerItems.map((style, index) => <span key={index} style={style}>✿</span>)}</div>
        <nav className={styles.navBar} aria-label="Các phần của thiệp">
          <a href="#invite"><InteractiveIcon defaultIcon={Mail} hoverIcon={MailOpen} /> Lời mời</a>
          {stories.length > 0 && <a href="#story"><InteractiveIcon defaultIcon={BookHeart} /> Chuyện mình</a>}
          {albums.length > 0 && <a href="#gallery"><InteractiveIcon defaultIcon={ImageIcon} /> Ảnh cưới</a>}
          <a href="#rsvp" className={styles.navCta}><InteractiveIcon defaultIcon={CalendarCheck} /> Tham dự</a>
        </nav>
        <main className={styles.mainContent}>
        <section id="hero" className={styles.hero} style={invitation.heroBgUrl ? { backgroundImage: `url("${invitation.heroBgUrl}")` } : undefined}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>{texts.heroSubtitle || 'Lễ Thành Hôn'}</p>
            <h1 ref={heading} tabIndex={-1} className={styles.heroNames}>{invitation.groom?.replace(/ /g, '\u00A0')}<span>&</span>{invitation.bride?.replace(/ /g, '\u00A0')}</h1>
            {validDate && <p className={styles.heroDate}>{formatDate(date).replaceAll('/', ' \u2022 ')}</p>}
            {validDate && <Countdown date={date} />}
            <p className={styles.heroLocation}>{selectedEvent.venue || selectedEvent.name}</p>
            <a className={styles.heroCta} href="#invite">Cùng chung vui <InteractiveIcon defaultIcon={ArrowDown} hoverIcon={ArrowDown} size={16} style={{ marginLeft: 8 }} /></a>
          </div>
          <span className={styles.heroCaption}>HÀNH TRÌNH MỚI, CÙNG NHAU</span>
        </section>

        <FadeInSection id="invite">
          <p className={styles.eyebrow}>NGÀY VUI CỦA CHÚNG MÌNH</p>
          <h2 className={styles.sectionTitle}>{texts.inviteTitle || 'Trân Trọng Kính Mời'}</h2>
          {guestName && <p className={styles.guestName}>{guestName}</p>}
          <p className={styles.intro}>{texts.inviteGreeting || 'Tới dự bữa tiệc chung vui cùng gia đình chúng tôi'}</p>
          {(invitation.groomBio || invitation.brideBio || invitation.groomAvatarUrl || invitation.brideAvatarUrl) && (
            <div className={styles.coupleProfiles}>
              <div>
                {invitation.groomAvatarUrl && <img src={invitation.groomAvatarUrl} alt={invitation.groom} loading="lazy" />}
                <strong>{invitation.groom}</strong>
                <p>{invitation.groomBio}</p>
              </div>
              <span className={styles.coupleDivider} aria-hidden="true">&</span>
              <div>
                {invitation.brideAvatarUrl && <img src={invitation.brideAvatarUrl} alt={invitation.bride} loading="lazy" />}
                <strong>{invitation.bride}</strong>
                <p>{invitation.brideBio}</p>
              </div>
            </div>
          )}
          <div className={styles.parentsGrid}>
            <div>{groomDeco}<h3>{texts.groomParentsTitle || 'Nhà Trai'}</h3>{invitation.groomParents?.map((name, index) => <p key={index}>{name}</p>)}<small>{invitation.groomAddress?.replace(/ ([^ ]+)$/, '\u00A0$1')}</small></div>
            <div>{brideDeco}<h3>{texts.brideParentsTitle || 'Nhà Gái'}</h3>{invitation.brideParents?.map((name, index) => <p key={index}>{name}</p>)}<small>{invitation.brideAddress?.replace(/ ([^ ]+)$/, '\u00A0$1')}</small></div>
          </div>
          <div className={styles.eventPicker} role="group" aria-label="Chọn tiệc cưới">{events.map(event => <button key={event.id} className={event.id === selectedEvent.id ? styles.primaryButton : styles.secondaryButton} aria-pressed={event.id === selectedEvent.id} onClick={() => { setActiveTabId(event.id); if (!rsvpSelectionEdited.current) setForm(previous => ({ ...previous, eventIds: [event.id] })); if (hasReply) setStatus('idle'); }}>{event.name}</button>)}</div>
          
          {selectedEvent.subEvents ? (
            <>
              <div className={styles.subEventsGrid}>
                {selectedEvent.subEvents.map(sub => {
                  const subDate = weddingDate(sub.date);
                  const subValidDate = Number.isFinite(subDate.getTime());
                  const subDirections = sub.mapUrl && /^https?:\/\//.test(sub.mapUrl) && !sub.mapUrl.includes('/embed') ? sub.mapUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sub.address || sub.venue || '')}`;
                  return (
                    <div key={sub.id} className={styles.eventCard} style={{ marginTop: 0, height: '100%' }}>
                      <p className={styles.eyebrow}>{sub.name}</p>
                      {subValidDate && <><p className={styles.eventTime}>{formatTime(subDate)}</p><time dateTime={subDate.toISOString()} className={styles.eventDate}>{formatDate(subDate)}</time></>}
                      {!subValidDate && <p className={styles.muted}>Thời gian sẽ được thông báo</p>}{sub.lunarDate && <p className={styles.muted}>Tức ngày {sub.lunarDate}</p>}
                      <h3>{texts.locationPrefix || 'Tại'} {noOrphan(sub.venue)}</h3><p>{noOrphan(sub.address)}</p>
                      <div className={styles.actions}>{(sub.address || sub.mapUrl) && <a className={styles.secondaryButton} href={subDirections} target="_blank" rel="noreferrer"><InteractiveIcon defaultIcon={MapPin} hoverIcon={Navigation} size={16} style={{ marginRight: 6 }} /> Chỉ đường</a>}</div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.actions} style={{ justifyContent: 'center', marginTop: '24px' }}><a className={styles.primaryButton} href="#rsvp">Xác nhận tham dự</a></div>
            </>
          ) : (
            <div className={styles.eventCard}>
              <p className={styles.eyebrow}>HẸN GẶP BẠN VÀO</p>
              {validDate && <><p className={styles.eventTime}>{formatTime(date)}</p><time dateTime={date.toISOString()} className={styles.eventDate}>{formatDate(date)}</time></>}
              {!validDate && <p className={styles.muted}>Thời gian sẽ được thông báo</p>}{selectedEvent.lunarDate && <p className={styles.muted}>Tức ngày {selectedEvent.lunarDate}</p>}
              <h3>{texts.locationPrefix || 'Tại'} {noOrphan(selectedEvent.venue || selectedEvent.name)}</h3><p>{noOrphan(selectedEvent.address) || 'Địa chỉ sẽ được thông báo'}</p>
              <div className={styles.actions}><a className={styles.primaryButton} href="#rsvp">Xác nhận tham dự</a>{validDate && <a className={styles.secondaryButton} href={calendarUrl()} target="_blank" rel="noreferrer">Lưu lịch</a>}{(selectedEvent.address || selectedEvent.mapUrl) && <a className={styles.secondaryButton} href={directions} target="_blank" rel="noreferrer"><InteractiveIcon defaultIcon={MapPin} hoverIcon={Navigation} size={16} style={{ marginRight: 6 }} /> Chỉ đường</a>}</div>
            </div>
          )}

          {schedule.length > 0 && <div className={styles.itinerary}><h3 className={styles.subheading}>{texts.itineraryTitle || 'Lịch Trình'}</h3><ol className={styles.schedule}>{schedule.map((item, index) => <li key={item.id || index}><span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span><strong>{item.time}</strong><span>{item.event || item.label}</span></li>)}</ol></div>}
          {embed && <div className={styles.mapContainer}><iframe title="Bản đồ địa điểm tổ chức lễ cưới" src={embed} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}
        </FadeInSection>

        {stories.length > 0 && <FadeInSection id="story" className={styles.storySection}><p className={styles.eyebrow}>TỪ MỘT LẦN GẶP GỠ</p><h2 className={styles.sectionTitle}>{texts.storyTitle || 'Chuyện Tình Yêu'}</h2><div className={styles.stories}>{stories.map((story, index) => <article key={story.id || index} className={styles.storyCard}>{story.imageUrl && <img src={story.imageUrl} alt={story.title} loading="lazy" decoding="async" />}<div><p className={styles.eyebrow}>{story.date}</p><h3>{story.title}</h3><p>{story.content}</p></div></article>)}</div></FadeInSection>}

        {albums.length > 0 && <FadeInSection id="gallery"><p className={styles.eyebrow}>NHỮNG ĐIỀU MUỐN GIỮ MÃI</p><h2 className={styles.sectionTitle}>{texts.galleryTitle || 'Khoảnh Khắc'}</h2><p className={styles.intro}>Chạm vào ảnh để ngắm trọn vẹn.</p>
          <div className={styles.galleryContainer}>
            <button className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`} onClick={() => scrollGallery('left')} aria-label="Cuộn trái">
              <InteractiveIcon defaultIcon={ArrowLeft} size={24} />
            </button>
            <div className={styles.horizontalScroll} ref={scrollRef}>
              {albums.map((url, index) => (
                <button key={index} className={styles.scrollItem} aria-label={`Phóng to ảnh cưới ${index + 1}`} onClick={() => setZoom(url)}>
                  <img src={url} alt={`Ảnh cưới ${index + 1}`} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
            <button className={`${styles.scrollBtn} ${styles.scrollBtnRight}`} onClick={() => scrollGallery('right')} aria-label="Cuộn phải">
              <InteractiveIcon defaultIcon={ArrowRight} size={24} />
            </button>
          </div>
        </FadeInSection>}

        <FadeInSection id="rsvp" className={styles.rsvpSection}><div className={styles.rsvpHeading}><p className={styles.eyebrow}>MỘT LỜI HẸN, MỘT NIỀM VUI</p><h2 className={styles.sectionTitle}>{texts.rsvpTitle || 'Xác Nhận Tham Dự'}</h2><p>Sự hiện diện của bạn là món quà ý nghĩa nhất với chúng mình. Hãy để lại lời nhắn để chúng mình đón tiếp bạn chu đáo nhé.</p><span className={styles.rsvpFlower} aria-hidden="true">✿</span></div>
          <div className={styles.rsvpForm}>{status === 'success' ? <div ref={success} tabIndex={-1} role="status" className={styles.success}><MorphIcon icon={Heart} size={24} style={{ display: 'block', margin: '0 auto 12px', color: '#79603d' }} /><h3>Cảm ơn {form.name}!</h3><p>{form.attending === 'yes' ? 'Chúng mình đã nhận được xác nhận tham dự. Hẹn gặp bạn trong ngày vui!' : 'Chúng mình đã nhận được phản hồi. Cảm ơn bạn đã dành tình cảm cho chúng mình!'}</p><p className={styles.muted}>{replyEvents || 'Chưa chọn tiệc'}{form.attending === 'yes' ? ` · ${form.count} người` : ' · Không tham dự'}</p><div className={styles.actions}><button className={styles.primaryButton} onClick={() => setStatus('idle')}>Sửa xác nhận</button><a className={styles.secondaryButton} href="#guestbook">Xem sổ lưu bút</a></div></div> : <form onSubmit={submit} aria-busy={status === 'submitting'}>{hasReply && <p className={styles.muted}>Bạn đang sửa phản hồi đã gửi. Bấm lưu để cập nhật.</p>}{!replyReady && <p role="status">{replyError || 'Đang tải thông tin xác nhận…'}</p>}{!replyReady && replyError && <button type="button" className={styles.secondaryButton} onClick={() => setRetryLoad(value => value + 1)}>Thử tải lại</button>}<fieldset disabled={!replyReady || status === 'submitting'} className={styles.formFields}><div className={styles.formGroup}><label htmlFor="guest-name">Tên của bạn <span aria-hidden="true">*</span></label><input id="guest-name" name="name" autoComplete="name" required maxLength={120} pattern=".*\S.*" title="Vui lòng nhập tên của bạn" value={form.name} onChange={update} placeholder="Nhập tên của bạn" /></div><div className={styles.formGroup}><label htmlFor="attendance">Bạn sẽ tham dự chứ?</label><select id="attendance" name="attending" value={form.attending} onChange={update}><option value="yes">Mình sẽ đến chung vui</option><option value="no">Tiếc quá, mình không thể tham dự</option></select></div><div className={styles.formGroup}><label>Bạn sẽ tới chung vui tại</label><div className={styles.checkboxGroup}>{events.map(event => <label key={event.id} className={styles.checkboxLabel}><input type="checkbox" checked={form.eventIds.includes(event.id)} onChange={e => { const checked = e.target.checked; rsvpSelectionEdited.current = true; setForm(prev => { const current = new Set(prev.eventIds.filter(Boolean)); if (checked) current.add(event.id); else current.delete(event.id); return { ...prev, eventIds: Array.from(current) }; }); }} />{event.name}</label>)}</div></div>{form.attending === 'yes' && <div className={styles.formGroup}><label htmlFor="guest-count">Tổng số người tham dự</label><input id="guest-count" name="count" type="number" inputMode="numeric" min="1" max="10" required value={form.count} onChange={update} aria-describedby="count-hint" /><small id="count-hint">Tính cả bạn và người đi cùng (1–10 người).</small></div>}<div className={styles.formGroup}><label htmlFor="wish">Lời chúc gửi chúng mình <span className={styles.optional}>(không bắt buộc)</span></label><textarea id="wish" name="message" maxLength={2000} rows={4} value={form.message} onChange={update} placeholder="Gửi gắm một chút yêu thương…" aria-describedby="wish-hint" /><small id="wish-hint">Lời chúc và tên của bạn sẽ xuất hiện trong sổ lưu bút.</small></div><button className={styles.primaryButton} disabled={status === 'submitting'} type="submit">{status === 'submitting' ? 'Đang gửi phản hồi…' : (hasReply ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>Lưu thay đổi <InteractiveIcon defaultIcon={Send} isActive={status === 'submitting'} activeIcon={Loader2} size={16} /></span> : <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>Gửi phản hồi <InteractiveIcon defaultIcon={Send} isActive={status === 'submitting'} activeIcon={Loader2} size={16} /></span>)}</button></fieldset>{status === 'error' && <p className={styles.error} role="alert">{replyError || 'Chưa gửi được phản hồi. Thông tin của bạn vẫn được giữ lại, vui lòng thử lại.'}</p>}</form>}</div>
        </FadeInSection>

        <FadeInSection id="guestbook"><p className={styles.eyebrow}>YÊU THƯƠNG ĐƯỢC VIẾT THÀNH LỜI</p><h2 className={styles.sectionTitle}>{texts.guestbookTitle || 'Sổ Lưu Bút'} <span className={styles.guestbookEmoji}>🍀💚</span></h2>{invitation.guestbookPhotoUrl && <img className={styles.guestbookPhoto} src={invitation.guestbookPhotoUrl} alt="Kỷ niệm của chúng mình" loading="lazy" />}<div className={styles.wishes}>{wishes.length ? wishes.map((wish, index) => <blockquote key={wish.id || index}><p>“{wish.message}”</p><cite>— {wish.name}</cite></blockquote>) : <p className={styles.intro}>Hãy là người đầu tiên gửi lời chúc cho chúng mình nhé.</p>}</div><a className={styles.secondaryButton} href="#rsvp">Gửi một lời chúc</a></FadeInSection>

        {invitation.qrCodeUrl && <FadeInSection className={styles.giftSection}>
          <h2 className={styles.sectionTitle}>GỬI QUÀ MỪNG</h2>
          {!giftOpened ? (
            <div className={styles.giftBoxesWrapper} onClick={() => setGiftOpened(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setGiftOpened(true)}>
              <div className={styles.boxesContainer}>
                <div className={`${styles.floatingBox} ${styles.boxLeft}`}>
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="15" y="45" width="70" height="50" rx="4" fill="#C99B4E"/>
                    <rect x="10" y="32" width="80" height="15" rx="3" fill="#E0B363"/>
                    <rect x="15" y="47" width="70" height="4" fill="#A87E38"/>
                    <rect x="42" y="32" width="16" height="63" fill="#FFF8EB"/>
                    <rect x="42" y="47" width="16" height="4" fill="#EADCC2"/>
                    <path d="M 50 33 C 25 5, 5 25, 45 33 Z" fill="#FFF8EB"/>
                    <path d="M 45 33 C 20 10, 10 25, 45 33 Z" fill="#EADCC2" opacity="0.6"/>
                    <path d="M 50 33 C 75 5, 95 25, 55 33 Z" fill="#FFF8EB"/>
                    <path d="M 55 33 C 80 10, 90 25, 55 33 Z" fill="#EADCC2" opacity="0.6"/>
                    <circle cx="50" cy="31" r="6" fill="#F4EADB"/>
                  </svg>
                </div>
                <div className={`${styles.floatingBox} ${styles.boxCenter}`}>
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="15" y="45" width="70" height="50" rx="4" fill="#D3A758"/>
                    <rect x="10" y="32" width="80" height="15" rx="3" fill="#EBC274"/>
                    <rect x="15" y="47" width="70" height="4" fill="#B38944"/>
                    <rect x="42" y="32" width="16" height="63" fill="#FFF8EB"/>
                    <rect x="42" y="47" width="16" height="4" fill="#EADCC2"/>
                    <path d="M 50 33 C 25 5, 5 25, 45 33 Z" fill="#FFF8EB"/>
                    <path d="M 45 33 C 20 10, 10 25, 45 33 Z" fill="#EADCC2" opacity="0.6"/>
                    <path d="M 50 33 C 75 5, 95 25, 55 33 Z" fill="#FFF8EB"/>
                    <path d="M 55 33 C 80 10, 90 25, 55 33 Z" fill="#EADCC2" opacity="0.6"/>
                    <circle cx="50" cy="31" r="6" fill="#F4EADB"/>
                  </svg>
                </div>
                <div className={`${styles.floatingBox} ${styles.boxRight}`}>
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="15" y="45" width="70" height="50" rx="4" fill="#B88A3F"/>
                    <rect x="10" y="32" width="80" height="15" rx="3" fill="#CDA150"/>
                    <rect x="15" y="47" width="70" height="4" fill="#946C2D"/>
                    <rect x="42" y="32" width="16" height="63" fill="#FFF8EB"/>
                    <rect x="42" y="47" width="16" height="4" fill="#EADCC2"/>
                    <path d="M 50 33 C 25 5, 5 25, 45 33 Z" fill="#FFF8EB"/>
                    <path d="M 45 33 C 20 10, 10 25, 45 33 Z" fill="#EADCC2" opacity="0.6"/>
                    <path d="M 50 33 C 75 5, 95 25, 55 33 Z" fill="#FFF8EB"/>
                    <path d="M 55 33 C 80 10, 90 25, 55 33 Z" fill="#EADCC2" opacity="0.6"/>
                    <circle cx="50" cy="31" r="6" fill="#F4EADB"/>
                  </svg>
                </div>
              </div>
              <p className={styles.giftHint}>Chạm vào hộp quà để mở</p>
            </div>
          ) : (
            <div className={styles.qrReveal}>
              <p className={styles.intro} style={{ marginBottom: '16px' }}>Quét QR để gửi yêu thương trực tiếp tới cô dâu và chú rể</p>
              <img className={styles.giftQr} src={invitation.qrCodeUrl} alt="Mã QR mừng cưới do cô dâu chú rể cung cấp" loading="lazy" />
            </div>
          )}
        </FadeInSection>}
        <footer className={styles.footer}><span className={styles.eyebrow}>CẢM ƠN VÌ LÀ MỘT PHẦN NGÀY VUI</span><p className={styles.footerNames}>{invitation.groom?.replace(/ /g, '\u00A0')}<span>&</span>{invitation.bride?.replace(/ /g, '\u00A0')}</p><button className={styles.secondaryButton} onClick={copyLink}><InteractiveIcon defaultIcon={Copy} isActive={!!copyStatus} activeIcon={Check} size={16} style={{ marginRight: 6 }} /> Sao chép đường dẫn thiệp</button><p className={styles.copyStatus} role="status">{copyStatus}</p><a href="#hero" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>Về đầu trang <InteractiveIcon defaultIcon={ArrowUp} hoverIcon={ArrowUp} size={16} /></a></footer>
      </main>
    </div>
    {zoom && <PhotoDialog src={zoom} onClose={() => setZoom(null)} />}
    <div className={`${styles.mascot} ${styles.mascotRight}`} aria-label="Linh vật chó">
      <Mascot
        directions="/mascots/pug-directions.webp"
        reactions="/mascots/pug-reactions.webp"
        size={100}
      />
    </div>
    <div className={`${styles.mascot} ${styles.mascotLeft}`} aria-label="Linh vật mèo">
      <Mascot
        directions="/mascots/cat-directions.webp"
        reactions="/mascots/cat-reactions.webp"
        size={100}
      />
    </div>
  </div>;
}
