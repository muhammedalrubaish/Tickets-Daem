'use client';

import React, { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  number: string;
  solution: string;
  receiver: string;
  date: string;
  type?: string;
}

interface Counts {
  new: number;
  recent: number;
  old: number;
  veryOld: number;
  unassigned: number;
  notSolved: number;
}

const LATEST_VERSION = '1.1';

export default function ExtensionPopupPage() {
  const [counts, setCounts] = useState<Counts>({ new: 0, recent: 0, old: 0, veryOld: 0, unassigned: 0, notSolved: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [clientVersion, setClientVersion] = useState<string>('');
  
  const [role, setRole] = useState<'admin' | 'support' | null>(null);
  const [password, setPassword] = useState<string>('');
  const [showPasswordField, setShowPasswordField] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [nextEmployee, setNextEmployee] = useState<string>('غير محدد');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setClientVersion(params.get('v') || '');
      
      const paramRole = params.get('role');
      const paramPass = params.get('p') || '';
      const savedRole = localStorage.getItem('daemRole') as 'admin' | 'support' | null;
      const savedPass = localStorage.getItem('daemPassword') || '';
      
      const activeRole = savedRole || (paramRole && paramRole !== 'null' ? (paramRole as 'admin' | 'support') : null);
      const activePass = savedPass || paramPass || '';

      if (activePass) {
        setPassword(activePass);
      }

      if (activeRole) {
        setRole(activeRole);
        localStorage.setItem('daemRole', activeRole);
        if (activePass) {
          localStorage.setItem('daemPassword', activePass);
        }
        window.parent.postMessage({ action: 'SET_ROLE', role: activeRole, password: activePass }, '*');
      }
    }

    async function loadData() {
      try {
        const res = await fetch('/api/tickets-json');
        if (res.ok) {
          const tickets: Ticket[] = await res.json();
          const calculatedCounts = calculateCounts(tickets);
          setCounts(calculatedCounts);

          // حساب الموظف التالي بالدور
          const priorityOrder = [
            { name: 'البراء النصيان', user: 'a.alnesayan' },
            { name: 'محمد الربيش', user: 'mialrubaish' },
            { name: 'عبدالرحمن العمري', user: 'af.alamri' },
            { name: 'عزام الحربي', user: 'azz.alharbi' },
            { name: 'صالح الغصن', user: 's.alghosen' },
            { name: 'طارق الهدياني', user: 't.alhedyani' },
            { name: 'ثامر المنصور', user: 't.almansour' }
          ];

          const empCounts: Record<string, number> = {};
          priorityOrder.forEach(emp => {
            empCounts[emp.name] = 0;
          });

          const baseTickets = tickets.filter(t => 
            t.date && 
            t.date >= '2026-04-04' && 
            t.type !== 'تحديث نظام' && 
            t.type !== 'تحديثات النظام' &&
            !(t.number && t.number.includes('📢'))
          );

          baseTickets.forEach(t => {
            const receiver = (t.receiver || '').trim();
            if (!receiver || receiver === 'غير محدد') return;

            const matched = priorityOrder.find(p => 
              receiver.includes(p.name.split(' ')[0]) || 
              p.name.includes(receiver.split(' ')[0])
            );

            if (matched) {
              empCounts[matched.name]++;
            }
          });

          let bestCandidate = priorityOrder[0];
          let minCount = empCounts[bestCandidate.name];

          for (const emp of priorityOrder) {
            if (empCounts[emp.name] < minCount) {
              minCount = empCounts[emp.name];
              bestCandidate = emp;
            }
          }
          setNextEmployee(bestCandidate.name);
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

  const handleLoginSupport = () => {
    setRole('support');
    localStorage.setItem('daemRole', 'support');
    localStorage.removeItem('daemPassword');
    window.parent.postMessage({ action: 'SET_ROLE', role: 'support', password: '' }, '*');
  };

  const handleLoginAdmin = () => {
    const EMPLOYEES = [
      { name: 'البراء النصيان', user: 'a.alnesayan', pass: '1111' },
      { name: 'عبدالله العويد', user: 'aalowaid', pass: '2222' },
      { name: 'عبدالرحمن العمري', user: 'af.alamri', pass: '3333' },
      { name: 'عزام الحربي', user: 'azz.alharbi', pass: '4444' },
      { name: 'محمد الربيش', user: 'mialrubaish', pass: 'Balady.20' },
      { name: 'صالح الغصن', user: 's.alghosen', pass: '6666' },
      { name: 'طارق الهدياني', user: 't.alhedyani', pass: '7777' },
      { name: 'ثامر المنصور', user: 't.almansour', pass: '8888' },
    ];

    let currentEmployees = EMPLOYEES;
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('balady_employees_v1');
      if (cached) {
        try {
          currentEmployees = JSON.parse(cached);
        } catch (e) {}
      }
    }

    const adminUser = currentEmployees.find(e => e.user === 'mialrubaish');
    const correctPassword = adminUser ? adminUser.pass : 'Balady.20';

    if (password.trim() === correctPassword.trim()) {
      setRole('admin');
      localStorage.setItem('daemRole', 'admin');
      localStorage.setItem('daemPassword', password);
      window.parent.postMessage({ action: 'SET_ROLE', role: 'admin', password: password }, '*');
      setErrorMsg('');
    } else {
      setErrorMsg('كلمة المرور غير صحيحة! ⚠️');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('daemRole');
    localStorage.removeItem('daemPassword');
    window.parent.postMessage({ action: 'SET_ROLE', role: 'support', password: '' }, '*');
    setShowPasswordField(false);
    setPassword('');
    setErrorMsg('');
  };

  function calculateCounts(tickets: Ticket[]): Counts {
    let counts = { new: 0, recent: 0, old: 0, veryOld: 0, unassigned: 0, notSolved: 0 };
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
      } else if (status === 'لم يتم الحل') {
        counts.notSolved++;
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

  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);

  return (
    <div className="popup-container">
      <style>{`
        /* Reset and self-contain styles for extension-popup */
        html, body {
          background: #0f172a !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: 100% !important;
        }

        /* Custom scrollbar for dark theme */
        ::-webkit-scrollbar {
          width: 4px !important;
        }
        ::-webkit-scrollbar-track {
          background: #0f172a !important;
        }
        ::-webkit-scrollbar-thumb {
          background: #334155 !important;
          border-radius: 4px !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #10b981 !important;
        }

        .popup-container {
          background: #0f172a !important;
          color: #f8fafc !important;
          font-family: 'Cairo', sans-serif !important;
          margin: 0 !important;
          padding: 10px !important;
          width: 100% !important;
          min-height: 100% !important;
          box-sizing: border-box !important;
          direction: rtl !important;
          overflow-y: auto !important;
        }

        .header-logo {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          margin-bottom: 4px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding-bottom: 4px !important;
          width: 100% !important;
        }

        .logo-img {
          width: 38px !important;
          height: 38px !important;
          border-radius: 10px !important;
          margin-bottom: 4px !important;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25) !important;
          border: 2px solid #10b981 !important;
          transition: all 0.3s ease !important;
        }

        .logo-img:hover {
          transform: scale(1.06) rotate(3deg) !important;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45) !important;
        }

        h3.title {
          margin: 0 !important;
          font-size: 13px !important;
          color: #10b981 !important;
          text-align: center !important;
          font-weight: 700 !important;
        }

        .stats-grid {
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
        }

        .stat-card {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 5px 10px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border-radius: 6px !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          transition: all 0.2s ease !important;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }

        .label-group {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
        }

        .dot {
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
        }

        .count {
          font-weight: 700 !important;
          font-size: 14px !important;
          color: #38bdf8 !important;
        }

        .dot-new { background: #3b82f6 !important; box-shadow: 0 0 8px #3b82f6 !important; }
        .dot-recent { background: #ec4899 !important; box-shadow: 0 0 8px #ec4899 !important; }
        .dot-very-old { background: #fbbf24 !important; box-shadow: 0 0 8px #fbbf24 !important; }
        .dot-old { background: #06b6d4 !important; box-shadow: 0 0 8px #06b6d4 !important; }
        .dot-not-solved { background: #ef4444 !important; box-shadow: 0 0 8px #ef4444 !important; }
        .dot-unassigned { background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%) !important; box-shadow: 0 0 8px #ef4444 !important; }

        .update-banner {
          display: block !important;
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%) !important;
          color: white !important;
          text-decoration: none !important;
          text-align: center !important;
          padding: 8px 10px !important;
          border-radius: 8px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          margin-bottom: 10px !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          transition: all 0.2s ease !important;
          animation: banner-glow 1.5s infinite ease-in-out !important;
        }

        .update-banner:hover {
          filter: brightness(1.1) !important;
          transform: translateY(-1px) !important;
        }

        @keyframes banner-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); }
        }

        .daem-link-container {
          margin-top: 6px !important;
          display: flex !important;
          justify-content: center !important;
          width: 100% !important;
        }

        .daem-btn {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          padding: 4px 8px !important;
          background: linear-gradient(135deg, #10b981, #059669) !important;
          color: white !important;
          text-decoration: none !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 10px !important;
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
          margin-top: 6px !important;
          font-size: 8px !important;
          text-align: center !important;
          opacity: 0.8 !important;
          padding-bottom: 6px !important;
        }

        .logout-footer {
          margin-top: 4px !important;
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding-top: 4px !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }

        .badge-role {
          font-size: 9px !important;
          font-weight: 700 !important;
          color: #94a3b8 !important;
        }

        .btn-switch-account {
          background: transparent !important;
          border: none !important;
          color: #ef4444 !important;
          font-family: 'Cairo', sans-serif !important;
          font-size: 9px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          transition: all 0.2s !important;
        }

        .btn-switch-account:hover {
          background: rgba(239, 68, 68, 0.15) !important;
        }

        .space-dashboard {
          background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.05)) !important;
          border: 1px dashed rgba(16, 185, 129, 0.3) !important;
          border-radius: 10px !important;
          padding: 10px !important;
          margin-top: 8px !important;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.1) !important;
          direction: rtl !important;
          text-align: right !important;
          font-family: 'Cairo', sans-serif !important;
          animation: space-pulse 4s infinite alternate !important;
          display: block !important;
        }

        @keyframes space-pulse {
          0% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
          100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.25); border-color: rgba(59, 130, 246, 0.5); }
        }

        .space-title {
          font-size: 10px !important;
          font-weight: 700 !important;
          color: #38bdf8 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          margin-bottom: 8px !important;
        }

        .space-metric-container {
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
        }

        .space-bar-bg {
          width: 100% !important;
          height: 6px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border-radius: 3px !important;
          overflow: hidden !important;
          position: relative !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .space-bar-fill {
          height: 100% !important;
          background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6) !important;
          border-radius: 3px !important;
          transition: width 1s ease-in-out !important;
          box-shadow: 0 0 8px #10b981 !important;
        }

        .space-text-row {
          display: flex !important;
          justify-content: space-between !important;
          font-size: 10px !important;
          color: #e2e8f0 !important;
        }

        .space-assignee-tag {
          background: rgba(16, 185, 129, 0.1) !important;
          color: #10b981 !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
          font-weight: 700 !important;
          font-size: 9px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
        }

        .login-view {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 100vh !important;
          text-align: center !important;
        }

        .logo-container {
          margin-bottom: 15px !important;
        }

        .logo-img-login {
          width: 55px !important;
          height: 55px !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25) !important;
          border: 2px solid #10b981 !important;
        }

        h2.login-title {
          margin: 0 0 8px 0 !important;
          font-size: 15px !important;
          color: #10b981 !important;
          font-weight: 700 !important;
        }

        p.login-desc {
          margin: 0 0 20px 0 !important;
          font-size: 11px !important;
          color: #94a3b8 !important;
        }

        .login-btn {
          width: 100% !important;
          padding: 10px 12px !important;
          margin-bottom: 10px !important;
          border-radius: 8px !important;
          border: none !important;
          font-family: 'Cairo', sans-serif !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }

        .login-btn-primary {
          background: linear-gradient(135deg, #10b981, #059669) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2) !important;
        }

        .login-btn-secondary {
          background: #1e293b !important;
          color: #f8fafc !important;
          border: 1px solid #334155 !important;
        }

        .login-btn:hover {
          transform: translateY(-2px) !important;
          filter: brightness(1.15) !important;
        }

        #password-section {
          width: 100% !important;
          margin-top: 10px !important;
          animation: slideDown 0.3s ease forwards !important;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .password-input-container {
          position: relative !important;
          width: 100% !important;
          margin-bottom: 8px !important;
        }

        .login-input {
          width: 100% !important;
          padding: 8px 38px 8px 12px !important;
          border-radius: 6px !important;
          border: 1px solid #334155 !important;
          background-color: #1e293b !important;
          color: white !important;
          font-family: 'Cairo', sans-serif !important;
          font-size: 11px !important;
          text-align: center !important;
          outline: none !important;
          box-sizing: border-box !important;
        }

        .login-input:focus {
          border-color: #10b981 !important;
        }

        .password-toggle-btn {
          position: absolute !important;
          right: 10px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          background: transparent !important;
          border: none !important;
          color: #94a3b8 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          outline: none !important;
        }

        .password-toggle-btn:hover {
          color: #10b981 !important;
        }

        .error-message {
          color: #ef4444 !important;
          font-size: 10px !important;
          margin-bottom: 8px !important;
          font-weight: 700 !important;
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

      {role === null ? (
        <div className="login-view">
          <div className="logo-container">
            <img src="/ايقونة داعم.png" alt="Daem Plus Logo" className="logo-img-login" />
          </div>
          <h2 className="login-title">🚀 مرحباً بك في داعم بلس</h2>
          <p className="login-desc">الرجاء اختيار صلاحية الدخول لبدء الاستخدام</p>
          
          <button onClick={handleLoginSupport} className="login-btn login-btn-secondary">
            👤 دخول (نسخ ولصق فقط)
          </button>
          
          <button onClick={() => setShowPasswordField(true)} className="login-btn login-btn-primary">
            🔑 دخول بالصلاحيات الكاملة (إنشاء وإسناد)
          </button>
          
          {showPasswordField && (
            <div id="password-section">
              <div className="password-input-container">
                <input 
                  type={showPasswordText ? "text" : "password"} 
                  className="login-input" 
                  placeholder="أدخل كلمة مرور محمد الربيش"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLoginAdmin();
                  }}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  title={showPasswordText ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPasswordText ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              <button onClick={handleLoginAdmin} className="login-btn login-btn-primary">تأكيد الدخول</button>
              {errorMsg && <div className="error-message">{errorMsg}</div>}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="header-logo">
            <img src="/ايقونة داعم.png" alt="Daem Plus Logo" className="logo-img" />
            <h3 className="title">🚀 داعم بلس Premium</h3>
          </div>

          {clientVersion && clientVersion !== LATEST_VERSION && (
            <a href="/Daem-Plus.zip" download className="update-banner">
              ⚠️ يتوفر تحديث جديد للإضافة ({LATEST_VERSION})! اضغط للتحميل ⚡
            </a>
          )}

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
                  <div className="dot dot-not-solved"></div>
                  <span>لم يتم الحل (بالموقع)</span>
                </div>
                <div className="count">{counts.notSolved}</div>
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

          <div className="footer">
            <div>تطوير ذكي - 2026 (تحديث فوري تلقائي ⚡)</div>
            <div className="logout-footer">
              <span className="badge-role" style={{ color: role === 'admin' ? '#10b981' : '#94a3b8' }}>
                الدور: {role === 'admin' ? '🔑 صلاحيات كاملة' : '👤 نسخ ولصق فقط'}
              </span>
              <button onClick={handleLogout} className="btn-switch-account">
                ❌ تبديل الحساب
              </button>
            </div>

            {/* مركز التوزيع يظهر لكلا الدورين دائماً */}
            <div className="space-dashboard">
              <div className="space-title">
                <span>🛰️ مركز التوزيع والتحكم</span>
              </div>
              <div className="space-metric-container">
                <div className="space-text-row">
                  <span>إجمالي البلاغات النشطة:</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                    {counts.new + counts.recent + counts.veryOld + counts.old + counts.notSolved}
                  </span>
                </div>
                <div className="space-bar-bg">
                  <div 
                    className="space-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, ((counts.new + counts.recent + counts.veryOld + counts.old + counts.notSolved) / 100) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="space-text-row" style={{ marginTop: '6px' }}>
                  <span>المستقبل التالي بالدور:</span>
                  <span className="space-assignee-tag">
                    <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981', display: 'inline-block', flexShrink: 0 }}></span>
                    {nextEmployee}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
