import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  try {
    let { ticketId, solution, status, receiver, mainTicketId, number } = await req.json();

    const updateData: any = {};
    if (solution !== undefined) {
      // Map solution to status accordingly (e.g. تم الحل -> إغلاق, otherwise قيد المعالجة)
      updateData.status = (solution === 'تم الحل') ? 'إغلاق' : 'قيد المعالجة';
      updateData.solution = solution;
    }
    if (receiver !== undefined) {
      updateData.receiver = receiver;
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
