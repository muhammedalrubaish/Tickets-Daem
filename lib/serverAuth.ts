import crypto from 'crypto';

// المصدر الوحيد للتحقق من بيانات الدخول — يعمل على الخادم فقط ولا يصل للمتصفح أبداً
export type AuthRole = 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  username: string;
  name: string;
  key: string;
  role: AuthRole;
}

// يمكن تجاوز كلمات المرور دون تعديل الكود عبر متغير البيئة EMPLOYEE_PASSWORDS
// بصيغة JSON مثل: {"mialrubaish":"كلمة-جديدة","aalowaid":"..."}
const EMPLOYEES: { name: string; user: string; key: string; pass: string }[] = [
  { name: 'البراء النصيان', user: 'a.alnesayan', key: 'alnesayan', pass: '1111' },
  { name: 'عبدالله العويد', user: 'aalowaid', key: 'alowaid', pass: '2222' },
  { name: 'عبدالرحمن العمري', user: 'af.alamri', key: 'alamri', pass: '3333' },
  { name: 'عزام الحربي', user: 'azz.alharbi', key: 'alharbi', pass: '4444' },
  { name: 'محمد الربيش', user: 'mialrubaish', key: 'alrubaish', pass: 'Balady.20' },
  { name: 'صالح الغصن', user: 's.alghosen', key: 'alghosen', pass: '6666' },
  { name: 'طارق الهدياني', user: 't.alhedyani', key: 'alhedyani', pass: '7777' },
  { name: 'ثامر المنصور', user: 't.almansour', key: 'almansour', pass: '8888' },
];

const VIEWER_PASSWORD = process.env.VIEWER_PASSWORD || 'Balady.2026';

// سر التوقيع — يُفضل ضبط AUTH_SECRET صراحة في متغيرات البيئة على Vercel
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'daem-plus-fallback-secret';

// صلاحية التوكن أسبوع واحد، بنفس مدة كوكي الدخول (max-age=604800)
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function getEmployeePassword(emp: { user: string; pass: string }): string {
  try {
    const overrides = JSON.parse(process.env.EMPLOYEE_PASSWORDS || '{}');
    if (overrides && typeof overrides[emp.user] === 'string') return overrides[emp.user];
  } catch { }
  return emp.pass;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hmac(data: string): string {
  return b64url(crypto.createHmac('sha256', AUTH_SECRET).update(data).digest());
}

function timingSafeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signAuthToken(user: AuthUser): { token: string; exp: number } {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = b64url(Buffer.from(
    JSON.stringify({ u: user.username, n: user.name, k: user.key, r: user.role, exp }),
    'utf8'
  ));
  return { token: `${payload}.${hmac(payload)}`, exp };
}

export function verifyAuthToken(token: string): AuthUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!timingSafeEquals(signature, hmac(payload))) return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    );
    if (!data || typeof data.exp !== 'number' || data.exp * 1000 < Date.now()) return null;
    if (data.r !== 'admin' && data.r !== 'editor' && data.r !== 'viewer') return null;
    return { username: data.u || '', name: data.n || '', key: data.k || '', role: data.r };
  } catch {
    return null;
  }
}

export function verifyEmployeeLogin(username: string, password: string): AuthUser | null {
  const cleanUser = String(username || '').trim().toLowerCase();
  const emp = EMPLOYEES.find(e => e.user.toLowerCase() === cleanUser);
  if (!emp) return null;
  if (!timingSafeEquals(String(password || '').trim(), getEmployeePassword(emp).trim())) return null;
  return {
    username: emp.user,
    name: emp.name,
    key: emp.key,
    role: emp.user === 'mialrubaish' ? 'admin' : 'editor',
  };
}

export function verifyViewerLogin(password: string): AuthUser | null {
  if (!timingSafeEquals(String(password || '').trim(), VIEWER_PASSWORD.trim())) return null;
  return { username: 'viewer', name: 'المشرف', key: '', role: 'viewer' };
}

// يقرأ التوكن من ترويسة Authorization (الإضافة) أو كوكي auth_token (الموقع)
export function getAuthFromRequest(req: Request): AuthUser | null {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const user = verifyAuthToken(authHeader.slice(7).trim());
    if (user) return user;
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const authCookie = cookieHeader.split(/;\s*/).find(c => c.startsWith('auth_token='));
  if (authCookie) {
    try {
      return verifyAuthToken(decodeURIComponent(authCookie.slice('auth_token='.length)));
    } catch {
      return null;
    }
  }
  return null;
}
