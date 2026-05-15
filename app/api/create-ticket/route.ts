import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

const notion = new Client({ auth: process.env.NOTION_SECRET });

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!databaseId) {
      return NextResponse.json({ error: 'Database ID is missing' }, { status: 500 });
    }

    // إنشاء الصفحة في نوشن
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Name': {
          title: [{ text: { content: data.ticketNumber || `بلاغ: ${data.name}` } }]
        },
        'نوع التصنيف': {
          select: { name: data.type || data.serviceType || 'أخرى' }
        },
        'تاريخ استقبال البلاغ': {
          date: { start: data.date }
        },
        'الحل المقترح': {
          select: { name: data.solution || 'لم يتم الحل' }
        },
        'المستقبل': {
          select: { name: data.receiver || data.name || 'غير محدد' }
        }
      }
    });

    // الرفع إلى Supabase للمزامنة الفورية
    const { supabase } = await import('../../../lib/supabase');
    await supabase.from('tickets').insert({
      notion_id: response.id,
      ticket_number: data.ticketNumber,
      category_type: data.type || data.serviceType || 'أخرى',
      status: 'جديد',
      solution: data.solution || 'لم يتم الحل',
      reception_date: data.date,
      receiver: data.receiver || data.name || 'غير محدد'
    });

    return NextResponse.json({ success: true, pageId: response.id });
  } catch (error: any) {
    console.error('Create Ticket Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'حدث خطأ أثناء إرسال البلاغ.'
    }, { status: 500 });
  }
}
