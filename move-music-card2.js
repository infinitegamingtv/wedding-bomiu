const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

const musicCardRegex = /<div className=\{styles\.card\}>\s*<h2 className=\{styles\.cardTitle\}>Danh Sách Nhạc \(Playlist\)<\/h2>[\s\S]*?Xóa bài hát<\/button>\s*<\/div>\s*\)\)\}\s*<\/div>\s*/g;

const match = c.match(musicCardRegex);
if (match) {
    const musicCard = match[0];
    c = c.replace(musicCard, '');
    
    // Replace at the end of content tab
    const anchor = '          )}\n\n        {activeTab === \'gallery\' && (';
    if (c.includes(anchor)) {
        c = c.replace(anchor, '            ' + musicCard.trim() + '\n          </div>\n        )}\n\n        {activeTab === \'gallery\' && (');
        // wait, we need to be careful with the div closing.
        // The original anchor is:
        //             </div>
        //           )}
        //
        //           {activeTab === 'gallery' && (
    }
}

fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
