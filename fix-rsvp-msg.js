const fs = require('fs');
let c = fs.readFileSync('src/components/InvitationUI.js', 'utf8');

const str1 = `'Chúng mình đã nhận được xác nhận tham dự. Hẹn gặp bạn trong ngày vui!'`;
const rep1 = `<>Chúng mình đã nhận được xác nhận tham dự.<br />Hẹn gặp bạn trong ngày vui!</>`;

const str2 = `'Chúng mình đã nhận được phản hồi. Cảm ơn bạn đã dành tình cảm cho chúng mình!'`;
const rep2 = `<>Chúng mình đã nhận được phản hồi.<br />Cảm ơn bạn đã dành tình cảm cho chúng mình!</>`;

c = c.replace(str1, rep1);
c = c.replace(str2, rep2);

fs.writeFileSync('src/components/InvitationUI.js', c, 'utf8');
console.log('Replaced RSVP messages');
