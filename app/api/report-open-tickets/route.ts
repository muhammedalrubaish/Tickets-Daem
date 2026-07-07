import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/push';

interface IncomingTicket {
  ticketId: string;
  engineer?: string;
  category?: string;
  subject?: string;
  status?: string;
  modifiedDate?: string;
}

// تستقبل هذه النقطة قائمة التذاكر المفتوحة كما تظهر فعلياً بمتصفح الموظف المسجل دخوله
// في داعم (عبر إضافة Daem Plus)، وتقارنها بالبلاغات المسجلة بقاعدة بيانات الموقع،
// وترسل إشعار Push عند ظهور تذكرة جديدة غير مسجلة.
export async function POST(request: NextRequest) {
  try {
    const { tickets } = (await request.json()) as { tickets: IncomingTicket[] };

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json({ success: true, totalReported: 0, newCount: 0 });
    }

    const incomingIds = tickets
      .map((t) => (t.ticketId || '').trim())
      .filter(Boolean);

    // التذاكر الموجودة مسبقاً في لقطة الحالة المخزنة (لتمييز الجديدة منها)
    const { data: existingSnapshotRows } = await supabase
      .from('daem_open_tickets')
      .select('ticket_id')
      .in('ticket_id', incomingIds);

    const existingIds = new Set((existingSnapshotRows || []).map((r) => r.ticket_id));

    // التذاكر المسجلة فعلياً بالموقع (جدول tickets) للمقارنة
    const { data: registeredRows } = await supabase
      .from('tickets')
      .select('ticket_number')
      .in('ticket_number', incomingIds);

    const registeredIds = new Set(
      (registeredRows || []).map((r) => String(r.ticket_number).trim())
    );

    const now = new Date().toISOString();
    const rowsToUpsert = tickets
      .filter((t) => (t.ticketId || '').trim())
      .map((t) => {
        const ticketId = t.ticketId.trim();
        return {
          ticket_id: ticketId,
          engineer: t.engineer || null,
          category: t.category || null,
          subject: t.subject || null,
          status: t.status || null,
          modified_date: t.modifiedDate || null,
          is_registered: registeredIds.has(ticketId),
          last_seen_at: now
        };
      });

    const { error: upsertError } = await supabase
      .from('daem_open_tickets')
      .upsert(rowsToUpsert, { onConflict: 'ticket_id' });

    if (upsertError) {
      console.error('Error upserting open tickets snapshot:', upsertError);
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      );
    }

    // التذاكر التي تظهر لأول مرة وغير مسجلة بالموقع تستحق إشعاراً
    const newUnregisteredTickets = tickets.filter((t) => {
      const ticketId = (t.ticketId || '').trim();
      return ticketId && !existingIds.has(ticketId) && !registeredIds.has(ticketId);
    });

    if (newUnregisteredTickets.length > 0) {
      const title =
        newUnregisteredTickets.length === 1
          ? `تذكرة جديدة غير مسجلة: ${newUnregisteredTickets[0].ticketId}`
          : `${newUnregisteredTickets.length} تذاكر جديدة غير مسجلة بالموقع`;
      const body = newUnregisteredTickets
        .slice(0, 3)
        .map((t) => `${t.ticketId}${t.subject ? ' - ' + t.subject : ''}`)
        .join(' | ');

      try {
        await sendPushNotification({ title, body, url: '/open-tickets' });
      } catch (pushErr) {
        console.error('Failed to send push notification for new tickets:', pushErr);
      }
    }

    return NextResponse.json({
      success: true,
      totalReported: tickets.length,
      newCount: newUnregisteredTickets.length
    });
  } catch (error) {
    console.error('Error in report-open-tickets POST:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// تعيد آخر لقطة معروفة للتذاكر المفتوحة (لعرضها في صفحة /open-tickets)
export async function GET() {
  try {
    // نعرض فقط ما تم رصده خلال آخر 3 أيام لتفادي عرض تذاكر قديمة تم إغلاقها
    // ولم تعد تظهر بجدول داعم (ولا يوجد لدينا حالياً وسيلة لتأكيد إغلاقها)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('daem_open_tickets')
      .select('*')
      .gte('last_seen_at', threeDaysAgo)
      .order('last_seen_at', { ascending: false });

    if (error) {
      console.error('Error fetching open tickets snapshot:', error);
      return NextResponse.json(
        { success: false, error: error.message, tickets: [] },
        { status: 500 }
      );
    }

    const tickets = (data || []).map((row) => ({
      ticketId: row.ticket_id,
      engineer: row.engineer || '',
      category: row.category || '',
      subject: row.subject || '',
      status: row.status || '',
      modifiedDate: row.modified_date || '',
      isRegistered: row.is_registered,
      lastSeenAt: row.last_seen_at,
      url: `https://daem.momah.gov.sa/sm/index.do`
    }));

    return NextResponse.json({
      success: true,
      count: tickets.length,
      registeredCount: tickets.filter((t) => t.isRegistered).length,
      unregisteredCount: tickets.filter((t) => !t.isRegistered).length,
      tickets,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in report-open-tickets GET:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tickets: []
      },
      { status: 500 }
    );
  }
}
