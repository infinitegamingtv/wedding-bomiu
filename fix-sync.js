const fs = require('fs');
let c = fs.readFileSync('sync.js', 'utf8');
c = c.replace('https://wedding-bomiu.vercel.app', 'https://damcuoibomiu.vercel.app');
fs.writeFileSync('sync.js', c, 'utf8');
