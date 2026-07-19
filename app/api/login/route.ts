import { NextResponse } from 'next/server';
import { verifyEmployeeLogin, verifyViewerLogin, signAuthToken } from '../../../lib/serverAuth';

export async function POST(req: Request) {
  try {
    const { username, password, mode } = await req.json();

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'كلمة المرور مطلوبة.' }, { status: 400 });
    }

    const user = (mode === 'viewer' || !username)
      ? verifyViewerLogin(password)
      : verifyEmployeeLogin(String(username), password);

    if (!user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 });
    }

    const { token, exp } = signAuthToken(user);

    return NextResponse.json({
      success: true,
      token,
      exp,
      role: user.role,
      username: user.username,
      name: user.name,
      key: user.key,
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول.' }, { status: 500 });
  }
}
