'use client';

import { useState } from 'react';
import styles from '../page.module.css';

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState<'admin' | 'employee' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (failedAttempts >= 3) {
      setError('تم حظر الدخول لتجاوز عدد المحاولات المسموح به (3 محاولات). يرجى مراجعة المسؤول.');
      return;
    }

    setIsLoading(true);
    setError('');

    // التحقق من بيانات الدخول يتم بالكامل في الخادم ويعيد توكن موقعاً
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          loginMode === 'admin'
            ? { mode: 'viewer', password }
            : { username: username.trim(), password: password.trim() }
        ),
      });
      const data = await res.json().catch(() => ({} as any));

      if (res.ok && data.token) {
        document.cookie = `auth_token=${encodeURIComponent(data.token)}; path=/; max-age=604800`;
        window.location.href = '/';
      } else {
        const newCount = failedAttempts + 1;
        setFailedAttempts(newCount);
        setIsLoading(false);

        if (newCount >= 3) {
          setError('تم حظر الدخول لتجاوز عدد المحاولات (3 محاولات). يرجى مراجعة المسؤول.');
        } else {
          setError(`بيانات الدخول غير صحيحة. المحاولات المتبقية: ${3 - newCount}`);
        }
      }
    } catch (err) {
      setIsLoading(false);
      setError('تعذر الاتصال بالخادم. حاول مرة أخرى.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard} style={{maxWidth: loginMode ? '450px' : '600px'}}>
        <img src="/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png" alt="شعار بلدي" className={styles.loginLogo} />
        <h1 className={styles.loginTitle}>نظام بلاغات وحدة بلدي</h1>
        
        {!loginMode ? (
          <div className={styles.loginModesGrid}>
            <button className={styles.modeCard} onClick={() => setLoginMode('admin')}>
              <div className={styles.modeIcon} style={{color: 'var(--primary)'}}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h3>بوابة المشرف</h3>
              <p>للمتابعة فقط</p>
            </button>
            <button className={styles.modeCard} onClick={() => setLoginMode('employee')}>
              <div className={styles.modeIcon} style={{color: 'var(--primary)'}}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>
              <h3>بوابة الموظف</h3>
              <p>تحديث ومعالجة البلاغات</p>
            </button>
          </div>
        ) : (
          <div className={styles.loginFormContainer}>
            <button className={styles.backBtn} onClick={() => { setLoginMode(null); setError(''); setPassword(''); setUsername(''); }}>
              &rarr; العودة للخيارات
            </button>
            <h2 style={{fontSize: '1.2rem', marginBottom: '1.5rem', textAlign: 'center'}}>
              {loginMode === 'admin' ? 'دخول المشرف (رؤية فقط)' : 'دخول الموظف (تعديل)'}
            </h2>
            
            <form onSubmit={handleSubmit} className={styles.loginForm}>
              {loginMode === 'employee' && (
                <div style={{marginBottom: '1rem'}}>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    autoComplete="username"
                    placeholder="اسم المستخدم"
                    className={styles.loginInput}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              )}
              <div style={{position: 'relative', width: '100%'}}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  placeholder={loginMode === 'admin' ? "كلمة مرور المشرف" : "كلمة السر"}
                  className={styles.loginInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{paddingLeft: '3rem'}}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeBtn}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {error && <p className={styles.errorText}>{error}</p>}
              <button type="submit" className={styles.loginButton} disabled={isLoading}>
                {isLoading ? 'جاري التحقق...' : 'دخول النظام'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
