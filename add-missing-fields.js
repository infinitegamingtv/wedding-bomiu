const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

// Replace "Thông tin chung" card to add bio and lunarDate
const oldGeneralInfo = `<div className={styles.formGroup}><label className={styles.label}>Tên Chú Rể (Rút gọn)</label><input className={styles.input} value={data.invitation.groomShort || ''} onChange={e => handleInputChange(e, 'groomShort')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tên Cô Dâu (Rút gọn)</label><input className={styles.input} value={data.invitation.brideShort || ''} onChange={e => handleInputChange(e, 'brideShort')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Ngày cưới (Tùy chỉnh)</label><input className={styles.input} value={data.invitation.dateString || ''} onChange={e => handleInputChange(e, 'dateString')} /></div>
              </div>`;
const newGeneralInfo = `<div className={styles.formGroup}><label className={styles.label}>Tên Chú Rể (Rút gọn)</label><input className={styles.input} value={data.invitation.groomShort || ''} onChange={e => handleInputChange(e, 'groomShort')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tên Cô Dâu (Rút gọn)</label><input className={styles.input} value={data.invitation.brideShort || ''} onChange={e => handleInputChange(e, 'brideShort')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Ngày cưới (Tùy chỉnh)</label><input className={styles.input} value={data.invitation.dateString || ''} onChange={e => handleInputChange(e, 'dateString')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Ngày Âm Lịch</label><input className={styles.input} value={data.invitation.lunarDate || ''} onChange={e => handleInputChange(e, 'lunarDate')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Mô tả Chú rể (Bio)</label><input className={styles.input} value={data.invitation.groomBio || ''} onChange={e => handleInputChange(e, 'groomBio')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Mô tả Cô dâu (Bio)</label><input className={styles.input} value={data.invitation.brideBio || ''} onChange={e => handleInputChange(e, 'brideBio')} /></div>
              </div>`;

c = c.replace(oldGeneralInfo, newGeneralInfo);

// Insert "Thông tin Gia đình" and "Thông tin Ngân hàng" before EventEditor card
const targetInsert = `<div className={styles.card}>
              <EventEditor events={data.events} onChange={events => setData(prev => ({ ...prev, events }))} />
            </div>`;

const newCards = `<div className={styles.card}>
              <h2 className={styles.cardTitle}>Thông tin Gia đình</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Bố mẹ Chú rể (cách nhau bởi dấu phẩy)</label><input className={styles.input} value={(data.invitation.groomParents || []).join(', ')} onChange={e => setData(prev => ({...prev, invitation: {...prev.invitation, groomParents: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}}))} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Địa chỉ Nhà Trai</label><input className={styles.input} value={data.invitation.groomAddress || ''} onChange={e => handleInputChange(e, 'groomAddress')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Bố mẹ Cô dâu (cách nhau bởi dấu phẩy)</label><input className={styles.input} value={(data.invitation.brideParents || []).join(', ')} onChange={e => setData(prev => ({...prev, invitation: {...prev.invitation, brideParents: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}}))} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Địa chỉ Nhà Gái</label><input className={styles.input} value={data.invitation.brideAddress || ''} onChange={e => handleInputChange(e, 'brideAddress')} /></div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Thông tin Ngân hàng (Mừng cưới)</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Tên Ngân Hàng</label><input className={styles.input} value={data.invitation.bankName || ''} onChange={e => handleInputChange(e, 'bankName')} placeholder="VD: Vietcombank" /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tên Chủ Tài Khoản</label><input className={styles.input} value={data.invitation.accountName || ''} onChange={e => handleInputChange(e, 'accountName')} placeholder="VD: NGUYEN VAN A" /></div>
                <div className={styles.formGroup}><label className={styles.label}>Số Tài Khoản</label><input className={styles.input} value={data.invitation.accountNumber || ''} onChange={e => handleInputChange(e, 'accountNumber')} placeholder="VD: 123456789" /></div>
              </div>
            </div>

            <div className={styles.card}>
              <EventEditor events={data.events} onChange={events => setData(prev => ({ ...prev, events }))} />
            </div>`;

c = c.replace(targetInsert, newCards);

fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
console.log('Added all missing fields');
