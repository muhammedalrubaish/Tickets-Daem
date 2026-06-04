import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { sendPushNotification } from '../../../lib/push';

export async function POST(req: Request) {
  try {
    let { ticketId, solution, status, receiver, mainTicketId, number, category_type, date } = await req.json();

    const updateData: any = {};
    if (solution !== undefined) {
      // Map solution to status accordingly (e.g. تم الحل -> إغلاق, otherwise قيد المعالجة)
      updateData.status = (solution === 'تم الحل') ? 'إغلاق' : 'قيد المعالجة';
      updateData.solution = solution;
    }
    if (receiver !== undefined) {
      updateData.receiver = receiver;
    }
    if (category_type !== undefined) {
      updateData.category_type = category_type;
    }
    if (date !== undefined) {
      updateData.reception_date = date;
    }

    if (Object.keys(updateData).length > 0) {
      let query = supabase.from('tickets').update(updateData);
      
      const conditions: string[] = [];
      if (mainTicketId) {
        if (mainTicketId.includes('-') && mainTicketId.length > 20) {
          conditions.push(`id.eq.${mainTicketId}`);
        } else {
          conditions.push(`notion_id.eq.${mainTicketId}`);
        }
      }
      if (ticketId) {
        if (ticketId.includes('-') && ticketId.length > 20) {
          conditions.push(`id.eq.${ticketId}`);
        } else {
          conditions.push(`notion_id.eq.${ticketId}`);
        }
      }
      if (number && number !== 'غير محدد') {
        conditions.push(`ticket_number.eq.${number}`);
      }

      if (conditions.length > 0) {
        const { error } = await query.or(conditions.join(','));
        if (error) throw error;
        
        // Trigger Push Notification for the update
        try {
          const ticketNum = number || 'غير محدد';
          const category = category_type || 'غير محدد';
          const rcv = receiver || 'غير محدد';
          const statusText = (solution === 'تم الحل' || status === 'إغلاق') ? 'إغلاق' : 'قيد المعالجة';

          await sendPushNotification({
            title: 'بلاغات بلدي',
            body: `✏️ تم التحديث بلاغ رقم: ${ticketNum}\nالتصنيف: ${category} | المستقبل: ${rcv} | الحالة: ${statusText}`,
            url: '/'
          });
        } catch (pushErr) {
          console.error('Failed to trigger push notification for updated ticket:', pushErr);
        }
      } else {
        return NextResponse.json({ error: 'No ticket identifier provided' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تحديث البيانات في قاعدة البيانات.',
      details: error?.message 
    }, { status: 500 });
  }
}
