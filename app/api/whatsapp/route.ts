import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

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

    if (!messageData || messageData.type !== 'text') {
      return NextResponse.json({ status: 'ok' });
    }

    const userMessage: string = messageData.text.body.trim();
    const senderPhone: string = messageData.from;

    // Check if message contains a ticket number (e.g. IM4407072)
    const ticketNumberMatch = userMessage.match(/IM\d+/i);

    let reply: string;

    if (ticketNumberMatch) {
      const ticketNumber = ticketNumberMatch[0].toUpperCase();
      reply = await getTicketStatusReply(ticketNumber);
    } else {
      reply = await getAIReply(userMessage);
    }

    await sendWhatsAppMessage(senderPhone, reply);
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

// Query Supabase and return official status reply
async function getTicketStatusReply(ticketNumber: string): Promise<string> {
  const { data, error } = await supabase
    .from('tickets')
    .select('ticket_number, solution, status')
    .ilike('ticket_number', ticketNumber)
    .maybeSingle();

  if (error || !data) {
    return `لم يتم العثور على البلاغ رقم ${ticketNumber}.\nيرجى التأكد من صحة رقم البلاغ أو التواصل مع الجهة المختصة.`;
  }

  const solution: string = (data.solution || '').trim();

  const statusMessages: Record<string, string> = {
    'بانتظار المستفيد': `بلاغكم رقم ${ticketNumber} قيد المعالجة حالياً.\nسيتم التواصل معكم عند الحاجة.`,
    'لدى الوزارة':     `بلاغكم رقم ${ticketNumber} تمت إحالته إلى الوزارة المختصة.\nيرجى متابعة الجهة المختصة للاستفسار.`,
    'تم الحل':         `بلاغكم رقم ${ticketNumber} تم إغلاقه بعد اتخاذ الإجراء المناسب.\nشكراً لتواصلكم مع وحدة بلدي.`,
    'لم يتم الحل':     `بلاغكم رقم ${ticketNumber} لا يزال قيد الدراسة.\nسيتم إشعاركم عند اتخاذ الإجراء المناسب.`,
    'بلاغ جديد':       `بلاغكم رقم ${ticketNumber} تم استلامه وهو قيد المراجعة الأولية.\nسيتم اتخاذ الإجراء اللازم في أقرب وقت.`,
    'مشكلة عامة':      `بلاغكم رقم ${ticketNumber} قيد المعالجة ضمن البلاغات العامة.\nسيتم التعامل معه وفق الأولوية المحددة.`,
  };

  return (
    statusMessages[solution] ||
    `بلاغكم رقم ${ticketNumber} قيد المتابعة من قِبل الجهة المختصة.\nللاستفسار يرجى التواصل المباشر مع وحدة بلدي.`
  );
}

// Strictly professional AI for work-related queries only
async function getAIReply(userMessage: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return 'عذراً، الخدمة غير متاحة حالياً.';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = `
    أنت مساعد رسمي لوحدة بلدي على واتساب.

    مهامك المسموح بها فقط:
    - الإجابة على استفسارات المواطنين المتعلقة ببلاغات بلدي والخدمات البلدية.
    - توجيه المواطن لإرسال رقم البلاغ (مثال: IM4407072) للاستعلام عن حالته.
    - الإجابة على أسئلة متعلقة بأنظمة بلدي: الرخص التجارية، الرخص الإنشائية، الشهادات الصحية.

    قواعد صارمة:
    - الرد باللغة العربية الفصحى الرسمية فقط.
    - لا تجاوب على أي موضوع خارج نطاق عمل وحدة بلدي.
    - إذا كان السؤال خارج نطاق العمل، رد بـ: "هذا الاستفسار خارج نطاق خدماتنا. للمساعدة في بلاغات بلدي يرجى إرسال رقم البلاغ."
    - لا تستخدم رموز أو تنسيق markdown.
    - الردود مختصرة ومهنية.
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

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
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
