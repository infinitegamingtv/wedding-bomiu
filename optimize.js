const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

// Insert import Image from 'next/image' at the top if not exists
if (!c.includes('import Image from \'next/image\'')) {
  c = c.replace('import { MorphIcon', 'import Image from \'next/image\';\nimport { MorphIcon');
}

// 1. Audio optimization: remove autoPlay, change preload to metadata, change initial state
c = c.replace(/const \[playing, setPlaying\] = useState\(true\);/g, 'const [playing, setPlaying] = useState(false);');
c = c.replace(/<audio ref=\{audio\} autoPlay src=\{trackUrl\} preload="auto"/g, '<audio ref={audio} src={trackUrl} preload="metadata"');

// 2. Image optimizations
// Envelope logo
c = c.replace(/<img className=\{styles\.cardLogo\} src=\{invitation\.logoUrl\} alt="" \/>/g, '<Image className={styles.cardLogo} src={invitation.logoUrl} alt="Logo" width={600} height={400} priority />');

// Hero logo
c = c.replace(/<img src=\{invitation\.logoUrl\} alt="" className=\{styles\.heroLogo\} \/>/g, '<Image src={invitation.logoUrl} alt="Logo" className={styles.heroLogo} width={600} height={400} priority />');

// Stories
c = c.replace(/<img src=\{story\.imageUrl\} alt=\{story\.title\} loading="lazy" decoding="async" \/>/g, '<Image src={story.imageUrl} alt={story.title} width={600} height={450} loading="lazy" />');

// Guestbook
c = c.replace(/<img className=\{styles\.guestbookPhoto\} src=\{invitation\.guestbookPhotoUrl\} alt="([^"]+)" loading="lazy" \/>/g, '<Image className={styles.guestbookPhoto} src={invitation.guestbookPhotoUrl} alt="$1" width={800} height={600} loading="lazy" />');

// Gallery
c = c.replace(/<img src=\{url\} alt=\{([^}]+)\} loading="lazy" decoding="async" \/>/g, '<Image src={url} alt={$1} width={400} height={533} sizes="(max-width: 768px) 75vw, 320px" loading="lazy" />');

// QR Codes
c = c.replace(/<img src=\{invitation\.qrCodeUrl\} alt="Mã QR" className=\{styles\.qrImage\} \/>/g, '<Image src={invitation.qrCodeUrl} alt="Mã QR" className={styles.qrImage} width={400} height={400} loading="lazy" />');
c = c.replace(/<img src=\{invitation\.qrCodeUrl2\} alt="Mã QR 2" className=\{styles\.qrImage\} \/>/g, '<Image src={invitation.qrCodeUrl2} alt="Mã QR 2" className={styles.qrImage} width={400} height={400} loading="lazy" />');

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Optimized InvitationUI.js');
