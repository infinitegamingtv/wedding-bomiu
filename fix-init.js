const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

// Find the problematic block
const regex = /const \[track, setTrack\] = useState\(0\);\s*useEffect\(\(\) => \{\s*if \(tracksCount > 1\) setTrack\(Math\.floor\(Math\.random\(\) \* tracksCount\)\);\s*\}, \[tracksCount\]\);\s*const tracksCount = invitation\.musicTracks\?\.length \|\| \(invitation\.musicUrl \? 1 : 0\);/m;

if (regex.test(c)) {
  c = c.replace(regex, `const [track, setTrack] = useState(0);\n    const tracksCount = invitation.musicTracks?.length || (invitation.musicUrl ? 1 : 0);\n    useEffect(() => {\n      if (tracksCount > 1) setTrack(Math.floor(Math.random() * tracksCount));\n    }, [tracksCount]);`);
} else {
  console.log("Could not find exact block to fix, attempting alternative replace...");
  c = c.replace(/const \[track, setTrack\] = useState\(0\);[\s\S]*?const tracksCount = [^;]+;/m, (match) => {
    return `const [track, setTrack] = useState(0);\n    const tracksCount = invitation.musicTracks?.length || (invitation.musicUrl ? 1 : 0);\n    useEffect(() => {\n      if (tracksCount > 1) setTrack(Math.floor(Math.random() * tracksCount));\n    }, [tracksCount]);`;
  });
}

// Remove any duplicate useEffects that were mistakenly added
const dupRegex = /useEffect\(\(\) => \{\s*\/\/\s*eslint-disable-next-line[^}]+\}\s*if \(tracksCount > 1\) setTrack[^}]+}, \[tracksCount\]\);/g;
c = c.replace(dupRegex, '');

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Fixed initialization order');
