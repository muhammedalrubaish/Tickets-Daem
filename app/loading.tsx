'use client';

import React from 'react';

export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      fontFamily: '"Cairo", sans-serif'
    }}>
      <div style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        marginBottom: '2rem'
      }}>
        <img 
          src="/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png" 
          alt="شعار بلدي" 
          style={{ width: '150px', height: 'auto', dropShadow: '0 10px 15px rgba(34, 197, 94, 0.2)' }} 
        />
      </div>
      
      <div style={{
        width: '250px',
        height: '6px',
        background: 'rgba(34, 197, 94, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
          borderRadius: '10px',
          animation: 'loadingBar 1.5s ease-in-out infinite',
          transformOrigin: 'left'
        }} />
      </div>
      <h3 style={{
        color: 'var(--primary)',
        marginTop: '1.5rem',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        letterSpacing: '0.5px'
      }}>
        جاري تحميل البيانات...
      </h3>

      <style jsx global>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .8; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
