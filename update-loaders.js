const fs = require('fs');
let c = fs.readFileSync('src/app/admin/page.js', 'utf8');

const oldLoading = "if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Đang tải dữ liệu...</div>;";
const newLoading = `if (loading) {
    return (
      <div className={styles.adminLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLogo}>BOMIUX ADMIN</div>
          <div className={styles.navMenu}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={\`\${styles.skeleton}\`} style={{height: 40, marginBottom: 8}}></div>
            ))}
          </div>
        </aside>
        <main className={styles.mainContent} aria-busy="true">
           <div className={\`\${styles.skeleton} \${styles.skeletonTitle}\`}></div>
           <div className={styles.statsGrid}>
              {[1, 2, 3].map(i => <div key={i} className={\`\${styles.skeleton} \${styles.skeletonCard}\`}></div>)}
           </div>
           <div className={\`\${styles.skeleton} \${styles.skeletonTable}\`}></div>
        </main>
      </div>
    );
  }`;

if (c.includes(oldLoading)) {
    c = c.replace(oldLoading, newLoading);
} else {
    // try fallback with regex if encoding issues
    const regex = /if \(loading\) return <div style=\{\{padding: '50px', textAlign: 'center'\}\}>.*?<\/div>;/;
    c = c.replace(regex, newLoading);
}

const oldSavingText = "{saving ? 'Đang lưu...' : <><Icon icon={Save} size={16} /> Lưu thay đổi</>}";
const newSavingText = "{saving ? <><span className={styles.spinner} role=\"status\" aria-label=\"Đang lưu\"></span> Đang lưu...</> : <><Icon icon={Save} size={16} /> Lưu thay đổi</>}";

c = c.replace(oldSavingText, newSavingText);

fs.writeFileSync('src/app/admin/page.js', c, 'utf8');
console.log("Updated loading and saving states.");
