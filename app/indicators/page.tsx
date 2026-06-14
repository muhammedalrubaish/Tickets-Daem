'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './indicators.module.css';

type KPIStats = {
  total: number;
  todayCount: number;
  closed: number;
  open: number;
  ministry: number;
  waiting: number;
  newTickets: number;
  general: number;
  activePending: number;
  successRate: number;
  employeeList: { name: string; count: number }[];
  closureList: { name: string; currentMonth: number; prevMonth: number }[];
  currentMonthName: string;
  prevMonthName: string;
  totalCurrentMonthClosures: number;
  totalPrevMonthClosures: number;
  averageResolutionTime: string;
  openUnder3Days: number;
  open3To7Days: number;
  openOver7Days: number;
  openUnder3DaysPercent: number;
  open3To7DaysPercent: number;
  openOver7DaysPercent: number;
};

export default function IndicatorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. التحقق من صلاحيات المشرف
  useEffect(() => {
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

  // 3. جلب البيانات من الخادم (مؤشر واحد خفيف جداً)
  const fetchKpiData = async () => {
    try {
      const res = await fetch('/api/kpi-stats');
      if (!res.ok) throw new Error('API Fetch failed');
      const data = await res.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching computed indicators:', err);
      // في حالة فشل الاتصال، لا نوقف المراقبة
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchKpiData();
    }
  }, [authorized]);

  // 4. آلية التحديث التلقائي كل 30 ثانية
  useEffect(() => {
    if (!authorized) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchKpiData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [authorized]);

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

  // حساب نسب المخطط الدائري (Donut Chart) بناءً على القيم القادمة من السيرفر
  const donutChartData = useMemo(() => {
    if (!stats) return [];
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

  if (loading || authorized === null || !stats) {
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
                <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3M10 21v-6H4M14 3v6h6" />
              )}
            </svg>
            {isFullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة للتلفزيون'}
          </button>

          <button onClick={() => router.push('/')} className={styles.btn} style={{ backgroundColor: 'rgba(200, 165, 127, 0.15)', borderColor: 'rgba(200, 165, 127, 0.3)', color: '#C8A57F' }}>
            العودة للرئيسية &larr;
          </button>
        </div>
      </header>

      {/* لوحة المؤشرات الرقمية الرئيسية */}
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
              <g>
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

        {/* مخطط توزيع أعباء البلاغات القائمة مع إخفاء الأسماء */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>👥 توزيع البلاغات النشطة (غير المغلقة) على أعضاء الفريق</h2>
          <div className={styles.employeeList}>
            {stats.employeeList.slice(0, 6).map((emp, idx) => {
              const maxCount = stats.employeeList[0]?.count || 1;
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
            {stats.employeeList.length === 0 && (
              <p style={{ textAlign: 'center', color: '#718096', padding: '2rem' }}>لا توجد بلاغات نشطة معلقة حالياً.</p>
            )}
          </div>
        </div>
      </section>

      {/* القسم الثاني (التقفيل الشهري ومؤشرات المدة مع إخفاء الأسماء) */}
      <section className={styles.chartsSection}>
        {/* قائمة مقارنة تقفيل البلاغات مع إخفاء الأسماء */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>📅 مقارنة تقفيل البلاغات ({stats.prevMonthName} 🆚 {stats.currentMonthName})</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', margin: '0.5rem 0 1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e0' }}>إجمالي تقفيل {stats.prevMonthName} (السابق)</span>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C8A57F', margin: '0.2rem 0 0' }}>{stats.totalPrevMonthClosures} بلاغ</p>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e0' }}>إجمالي تقفيل {stats.currentMonthName} (الجاري)</span>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', margin: '0.2rem 0 0' }}>{stats.totalCurrentMonthClosures} بلاغ</p>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>العضو</th>
                  <th>إغلاق ({stats.prevMonthName})</th>
                  <th>إغلاق ({stats.currentMonthName})</th>
                  <th>مؤشر الأداء</th>
                </tr>
              </thead>
              <tbody>
                {stats.closureList.map((emp, idx) => {
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
                          <span className={`${styles.trendIndicator} ${styles.trendUp}`}>📈 +{diff} نمو</span>
                        ) : (
                          <span className={`${styles.trendIndicator} ${styles.trendDown}`}>📉 {diff} تراجع</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* إحصائيات مدد حل البلاغات وأعمار المعلق */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>⏱️ إحصائيات مدة معالجة وحل البلاغات</h2>
          
          <div className={styles.durationContainer}>
            <div className={styles.durationMiniCard}>
              <span className={styles.durationLabel}>متوسط مدة حل البلاغ</span>
              <p className={styles.durationVal}>{stats.averageResolutionTime}</p>
              <span style={{ fontSize: '0.8rem', color: '#718096' }}>يوم لكل بلاغ مغلق</span>
            </div>
            
            <div className={styles.durationMiniCard}>
              <span className={styles.durationLabel}>معدل الاستجابة اليومي</span>
              <p className={styles.durationVal} style={{ color: '#16a34a' }}>
                {stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0}%
              </p>
              <span style={{ fontSize: '0.8rem', color: '#718096' }}>نسبة البلاغات المقفلة</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#C8A57F', marginBottom: '1rem', fontWeight: 'bold' }}>⏳ أعمار البلاغات القائمة المعلقة حالياً:</h3>
            
            <div className={styles.distributionList}>
              {/* أقل من 3 أيام */}
              <div className={styles.distributionItem}>
                <span className={styles.distLabel}>حديثة (&lt; 3 أيام)</span>
                <div className={styles.distProgressBg}>
                  <div className={styles.distProgressFill} style={{ width: `${stats.openUnder3DaysPercent}%`, backgroundColor: '#16a34a' }}></div>
                </div>
                <span className={styles.distCount}>{stats.openUnder3Days} ({stats.openUnder3DaysPercent}%)</span>
              </div>

              {/* من 3 إلى 7 أيام */}
              <div className={styles.distributionItem}>
                <span className={styles.distLabel}>متوسطة (3-7 أيام)</span>
                <div className={styles.distProgressBg}>
                  <div className={styles.distProgressFill} style={{ width: `${stats.open3To7DaysPercent}%`, backgroundColor: '#eab308' }}></div>
                </div>
                <span className={styles.distCount}>{stats.open3To7Days} ({stats.open3To7DaysPercent}%)</span>
              </div>

              {/* أكثر من 7 أيام */}
              <div className={styles.distributionItem}>
                <span className={styles.distLabel}>متأخرة (&gt; 7 أيام)</span>
                <div className={styles.distProgressBg}>
                  <div className={styles.distProgressFill} style={{ width: `${stats.openOver7DaysPercent}%`, backgroundColor: '#dc2626' }}></div>
                </div>
                <span className={styles.distCount}>{stats.openOver7Days} ({stats.openOver7DaysPercent}%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
