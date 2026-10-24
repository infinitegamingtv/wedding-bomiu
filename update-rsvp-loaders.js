const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

// 1. Update aria-busy
c = c.replace(/aria-busy=\{status === 'submitting'\}/g, "aria-busy={!replyReady || status === 'submitting'}");

// 2. Replace the loading text and error button with Skeleton
// The original code: {!replyReady && <p role="status">{replyError || '...'}</p>}{!replyReady && replyError && <button ...>Thử tải lại</button>}
const loadTextRegex = /\{!replyReady && <p role="status">\{replyError \|\| [^}]+\}<\/p>\}\{!replyReady && replyError && <button type="button" className=\{styles\.secondaryButton\} onClick=\{[^}]+\}>[^<]+<\/button>\}/;

const skeletonHTML = `{!replyReady && !replyError ? <div className={styles.formFields} aria-hidden="true"><div className={styles.formGroup}><div className={\`\${styles.skeleton} \${styles.skeletonText}\`} style={{width: '30%', marginBottom: 12}}></div><div className={styles.skeleton} style={{height: 48, borderRadius: 8}}></div></div><div className={styles.formGroup}><div className={\`\${styles.skeleton} \${styles.skeletonText}\`} style={{width: '40%', marginBottom: 12}}></div><div className={styles.skeleton} style={{height: 48, borderRadius: 8}}></div></div><div className={styles.formGroup}><div className={\`\${styles.skeleton} \${styles.skeletonText}\`} style={{width: '50%', marginBottom: 12}}></div><div className={styles.skeleton} style={{height: 100, borderRadius: 8}}></div></div><div className={styles.skeleton} style={{height: 48, borderRadius: 24, marginTop: 16}}></div></div> : (!replyReady && replyError && <div style={{textAlign: 'center', marginBottom: 16}}><p role="status" style={{color: 'red'}}>{replyError}</p><button type="button" className={styles.secondaryButton} onClick={() => setRetryLoad(value => value + 1)}>Thử tải lại</button></div>)}`;

if (loadTextRegex.test(c)) {
    c = c.replace(loadTextRegex, skeletonHTML);
    console.log("Successfully replaced skeleton UI.");
} else {
    console.log("Could not find load text regex.");
}

// 3. Make fieldset only render if replyReady or if there's an error (so error can be seen with form maybe? Actually, if there's an error, replyReady is true? No, if error, replyReady=false. But the old code kept the disabled form visible. Let's wrap the fieldset so it only shows if replyReady is true OR replyError is true.)
// Actually, it's easier to just do: `{ (replyReady || replyError) && <fieldset `
c = c.replace(/<fieldset disabled=\{!replyReady \|\| status === 'submitting'\}/, "{ (replyReady || replyError) && <fieldset disabled={!replyReady || status === 'submitting'}");
c = c.replace(/<\/fieldset>\{status === 'error'/, "</fieldset>}{status === 'error'");

// 4. Update the submit button text with spinner
// original: {status === 'submitting' ? 'Đang gửi phản hồi…' : (hasReply
// using regex because the text might be mangled:
const btnTextRegex = /\{status === 'submitting' \? '[^']+' : \(hasReply \?/;
if (btnTextRegex.test(c)) {
    c = c.replace(btnTextRegex, "{status === 'submitting' ? <><span className={styles.spinner} role=\"status\" aria-label=\"Đang gửi\"></span> Đang gửi...</> : (hasReply ?");
    console.log("Successfully replaced button spinner.");
} else {
    console.log("Could not find button text regex.");
}

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
