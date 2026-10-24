const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

c = c.replace(/const \[track, setTrack\] = useState\(0\);/, `const [track, setTrack] = useState(0);\n    const [showMusicTitle, setShowMusicTitle] = useState(false);\n    const titleTimeout = useRef(null);\n    const showTitleBriefly = () => { setShowMusicTitle(true); if (titleTimeout.current) clearTimeout(titleTimeout.current); titleTimeout.current = setTimeout(() => setShowMusicTitle(false), 3000); };`);

const oldMusicControlBlock = `<div className={styles.musicControlButtons}>
            {tracks.length > 1 && <button onClick={() => { setTrack(index => (index + 1 + Math.floor(Math.random() * (tracksCount - 1))) % tracksCount); setPlaying(true); }} aria-label="Bài trước"><MorphIcon icon={SkipBack} size={16} /></button>}
            <button onClick={() => setPlaying(value => !value)} aria-pressed={playing} aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}><MorphIcon icon={playing ? Pause : Music} size={16} /></button>
            {tracks.length > 1 && <button onClick={() => { setTrack(index => (index + 1 + Math.floor(Math.random() * (tracksCount - 1))) % tracksCount); setPlaying(true); }} aria-label="Bài tiếp"><MorphIcon icon={SkipForward} size={16} /></button>}
          </div>
          {tracks[track]?.name && <div className={styles.musicTitleWrapper}>{tracks[track].name}</div>}`;

const newMusicControlBlock = `<div className={styles.musicControlButtons}>
            {tracks.length > 1 && <button onClick={() => { setTrack(index => (index + 1 + Math.floor(Math.random() * (tracksCount - 1))) % tracksCount); setPlaying(true); showTitleBriefly(); }} aria-label="Bài trước"><MorphIcon icon={SkipBack} size={16} /></button>}
            <button onClick={() => { setPlaying(value => !value); showTitleBriefly(); }} aria-pressed={playing} aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}><MorphIcon icon={playing ? Pause : Music} size={16} /></button>
            {tracks.length > 1 && <button onClick={() => { setTrack(index => (index + 1 + Math.floor(Math.random() * (tracksCount - 1))) % tracksCount); setPlaying(true); showTitleBriefly(); }} aria-label="Bài tiếp"><MorphIcon icon={SkipForward} size={16} /></button>}
          </div>
          {tracks[track]?.name && <div className={\`\${styles.musicTitleWrapper} \${showMusicTitle ? styles.showTitle : ''}\`}>{tracks[track].name}</div>}`;

c = c.replace(oldMusicControlBlock, newMusicControlBlock);

// Also need to add showTitleBriefly when auto-playing the next track
c = c.replace(/onEnded=\{\(\) => setTrack\(index => tracksCount > 1 \? \(index \+ 1 \+ Math\.floor\(Math\.random\(\) \* \(tracksCount - 1\)\)\) % tracksCount : 0\)\}/, `onEnded={() => { setTrack(index => tracksCount > 1 ? (index + 1 + Math.floor(Math.random() * (tracksCount - 1))) % tracksCount : 0); showTitleBriefly(); }}`);

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Processed UI changes for music title visibility');
