const fs = require('fs');

let content = fs.readFileSync('src/app/admin/page.js', 'utf8');

// 1. Add filterSent state
const oldStates = "const [filterStatus, setFilterStatus] = useState('all');";
const newStates = `const [filterStatus, setFilterStatus] = useState('all');
  const [filterSent, setFilterSent] = useState('all');`;

if (content.includes(oldStates)) {
  content = content.replace(oldStates, newStates);
  console.log('1. Added filterSent state');
}

// 2. Add toggleGuestSent function
const oldRemoveLink = "const removeGuestLink = (id) => setData(prev => ({ ...prev, links: prev.links.filter(g => g.id !== id) }));";
const newRemoveLink = `const removeGuestLink = (id) => setData(prev => ({ ...prev, links: prev.links.filter(g => g.id !== id) }));
  const toggleGuestSent = (guestId) => {
    setData(prev => ({
      ...prev,
      links: (prev.links || []).map(link => link.id === guestId ? { ...link, sent: !link.sent } : link)
    }));
  };`;

if (content.includes(oldRemoveLink)) {
  content = content.replace(oldRemoveLink, newRemoveLink);
  console.log('2. Added toggleGuestSent handler');
}

// 3. Update crmRows filter to respect filterSent
const oldCrmRows = `  const crmRows = allRows.filter(r => 
    (filterEvent === 'all' || (r.eventIds && r.eventIds.includes(filterEvent))) && 
    (filterStatus === 'all' || r.attending === filterStatus) && 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );`;

const newCrmRows = `  const crmRows = allRows.filter(r => 
    (filterEvent === 'all' || (r.eventIds && r.eventIds.includes(filterEvent))) && 
    (filterStatus === 'all' || r.attending === filterStatus) && 
    (filterSent === 'all' || (filterSent === 'sent' ? r.sent : !r.sent)) &&
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );`;

if (content.includes(oldCrmRows)) {
  content = content.replace(oldCrmRows, newCrmRows);
  console.log('3. Updated crmRows with filterSent');
}

// 4. Update Filter bar to include filterSent dropdown
const oldFilterBar = `<select className={styles.select} style={{width: '150px'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">Mọi trạng thái</option><option value="pending">Chờ phản hồi</option><option value="yes">Tham dự</option><option value="no">Không đi</option></select>`;
const newFilterBar = `<select className={styles.select} style={{width: '150px'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="all">Mọi trạng thái</option><option value="pending">Chờ phản hồi</option><option value="yes">Tham dự</option><option value="no">Không đi</option></select>
                <select className={styles.select} style={{width: '150px'}} value={filterSent} onChange={e => setFilterSent(e.target.value)}><option value="all">Tất cả gửi thiệp</option><option value="sent">Đã gửi link</option><option value="unsent">Chưa gửi link</option></select>`;

if (content.includes(oldFilterBar)) {
  content = content.replace(oldFilterBar, newFilterBar);
  console.log('4. Added filterSent dropdown');
}

// 5. Update table headers
const oldTh = `                      <th>Khách mời</th>
                      <th>Link Gửi Khách</th>`;
const newTh = `                      <th>Khách mời</th>
                      <th>Đã gửi?</th>
                      <th>Link Gửi Khách</th>`;

if (content.includes(oldTh)) {
  content = content.replace(oldTh, newTh);
  console.log('5. Added Đã gửi? header');
}

// 6. Update table row to include checkbox column
const oldLinkBoxCol = `                        <td>
                          {row.guestId ? (
                            <div className={styles.linkBox}>`;

const newLinkBoxCol = `                        <td style={{textAlign: 'center'}}>
                          {row.guestId ? (
                            <label className={\`\${styles.sentToggle} \${row.sent ? styles.sentTrue : styles.sentFalse}\`} title="Bấm để đánh dấu đã gửi hoặc chưa gửi">
                              <input 
                                type="checkbox" 
                                checked={!!row.sent} 
                                onChange={() => toggleGuestSent(row.guestId)} 
                              />
                              <span>{row.sent ? 'Đã gửi' : 'Chưa gửi'}</span>
                            </label>
                          ) : (
                            <span style={{color: '#aaa', fontSize: '0.8rem'}}>—</span>
                          )}
                        </td>
                        <td>
                          {row.guestId ? (
                            <div className={styles.linkBox}>`;

if (content.includes(oldLinkBoxCol)) {
  content = content.replace(oldLinkBoxCol, newLinkBoxCol);
  console.log('6. Added Sent toggle checkbox column in table rows');
}

// 7. Update colSpan in empty row
if (content.includes('colSpan="5"')) {
  content = content.replace('colSpan="5"', 'colSpan="6"');
  console.log('7. Updated empty colSpan to 6');
}

fs.writeFileSync('src/app/admin/page.js', content, 'utf8');
console.log('Admin page.js updated with guest link sent checkboxes!');
