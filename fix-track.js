const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const track = data.invitation.musicTracks.find(t => t.url === '/music/NoiNayCoAnh-SonTungMTP.mp3');
if (track) {
  track.name = 'Nơi Này Có Anh - Sơn Tùng M-TP';
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('Fixed track name encoding');
}
