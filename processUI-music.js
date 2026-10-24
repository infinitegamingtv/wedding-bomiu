const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

// 1. Update imports
c = c.replace('import { Music, Pause, ', 'import { Music, Pause, SkipBack, SkipForward, ');

// 2. Setup random initial track
c = c.replace(/const \[track, setTrack\] = useState\(0\);/, `const [track, setTrack] = useState(0);\n    useEffect(() => {\n      if (tracksCount > 1) setTrack(Math.floor(Math.random() * tracksCount));\n    }, [tracksCount]);`);

// 3. Replace music control block completely
// Find the exact string from previous get-content
const oldBlock = `      {tracks.length > 0 && <div className={styles.musicControl}>
        <button onClick={() => setPlaying(value => !value)} aria-pressed={playing} aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}><MorphIcon icon={playing ? Pause : Music} size={16} /> {playing ? 'Tắt nhạc' : 'Bật nhạc'}</button>
        {tracks.length > 1 && <select aria-label="Chọn nhạc" value={track} onChange={e => { setTrack(Number(e.target.value)); setPlaying(true); }}>{tracks.map((item, index) => <option key={index} value={index}>{item.name || \`Bài \${index + 1}\`}</option>)}</select>}
      </div>}`;

const newBlock = `      {tracks.length > 0 && <div className={styles.musicControl}>
        <div className={styles.musicControlButtons}>
          {tracks.length > 1 && <button onClick={() => { setTrack(index => (index + 1 + Math.floor(Math.random() * (tracksCount - 1))) % tracksCount); setPlaying(true); }} aria-label="Bài trước"><SkipBack size={16} /></button>}
          <button onClick={() => setPlaying(value => !value)} aria-pressed={playing} aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}><MorphIcon icon={playing ? Pause : Music} size={16} /></button>
          {tracks.length > 1 && <button onClick={() => { setTrack(index => (index + 1 + Math.floor(Math.random() * (tracksCount - 1))) % tracksCount); setPlaying(true); }} aria-label="Bài tiếp"><SkipForward size={16} /></button>}
        </div>
        {tracks[track]?.name && <div className={styles.musicTitleWrapper}>{tracks[track].name}</div>}
      </div>}`;

if (c.includes(oldBlock)) {
  c = c.replace(oldBlock, newBlock);
} else {
  // Try regex if exact string mismatch
  const regex = /\{tracks\.length > 0 && <div className=\{styles\.musicControl\}>[\s\S]*?<\/div>\}/;
  c = c.replace(regex, newBlock);
}

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Processed UI changes');
