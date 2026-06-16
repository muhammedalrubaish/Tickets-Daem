import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { getCorsHeaders } from '../../../lib/cors';

export async function OPTIONS(req: Request) {
  const headers = getCorsHeaders(req.headers.get('origin'));
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(req: Request) {
  const headers = getCorsHeaders(req.headers.get('origin'));
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

    return NextResponse.json({
      success: true,
      pageId: insertedTicket?.id || 'supabase-' + Date.now()
    }, { headers });
  } catch (error: any) {
    console.error('Create Ticket Error:', error);
    return NextResponse.json({
      error: error?.message || 'حدث خطأ أثناء حفظ البلاغ في قاعدة البيانات.'
    }, { status: 500, headers });
  }
}
