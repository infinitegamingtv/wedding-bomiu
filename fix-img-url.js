const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

c = c.replace(/\{ url: newImageUrl\.trim\(\) \}/g, "newImageUrl.trim()");
c = c.replace(/<img src=\{img\.url\} alt="Album"/g, "<img src={typeof img === 'string' ? img : img.url} alt=\"Album\"");

fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
