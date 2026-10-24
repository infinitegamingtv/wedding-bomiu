const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

const musicCardRegex = /<div className=\{styles\.card\}>\s*<h2 className=\{styles\.cardTitle\}>Danh Sách Nhạc \(Playlist\)<\/h2>[\s\S]*?Xóa bài hát<\/button>\s*<\/div>\s*\)\)\}\s*<\/div>\s*/g;

const match = c.match(musicCardRegex);
if (match) {
    const musicCard = match[0];
    c = c.replace(musicCard, '');
    
    const parts = c.split("{activeTab === 'gallery' && (");
    if (parts.length === 2) {
        let firstPart = parts[0];
        // We need to insert musicCard right before the `</div>\n          )}\n\n`
        const closeTag = '</div>\n          )}\n\n        ';
        if (firstPart.endsWith(closeTag)) {
             firstPart = firstPart.slice(0, -closeTag.length) + '\n' + musicCard + closeTag;
             c = firstPart + "{activeTab === 'gallery' && (" + parts[1];
             fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
             console.log("Moved successfully.");
        } else {
             console.log("Could not find exact close tag.");
             console.log(firstPart.slice(-50));
        }
    } else {
        console.log("Split failed.");
    }
} else {
    console.log("Music card not found.");
}
