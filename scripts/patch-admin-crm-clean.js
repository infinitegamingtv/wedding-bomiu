const fs = require('fs');

let content = fs.readFileSync('src/app/admin/page.js', 'utf8');

// 1. Update addBulkGuests to support group
const oldAddBulk = /const addBulkGuests = \(\) => \{[\s\S]*?setBulkGuestNames\(''\);\s*\};/;
const newAddBulk = `const addBulkGuests = () => {
    const names = bulkGuestNames.split('\\n').map(n => n.trim()).filter(Boolean);
    if (!names.length) return;
    const newLinks = names.map(name => {
      const id = crypto.randomUUID();
      return { id, slug: id.slice(0, 8), guestName: name, group: bulkGroup || 'Bạn bè', eventId: bulkEventId || data.events[0]?.id || '', isInvited: true };
    });
    setData(prev => ({ ...prev, links: [...(prev.links || []), ...newLinks] }));
    setBulkGuestNames('');
  };`;

content = content.replace(oldAddBulk, newAddBulk);

// 2. Update Bulk Form
const oldForm = `<div className={styles.formGrid} style={{gridTemplateColumns: '2fr 1fr 1fr'}}>
                <textarea className={styles.textarea} placeholder="Nhập tên khách (mỗi người 1 dòng)..." value={bulkGuestNames} onChange={e => setBulkGuestNames(e.target.value)} style={{minHeight: '44px', height: '44px'}} />
                <select className={styles.select} value={bulkEventId} onChange={e => setBulkEventId(e.target.value)}>
                  <option value="">-- Mặc định (Tất cả tiệc) --</option>
                  {data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <button className={styles.buttonPrimary} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}} onClick={addBulkGuests}><Icon icon={Plus} size={16} /> Tạo link</button>
              </div>`;

const newForm = `<div className={styles.formGrid} style={{gridTemplateColumns: '2fr 1fr 1fr 1fr'}}>
                <textarea className={styles.textarea} placeholder="Nhập tên khách (mỗi người 1 dòng)..." value={bulkGuestNames} onChange={e => setBulkGuestNames(e.target.value)} style={{minHeight: '44px', height: '44px'}} />
                <select className={styles.select} value={bulkGroup} onChange={e => setBulkGroup(e.target.value)}>
                  <option value="Bạn bè">Nhóm: Bạn bè</option>
                  <option value="Đồng nghiệp">Nhóm: Đồng nghiệp</option>
                  <option value="Họ hàng Nhà Trai">Nhóm: Họ hàng Nhà Trai</option>
                  <option value="Họ hàng Nhà Gái">Nhóm: Họ hàng Nhà Gái</option>
                  <option value="Khách VIP">Nhóm: Khách VIP</option>
                  <option value="Khác">Nhóm: Khác</option>
                </select>
                <select className={styles.select} value={bulkEventId} onChange={e => setBulkEventId(e.target.value)}>
                  <option value="">-- Mặc định (Tất cả tiệc) --</option>
                  {data.events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <button className={styles.buttonPrimary} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}} onClick={addBulkGuests}><Icon icon={Plus} size={16} /> Tạo link</button>
              </div>`;

content = content.replace(oldForm, newForm);

// 3. Update actions column in table
const oldActions = `<div style={{display: 'flex', gap: '8px'}}>
                            {row.id && <button title="Xóa phản hồi" className={\`\${styles.buttonSecondary} \${styles.buttonDanger}\`} style={{padding: '6px 10px'}} onClick={() => deleteRsvp(row.id)}><Icon icon={Trash2} size={14} /></button>}
                            {row.guestId && <button title="Xóa Link" className={\`\${styles.buttonSecondary} \${styles.buttonDanger}\`} style={{padding: '6px 10px'}} onClick={() => removeGuestLink(row.guestId)}><Icon icon={Trash2} size={14} /></button>}
                          </div>`;

const newActions = `<div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
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

content = content.replace(oldActions, newActions);

fs.writeFileSync('src/app/admin/page.js', content, 'utf8');
console.log('Admin CRM features patched!');
