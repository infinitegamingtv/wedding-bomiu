const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

c = c.replace(/loading="lazy"/g, 'loading="eager"');

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
