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
        animation: 'pulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        marginBottom: '2rem'
      }}>
        <img 
          src="/%D8%B4%D8%B9%D8%A7%D8%B1%20%D8%A8%D9%84%D8%AF%D9%8A%20%D8%A7%D9%84%D8%B1%D8%B3%D9%85%D9%8A.png" 
          alt="شعار بلدي" 
          style={{ width: '150px', height: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0, 116, 113, 0.35))' }} 
        />
      </div>
      
      <div style={{
        width: '260px',
        height: '6px',
        background: 'rgba(0, 116, 113, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          background: 'linear-gradient(90deg, #007471 0%, #7fbc03 50%, #007471 100%)',
          backgroundSize: '200% 100%',
          borderRadius: '10px',
          animation: 'loadingBarFlow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          boxShadow: '0 0 8px rgba(127, 188, 3, 0.6)'
        }} />
      </div>

      <h3 className="loading-text" style={{
        background: 'linear-gradient(90deg, #007471 0%, #7fbc03 50%, #007471 100%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginTop: '1.5rem',
        fontWeight: 'bold',
        fontSize: '1.15rem',
        letterSpacing: '0.5px',
        animation: 'textShimmer 3s linear infinite',
        display: 'inline-flex',
        alignItems: 'center',
        direction: 'rtl'
      }}>
        جاري تحميل البيانات
        <span className="dot dot-1">.</span>
        <span className="dot dot-2">.</span>
        <span className="dot dot-3">.</span>
      </h3>

      <style jsx global>{`
        @keyframes loadingBarFlow {
          0% {
            transform: translateX(100%);
            background-position: 200% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            transform: translateX(-100%);
            background-position: 0% 50%;
          }
        }
        @keyframes textShimmer {
          0% { background-position: 200% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 10px 20px rgba(0, 116, 113, 0.25)); }
          50% { opacity: 0.9; transform: scale(0.97); filter: drop-shadow(0 10px 25px rgba(127, 188, 3, 0.4)); }
        }
        .dot {
          display: inline-block;
          font-size: 1.3rem;
          line-height: 1;
          animation: dotBounce 1.4s infinite both;
        }
        .dot-1 {
          animation-delay: 0s;
        }
        .dot-2 {
          animation-delay: 0.2s;
          margin-right: 1px;
        }
        .dot-3 {
          animation-delay: 0.4s;
          margin-right: 1px;
        }
        @keyframes dotBounce {
          0%, 80%, 100% {
            transform: scale(1) translateY(0);
            opacity: 0.3;
          }
          40% {
            transform: scale(1.4) translateY(-3px);
            opacity: 1;
            color: #7fbc03;
          }
        }
      `}</style>
    </div>
  );
}
