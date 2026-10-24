const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

c = c.replace(/useEffect\(\(\) => \{\s*\/\/\s*eslint-disable-next-line react-hooks\/set-state-in-effect\s*if \(tracksCount > 1\) setTrack\(Math\.floor\(Math\.random\(\) \* tracksCount\)\);\s*\}, \[tracksCount\]\);/, '');

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
