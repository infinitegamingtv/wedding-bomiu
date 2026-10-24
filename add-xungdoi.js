const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
data.invitation.musicTracks.push({
  name: 'Xứng Đôi Cưới Thôi - Lê Thiện Hiếu',
  url: '/music/XungDoiCuoiThoi-LeThienHieu.mp3'
});
fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Added Xứng Đôi Cưới Thôi to data.json');
