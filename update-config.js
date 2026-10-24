const fs = require('fs');
let code = fs.readFileSync('next.config.mjs', 'utf8');
code = code.replace(
  'const nextConfig = {',
  'const nextConfig = {\n  images: {\n    remotePatterns: [\n      { protocol: "https", hostname: "**" },\n      { protocol: "http", hostname: "**" }\n    ]\n  },'
);
fs.writeFileSync('next.config.mjs', code, 'utf8');
console.log('Updated next.config.mjs');
