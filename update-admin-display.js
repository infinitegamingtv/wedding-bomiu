const fs = require('fs');
let c = fs.readFileSync('src/components/GuestDashboard.js', 'utf8');

const target = `<td>{row.location}</td>`;
const replacement = `<td>{row.location ? row.location.split(' + ').map((loc, i) => <span key={i} style={{display: 'inline-block', margin: '2px', padding: '2px 8px', background: '#f5f0e6', borderRadius: '12px', fontSize: '0.85em', color: '#59472d', border: '1px solid #e1d8c3', whiteSpace: 'nowrap'}}>{loc}</span>) : <span style={{color: '#999'}}>Chưa chọn</span>}</td>`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync('src/components/GuestDashboard.js', c, 'utf8');
  console.log('Updated GuestDashboard');
} else {
  console.log('Could not find target string in GuestDashboard');
}

