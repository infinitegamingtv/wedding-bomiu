const fs = require('fs');
let c = fs.readFileSync('src/app/api/rsvp/route.js', 'utf8');

const regex = /if \(who\.guestId\) \{\s*const guest = data\.links\?\.find\(g => g\.id === who\.guestId\);\s*const allowedEventIds = guest\?\.eventId \? guest\.eventId\.split\(\',\('\)\)\.filter\(Boolean\) : data\.events\.map\(e => e\.id\);\s*if \(eventIds\.some\(id => !allowedEventIds\.includes\(id\)\)\) invalid\('YA\?u c\? u khA'ng h\?p l\?: B\?n khA'ng cA3 quy\?n ph\?n h\?"i cho ti\?c nA\?y\.'\);\s*\}/;

// Wait, the regex with unicode characters is prone to failure.
// Let's replace the whole block using substring or a more resilient match.
const target = `    if (who.guestId) {
      const guest = data.links?.find(g => g.id === who.guestId);
      const allowedEventIds = guest?.eventId ? guest.eventId.split(',').filter(Boolean) : data.events.map(e => e.id);
      if (eventIds.some(id => !allowedEventIds.includes(id))) invalid('YAu c u khA'ng hp l: Bn khA'ng cA3 quy?n phn h"i cho tic nAy.');
    }`;
    
c = c.replace(target, '');
// Alternatively:
c = c.replace(/if \(who\.guestId\) \{[\s\S]*?invalid\('.*?'\);\s*\}/, '');

fs.writeFileSync('src/app/api/rsvp/route.js', c, 'utf8');
