import { ADMIN_COOKIE, isAdmin, verifyPassword, signToken, cookieOptions, sameOrigin, limitRequests, clientAddress } from '@/lib/auth';
import { json, failure, readJson } from '@/lib/http';
export async function GET(request) { return json({ authenticated: isAdmin(request) }); }
export async function POST(request) {
  try {
    sameOrigin(request);
    await limitRequests('login:' + clientAddress(request), 10, 900);
    const body = await readJson(request, 2048);
    if (!await verifyPassword(body.password)) return json({ error: 'Mật khẩu không đúng.' }, 401);
    const response = json({ success: true });
    response.cookies.set(ADMIN_COOKIE, signToken('admin', 8 * 3600), cookieOptions(request, 8 * 3600));
    return response;
  } catch (error) { return failure(error); }
}
export async function DELETE(request) {
  try {
    sameOrigin(request);
    const response = json({ success: true });
    response.cookies.set(ADMIN_COOKIE, '', cookieOptions(request, 0));
    return response;
  } catch (error) { return failure(error); }
}
