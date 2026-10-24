const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

// The field to move
const qrField = `<div className={styles.formGroup}><label className={styles.label}>Link ảnh QR Mừng cưới</label><input className={styles.input} value={data.invitation.qrCodeUrl || ''} onChange={e => handleInputChange(e, 'qrCodeUrl')} placeholder="VD: https://..." /></div>`;

// 1. Remove from its current location
if (c.includes(qrField)) {
    c = c.replace(qrField + '\n                  ', '');
    
    // 2. Insert into the Bank card
    const targetBankEnd = `<div className={styles.formGroup}><label className={styles.label}>Số Tài Khoản</label><input className={styles.input} value={data.invitation.accountNumber || ''} onChange={e => handleInputChange(e, 'accountNumber')} placeholder="VD: 123456789" /></div>
                </div>
              </div>`;
              
    const newBankEnd = `<div className={styles.formGroup}><label className={styles.label}>Số Tài Khoản</label><input className={styles.input} value={data.invitation.accountNumber || ''} onChange={e => handleInputChange(e, 'accountNumber')} placeholder="VD: 123456789" /></div>
                  ${qrField}
                </div>
              </div>`;
              
    if (c.includes(targetBankEnd)) {
        c = c.replace(targetBankEnd, newBankEnd);
        fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
        console.log("Moved QR code field to Bank section successfully.");
    } else {
        console.log("Could not find the target Bank section.");
    }
} else {
    console.log("Could not find the QR field to remove.");
}
