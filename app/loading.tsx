'use client';

import React, { useState, useEffect } from 'react';

export default function Loading() {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // مدة التحميل الافتراضية 1.2 ثانية لتكون انسيابية ومثالية
    const duration = 1200; 
    const intervalTime = 10;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsDone(true);
          // تأخير بسيط لإتاحة فرصة لتأثير الاختفاء التدريجي (Fade out)
          setTimeout(() => {
            setIsVisible(false);
          }, 400);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#090e0c', // خلفية داكنة فخمة مائلة للخضار الملكي
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
      fontFamily: '"Cairo", sans-serif',
      opacity: isDone ? 0 : 1,
      transition: 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: isDone ? 'none' : 'auto',
      overflow: 'hidden',
    }}>
      {/* هالات الإضاءة المتحركة الخلفية (Ambient Floating Glow Orbs) */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-15%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 116, 113, 0.16) 0%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        animation: 'floatOrb 8s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-15%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(127, 188, 3, 0.12) 0%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        animation: 'floatOrb 10s ease-in-out infinite alternate-reverse',
      }} />

      {/* حاوية الشعار التفاعلية البارزة */}
      <div style={{
        marginBottom: '2.5rem',
        zIndex: 2,
        animation: 'softPulse 2s ease-in-out infinite',
      }}>
        <img 
          src="/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png" 
          alt="شعار بلدي" 
          style={{ 
            width: '160px', 
            height: 'auto', 
            filter: 'drop-shadow(0 15px 35px rgba(0, 116, 113, 0.35))' 
          }} 
        />
      </div>

      {/* شريط التحميل بتصميم زجاجي عصري (Glassmorphic Progress Bar Container) */}
      <div style={{
        width: '280px',
        height: '8px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 2,
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0, // التحميل يبدأ من اليمين ليتوافق مع اتجاه RTL العربي
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #7fbc03 0%, #007471 100%)', // هوية ألوان بلدي الرسمية (التيل والأخضر الفاتح)
          borderRadius: '20px',
          boxShadow: '0 0 12px rgba(127, 188, 3, 0.55)',
          transition: 'width 0.08s linear', // تمدد سلس وسريع
        }} />
      </div>

      {/* نسبة التحميل والنص التفاعلي الشفاف */}
      <div style={{
        marginTop: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        zIndex: 2,
      }}>
        <span style={{
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '1.3rem',
          letterSpacing: '1px',
          fontFamily: 'monospace',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
        }}>
          {Math.round(progress)}%
        </span>
        <h3 style={{
          color: 'rgba(255, 255, 255, 0.45)',
          fontWeight: 600,
          fontSize: '0.92rem',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}>
          جاري تهيئة لوحة التحكم
          <span className="loading-dots">...</span>
        </h3>
      </div>

      {/* التأثيرات الحركية العامة */}
      <style jsx global>{`
        @keyframes floatOrb {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(25px, -25px) scale(1.08); }
        }
        @keyframes softPulse {
          0%, 100% { 
            transform: scale(1); 
            filter: drop-shadow(0 15px 35px rgba(0, 116, 113, 0.25)); 
          }
          50% { 
            transform: scale(0.96); 
            filter: drop-shadow(0 15px 40px rgba(127, 188, 3, 0.35)); 
          }
        }
        .loading-dots {
          display: inline-block;
          animation: dotShimmer 1.5s infinite;
        }
        @keyframes dotShimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
