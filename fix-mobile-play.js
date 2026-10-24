const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

const target = `    useEffect(() => {
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
    }, [playing]);`;

if (c.includes(target)) {
  c = c.replace(target, '');
  fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
  console.log('Removed handleInteraction');
} else {
  console.log('Could not find target string, trying regex...');
  const regex = /useEffect\(\(\) => \{\s*const handleInteraction = \(\) => \{[\s\S]*?\}, \[playing\]\);/;
  if (regex.test(c)) {
    c = c.replace(regex, '');
    fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
    console.log('Removed handleInteraction via regex');
  } else {
    console.log('Failed completely');
  }
}
