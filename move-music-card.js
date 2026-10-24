const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

const regex = /<div className=\{styles\.card\}>\s*<h2 className=\{styles\.cardTitle\}>Danh Sách Nhạc \(Playlist\)<\/h2>[\s\S]*?Xóa bài hát<\/button>\s*<\/div>\s*\)\)\}\s*<\/div>/g;

const match = c.match(regex);
if (match) {
    const musicCard = match[0];
    c = c.replace(musicCard, '');
    
    // Find the end of content tab
    const endOfContentTabRegex = /<\/div>\s*\}\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*\{activeTab === 'gallery'/g;
    
    const storiesMatch = c.match(/<\/div>\s*\}\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*\{activeTab === 'gallery'/g);
    if(storiesMatch) {
       // Append musicCard after stories card
       c = c.replace(/<\/div>\s*\}\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*\{activeTab === 'gallery'/, `</div>\n\n            ${musicCard}\n          </div>\n        )}\n\n        {activeTab === 'gallery'`);
       fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
       console.log('Moved music card');
    } else {
       console.log('Could not find stories block end');
    }
} else {
    console.log("Could not find music card");
}
