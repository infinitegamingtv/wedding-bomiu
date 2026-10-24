const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

const targetCard = `<div className={styles.card}>
              <h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản</h2>`;

const newCard = `<div className={styles.card}>
              <h2 className={styles.cardTitle}>Ảnh chính & Nhận diện</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Link ảnh Logo</label><input className={styles.input} value={data.invitation.logoUrl || ''} onChange={e => handleInputChange(e, 'logoUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Link ảnh nền chính (Hero Background)</label><input className={styles.input} value={data.invitation.heroBgUrl || ''} onChange={e => handleInputChange(e, 'heroBgUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Link ảnh QR Mừng cưới</label><input className={styles.input} value={data.invitation.qrCodeUrl || ''} onChange={e => handleInputChange(e, 'qrCodeUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Link ảnh kỉ niệm (Cạnh sổ lưu bút)</label><input className={styles.input} value={data.invitation.guestbookPhotoUrl || ''} onChange={e => handleInputChange(e, 'guestbookPhotoUrl')} placeholder="VD: https://..." /></div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản</h2>`;

if (c.includes('<h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản</h2>')) {
    // We need to replace safely.
    const searchTarget = '<div className={styles.card}>\n              <h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản</h2>';
    if (c.includes(searchTarget)) {
       c = c.replace(searchTarget, newCard);
    } else {
       // fallback
       c = c.replace('<h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản</h2>', newCard.replace('<div className={styles.card}>\n              <h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản</h2>', '<h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản</h2>'));
    }
    fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
    console.log("Added images card");
} else {
    console.log("Target not found");
}
