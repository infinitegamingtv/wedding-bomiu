const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

// Add avatar fields to "Ảnh chính & Nhận diện" card
const targetAvatars = `<div className={styles.formGroup}><label className={styles.label}>Link ảnh kỉ niệm (Cạnh sổ lưu bút)</label><input className={styles.input} value={data.invitation.guestbookPhotoUrl || ''} onChange={e => handleInputChange(e, 'guestbookPhotoUrl')} placeholder="VD: https://..." /></div>
              </div>
            </div>`;
const newAvatars = `<div className={styles.formGroup}><label className={styles.label}>Link ảnh kỉ niệm (Cạnh sổ lưu bút)</label><input className={styles.input} value={data.invitation.guestbookPhotoUrl || ''} onChange={e => handleInputChange(e, 'guestbookPhotoUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Avatar Chú rể</label><input className={styles.input} value={data.invitation.groomAvatarUrl || ''} onChange={e => handleInputChange(e, 'groomAvatarUrl')} placeholder="VD: https://..." /></div>
                <div className={styles.formGroup}><label className={styles.label}>Avatar Cô dâu</label><input className={styles.input} value={data.invitation.brideAvatarUrl || ''} onChange={e => handleInputChange(e, 'brideAvatarUrl')} placeholder="VD: https://..." /></div>
              </div>
            </div>`;
c = c.replace(targetAvatars, newAvatars);

// Expand "Tùy chỉnh Văn Bản"
const targetTexts = `<h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Chữ &quot;Nhà Trai&quot;</label><input className={styles.input} value={data.texts?.groomParentsTitle || ''} onChange={e => handleTextChange(e, 'groomParentsTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Chữ &quot;Nhà Gái&quot;</label><input className={styles.input} value={data.texts?.brideParentsTitle || ''} onChange={e => handleTextChange(e, 'brideParentsTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiền tố địa điểm (VD: TẠI)</label><input className={styles.input} value={data.texts?.locationPrefix || ''} onChange={e => handleTextChange(e, 'locationPrefix')} /></div>
              </div>`;

const newTexts = `<h2 className={styles.cardTitle}>Tùy chỉnh Văn Bản (Tiêu đề các phần)</h2>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề chính (VD: Lễ Thành Hôn)</label><input className={styles.input} value={data.texts?.heroSubtitle || ''} onChange={e => handleTextChange(e, 'heroSubtitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Lời mời (VD: Trân Trọng Kính Mời)</label><input className={styles.input} value={data.texts?.inviteTitle || ''} onChange={e => handleTextChange(e, 'inviteTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Câu chào (VD: Tới dự bữa tiệc...)</label><input className={styles.input} value={data.texts?.inviteGreeting || ''} onChange={e => handleTextChange(e, 'inviteGreeting')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Chữ &quot;Nhà Trai&quot;</label><input className={styles.input} value={data.texts?.groomParentsTitle || ''} onChange={e => handleTextChange(e, 'groomParentsTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Chữ &quot;Nhà Gái&quot;</label><input className={styles.input} value={data.texts?.brideParentsTitle || ''} onChange={e => handleTextChange(e, 'brideParentsTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiền tố địa điểm (VD: TẠI)</label><input className={styles.input} value={data.texts?.locationPrefix || ''} onChange={e => handleTextChange(e, 'locationPrefix')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Lịch Trình</label><input className={styles.input} value={data.texts?.itineraryTitle || ''} onChange={e => handleTextChange(e, 'itineraryTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Chuyện Tình Yêu</label><input className={styles.input} value={data.texts?.storyTitle || ''} onChange={e => handleTextChange(e, 'storyTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Ảnh Album</label><input className={styles.input} value={data.texts?.galleryTitle || ''} onChange={e => handleTextChange(e, 'galleryTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Sổ Lưu Bút</label><input className={styles.input} value={data.texts?.guestbookTitle || ''} onChange={e => handleTextChange(e, 'guestbookTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề RSVP</label><input className={styles.input} value={data.texts?.rsvpTitle || ''} onChange={e => handleTextChange(e, 'rsvpTitle')} /></div>
                <div className={styles.formGroup}><label className={styles.label}>Tiêu đề Gửi Quà</label><input className={styles.input} value={data.texts?.giftTitle || ''} onChange={e => handleTextChange(e, 'giftTitle')} /></div>
              </div>`;

c = c.replace(targetTexts, newTexts);

fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
console.log('Added avatar and all text customization fields');
