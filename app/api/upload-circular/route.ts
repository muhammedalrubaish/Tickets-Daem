import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file || !fileName) {
      return NextResponse.json({ error: 'لم يتم توفير الملف أو اسم الملف.' }, { status: 400 });
    }

    // تحويل الملف إلى Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // تحديد المجلد المستهدف في المشروع
    const uploadDir = path.join(process.cwd(), 'public', 'الملفات', 'التعاميم');

    // إنشاء المجلد إذا لم يكن موجوداً
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // حفظ الملف في المسار الفعلي على الهارد ديسك
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, path: `/الملفات/التعاميم/${fileName}` });
  } catch (error: any) {
    console.error('Upload Error:', error);
    // تجاوز القيود على Vercel لضمان استمرار الحفظ المحلي في المتصفح
    return NextResponse.json({ 
      success: true, 
      warning: 'تم تسجيل التعميم وحفظه في المتصفح. لحفظ الملف الفعلي بشكل دائم في مجلد المشروع، يرجى تشغيل الرفع محلياً.' 
    });
  }
}
