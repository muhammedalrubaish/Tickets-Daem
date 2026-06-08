import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    if (!text || text.trim() === '') {
      return NextResponse.json({ correctedText: '' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const systemPrompt = `
      مهمتك هي تصحيح الأخطاء الإملائية والنحوية في النص العربي المدخل والذي يمثل شرحاً أو إفادة أو حلاً لبلاغ في نظام بلدي.
      
      القواعد:
      1. صحح الكلمات المكتوبة بشكل خاطئ إملائياً فقط (مثل الألف المقصورة، التاء المربوطة والهاء، همزات القطع والوصل، الظاء والضاد، إلخ).
      2. حافظ تماماً على نفس بنية الجملة والمعنى والمفردات المستخدمة دون أي تغيير أو تحوير في صياغة النص أو أسلوبه.
      3. أرجع النص المصحح فقط بدون أي مقدمات أو تحيات أو تفسيرات أو علامات تنصيص إضافية.
    `;

    let responseText = '';
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([systemPrompt, text]);
      responseText = result.response.text();
    } catch (e) {
      console.warn("Gemini 2.5 Flash failed, trying Gemini 1.5 Flash fallback:", e);
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await fallbackModel.generateContent([systemPrompt, text]);
      responseText = result.response.text();
    }

    const correctedText = responseText.trim();
    return NextResponse.json({ correctedText });
  } catch (error: any) {
    console.error('Spelling Correction API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process spelling correction.', 
      details: error.message || String(error) 
    }, { status: 500 });
  }
}

