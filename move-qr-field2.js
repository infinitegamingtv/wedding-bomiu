const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

const qrField = `<div className={styles.formGroup}><label className={styles.label}>Link ảnh QR Mừng cưới</label><input className={styles.input} value={data.invitation.qrCodeUrl || ''} onChange={e => handleInputChange(e, 'qrCodeUrl')} placeholder="VD: https://..." /></div>`;

if (c.includes(qrField)) {
    // Remove from old spot
    c = c.replace(qrField, '');
    // clean up empty spaces left by it
    c = c.replace(/\n\s*\n\s*<div className=\{styles.formGroup\}><label className=\{styles.label\}>Link ảnh kỉ niệm/, '\n                  <div className={styles.formGroup}><label className={styles.label}>Link ảnh kỉ niệm');
    
    // Insert after "Số Tài Khoản" line
    const accountLineMatch = c.match(/<div className=\{styles\.formGroup\}><label className=\{styles\.label\}>Số Tài Khoản[\s\S]*?<\/div>/);
    if (accountLineMatch) {
         c = c.replace(accountLineMatch[0], accountLineMatch[0] + '\n                  ' + qrField);
         fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
         console.log("Moved QR code field to Bank section successfully.");
    } else {
         console.log("Could not find the account number field.");
    }
} else {
    console.log("Could not find the QR field.");
}
