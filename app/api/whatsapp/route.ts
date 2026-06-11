import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// GET: Meta webhook verification
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// POST: Receive and reply to incoming WhatsApp messages
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const messageData = change?.value?.messages?.[0];

    // Ignore non-text messages or status updates
    if (!messageData || messageData.type !== 'text') {
      return NextResponse.json({ status: 'ok' });
    }

    const userMessage = messageData.text.body;
    const senderPhone = messageData.from;

    const aiReply = await getAIResponse(userMessage);
    await sendWhatsAppMessage(senderPhone, aiReply);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

async function getAIResponse(userMessage: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return 'عذراً، الخدمة غير متاحة حالياً.';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = `
    أنت "مساعد بلدي الذكي" (Baladi AI Assistant) على واتساب.
    مهمتك هي مساعدة موظفي "وحدة بلدي" في التعامل مع البلاغات وأنظمة بلدي.

    معلومات عنك:
    - أنت خبير في أنظمة بلدي (الرخص التجارية، الرخص الإنشائية، الشهادات الصحية، إلخ).
    - يمكنك مساعدة الموظفين في صياغة ردود احترافية على البلاغات.
    - يمكنك شرح إجراءات بلدي وأنظمتها.

    قواعدك:
    - تحدث دائماً باللغة العربية بلهجة مهنية وودودة.
    - كن مقتضباً وواضحاً — الردود القصيرة أفضل لواتساب.
    - لا تستخدم تنسيق Markdown (بدون نجوم أو رموز).
  `;

  const result = await model.generateContent([systemPrompt, userMessage]);
  const response = await result.response;
  return response.text();
}

async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('WhatsApp credentials are missing');
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error: ${err}`);
  }
}
