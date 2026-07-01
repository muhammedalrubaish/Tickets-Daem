import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let allData: any[] = [];
    let from = 0;
    const batchSize = 1000;

    // جلب البيانات على دفعات من Supabase
    while (true) {
      const { data, error } = await supabase
        .from('tickets')
        .select('ticket_number, category_type, solution, reception_date, receiver, created_at')
        .gte('reception_date', '2026-04-04')
        .order('reception_date', { ascending: false })
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('[KPI API] Supabase error:', error);
        break;
      }

      if (!data || data.length === 0) break;
      allData = allData.concat(data);
      if (data.length < batchSize) break;
      from += batchSize;
    }

    // تصفية بلاغات النظام والإعلانات
    const baseTickets = allData.filter(t =>
      t.reception_date &&
      t.reception_date >= '2026-04-04' &&
      t.category_type !== 'تحديث نظام' &&
      t.category_type !== 'تحديثات النظام' &&
      !(t.ticket_number && t.ticket_number.includes('📢'))
    );

    const total = baseTickets.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = baseTickets.filter(t => t.reception_date === todayStr).length;

    const closed = baseTickets.filter(t => (t.solution || '').trim() === 'تم الحل').length;
    const open = baseTickets.filter(t => (t.solution || '').trim() !== 'تم الحل').length;
    const ministry = baseTickets.filter(t => (t.solution || '').trim() === 'لدى الوزارة').length;
    const waiting = baseTickets.filter(t => (t.solution || '').trim() === 'بانتظار المستفيد').length;
    const newTickets = baseTickets.filter(t => (t.solution || '').trim() === 'بلاغ جديد').length;
    const general = baseTickets.filter(t => (t.solution || '').trim() === 'مشكلة عامة').length;

    const activePending = total - closed;
    const successRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // حساب توزيع البلاغات النشطة للموظفين (مجهولة الاسم للخصوصية)
    const employeeCounts: Record<string, number> = {};
    baseTickets.forEach(t => {
      const name = t.receiver ? t.receiver.trim() : 'غير محدد';
      if (name !== 'الجميع' && name !== 'غير محدد') {
        employeeCounts[name] = (employeeCounts[name] || 0) + 1;
      }
    });

    const sortedEmployees = Object.entries(employeeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // حسابات مقارنة إغلاق البلاغات شهرياً
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const prevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

    const getArabicMonthName = (monthIdx: number) => {
      const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      return arabicMonths[monthIdx];
    };

    const currentMonthName = getArabicMonthName(currentMonth);
    const prevMonthName = getArabicMonthName(prevMonth);

    // تصفية البلاغات المغلقة
    const closedTickets = baseTickets.filter(t => (t.solution || '').trim() === 'تم الحل');

    // توزيع الموظفين لإغلاق البلاغات
    const closuresByEmployee: Record<string, { currentMonth: number; prevMonth: number }> = {};
    const knownEmployees = [
      'البراء النصيان', 'عبدالله العويد', 'عبدالرحمن العمري',
      'عزام الحربي', 'محمد الربيش', 'صالح الغصن',
      'طارق الهدياني', 'ثامر المنصور'
    ];
    knownEmployees.forEach(emp => {
      closuresByEmployee[emp] = { currentMonth: 0, prevMonth: 0 };
    });

    closedTickets.forEach(t => {
      const receiver = t.receiver ? t.receiver.trim() : 'غير محدد';
      if (receiver === 'الجميع' || receiver === 'غير محدد') return;

      const matchedEmployee = knownEmployees.find(emp =>
        receiver.includes(emp.split(' ')[0]) ||
        emp.includes(receiver.split(' ')[0])
      ) || receiver;

      if (!closuresByEmployee[matchedEmployee]) {
        closuresByEmployee[matchedEmployee] = { currentMonth: 0, prevMonth: 0 };
      }

      if (t.reception_date && t.reception_date.startsWith(currentMonthStr)) {
        closuresByEmployee[matchedEmployee].currentMonth++;
      } else if (t.reception_date && t.reception_date.startsWith(prevMonthStr)) {
        closuresByEmployee[matchedEmployee].prevMonth++;
      }
    });

    const sortedClosures = Object.entries(closuresByEmployee)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.currentMonth - a.currentMonth);

    const totalCurrentMonthClosures = closedTickets.filter(t => t.reception_date && t.reception_date.startsWith(currentMonthStr)).length;
    const totalPrevMonthClosures = closedTickets.filter(t => t.reception_date && t.reception_date.startsWith(prevMonthStr)).length;

    // حساب إحصائيات مدد الحل
    let totalDurationDays = 0;
    let closedCountWithDuration = 0;

    closedTickets.forEach(t => {
      if (t.reception_date && t.created_at) {
        try {
          const recDate = new Date(t.reception_date);
          const clsDate = new Date(t.created_at);
          const diffTime = clsDate.getTime() - recDate.getTime();
          const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

          totalDurationDays += diffDays;
          closedCountWithDuration++;
        } catch (e) { }
      }
    });

    const averageResolutionTime = closedCountWithDuration > 0
      ? (totalDurationDays / closedCountWithDuration).toFixed(1)
      : '0';

    // حساب أعمار البلاغات القائمة النشطة معلقة حالياً
    let openUnder3Days = 0;
    let open3To7Days = 0;
    let openOver7Days = 0;
    const activeTickets = baseTickets.filter(t => (t.solution || '').trim() !== 'تم الحل');

    activeTickets.forEach(t => {
      if (t.reception_date && t.reception_date !== 'غير محدد') {
        try {
          const recDate = new Date(t.reception_date);
          const diffTime = now.getTime() - recDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 3) openUnder3Days++;
          else if (diffDays <= 7) open3To7Days++;
          else openOver7Days++;
        } catch (e) { }
      }
    });

    const activeCount = activeTickets.length || 1;
    const openUnder3DaysPercent = Math.round((openUnder3Days / activeCount) * 100);
    const open3To7DaysPercent = Math.round((open3To7Days / activeCount) * 100);
    const openOver7DaysPercent = Math.round((openOver7Days / activeCount) * 100);

    return NextResponse.json({
      total,
      todayCount,
      closed,
      open,
      ministry,
      waiting,
      newTickets,
      general,
      activePending,
      successRate,
      employeeList: sortedEmployees,
      closureList: sortedClosures,
      currentMonthName,
      prevMonthName,
      totalCurrentMonthClosures,
      totalPrevMonthClosures,
      averageResolutionTime,
      openUnder3Days,
      open3To7Days,
      openOver7Days,
      openUnder3DaysPercent,
      open3To7DaysPercent,
      openOver7DaysPercent
    });
  } catch (error: any) {
    console.error('[KPI API ERROR]:', error);
    return NextResponse.json({ error: 'Failed to process KPI statistics' }, { status: 500 });
  }
}
