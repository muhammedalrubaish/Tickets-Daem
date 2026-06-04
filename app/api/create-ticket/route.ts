import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { sendPushNotification } from '../../../lib/push';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Insert directly into Supabase
    const { data: insertedData, error: insertError } = await supabase
      .from('tickets')
      .insert({
        ticket_number: data.ticketNumber,
        category_type: data.type || data.serviceType || 'أخرى',
        status: (data.solution === 'تم الحل') ? 'إغلاق' : 'قيد المعالجة',
        solution: data.solution || 'لم يتم الحل',
        reception_date: data.date,
        receiver: data.receiver || data.name || 'غير محدد'
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    const insertedTicket = insertedData?.[0];

    // Trigger Push Notification to all subscribed devices
    try {
      const ticketNum = data.ticketNumber || 'غير محدد';
      const category = data.type || data.serviceType || 'غير محدد';
      const rcv = data.receiver || data.name || 'غير محدد';
      const statusText = (data.solution === 'تم الحل') ? 'إغلاق' : 'قيد المعالجة';

      await sendPushNotification({
        title: 'بلاغات بلدي',
        body: `🔔 بلاغ جديد رقم: ${ticketNum}\nالتصنيف: ${category} | المستقبل: ${rcv} | الحالة: ${statusText}`,
        url: '/' // Can point to homepage or target page
      });
    } catch (pushErr) {
      console.error('Failed to trigger push notification for new ticket:', pushErr);
    }

    return NextResponse.json({ 
      success: true, 
      pageId: insertedTicket?.id || 'supabase-' + Date.now() 
    });
  } catch (error: any) {
    console.error('Create Ticket Error:', error);
    return NextResponse.json({ 
      error: error?.message || 'حدث خطأ أثناء حفظ البلاغ في قاعدة البيانات.'
    }, { status: 500 });
  }
}
