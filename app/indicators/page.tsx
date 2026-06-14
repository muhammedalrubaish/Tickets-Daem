'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import styles from './indicators.module.css';

type Ticket = {
  id: string;
  number: string;
  type: string;
  status: string;
  solution: string;
  date: string;
  receiver: string;
};

export default function IndicatorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [countdown, setCountdown] = useState(30);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. التحقق من صلاحيات المشرف
  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split('; ');
      const authCookie = cookies.find(c => c.startsWith('auth_token='));
      
      if (!authCookie) {
        setAuthorized(false);
        router.push('/login');
        return;
      }

      const value = authCookie.split('=')[1];
      if (
        value === 'super_admin' || 
        value === 'viewer' || 
        value === 'admin' || 
        value === 'true' || 
        value.includes('محمد%20الربيش') ||
        decodeURIComponent(value).includes('محمد الربيش')
      ) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    checkAuth();
  }, [router]);

  // 2. تحديث الساعة والتاريخ
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. جلب البيانات من Supabase
  const fetchTicketsData = async () => {
    try {
      let allData: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .gte('reception_date', '2026-04-04')
          .order('reception_date', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) {
          console.error('Supabase error fetching kpis:', error);
          break;
        }

        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < batchSize) break;
        from += batchSize;
      }

      const formatted = allData.map((ticket: any) => ({
        id: ticket.notion_id || ticket.id || ticket.ticket_number,
        number: ticket.ticket_number || 'غير محدد',
        type: ticket.category_type || 'غير محدد',
        status: ticket.status || 'غير محدد',
        solution: ticket.solution || 'غير محدد',
        date: ticket.reception_date || 'غير محدد',
        receiver: ticket.receiver || 'غير محدد',
      }));

      setTickets(formatted);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tickets for indicators:', err);
      setLoading(false);
    }
  };

  // جلب البيانات لأول مرة عند التصريح بالدخول
  useEffect(() => {
    if (authorized) {
      fetchTicketsData();
    }
  }, [authorized]);

  // 4. آلية التحديث التلقائي كل 30 ثانية
  useEffect(() => {
    if (!authorized) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchTicketsData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [authorized]);

  // 5. احتساب الإحصائيات والمؤشرات
  const stats = useMemo(() => {
    // تصفية بلاغات النظام والإعلانات
    const baseTickets = tickets.filter(t => 
      t.date && 
      t.date >= '2026-04-04' && 
      t.type !== 'تحديث نظام' && 
      t.type !== 'تحديثات النظام' &&
      !t.number.includes('📢')
    );

    const total = baseTickets.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = baseTickets.filter(t => t.date === todayStr).length;

    const closed = baseTickets.filter(t => t.solution.trim() === 'تم الحل').length;
    const open = baseTickets.filter(t => t.solution.trim() === 'لم يتم الحل').length;
    const ministry = baseTickets.filter(t => t.solution.trim() === 'لدى الوزارة').length;
    const waiting = baseTickets.filter(t => t.solution.trim() === 'بانتظار المستفيد').length;
    const newTickets = baseTickets.filter(t => t.solution.trim() === 'بلاغ جديد').length;
    const general = baseTickets.filter(t => t.solution.trim() === 'مشكلة عامة').length;
    const undefinedStatus = baseTickets.filter(t => t.solution.trim() === 'غير محدد' || t.solution.trim() === '').length;

    const activePending = total - closed;
    const successRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    // حساب توزيع الموظفين
    const employeeCounts: Record<string, number> = {};
    baseTickets.forEach(t => {
      const name = t.receiver ? t.receiver.trim() : 'غير محدد';
      if (name !== 'الجميع' && name !== 'غير محدد') {
        employeeCounts[name] = (employeeCounts[name] || 0) + 1;
      }
    });

    const employeeList = Object.entries(employeeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      todayCount,
      closed,
      open,
      ministry,
      waiting,
      newTickets,
      general,
      undefinedStatus,
      activePending,
      successRate,
      employeeList
    };
  }, [tickets]);

  // وضع ملء الشاشة
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // حساب نسب المخطط الدائري (Donut Chart) لتمثيله باستخدام SVG
  const donutChartData = useMemo(() => {
    const data = [
      { name: 'تم الحل', val: stats.closed, color: '#16a34a' },
      { name: 'لم يتم الحل', val: stats.open, color: '#dc2626' },
      { name: 'لدى الوزارة', val: stats.ministry, color: '#3b82f6' },
      { name: 'بانتظار المستفيد', val: stats.waiting, color: '#eab308' },
      { name: 'بلاغ جديد', val: stats.newTickets, color: '#a855f7' },
      { name: 'مشكلة عامة', val: stats.general, color: '#94a3b8' }
    ].filter(d => d.val > 0);

    const totalVal = data.reduce((sum, d) => sum + d.val, 0);
    let accumulatedPercent = 0;

    return data.map(d => {
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
  }, [stats]);

  if (authorized === false) {
    return (
      <div className={styles.unauthorized}>
        <h2 style={{ color: 'var(--danger)', fontSize: '2rem' }}>⚠️ غير مصرح بالدخول</h2>
        <p style={{ fontSize: '1.2rem' }}>عذراً، هذه الصفحة مخصصة للمشرفين والمسؤولين فقط. جاري إعادة توجيهك...</p>
      </div>
    );
  }

  if (loading || authorized === null) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>جاري تحميل مؤشرات أداء وحدة بلدي...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* الشريط العلوي */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <img src="/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png" alt="شعار بلدي" className={styles.logo} />
          <div>
            <h1 className={styles.title}>شاشة مؤشرات الأداء الفنية | وحدة بلدي</h1>
            <p className={styles.subtitle}>{currentDate} | {currentTime}</p>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.refreshTimer}>
            <span className={styles.timerDot}></span>
            <span>تحديث تلقائي خلال: {countdown} ثانية</span>
          </div>

          <button onClick={toggleFullscreen} className={styles.btn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <>
                  <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
                </>
              ) : (
                <>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3M10 21v-6H4M14 3v6h6" />
                </>
              )}
            </svg>
            {isFullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة للتلفزيون'}
          </button>

          <button onClick={() => router.push('/')} className={styles.btn} style={{ backgroundColor: 'rgba(200, 165, 127, 0.15)', borderColor: 'rgba(200, 165, 127, 0.3)', color: '#C8A57F' }}>
            العودة للرئيسية &larr;
          </button>
        </div>
      </header>

      {/* لوحة المؤشرات الرقمية */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard} style={{ '--card-accent': '#C8A57F' } as React.CSSProperties}>
          <span className={styles.statLabel}>إجمالي البلاغات</span>
          <span className={styles.statValue}>{stats.total}</span>
          <span className={styles.statDesc}>منذ تاريخ 4 إبريل 2026</span>
        </div>

        <div className={styles.statCard} style={{ '--card-accent': '#16a34a' } as React.CSSProperties}>
          <span className={styles.statLabel}>نسبة الإنجاز</span>
          <span className={styles.statValue} style={{ color: '#16a34a' }}>{stats.successRate}%</span>
          <span className={styles.statDesc}>تم إنجاز {stats.closed} بلاغ بنجاح</span>
        </div>

        <div className={styles.statCard} style={{ '--card-accent': '#dc2626' } as React.CSSProperties}>
          <span className={styles.statLabel}>البلاغات النشطة القائمة</span>
          <span className={styles.statValue} style={{ color: '#dc2626' }}>{stats.activePending}</span>
          <span className={styles.statDesc}>تتطلب اتخاذ إجراء فوري</span>
        </div>

        <div className={styles.statCard} style={{ '--card-accent': '#a855f7' } as React.CSSProperties}>
          <span className={styles.statLabel}>بلاغات اليوم الجديدة</span>
          <span className={styles.statValue} style={{ color: '#a855f7' }}>{stats.todayCount}</span>
          <span className={styles.statDesc}>المستلمة خلال الـ 24 ساعة الماضية</span>
        </div>
      </section>

      {/* المخططات التفصيلية */}
      <section className={styles.chartsSection}>
        {/* مخطط توزيع الحالات */}
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
              <g className={styles.chartText}>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="bold" style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}>
                  {stats.total}
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

        {/* مخطط أعباء العمل وتوزيع الموظفين */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>👥 أعباء العمل وتوزيع البلاغات النشطة</h2>
          <div className={styles.employeeList}>
            {stats.employeeList.slice(0, 7).map((emp, idx) => {
              const maxCount = stats.employeeList[0]?.count || 1;
              const percent = Math.round((emp.count / maxCount) * 100);
              return (
                <div key={idx} className={styles.employeeRow}>
                  <div className={styles.employeeInfo}>
                    <span className={styles.employeeName}>{idx + 1}. {emp.name}</span>
                    <span className={styles.employeeCount}>{emp.count} بلاغ</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div className={styles.progressBarFill} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
            {stats.employeeList.length === 0 && (
              <p style={{ textAlign: 'center', color: '#718096', padding: '2rem' }}>لا توجد بيانات موظفين حالية.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
