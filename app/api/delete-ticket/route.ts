import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

const notion = new Client({ auth: process.env.NOTION_SECRET });

export async function POST(req: Request) {
  try {
    const { ticketId, createdAt } = await req.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    // التحقق من صلاحيات المشرف محمد الربيش لتجاوز قيد الساعتين
    const cookieStore = req.headers.get('cookie') || '';
    const isMainAdmin = cookieStore.includes('super_admin') || cookieStore.includes(encodeURIComponent('محمد الربيش'));

    // التحقق من الوقت (ساعتين) في السيرفر لزيادة الأمان (فقط لغير محمد الربيش)
    if (createdAt && !isMainAdmin) {
      const createdDate = new Date(createdAt);
      const now = new Date();
      const diffInHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours > 2) {
        return NextResponse.json({ error: 'عذراً، لا يمكن حذف البلاغات التي مر عليها أكثر من ساعتين.' }, { status: 403 });
      }
    }

    // أرشفة الصفحة في نوشن (بمثابة حذف)
    await notion.pages.update({
      page_id: ticketId,
      archived: true,
    });

    // الحذف من Supabase للمزامنة الفورية
    const { supabase } = await import('../../../lib/supabase');
    await supabase.from('tickets').delete().eq('notion_id', ticketId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف البلاغ.' }, { status: 500 });
  }
}
