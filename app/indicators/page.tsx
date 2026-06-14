import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import styles from './indicators.module.css';

// إجبار الصفحة على أن تكون ديناميكية ليتم جلب البيانات من قاعدة البيانات في كل طلب
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Ticket = {
  id: string;
  number: string;
  type: string;
  status: string;
  solution: string;
  date: string;
  receiver: string;
  createdAt?: string;
};

// دالة جلب البيانات من الخادم مباشرة
async function getTicketsData() {
  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('tickets')
      .select('ticket_number, category_type, solution, reception_date, receiver, created_at')
      .gte('reception_date', '2026-04-04')
      .order('reception_date', { ascending: false })
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('[KPI Server Page] Supabase error:', error);
      break;
    }

    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  return allData.map((ticket: any) => ({
    id: ticket.notion_id || ticket.id || ticket.ticket_number,
    number: ticket.ticket_number || 'غير محدد',
    type: ticket.category_type || 'غير محدد',
    status: ticket.status || 'غير محدد',
    solution: ticket.solution || 'غير محدد',
    date: ticket.reception_date || 'غير محدد',
    receiver: ticket.receiver || 'غير محدد',
    createdAt: ticket.created_at
  }));
}

export default async function IndicatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. التحقق من الصلاحيات من خلال الخادم (Server-side Authentication)
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;
  let isAuthorized = false;

  if (token === 'BaladyTV2026') {
    isAuthorized = true;
  } else {
    // التحقق من كوكيز المتصفح في الخادم
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('auth_token');
    
    if (authCookie) {
      const value = authCookie.value;
      if (
        value === 'super_admin' ||
        value === 'viewer' ||
        value === 'admin' ||
        value === 'true' ||
        value.indexOf('محمد') !== -1 ||
        decodeURIComponent(value).indexOf('محمد') !== -1
      ) {
        isAuthorized = true;
      }
    }
  }

  // إعادة التوجيه الفوري من الخادم في حال عدم الصلاحية (يمنع ظهور صفحة سوداء)
  if (!isAuthorized) {
    redirect('/login');
  }

  // 2. جلب البيانات وحساب الإحصائيات بالكامل في الخادم
  const tickets = await getTicketsData();

  // تصفية بلاغات النظام والإعلانات
  const baseTickets = tickets.filter(t => 
    t.date && 
    t.date >= '2026-04-04' && 
    t.type !== 'تحديث نظام' && 
    t.type !== 'تحديثات النظام' &&
    !t.number.includes('📢')
  );

  const total = baseTickets.length;
  
  // توقيت السعودية الفعلي للحسابات
  const todayStr = new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayCount = baseTickets.filter(t => t.date === todayStr).length;

  const closed = baseTickets.filter(t => t.solution.trim() === 'تم الحل').length;
  const open = baseTickets.filter(t => t.solution.trim() === 'لم يتم الحل').length;
  const ministry = baseTickets.filter(t => t.solution.trim() === 'لدى الوزارة').length;
  const waiting = baseTickets.filter(t => t.solution.trim() === 'بانتظار المستفيد').length;
  const newTickets = baseTickets.filter(t => t.solution.trim() === 'بلاغ جديد').length;
  const general = baseTickets.filter(t => t.solution.trim() === 'مشكلة عامة').length;

  const activePending = total - closed;
  const successRate = total > 0 ? Math.round((closed / total) * 100) : 0;

  // حساب توزيع البلاغات النشطة للموظفين (مجهولة لخصوصية التلفزيون)
  const employeeCounts: Record<string, number> = {};
  baseTickets.forEach(t => {
    const name = t.receiver ? t.receiver.trim() : 'غير محدد';
    if (name !== 'الجميع' && name !== 'غير محدد') {
      employeeCounts[name] = (employeeCounts[name] || 0) + 1;
    }
  });

  const sortedEmployeeList = Object.entries(employeeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // حساب مقارنات الإغلاق الشهري
  const now = new Date(new Date().getTime() + 3 * 60 * 60 * 1000); // KSA Time
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

  const closedTickets = baseTickets.filter(t => t.solution.trim() === 'تم الحل');

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

    if (t.date && t.date.startsWith(currentMonthStr)) {
      closuresByEmployee[matchedEmployee].currentMonth++;
    } else if (t.date && t.date.startsWith(prevMonthStr)) {
      closuresByEmployee[matchedEmployee].prevMonth++;
    }
  });

  const sortedClosureList = Object.entries(closuresByEmployee)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.currentMonth - a.currentMonth);

  const totalCurrentMonthClosures = closedTickets.filter(t => t.date && t.date.startsWith(currentMonthStr)).length;
  const totalPrevMonthClosures = closedTickets.filter(t => t.date && t.date.startsWith(prevMonthStr)).length;

  // حساب مدد الحل
  let totalDurationDays = 0;
  let closedCountWithDuration = 0;

  closedTickets.forEach(t => {
    if (t.date && t.createdAt) {
      try {
        const recDate = new Date(t.date);
        const clsDate = new Date(t.createdAt);
        const diffTime = clsDate.getTime() - recDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        
        totalDurationDays += diffDays;
        closedCountWithDuration++;
      } catch (e) {}
    }
  });

  const averageResolutionTime = closedCountWithDuration > 0 
    ? (totalDurationDays / closedCountWithDuration).toFixed(1) 
    : '0';

  // أعمار المعلق
  let openUnder3Days = 0;
  let open3To7Days = 0;
  let openOver7Days = 0;
  const activeTickets = baseTickets.filter(t => t.solution.trim() !== 'تم الحل');

  activeTickets.forEach(t => {
    if (t.date && t.date !== 'غير محدد') {
      try {
        const recDate = new Date(t.date);
        const diffTime = now.getTime() - recDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 3) openUnder3Days++;
        else if (diffDays <= 7) open3To7Days++;
        else openOver7Days++;
      } catch (e) {}
    }
  });

  const activeCount = activeTickets.length || 1;
  const openUnder3DaysPercent = Math.round((openUnder3Days / activeCount) * 100);
  const open3To7DaysPercent = Math.round((open3To7Days / activeCount) * 100);
  const openOver7DaysPercent = Math.round((openOver7Days / activeCount) * 100);

  // حساب بيانات المخطط الدائري (Donut Chart)
  const donutRawData = [
    { name: 'تم الحل', val: closed, color: '#16a34a' },
    { name: 'لم يتم الحل', val: open, color: '#dc2626' },
    { name: 'لدى الوزارة', val: ministry, color: '#3b82f6' },
    { name: 'بانتظار المستفيد', val: waiting, color: '#eab308' },
    { name: 'بلاغ جديد', val: newTickets, color: '#a855f7' },
    { name: 'مشكلة عامة', val: general, color: '#94a3b8' }
  ].filter(d => d.val > 0);

  const totalVal = donutRawData.reduce((sum, d) => sum + d.val, 0);
  let accumulatedPercent = 0;

  const donutChartData = donutRawData.map(d => {
    const percent = totalVal > 0 ? (d.val / totalVal) * 100 : 0;
    const strokeDash = `${percent} ${100 - percent}`;
    const strokeOffset = 100 - accumulatedPercent;
    accumulatedPercent += percent;
    return {
      ...d,
      percent: Math.round(percent),
      strokeDash,
      strokeOffset
    };
  });

  // توليد تواريخ الساعة الحالية للخادم لعرضها كتوقيت التحديث
  const serverTimeFormatted = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const serverDateFormatted = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className={styles.container}>
      {/* وسم التحديث التلقائي الفوري بدون جافاسكريبت لراحة رامات التلفزيون وسرعته */}
      <meta httpEquiv="refresh" content="30" />
      
      {/* الشريط العلوي */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <img src="/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png" alt="شعار بلدي" className={styles.logo} />
          <div>
            <h1 className={styles.title}>شاشة مؤشرات الأداء الفنية | وحدة بلدي</h1>
            <p className={styles.subtitle}>{serverDateFormatted} | آخر تحديث: {serverTimeFormatted}</p>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.refreshTimer}>
            <span className={styles.timerDot}></span>
            <span>تحديث تلقائي للمتصفح كل 30 ثانية (بدون رامات)</span>
          </div>

          <a href="/" className={styles.btn} style={{ backgroundColor: 'rgba(200, 165, 127, 0.15)', borderColor: 'rgba(200, 165, 127, 0.3)', color: '#C8A57F' }}>
            العودة للرئيسية &larr;
          </a>
        </div>
      </header>

      {/* لوحة المؤشرات الرقمية الرئيسية */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard} style={{ '--card-accent': '#C8A57F' } as React.CSSProperties}>
          <span className={styles.statLabel}>إجمالي البلاغات</span>
          <span className={styles.statValue}>{total}</span>
          <span className={styles.statDesc}>منذ تاريخ 4 إبريل 2026</span>
        </div>

        <div className={styles.statCard} style={{ '--card-accent': '#16a34a' } as React.CSSProperties}>
          <span className={styles.statLabel}>نسبة الإنجاز</span>
          <span className={styles.statValue} style={{ color: '#16a34a' }}>{successRate}%</span>
          <span className={styles.statDesc}>تم إنجاز {closed} بلاغ بنجاح</span>
        </div>

        <div className={styles.statCard} style={{ '--card-accent': '#dc2626' } as React.CSSProperties}>
          <span className={styles.statLabel}>البلاغات النشطة القائمة</span>
          <span className={styles.statValue} style={{ color: '#dc2626' }}>{activePending}</span>
          <span className={styles.statDesc}>تتطلب اتخاذ إجراء فوري</span>
        </div>

        <div className={styles.statCard} style={{ '--card-accent': '#a855f7' } as React.CSSProperties}>
          <span className={styles.statLabel}>بلاغات اليوم الجديدة</span>
          <span className={styles.statValue} style={{ color: '#a855f7' }}>{todayCount}</span>
          <span className={styles.statDesc}>المستلمة خلال الـ 24 ساعة الماضية</span>
        </div>
      </section>

      {/* شبكة المؤشرات الكلية (صفحة واحدة 2x2 بدون شريط تمرير) */}
      <section className={styles.dashboardGrid}>
        
        {/* المخطط 1: الحالة التشغيلية للبلاغات */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>📊 الحالة التشغيلية للبلاغات</h2>
          <div className={styles.donutChartContainer}>
            <svg width="200" height="200" viewBox="0 0 42 42" className={styles.donutSvg}>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4.2"></circle>
              {donutChartData.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="4.5"
                  strokeDasharray={seg.strokeDash}
                  strokeDashoffset={seg.strokeOffset}
                  className={styles.donutSegment}
                ></circle>
              ))}
              <g>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="bold" style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}>
                  {total}
                </text>
                <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="#a0aec0" fontSize="2" style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}>
                  بلاغ إجمالي
                </text>
              </g>
            </svg>

            <div className={styles.chartLegend}>
              {donutChartData.map((seg, idx) => (
                <div key={idx} className={styles.legendItem}>
                  <span className={styles.legendColor} style={{ backgroundColor: seg.color }}></span>
                  <span className={styles.legendName}>{seg.name}</span>
                  <span className={styles.legendVal}>{seg.val} ({seg.percent}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* المخطط 2: توزيع أعباء البلاغات القائمة مع إخفاء الأسماء */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>👥 توزيع البلاغات النشطة (غير المغلقة) على أعضاء الفريق</h2>
          <div className={styles.employeeList}>
            {sortedEmployeeList.slice(0, 6).map((emp, idx) => {
              const maxCount = sortedEmployeeList[0]?.count || 1;
              const percent = Math.round((emp.count / maxCount) * 100);
              return (
                <div key={idx} className={styles.employeeRow}>
                  <div className={styles.employeeInfo}>
                    <span className={styles.employeeName}>{idx + 1}. الموظف {idx + 1}</span>
                    <span className={styles.employeeCount}>{emp.count} بلاغ معلق</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div className={styles.progressBarFill} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
            {sortedEmployeeList.length === 0 && (
              <p style={{ textAlign: 'center', color: '#718096', padding: '1rem', fontSize: '0.8rem' }}>لا توجد بلاغات نشطة معلقة حالياً.</p>
            )}
          </div>
        </div>

        {/* المخطط 3: مقارنة تقفيل البلاغات مع إخفاء الأسماء */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>📅 مقارنة تقفيل البلاغات ({prevMonthName} 🆚 {currentMonthName})</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', margin: '0.2rem 0 0.6rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e0' }}>تقفيل {prevMonthName} (السابق)</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#C8A57F', margin: '0' }}>{totalPrevMonthClosures} بلاغ</p>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e0' }}>تقفيل {currentMonthName} (الجاري)</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#16a34a', margin: '0' }}>{totalCurrentMonthClosures} بلاغ</p>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>العضو</th>
                  <th>إغلاق ({prevMonthName})</th>
                  <th>إغلاق ({currentMonthName})</th>
                  <th>مؤشر الأداء</th>
                </tr>
              </thead>
              <tbody>
                {sortedClosureList.slice(0, 6).map((emp, idx) => {
                  const diff = emp.currentMonth - emp.prevMonth;
                  const isPositive = diff > 0;
                  const isNeutral = diff === 0;

                  return (
                    <tr key={idx}>
                      <td>الموظف {idx + 1}</td>
                      <td>{emp.prevMonth}</td>
                      <td style={{ fontWeight: 'bold', color: emp.currentMonth > 0 ? '#16a34a' : '#e2e8f0' }}>{emp.currentMonth}</td>
                      <td>
                        {isNeutral ? (
                          <span className={`${styles.trendIndicator} ${styles.trendNeutral}`}>➖ مستقر</span>
                        ) : isPositive ? (
                          <span className={`${styles.trendIndicator} ${styles.trendUp}`}>📈 +{diff}</span>
                        ) : (
                          <span className={`${styles.trendIndicator} ${styles.trendDown}`}>📉 {diff}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* المخطط 4: إحصائيات مدد حل البلاغات وأعمار المعلق */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>⏱️ إحصائيات مدة معالجة وحل البلاغات</h2>
          
          <div className={styles.durationContainer}>
            <div className={styles.durationMiniCard}>
              <span className={styles.durationLabel}>متوسط مدة حل البلاغ</span>
              <p className={styles.durationVal}>{averageResolutionTime}</p>
              <span style={{ fontSize: '0.7rem', color: '#718096' }}>يوم لكل بلاغ مغلق</span>
            </div>
            
            <div className={styles.durationMiniCard}>
              <span className={styles.durationLabel}>معدل الاستجابة اليومي</span>
              <p className={styles.durationVal} style={{ color: '#16a34a' }}>
                {total > 0 ? Math.round((closed / total) * 100) : 0}%
              </p>
              <span style={{ fontSize: '0.7rem', color: '#718096' }}>نسبة البلاغات المقفلة</span>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
            <h3 style={{ fontSize: '0.8rem', color: '#C8A57F', marginBottom: '0.4rem', fontWeight: 'bold' }}>⏳ أعمار البلاغات القائمة المعلقة حالياً:</h3>
            
            <div className={styles.distributionList}>
              {/* أقل من 3 أيام */}
              <div className={styles.distributionItem}>
                <span className={styles.distLabel}>حديثة (&lt; 3 أيام)</span>
                <div className={styles.distProgressBg}>
                  <div className={styles.distProgressFill} style={{ width: `${openUnder3DaysPercent}%`, backgroundColor: '#16a34a' }}></div>
                </div>
                <span className={styles.distCount}>{openUnder3Days} ({openUnder3DaysPercent}%)</span>
              </div>

              {/* من 3 إلى 7 أيام */}
              <div className={styles.distributionItem}>
                <span className={styles.distLabel}>متوسطة (3-7 أيام)</span>
                <div className={styles.distProgressBg}>
                  <div className={styles.distProgressFill} style={{ width: `${open3To7DaysPercent}%`, backgroundColor: '#eab308' }}></div>
                </div>
                <span className={styles.distCount}>{open3To7Days} ({open3To7DaysPercent}%)</span>
              </div>

              {/* أكثر من 7 أيام */}
              <div className={styles.distributionItem}>
                <span className={styles.distLabel}>متأخرة (&gt; 7 أيام)</span>
                <div className={styles.distProgressBg}>
                  <div className={styles.distProgressFill} style={{ width: `${openOver7DaysPercent}%`, backgroundColor: '#dc2626' }}></div>
                </div>
                <span className={styles.distCount}>{openOver7Days} ({openOver7DaysPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
