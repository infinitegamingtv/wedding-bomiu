const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

c = c.replace(/<SkipBack size=\{16\} \/>/g, '<MorphIcon icon={SkipBack} size={16} />');
c = c.replace(/<SkipForward size=\{16\} \/>/g, '<MorphIcon icon={SkipForward} size={16} />');

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
