const fs = require('fs');

let content = fs.readFileSync('src/app/admin/page.js', 'utf8');

// 1. Add MessageCircle icon import
if (content.includes("Trash2 } from 'lucide';")) {
  content = content.replace("Trash2 } from 'lucide';", "Trash2, MessageCircle } from 'lucide';");
  console.log('1. Added MessageCircle icon');
}

// 2. Add bulkGroup state
const oldBulkState = "const [bulkEventId, setBulkEventId] = useState('');";
const newBulkState = `const [bulkEventId, setBulkEventId] = useState('');
  const [bulkGroup, setBulkGroup] = useState('Bạn bè');`;

if (content.includes(oldBulkState)) {
  content = content.replace(oldBulkState, newBulkState);
  console.log('2. Added bulkGroup state');
}

// 3. Update addBulkGuests function to include group
const oldAddBulk = `    const newLinks = names.map(name => {
      const id = crypto.randomUUID();
      return { id, slug: id.slice(0, 8), guestName: name, eventId: bulkEventId || data.events[0]?.id || '', isInvited: true };
    });`;

const newAddBulk = `    const newLinks = names.map(name => {
      const id = crypto.randomUUID();
      return { id, slug: id.slice(0, 8), guestName: name, group: bulkGroup || 'Khách chung', eventId: bulkEventId || data.events[0]?.id || '', isInvited: true };
    });`;

if (content.includes(oldAddBulk)) {
  content = content.replace(oldAddBulk, newAddBulk);
  console.log('3. Updated addBulkGuests with group');
}

// 4. Update Bulk Guest Form UI to include Group selector
const oldBulkFormUI = `<div className={styles.formGrid} style={{gridTemplateColumns: '2fr 1fr 1fr'}}>
                <textarea className={styles.textarea} placeholder="Nhập tên khách (mỗi người 1 dòng)..." value={bulkGuestNames} onChange={e => setBulkGuestNames(e.target.value)} style={{minHeight: '44px', height: '44px'}} />
                <select className={styles.select} value={bulkEventId} onChange={e => setBulkEventId(e.target.value)}>
                  <option value="">-- Mặc định (Tất cả tiệc) --</option>
                  {data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <button className={styles.buttonPrimary} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}} onClick={addBulkGuests}><Icon icon={Plus} size={16} /> Tạo link</button>
              </div>`;

const newBulkFormUI = `<div className={styles.formGrid} style={{gridTemplateColumns: '2fr 1fr 1fr 1fr'}}>
                <textarea className={styles.textarea} placeholder="Nhập tên khách (mỗi người 1 dòng)..." value={bulkGuestNames} onChange={e => setBulkGuestNames(e.target.value)} style={{minHeight: '44px', height: '44px'}} />
                <select className={styles.select} value={bulkGroup} onChange={e => setBulkGroup(e.target.value)}>
                  <option value="Bạn bè">Nhóm: Bạn bè</option>
                  <option value="Đồng nghiệp">Nhóm: Đồng nghiệp</option>
                  <option value="Họ hàng Nhà Trai">Nhóm: Họ hàng Nhà Trai</option>
                  <option value="Họ hàng Nhà Gái">Nhóm: Họ hàng Nhà Gái</option>
                  <option value="Khách VIP">Nhóm: Khách VIP</option>
                  <option value="Khách chung">Nhóm: Khác</option>
                </select>
                <select className={styles.select} value={bulkEventId} onChange={e => setBulkEventId(e.target.value)}>
                  <option value="">-- Tiệc mặc định --</option>
                  {data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <button className={styles.buttonPrimary} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}} onClick={addBulkGuests}><Icon icon={Plus} size={16} /> Tạo link</button>
              </div>`;

if (content.includes(oldBulkFormUI)) {
  content = content.replace(oldBulkFormUI, newBulkFormUI);
  console.log('4. Updated Bulk Guest Form UI');
}

// 5. Update CRM table rows to show group tag and Zalo button
const oldRowRender = `                        <td><strong>{row.name}</strong> {row.legacy && <span className={\`\${styles.badge} \${styles.neutral}\`}>Tự RSVP</span>}</td>`;
const newRowRender = `                        <td>
                          <strong>{row.name}</strong> 
                          {row.group && <span className={styles.groupBadge}>{row.group}</span>}
                          {row.legacy && <span className={\`\${styles.badge} \${styles.neutral}\`}>Tự RSVP</span>}
                        </td>`;

if (content.includes(oldRowRender)) {
  content = content.replace(oldRowRender, newRowRender);
  console.log('5. Added group badge in guest name column');
}

const oldActionRender = `<div style={{display: 'flex', gap: '8px'}}>
                            {row.id && <button title="Xóa phản hồi" className={\`\${styles.buttonSecondary} \${styles.buttonDanger}\`} style={{padding: '6px 10px'}} onClick={() => deleteRsvp(row.id)}><Icon icon={Trash2} size={14} /></button>}
                            {row.guestId && <button title="Xóa Link" className={\`\${styles.buttonSecondary} \${styles.buttonDanger}\`} style={{padding: '6px 10px'}} onClick={() => removeGuestLink(row.guestId)}><Icon icon={Trash2} size={14} /></button>}
                          </div>`;

const newActionRender = `<div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                            {row.guestId && (
                              <button
                                className={styles.buttonZalo}
                                title="Mở Zalo gửi lời mời"
                                onClick={() => {
                                  const linkObj = data.links.find(l => l.id === row.guestId);
                                  const inviteUrl = \`\${typeof window !== 'undefined' ? window.location.origin : ''}/invite/\${linkObj?.slug}\`;
                                  const groom = data.invitation.groom || 'chúng mình';
                                  const bride = data.invitation.bride || '';
                                  const msg = encodeURIComponent(\`Thân gửi \${row.name}! \${groom} & \${bride} gửi thiệp cưới online mời \${row.name} tới chung vui cùng gia đình chúng mình tại: \${inviteUrl}\`);
                                  window.open(\`https://zalo.me/?text=\${msg}\`, '_blank');
                                }}
                              >
                                <Icon icon={MessageCircle} size={13} /> Zalo
                              </button>
                            )}
                            {row.id && <button title="Xóa phản hồi" className={\`\${styles.buttonSecondary} \${styles.buttonDanger}\`} style={{padding: '6px 10px'}} onClick={() => deleteRsvp(row.id)}><Icon icon={Trash2} size={14} /></button>}
                            {row.guestId && <button title="Xóa Link" className={\`\${styles.buttonSecondary} \${styles.buttonDanger}\`} style={{padding: '6px 10px'}} onClick={() => removeGuestLink(row.guestId)}><Icon icon={Trash2} size={14} /></button>}
                          </div>`;

if (content.includes(oldActionRender)) {
  content = content.replace(oldActionRender, newActionRender);
  console.log('6. Added Zalo share button in actions column');
}

fs.writeFileSync('src/app/admin/page.js', content, 'utf8');
console.log('Admin page.js updated successfully!');
