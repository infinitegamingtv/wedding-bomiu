const fs = require('fs');

let content = fs.readFileSync('src/app/admin/page.js', 'utf8');

// 1. Add guestModal state
const targetState = "  const [filterStatus, setFilterStatus] = useState('all');";
const newState = `  const [filterStatus, setFilterStatus] = useState('all');
  const [guestModal, setGuestModal] = useState(null);`;

if (content.includes(targetState)) {
  content = content.replace(targetState, newState);
  console.log('1. guestModal state added');
} else {
  console.error('Target state line not found');
}

// 2. Replace the stats cards and events cards in Overview (tab === 'dashboard')
const oldDashboardRegex = /\{activeTab === 'dashboard' && \([\s\S]*?\)\s*\}\s*\{activeTab === 'crm'/;

const newDashboardBlock = `{activeTab === 'dashboard' && (
          <div>
            <div className={styles.header}>
              <h1 className={styles.pageTitle}>Tổng quan</h1>
            </div>
            <div className={styles.statsGrid}>
              <div 
                className={\`\${styles.statCard} \${styles.highlight} \${styles.clickableCard}\`}
                onClick={() => {
                  const list = allRows.filter(r => r.attending === 'yes');
                  setGuestModal({
                    title: 'Khách xác nhận Tham dự',
                    subtitle: \`Tổng cộng \${totalAttending} người (\${list.length} phản hồi)\`,
                    list
                  });
                }}
                title="Bấm để xem danh sách khách tham dự"
              >
                <h3>{totalAttending}</h3>
                <p>Khách tham dự</p>
                <span className={styles.cardHint}>👉 Bấm để xem chi tiết tên khách</span>
              </div>

              <div 
                className={\`\${styles.statCard} \${styles.clickableCard}\`}
                onClick={() => {
                  const list = allRows.filter(r => r.attending === 'pending');
                  setGuestModal({
                    title: 'Khách Đang chờ phản hồi',
                    subtitle: \`Tổng cộng \${totalPending} khách chưa gửi phản hồi\`,
                    list
                  });
                }}
                title="Bấm để xem danh sách khách chờ phản hồi"
              >
                <h3>{totalPending}</h3>
                <p>Đang chờ phản hồi</p>
                <span className={styles.cardHint}>👉 Bấm để xem chi tiết tên khách</span>
              </div>

              <div 
                className={\`\${styles.statCard} \${styles.clickableCard}\`}
                onClick={() => {
                  const list = allRows.filter(r => r.attending === 'no');
                  setGuestModal({
                    title: 'Khách Báo vắng',
                    subtitle: \`Tổng cộng \${totalDeclined} khách không thể tham dự\`,
                    list
                  });
                }}
                title="Bấm để xem danh sách khách báo vắng"
              >
                <h3>{totalDeclined}</h3>
                <p>Báo vắng</p>
                <span className={styles.cardHint}>👉 Bấm để xem chi tiết tên khách</span>
              </div>
            </div>
            
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span>Thống kê theo tiệc</span>
                <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'normal' }}>Bấm vào từng tiệc để xem tên khách</span>
              </h2>
              <div className={styles.statsGrid} style={{marginBottom: 0}}>
                {data.events.map(event => {
                  const attendingRows = allRows.filter(r => r.attending === 'yes' && r.eventIds && r.eventIds.includes(event.id));
                  const pendingRows = allRows.filter(r => r.attending === 'pending' && r.eventIds && r.eventIds.includes(event.id));
                  const evtAttending = attendingRows.reduce((s, r) => s + Number(r.count || 0), 0);
                  const evtPending = pendingRows.length;
                  return (
                    <div 
                      key={event.id} 
                      className={\`\${styles.statCard} \${styles.clickableCard}\`} 
                      style={{padding: '18px'}}
                      onClick={() => {
                        setGuestModal({
                          title: \`Khách tham dự: \${event.name}\`,
                          subtitle: \`Tổng cộng \${evtAttending} người tham dự (\${attendingRows.length} lượt phản hồi)\`,
                          list: attendingRows
                        });
                      }}
                      title="Bấm để xem danh sách khách dự tiệc này"
                    >
                      <h4 style={{margin: '0 0 10px 0', fontSize: '1.15rem', color: '#222'}}>{event.name}</h4>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem'}}>
                        <span style={{color: '#555'}}>Tham dự:</span> 
                        <strong style={{color: '#C5A880', fontSize: '1.1rem'}}>{evtAttending} người</strong>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.9rem'}}>
                        <span>Chờ phản hồi:</span> 
                        <strong>{evtPending}</strong>
                      </div>
                      <span className={styles.cardHint} style={{marginTop: '10px'}}>👉 Xem danh sách khách</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Phản hồi mới nhất</h2>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead><tr><th>Khách mời</th><th>Tiệc</th><th>Trạng thái</th><th>Lời chúc</th></tr></thead>
                  <tbody>
                    {(data.rsvps || []).slice(-5).reverse().map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.location || 'Chưa rõ'}</td>
                        <td><span className={\`\${styles.badge} \${r.attending === 'yes' ? styles.success : styles.danger}\`}>{r.attending === 'yes' ? 'Tham dự' : 'Không đi'}</span></td>
                        <td><small>{r.message}</small></td>
                      </tr>
                    ))}
                    {!(data.rsvps?.length) && <tr><td colSpan="4" style={{textAlign: 'center', color: '#999'}}>Chưa có phản hồi nào</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* POPUP MODAL HIỂN THỊ CHI TIẾT TÊN KHÁCH & SỐ LƯỢNG */}
        {guestModal && (
          <div className={styles.modalBackdrop} onClick={() => setGuestModal(null)}>
            <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>{guestModal.title}</h3>
                  <p className={styles.modalSubtitle}>{guestModal.subtitle}</p>
                </div>
                <button className={styles.modalCloseBtn} onClick={() => setGuestModal(null)} aria-label="Đóng popup">✕</button>
              </div>
              <div className={styles.modalBody}>
                {guestModal.list.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', padding: '30px 0' }}>Chưa có khách nào trong danh sách này.</p>
                ) : (
                  <div>
                    {guestModal.list.map((guest, idx) => (
                      <div key={guest.id || idx} className={styles.guestItem}>
                        <div>
                          <div className={styles.guestName}>{guest.name}</div>
                          <div className={styles.guestMeta}>
                            {guest.location && <span>Tiệc: {guest.location} • </span>}
                            {guest.message ? <span>Lời chúc: "{guest.message}"</span> : <span>Chưa có lời chúc</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {guest.attending === 'yes' && (
                            <span className={\`\${styles.badge} \${styles.success}\`}>
                              Đi {guest.count || 1} người
                            </span>
                          )}
                          {guest.attending === 'pending' && (
                            <span className={\`\${styles.badge} \${styles.warning}\`}>
                              Chờ phản hồi
                            </span>
                          )}
                          {guest.attending === 'no' && (
                            <span className={\`\${styles.badge} \${styles.danger}\`}>
                              Báo bận
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crm'`;

if (oldDashboardRegex.test(content)) {
  content = content.replace(oldDashboardRegex, newDashboardBlock);
  console.log('2. Dashboard tab replaced with interactive clickable cards and modal');
} else {
  console.error('Could not match old dashboard regex');
}

fs.writeFileSync('src/app/admin/page.js', content, 'utf8');
console.log('Done patching admin page.js');
