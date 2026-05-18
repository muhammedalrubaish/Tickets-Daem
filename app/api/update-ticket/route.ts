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
      
      if (number) {
        const { error } = await query.eq('ticket_number', number);
        if (error) throw error;
      } else if (mainTicketId) {
        // If mainTicketId is a UUID
        if (mainTicketId.includes('-') && mainTicketId.length > 20) {
          const { error } = await query.eq('id', mainTicketId);
          if (error) throw error;
        } else {
          const { error } = await query.eq('notion_id', mainTicketId);
          if (error) throw error;
        }
      } else if (ticketId) {
        const { error } = await query.eq('notion_id', ticketId);
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
