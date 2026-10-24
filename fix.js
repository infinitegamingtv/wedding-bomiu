const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');
c = c.replace(
  /const subDirections = [^\n]+;/,
  match => match + '\n                    const subEmbed = mapEmbed(sub.mapUrl);'
);
c = c.replace(
  /(<div className=\{styles\.actions\}>[\s\S]*?<\/div>)\s*(<\/div>\s*\);\s*\})/,
  '$1\n                      {subEmbed && <div className={styles.mapContainer} style={{ marginTop: \'24px\' }}><iframe title={`Bản đồ ${sub.name}`} src={subEmbed} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}\n                    $2'
);
fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Fixed');
