const fs = require('fs');

let content = fs.readFileSync('src/app/admin/page.js', 'utf8');

// 1. Update crmRows filter
const oldFilter = `  const allRows = guestRows(data);
  const crmRows = allRows.filter(r => 
    (filterEvent === 'all' || (r.eventIds && r.eventIds.includes(filterEvent))) && 
    (filterStatus === 'all' || r.attending === filterStatus) && 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );`;

const newFilter = `  const allRows = guestRows(data);
  const crmRows = allRows.filter(r => 
    (filterEvent === 'all' || (r.eventIds && r.eventIds.includes(filterEvent))) && 
    (filterStatus === 'all' || r.attending === filterStatus) && 
    (filterSent === 'all' || (filterSent === 'sent' ? r.sent : !r.sent)) &&
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );`;

content = content.replace(/\r\n/g, '\n');
const normalizedOldFilter = oldFilter.replace(/\r\n/g, '\n');
const normalizedNewFilter = newFilter.replace(/\r\n/g, '\n');

if (content.includes(normalizedOldFilter)) {
  content = content.replace(normalizedOldFilter, normalizedNewFilter);
  console.log('1. crmRows filter updated with filterSent');
} else {
  console.log('1. crmRows filter already updated or not found');
}

// 2. Update table header to add "Đã gửi?"
const oldTh = `                      <th>Khách mời</th>
                      <th>Link Gửi Khách</th>`;

const newTh = `                      <th>Khách mời</th>
                      <th style={{textAlign: 'center'}}>Đã gửi link?</th>
                      <th>Link Gửi Khách</th>`;

const normOldTh = oldTh.replace(/\r\n/g, '\n');
const normNewTh = newTh.replace(/\r\n/g, '\n');

if (content.includes(normOldTh)) {
  content = content.replace(normOldTh, normNewTh);
  console.log('2. th header updated');
} else {
  console.log('2. th header not found');
}

// 3. Update table body row to add sent toggle checkbox
const oldRowCol = `                        <td>
                          {row.guestId ? (
                            <div className={styles.linkBox}>`;

const newRowCol = `                        <td style={{textAlign: 'center'}}>
                          {row.guestId ? (
                            <label className={\`\${styles.sentToggle} \${row.sent ? styles.sentTrue : styles.sentFalse}\`} title="Bấm để tick đã gửi hoặc chưa gửi">
                              <input 
                                type="checkbox" 
                                checked={!!row.sent} 
                                onChange={() => toggleGuestSent(row.guestId)} 
                              />
                              <span>{row.sent ? 'Đã gửi' : 'Chưa gửi'}</span>
                            </label>
                          ) : (
                            <span style={{color: '#bbb', fontSize: '0.8rem'}}>—</span>
                          )}
                        </td>
                        <td>
                          {row.guestId ? (
                            <div className={styles.linkBox}>`;

const normOldRowCol = oldRowCol.replace(/\r\n/g, '\n');
const normNewRowCol = newRowCol.replace(/\r\n/g, '\n');

if (content.includes(normOldRowCol)) {
  content = content.replace(normOldRowCol, normNewRowCol);
  console.log('3. row column updated with checkbox');
} else {
  console.log('3. row column not found');
}

fs.writeFileSync('src/app/admin/page.js', content, 'utf8');
console.log('File src/app/admin/page.js updated successfully!');
