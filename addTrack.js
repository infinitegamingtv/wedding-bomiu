const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
data.invitation.musicTracks.push({
  name: "Yêu Em - Phuong Linh & Hà Anh Tu?n",
  url: "/music/YeuEm-PhuongLinhHaAnhTuan.mp3"
});
fs.writeFileSync('data.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Track added.');
