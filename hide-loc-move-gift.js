const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

const oldLoc = `<div className={styles.formGroup}><label>Bạn sẽ tới chung vui tại</label><div className={styles.checkboxGroup}>{events.map(event => <label key={event.id} className={styles.checkboxLabel}><input type="checkbox" checked={form.eventIds.includes(event.id)} onChange={e => { const checked = e.target.checked; rsvpSelectionEdited.current = true; setForm(prev => { const current = new Set(prev.eventIds.filter(Boolean)); if (checked) current.add(event.id); else current.delete(event.id); return { ...prev, eventIds: Array.from(current) }; }); }} />{event.name}</label>)}</div></div>`;
const newLoc = `{form.attending === 'yes' && <div className={styles.formGroup}><label>Bạn sẽ tới chung vui tại</label><div className={styles.checkboxGroup}>{events.map(event => <label key={event.id} className={styles.checkboxLabel}><input type="checkbox" checked={form.eventIds.includes(event.id)} onChange={e => { const checked = e.target.checked; rsvpSelectionEdited.current = true; setForm(prev => { const current = new Set(prev.eventIds.filter(Boolean)); if (checked) current.add(event.id); else current.delete(event.id); return { ...prev, eventIds: Array.from(current) }; }); }} />{event.name}</label>)}</div></div>}`;

if (c.includes(oldLoc)) {
    c = c.replace(oldLoc, newLoc);
    console.log("Replaced location picker");
} else {
    console.log("Could not find location picker block");
}

const giftSectionRegex = /(\{invitation\.qrCodeUrl && <FadeInSection className=\{styles\.giftSection\}>[\s\S]*?<\/FadeInSection>\})/;
const match = c.match(giftSectionRegex);
if (match) {
    const giftSectionContent = match[1];
    const modifiedGiftSection = giftSectionContent.replace('<FadeInSection className={styles.giftSection}>', '<FadeInSection id="gift" className={styles.giftSection}>');
    c = c.replace(match[0], '');
    const guestbookRegex = /<FadeInSection id="guestbook">/;
    c = c.replace(guestbookRegex, `${modifiedGiftSection}\n\n        <FadeInSection id="guestbook">`);
    console.log("Moved gift section");
} else {
    console.log("Could not find gift section");
}

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
