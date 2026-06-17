'use client';
import React, { useEffect, useState, useCallback } from 'react';

interface Complaint {
  id: string;
  number: string;
  type: string;
  status: string;
  solution: string;
  date: string;
  receiver: string;
}

interface Props {
  initialComplaints: Complaint[];
}

function CircleGauge({ percent, color, size = 140 }: { percent: number; color: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(percent, 100) / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.08} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.08}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#1e293b"
        fontSize={size * 0.18}
        fontWeight="bold"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

function StatCard({
  icon, label, value, color, percent, total,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any; label: string; value: number; color: string; percent: number; total: number;
}) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      padding: '28px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      border: `2px solid ${color}22`,
      minWidth: 0,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '16px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
          {icon}
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '2.8rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <CircleGauge percent={percent} color={color} size={80} />
      </div>
    </div>
  );
}

// SVG icon paths
const ICONS = {
  total: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  resolved: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  unresolved: <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  waiting: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  ministry: <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  new: <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  general: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  late: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  today: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
};

function computeStats(complaints: Complaint[]) {
  const today = new Date().toISOString().split('T')[0];
  const total = complaints.length;
  const closed = complaints.filter(c => c.solution?.trim() === 'تم الحل').length;
  const open = complaints.filter(c => c.solution?.trim() === 'لم يتم الحل').length;
  const waiting = complaints.filter(c => c.solution?.trim() === 'بانتظار المستفيد').length;
  const ministry = complaints.filter(c => c.solution?.trim() === 'لدى الوزارة').length;
  const newT = complaints.filter(c => c.solution?.trim() === 'بلاغ جديد').length;
  const general = complaints.filter(c => c.solution?.trim() === 'مشكلة عامة').length;
  const late = complaints.filter(c => {
    const sol = c.solution?.trim() || '';
    const isNew = sol === 'بلاغ جديد' || sol === 'غير محدد' || sol === '';
    if (!isNew || !c.date || c.date === 'غير محدد') return false;
    try {
      const d = new Date(c.date);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return d < oneWeekAgo;
    } catch { return false; }
  }).length;
  const todayCount = complaints.filter(c => c.date === today).length;
  const resolutionRate = total > 0 ? (closed / total) * 100 : 0;
  const pct = (v: number) => total > 0 ? (v / total) * 100 : 0;
  return { total, closed, open, waiting, ministry, newT, general, late, todayCount, resolutionRate, pct };
}

export default function IndicatorsTV({ initialComplaints }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [now, setNow] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets-json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setComplaints(data);
      }
    } catch { /* silent */ }
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    const refresher = setInterval(refresh, 60000);
    return () => { clearInterval(clock); clearInterval(refresher); };
  }, [refresh]);

  const stats = computeStats(complaints);
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const cards = [
    { icon: ICONS.total,      label: 'إجمالي البلاغات',     value: stats.total,    color: '#6366f1', percent: 100 },
    { icon: ICONS.today,      label: 'بلاغات اليوم',        value: stats.todayCount, color: '#0ea5e9', percent: stats.pct(stats.todayCount) },
    { icon: ICONS.resolved,   label: 'تم الحل',             value: stats.closed,   color: '#22c55e', percent: stats.pct(stats.closed) },
    { icon: ICONS.unresolved, label: 'لم يتم الحل',         value: stats.open,     color: '#ef4444', percent: stats.pct(stats.open) },
    { icon: ICONS.waiting,    label: 'بانتظار المستفيد',    value: stats.waiting,  color: '#ec4899', percent: stats.pct(stats.waiting) },
    { icon: ICONS.ministry,   label: 'لدى الوزارة',         value: stats.ministry, color: '#f59e0b', percent: stats.pct(stats.ministry) },
    { icon: ICONS.new,        label: 'بلاغ جديد',           value: stats.newT,     color: '#8b5cf6', percent: stats.pct(stats.newT) },
    { icon: ICONS.general,    label: 'مشكلة عامة',          value: stats.general,  color: '#06b6d4', percent: stats.pct(stats.general) },
    { icon: ICONS.late,       label: 'متأخرة (أكثر من أسبوع)', value: stats.late, color: '#f43f5e', percent: stats.pct(stats.late) },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      direction: 'rtl',
      fontFamily: "'Segoe UI', 'Noto Sans Arabic', sans-serif",
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        borderRadius: '20px',
        padding: '20px 32px',
        marginBottom: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/شعار بلدي الرسمي.png" alt="بلدي" style={{ height: 56, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>متصفح المؤشرات</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 2 }}>وحدة بلدي — لوحة العرض</div>
          </div>
        </div>

        {/* معدل الإنجاز */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <CircleGauge percent={stats.resolutionRate} color="#22c55e" size={120} />
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4, fontWeight: 600 }}>معدل الإنجاز</div>
          </div>

          <div style={{ textAlign: 'left', borderRight: '1px solid #e2e8f0', paddingRight: '20px' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-1px' }}>{timeStr}</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 4 }}>{dateStr}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 6 }}>
              آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '18px',
      }}>
        {cards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            color={card.color}
            percent={card.percent}
            total={stats.total}
          />
        ))}
      </div>

      {/* Footer bar */}
      <div style={{
        marginTop: '20px',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          {[
            { label: 'معدل الحل', value: `${Math.round(stats.resolutionRate)}%`, color: '#22c55e' },
            { label: 'إجمالي البلاغات', value: stats.total, color: '#6366f1' },
            { label: 'محتاجة متابعة', value: stats.open + stats.late, color: '#ef4444' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{item.label}:</span>
              <span style={{ color: item.color, fontWeight: 700, fontSize: '0.95rem' }}>{item.value}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>يتجدد تلقائياً كل دقيقة</div>
      </div>
    </div>
  );
}
