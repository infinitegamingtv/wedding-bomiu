const fs = require('fs');

let content = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

// Replace date and time formatters with robust, universal formatters
const oldDateMarker = "const formatDate = date => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });";
const oldTimeMarker = "const formatTime = date => date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });";

const newFormatters = `const formatDate = date => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const vnTime = new Date(date.getTime() + (7 * 60 + date.getTimezoneOffset()) * 60000);
  const d = String(vnTime.getDate()).padStart(2, '0');
  const m = String(vnTime.getMonth() + 1).padStart(2, '0');
  const y = vnTime.getFullYear();
  return \`\${d}/\${m}/\${y}\`;
};
const formatTime = date => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const vnTime = new Date(date.getTime() + (7 * 60 + date.getTimezoneOffset()) * 60000);
  const h = String(vnTime.getHours()).padStart(2, '0');
  const min = String(vnTime.getMinutes()).padStart(2, '0');
  return \`\${h}:\${min}\`;
};`;

if (content.includes(oldDateMarker)) {
  content = content.replace(oldDateMarker + '\r\n' + oldTimeMarker, newFormatters);
  if (content.includes(oldDateMarker)) {
    content = content.replace(oldDateMarker + '\n' + oldTimeMarker, newFormatters);
  }
  console.log('formatDate & formatTime replaced successfully');
} else {
  console.log('Markers not found');
}

// Update audio preload to 'none'
if (content.includes('preload="metadata"')) {
  content = content.replace('preload="metadata"', 'preload="none"');
  console.log('Audio preload changed to none');
}

fs.writeFileSync('src/components/InvitationUI.js', content, 'utf8');
console.log('InvitationUI.js saved.');
