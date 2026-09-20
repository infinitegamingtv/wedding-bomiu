import { randomBytes, scryptSync } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Run locally; credentials are written to a private file, never logged.
const envPath = path.resolve('.env.local');
let current = '';
try { current = await fs.readFile(envPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (/^ADMIN_PASSWORD_HASH=/m.test(current)) throw new Error('Đã có cấu hình đăng nhập. Không ghi đè mật khẩu hiện tại.');
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = salt + ':' + scryptSync(password, salt, 64).toString('hex');
let added = `\nADMIN_PASSWORD_HASH=${hash}\n`;
if (!/^SESSION_SECRET=/m.test(current)) added += `SESSION_SECRET=${randomBytes(48).toString('hex')}\n`;
await fs.writeFile(envPath, current + added, { mode: 0o600 });
const accessFile = path.resolve(process.argv[2] || 'admin-access.txt');
await fs.mkdir(path.dirname(accessFile), { recursive: true });
await fs.writeFile(accessFile, `THÔNG TIN QUẢN TRỊ THIỆP CƯỚI\n\nTrang đăng nhập: /admin\nMật khẩu mới: ${password}\n\nMật khẩu cũ trong giao diện đã được loại bỏ. Giữ riêng tệp này.\n\nKhi triển khai lên hosting, đặt ADMIN_PASSWORD_HASH và SESSION_SECRET từ .env.local vào phần biến môi trường của hosting. Không đưa .env.local hoặc tệp này vào thư mục public.\n`, { mode: 0o600 });
console.log('Đã cấu hình đăng nhập và lưu thông tin truy cập vào tệp riêng.');
