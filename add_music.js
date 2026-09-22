const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\dangq\\OneDrive\\Desktop\\files (online-audio-converter.com) (4)';
const destDir = path.join(__dirname, 'public', 'music');
const dataPath = path.join(__dirname, 'data.json');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.mp3'));
let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

if (!data.invitation.musicTracks) {
  data.invitation.musicTracks = [];
}

files.forEach(file => {
  const originalName = path.parse(file).name;
  
  // Sluggify for filename
  let slug = originalName.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const destFile = slug + '.mp3';
  
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, destFile));
  
  // Check if it already exists to avoid duplicates
  if (!data.invitation.musicTracks.find(t => t.url === '/music/' + destFile)) {
    data.invitation.musicTracks.push({
      name: originalName,
      url: '/music/' + destFile
    });
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Added ' + files.length + ' tracks.');
