const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

const musicCardRegex = /<div className=\{styles\.card\}>\s*<h2 className=\{styles\.cardTitle\}>Danh Sách Nhạc \(Playlist\)<\/h2>[\s\S]*?Xóa bài hát<\/button>\s*<\/div>\s*\)\)\}\s*<\/div>\s*/;
const match = c.match(musicCardRegex);

if (match) {
    const musicCard = match[0];
    c = c.replace(musicCard, '');
    
    const parts = c.split("{activeTab === 'gallery' && (");
    if (parts.length === 2) {
        // We know parts[0] ends with the content block closing tags.
        // It ends roughly like:
        //               </div>
        //             </div>
        //           )}
        //   
        //         
        // We can just find the last indexOf "}" which corresponds to `)}` of the activeTab === 'content' block.
        
        const lastParenIndex = parts[0].lastIndexOf(")}");
        if (lastParenIndex !== -1) {
             const before = parts[0].substring(0, lastParenIndex);
             const after = parts[0].substring(lastParenIndex); // ")}\n\n        "
             // actually we want it INSIDE the content block, so before the "</div>\n          )}\n"
             // Let's just insert it before the LAST `</div>` before `)}`
             const lastDivIndex = before.lastIndexOf("</div>");
             if (lastDivIndex !== -1) {
                 const newBefore = before.substring(0, lastDivIndex) + musicCard + before.substring(lastDivIndex);
                 c = newBefore + after + "{activeTab === 'gallery' && (" + parts[1];
                 fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
                 console.log("Moved successfully with split strategy.");
             }
        }
    }
} else {
    console.log("Could not find music card.");
}
