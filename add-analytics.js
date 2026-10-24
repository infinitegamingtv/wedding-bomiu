const fs = require('fs');
let code = fs.readFileSync('src/app/layout.js', 'utf8');
code = code.replace(
  'import "./globals.css";',
  'import { Analytics } from "@vercel/analytics/react";\nimport "./globals.css";'
);
code = code.replace(
  '<ButtonSfx />{children}</body>',
  '<ButtonSfx />{children}<Analytics /></body>'
);
fs.writeFileSync('src/app/layout.js', code, 'utf8');
console.log('Injected Analytics');
