const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

const target = `<div className={styles.actions}><button className={styles.primaryButton} onClick={() => setStatus('idle')}>Sửa xác nhận</button><a className={styles.secondaryButton} href="#guestbook">Xem sổ lưu bút</a></div>`;

const replacement = `<div className={styles.actions}>
{invitation.qrCodeUrl && <a className={form.attending === 'no' ? styles.primaryButton : styles.secondaryButton} href="#gift" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><InteractiveIcon defaultIcon={Heart} size={16} /> Gửi quà mừng</a>}
<button className={form.attending === 'yes' ? styles.primaryButton : styles.secondaryButton} onClick={() => setStatus('idle')}>Sửa xác nhận</button>
<a className={styles.secondaryButton} href="#guestbook">Xem sổ lưu bút</a>
</div>`;

// Wait, InteractiveIcon isn't imported with Heart, wait, Heart is imported. 
// "Heart" is used: `<MorphIcon icon={Heart} .../>`. 
// I'll just use a plain text or <MorphIcon> to avoid errors.

const safeReplacement = `<div className={styles.actions}>{invitation.qrCodeUrl && <a className={form.attending === 'no' ? styles.primaryButton : styles.secondaryButton} href="#gift">Gửi quà mừng</a>}<button className={form.attending === 'yes' ? styles.primaryButton : styles.secondaryButton} onClick={() => setStatus('idle')}>Sửa xác nhận</button><a className={styles.secondaryButton} href="#guestbook">Xem sổ lưu bút</a></div>`;

if (c.includes(target)) {
  c = c.replace(target, safeReplacement);
  fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
  console.log('Replaced actions');
} else {
  console.log('Could not find actions block');
}
