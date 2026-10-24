const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

c = c.replace(/setPlaying\(true\);\s*\}\}\s*aria-label="Bi tr>c"/g, `setPlaying(true); showTitleBriefly(); }} aria-label="Bài trước"`);
c = c.replace(/setPlaying\(true\);\s*\}\}\s*aria-label="Bi tip"/g, `setPlaying(true); showTitleBriefly(); }} aria-label="Bài tiếp"`);
c = c.replace(/onClick=\{\(\) => setPlaying\(value => !value\)\}/g, `onClick={() => { setPlaying(value => !value); showTitleBriefly(); }}`);
c = c.replace(/className=\{styles\.musicTitleWrapper\}/g, "className={`${styles.musicTitleWrapper} ${showMusicTitle ? styles.showTitle : ''}`}");

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Fixed buttons');
