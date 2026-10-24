const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

// Task 1: Change hero subtitle logic
// The old logic:
// heroSubtitle: 'Lễ Nạp Tài',
c = c.replace(/heroSubtitle: 'Lễ Nạp Tài',/g, "heroSubtitle: 'Tiệc Cưới Nhà Gái',");

// Task 2: Sub-events Lưu lịch
// We need to insert subCalendarUrl definition inside subEvents map
const subCalendarUrlCode = `
                    let subCalendarUrl = '#';
                    if (subValidDate) {
                      const stamp = value => value.toISOString().replace(/[-:]|\\.\\d{3}/g, '');
                      const end = new Date(subDate.getTime() + 4 * 3600000);
                      subCalendarUrl = \`https://calendar.google.com/calendar/render?action=TEMPLATE&text=\${encodeURIComponent(sub.name)} - \${encodeURIComponent(invitation.groom)} & \${encodeURIComponent(invitation.bride)}&dates=\${stamp(subDate)}/\${stamp(end)}&details=\${encodeURIComponent(texts.inviteGreeting || 'Trân trọng kính mời')}&location=\${encodeURIComponent(sub.address || sub.venue || '')}\`;
                    }
                    const subEmbed = mapEmbed(sub.mapUrl);
`;
c = c.replace(/const subEmbed = mapEmbed\(sub\.mapUrl\);/g, subCalendarUrlCode);

// Then insert the "Lưu lịch" button in the .actions div for subEvents
c = c.replace(/<div className=\{styles\.actions\}>\{\(sub\.address \|\| sub\.mapUrl\) && <a className=\{styles\.secondaryButton\} href=\{subDirections\} target="_blank" rel="noreferrer"><InteractiveIcon defaultIcon=\{MapPin\} hoverIcon=\{Navigation\} size=\{16\} style=\{\{ marginRight: 6 \}\} \/> Chỉ đường<\/a>\}<\/div>/g, 
  `<div className={styles.actions}>{subValidDate && <a className={styles.secondaryButton} href={subCalendarUrl} target="_blank" rel="noreferrer">Lưu lịch</a>}{(sub.address || sub.mapUrl) && <a className={styles.secondaryButton} href={subDirections} target="_blank" rel="noreferrer"><InteractiveIcon defaultIcon={MapPin} hoverIcon={Navigation} size={16} style={{ marginRight: 6 }} /> Chỉ đường</a>}</div>`
);

// Task 3: Compact Music Player
const oldMusicControl = `      {tracks.length > 0 && <div className={styles.musicControl}>
        <button onClick={() => setPlaying(value => !value)} aria-pressed={playing} aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}><MorphIcon icon={playing ? Pause : Music} size={16} /> {playing ? 'Tắt nhạc' : 'Bật nhạc'}</button>
        {tracks.length > 1 && <select aria-label="Chọn nhạc" value={track} onChange={e => { setTrack(Number(e.target.value)); setPlaying(true); }}>{tracks.map((item, index) => <option key={index} value={index}>{item.name || \`Bài \${index + 1}\`}</option>)}</select>}
      </div>}`;

const newMusicControl = `      {tracks.length > 0 && <div className={styles.musicControl}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => setPlaying(value => !value)} aria-pressed={playing} aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}><MorphIcon icon={playing ? Pause : Music} size={16} /></button>
          {tracks.length > 1 && <button onClick={() => setShowMusicList(!showMusicList)} aria-label="Danh sách nhạc"><Music size={16} /> Nhạc</button>}
        </div>
        {showMusicList && tracks.length > 1 && (
          <div className={styles.musicDropdown}>
            {tracks.map((item, index) => <button key={index} className={track === index ? styles.activeTrack : ''} onClick={() => { setTrack(index); setPlaying(true); setShowMusicList(false); }}>{item.name || \`Bài \${index + 1}\`}</button>)}
          </div>
        )}
      </div>}`;

c = c.replace(oldMusicControl, newMusicControl);

// Also need to add showMusicList to state
c = c.replace(/const \[playing, setPlaying\] = useState\(false\);/, `const [playing, setPlaying] = useState(false);\n  const [showMusicList, setShowMusicList] = useState(false);`);

// Task 4: Move Event Picker
const oldPicker = `<div className={styles.eventPicker} role="group" aria-label="Chọn tiệc cưới">{events.map(event => <button key={event.id} className={event.id === selectedEvent.id ? styles.primaryButton : styles.secondaryButton} aria-pressed={event.id === selectedEvent.id} onClick={() => { setActiveTabId(event.id); if (!rsvpSelectionEdited.current) setForm(previous => ({ ...previous, eventIds: [event.id] })); if (hasReply) setStatus('idle'); }}>{event.name}</button>)}</div>`;
c = c.replace(oldPicker, ''); // Remove it from below parentsGrid

const newPicker = `
        <div className={styles.eventPickerContainer}>
          <h2 className={styles.pickerTitle}>Bạn sẽ chung vui cùng chúng mình tại đâu?</h2>
          <div className={styles.eventPicker} role="group" aria-label="Chọn tiệc cưới">
            {events.map(event => {
              const mainDate = weddingDate(event.date);
              const subDate = event.subEvents?.[0] ? weddingDate(event.subEvents[0].date) : null;
              const dateToShow = Number.isFinite(mainDate.getTime()) ? mainDate : (Number.isFinite(subDate?.getTime()) ? subDate : null);
              return (
                <button key={event.id} className={event.id === selectedEvent.id ? styles.primaryButton : styles.secondaryButton} aria-pressed={event.id === selectedEvent.id} onClick={() => { setActiveTabId(event.id); if (!rsvpSelectionEdited.current) setForm(previous => ({ ...previous, eventIds: [event.id] })); if (hasReply) setStatus('idle'); }}>
                  <strong>{event.name}</strong>
                  {dateToShow && <small>{formatDate(dateToShow)}</small>}
                </button>
              );
            })}
          </div>
        </div>
`;

// Insert it right under <section id="invite"> ... <div className={styles.container}>
c = c.replace(/(<section id="invite"[^>]*>\s*<div className=\{styles\.container\}>)/, `$1${newPicker}`);

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Processed UI changes');
