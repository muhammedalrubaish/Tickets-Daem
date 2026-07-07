import { NextRequest, NextResponse } from 'next/server';

interface OpenTicket {
  ticketId: string;
  engineer: string;
  category: string;
  subject: string;
  modifiedDate: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    // جلب صفحة DAEM مع بيانات اعتماد المستخدم من الـ request أو من متغيرات البيئة
    const { username, password } = await request.json();

    const daemUrl = 'https://daem.momah.gov.sa/sm/index.do';

    // جلب الصفحة الأولية للحصول على session و cookies
    const initialResponse = await fetch(daemUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // محاولة تسجيل الدخول إذا تم توفير بيانات اعتماد
    let authenticated = true;
    if (username && password) {
      const loginFormData = new FormData();
      loginFormData.append('username', username);
      loginFormData.append('password', password);

      const loginResponse = await fetch(daemUrl, {
        method: 'POST',
        body: loginFormData,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        redirect: 'follow'
      });

      authenticated = loginResponse.ok;
    }

    // جلب محتوى الصفحة
    const pageResponse = await fetch(daemUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar-SA,ar;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    const html = await pageResponse.text();

    // استخراج البيانات من جدول التذاكر
    const tickets = parseTicketsFromHTML(html);

    return NextResponse.json({
      success: true,
      count: tickets.length,
      tickets,
      timestamp: new Date().toISOString(),
      authenticated
    });
  } catch (error) {
    console.error('Error fetching open tickets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        tickets: []
      },
      { status: 500 }
    );
  }
}

function parseTicketsFromHTML(html: string): OpenTicket[] {
  const tickets: OpenTicket[] = [];

  try {
    // البحث عن جدول التذاكر
    const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/i);
    if (!tableMatch) {
      console.warn('No table found in HTML');
      return tickets;
    }

    const tableHtml = tableMatch[0];

    // استخراج صفوف الجدول (تخطي صف الرأس)
    const rowMatches = tableHtml.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    let isFirstRow = true;

    for (const rowMatch of rowMatches) {
      const rowHtml = rowMatch[0];

      // تخطي الصف الأول (رأس الجدول)
      if (isFirstRow) {
        isFirstRow = false;
        continue;
      }

      // استخراج الخلايا من الصف
      const cells = Array.from(
        rowHtml.matchAll(/<td[^>]*>[\s\S]*?<\/td>/gi)
      );

      if (cells.length >= 5) {
        const ticketId = extractTextFromCell(cells[1]?.toString() || '').trim();
        const engineer = extractTextFromCell(cells[2]?.toString() || '').trim();
        const category = extractTextFromCell(cells[3]?.toString() || '').trim();
        const subject = extractTextFromCell(cells[4]?.toString() || '').trim();
        const modifiedDate = extractTextFromCell(cells[0]?.toString() || '').trim();

        if (ticketId) {
          tickets.push({
            ticketId,
            engineer,
            category,
            subject,
            modifiedDate,
            url: `https://daem.momah.gov.sa/sm/index.do?ticketid=${ticketId}`
          });
        }
      }
    }
  } catch (error) {
    console.error('Error parsing HTML:', error);
  }

  return tickets;
}

function extractTextFromCell(cellHtml: string): string {
  // إزالة الوسوم HTML
  let text = cellHtml.replace(/<[^>]*>/g, '');
  // فك تشفير الكيانات HTML
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#?\w+;/g, '');
  return text;
}
