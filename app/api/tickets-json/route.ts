import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// Disable default static caching to ensure the Chrome extension gets real-time data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Query Supabase - جلب الإجمالي الفعلي بدون حد الـ 1000 الافتراضي
    const { data: ticketsData, error } = await supabase
      .from('tickets')
      .select('id, notion_id, ticket_number, category_type, solution, receiver, reception_date')
      .gte('reception_date', '2026-04-04')
      .order('reception_date', { ascending: false })
      .limit(9999);

    if (error) {
      throw error;
    }

    // Map to the exact schema expected by the Chrome extension (Daem Plus)
    const formattedTickets = (ticketsData || []).map(ticket => ({
      id: ticket.notion_id || ticket.id,
      statusPageId: ticket.notion_id || null,
      number: ticket.ticket_number || 'غير محدد',
      type: ticket.category_type || 'أخرى',
      solution: ticket.solution || 'لم يتم الحل',
      receiver: ticket.receiver || 'غير محدد',
      date: ticket.reception_date || ''
    }));

    return NextResponse.json(formattedTickets);
  } catch (error: any) {
    console.error('Tickets JSON Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets from database' }, { status: 500 });
  }
}
