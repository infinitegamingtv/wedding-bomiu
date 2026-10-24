const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

c = c.replace(/<img src=\{invitation\.groomAvatarUrl\} alt=\{invitation\.groom\} loading="lazy" \/>/g, '<Image src={invitation.groomAvatarUrl} alt={invitation.groom} width={80} height={80} loading="lazy" />');
c = c.replace(/<img src=\{invitation\.brideAvatarUrl\} alt=\{invitation\.bride\} loading="lazy" \/>/g, '<Image src={invitation.brideAvatarUrl} alt={invitation.bride} width={80} height={80} loading="lazy" />');

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Optimized avatars');
