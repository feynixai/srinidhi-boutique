'use client';
import { useEffect, useState } from 'react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('cookie-consent')) {
        // Small delay so it doesn't flash on first paint
        const t = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  function accept() {
    try { localStorage.setItem('cookie-consent', 'accepted'); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[60] animate-slide-up"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        }}
        className="rounded-2xl px-5 py-4 flex items-center gap-4"
      >
        <span className="text-xl flex-shrink-0">🍪</span>
        <p className="text-sm text-[#1a1a2e]/80 flex-1 leading-snug">
          We use cookies for a better experience.
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 bg-[#1a1a2e] text-[#c5a55a] text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#2d2d4e] transition-colors"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
