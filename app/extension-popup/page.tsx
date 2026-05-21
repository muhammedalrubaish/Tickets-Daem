'use client';

import React, { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  number: string;
  solution: string;
  receiver: string;
  date: string;
}

interface Counts {
  new: number;
  recent: number;
  old: number;
  veryOld: number;
  unassigned: number;
}

export default function ExtensionPopupPage() {
  const [counts, setCounts] = useState<Counts>({ new: 0, recent: 0, old: 0, veryOld: 0, unassigned: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/tickets-json');
        if (res.ok) {
          const tickets: Ticket[] = await res.json();
          const calculatedCounts = calculateCounts(tickets);
          setCounts(calculatedCounts);
        }
      } catch (err) {
        console.error('Failed to load tickets in extension popup page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // Auto-refresh every 30 seconds to keep live counts perfectly updated
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  function calculateCounts(tickets: Ticket[]): Counts {
    let counts = { new: 0, recent: 0, old: 0, veryOld: 0, unassigned: 0 };
    if (!Array.isArray(tickets)) return counts;

    tickets.forEach(ticket => {
      const status = (ticket.solution || '').trim();

      if (status === 'بلاغ جديد') {
        counts.new++;
      } else if (status === 'بانتظار المستفيد') {
        counts.recent++;
      } else if (status === 'لدى الوزارة') {
        counts.veryOld++;
      } else if (status === 'مشكلة عامة') {
        counts.old++;
      }

      // حساب التذاكر المتأخرة لأكثر من أسبوع
      const isNew = status === 'بلاغ جديد' || status === 'غير محدد' || status === '';
      if (isNew && ticket.date && ticket.date !== 'غير محدد') {
        try {
          const ticketDate = new Date(ticket.date);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          if (ticketDate < oneWeekAgo) {
            counts.unassigned++;
          }
        } catch (e) {}
      }
    });
    return counts;
  }

  return (
    <div className="popup-container">
      <style>{`
        /* Reset and self-contain styles for extension-popup */
        html, body {
          background: #0f172a !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        .popup-container {
          background: #0f172a !important;
          color: #f8fafc !important;
          font-family: 'Cairo', sans-serif !important;
          margin: 0 !important;
          padding: 20px !important;
          width: 350px !important;
          min-height: 500px !important;
          box-sizing: border-box !important;
          direction: rtl !important;
        }

        .header-logo {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          margin-bottom: 20px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding-bottom: 15px !important;
          width: 100% !important;
        }

        .logo-img {
          width: 68px !important;
          height: 68px !important;
          border-radius: 16px !important;
          margin-bottom: 10px !important;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25) !important;
          border: 2.5px solid #10b981 !important;
          transition: all 0.3s ease !important;
        }

        .logo-img:hover {
          transform: scale(1.06) rotate(3deg) !important;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45) !important;
        }

        h3.title {
          margin: 0 !important;
          font-size: 18px !important;
          color: #10b981 !important;
          text-align: center !important;
          font-weight: 700 !important;
        }

        .stats-grid {
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
        }

        .stat-card {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 12px 16px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          transition: all 0.2s ease !important;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }

        .label-group {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
        }

        .dot {
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
        }

        .count {
          font-weight: 700 !important;
          font-size: 16px !important;
          color: #38bdf8 !important;
        }

        .dot-new { background: #3b82f6 !important; box-shadow: 0 0 8px #3b82f6 !important; }
        .dot-recent { background: #ec4899 !important; box-shadow: 0 0 8px #ec4899 !important; }
        .dot-very-old { background: #fbbf24 !important; box-shadow: 0 0 8px #fbbf24 !important; }
        .dot-old { background: #06b6d4 !important; box-shadow: 0 0 8px #06b6d4 !important; }
        .dot-unassigned { background: #ef4444 !important; box-shadow: 0 0 8px #ef4444 !important; }

        .daem-link-container {
          margin-top: 18px !important;
          display: flex !important;
          justify-content: center !important;
          width: 100% !important;
        }

        .daem-btn {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          padding: 10px 14px !important;
          background: linear-gradient(135deg, #10b981, #059669) !important;
          color: white !important;
          text-decoration: none !important;
          border-radius: 12px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          transition: all 0.3s ease !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15) !important;
        }

        .daem-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35) !important;
          filter: brightness(1.08) !important;
        }

        .footer {
          margin-top: 20px !important;
          font-size: 11px !important;
          text-align: center !important;
          opacity: 0.4 !important;
        }

        .loading-pulse {
          text-align: center !important;
          padding: 80px 0 !important;
          font-size: 14px !important;
          opacity: 0.7 !important;
          animation: pulse 1.5s infinite ease-in-out !important;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="header-logo">
        <img src="/ايقونة داعم.png" alt="Daem Plus Logo" className="logo-img" />
        <h3 className="title">🚀 داعم بلس Premium</h3>
      </div>

      {loading ? (
        <div className="loading-pulse">جاري جلب العدادات الحية... ⚡</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label-group">
              <div className="dot dot-new"></div>
              <span>بلاغات جديدة (بالموقع)</span>
            </div>
            <div className="count">{counts.new}</div>
          </div>

          <div className="stat-card">
            <div className="label-group">
              <div className="dot dot-recent"></div>
              <span>بانتظار المستفيد (بالموقع)</span>
            </div>
            <div className="count">{counts.recent}</div>
          </div>

          <div className="stat-card">
            <div className="label-group">
              <div className="dot dot-very-old"></div>
              <span>لدى الوزارة (بالموقع)</span>
            </div>
            <div className="count">{counts.veryOld}</div>
          </div>

          <div className="stat-card">
            <div className="label-group">
              <div className="dot dot-old"></div>
              <span>مشكلة عامة (بالموقع)</span>
            </div>
            <div className="count">{counts.old}</div>
          </div>

          <div className="stat-card">
            <div className="label-group">
              <div className="dot dot-unassigned"></div>
              <span>متأخر أكثر من أسبوع</span>
            </div>
            <div className="count">{counts.unassigned}</div>
          </div>
        </div>
      )}

      <div className="daem-link-container">
        <a href="https://daem.momah.gov.sa/sm/index.do" target="_blank" rel="noopener noreferrer" className="daem-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          منصة داعم الرسمية
        </a>
      </div>

      <div className="footer">تطوير ذكي - 2026 (تحديث فوري تلقائي ⚡)</div>
    </div>
  );
}
