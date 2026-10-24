const fs = require('fs');
let code = fs.readFileSync('src/app/layout.js', 'utf8');
code = code.replace(
  'import { Analytics } from "@vercel/analytics/react";',
  'import { Analytics } from "@vercel/analytics/next";'
);
fs.writeFileSync('src/app/layout.js', code, 'utf8');
console.log('Fixed Analytics import');
