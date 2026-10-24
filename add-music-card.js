const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

const targetCard = `<div className={styles.card}>
              <EventEditor events={data.events} onChange={events => setData(prev => ({ ...prev, events }))} />
            </div>`;

const newCard = `<div className={styles.card}>
              <h2 className={styles.cardTitle}>Danh Sách Nhạc (Playlist)</h2>
              <button className={styles.buttonSecondary} style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px'}} onClick={() => setData(prev => ({ ...prev, invitation: { ...prev.invitation, musicTracks: [...(prev.invitation.musicTracks || []), { name: '', url: '' }] } }))}><Icon icon={Plus} size={16} /> Thêm Bài Hát</button>
              {(data.invitation.musicTracks || []).map((track, i) => (
                <div key={i} style={{ padding: '16px', border: '1px solid #eaeaea', borderRadius: '8px', marginBottom: '16px', background: '#fafafa' }}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}><label className={styles.label}>Tên Bài Hát</label><input className={styles.input} value={track.name || ''} onChange={e => setData(prev => { const newTracks = [...(prev.invitation.musicTracks || [])]; newTracks[i] = { ...newTracks[i], name: e.target.value }; return { ...prev, invitation: { ...prev.invitation, musicTracks: newTracks } }; })} placeholder="VD: Beautiful In White" /></div>
                    <div className={styles.formGroup}><label className={styles.label}>Link File Nhạc (MP3)</label><input className={styles.input} value={track.url || ''} onChange={e => setData(prev => { const newTracks = [...(prev.invitation.musicTracks || [])]; newTracks[i] = { ...newTracks[i], url: e.target.value }; return { ...prev, invitation: { ...prev.invitation, musicTracks: newTracks } }; })} placeholder="VD: /music/song.mp3 hoặc https://..." /></div>
                  </div>
                  <button className={\`\${styles.buttonSecondary} \${styles.buttonDanger}\`} style={{marginTop: '12px'}} onClick={() => setData(prev => { const newTracks = prev.invitation.musicTracks.filter((_, idx) => idx !== i); return { ...prev, invitation: { ...prev.invitation, musicTracks: newTracks } }; })}>Xóa bài hát</button>
                </div>
              ))}
            </div>

            <div className={styles.card}>
              <EventEditor events={data.events} onChange={events => setData(prev => ({ ...prev, events }))} />
            </div>`;

if (c.includes(targetCard)) {
    c = c.replace(targetCard, newCard);
    fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
    console.log("Added music card");
} else {
    console.log("Target not found");
}
