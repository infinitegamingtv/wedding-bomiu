const fs = require('fs');
let c = fs.readFileSync('src/components/GuestDashboard.js', 'utf8');

c = c.replace(/return r\.eventId\?\.includes\(eventId\);/g, "return r.eventId?.split(',').includes(eventId);");

fs.writeFileSync('src/components/GuestDashboard.js', c, 'utf8');
console.log('Fixed filtering logic');
