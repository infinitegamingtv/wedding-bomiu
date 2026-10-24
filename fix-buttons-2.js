const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

c = c.replace(/setPlaying\(true\);\s*\}\}/g, `setPlaying(true); showTitleBriefly(); }}`);

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
