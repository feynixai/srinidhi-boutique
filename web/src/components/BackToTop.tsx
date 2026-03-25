'use client';
import { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 500);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="fixed bottom-24 right-4 z-40 bg-white/70 backdrop-blur-xl border border-white/40 shadow-card rounded-full px-4 py-2.5 flex items-center gap-1.5 text-[#1a1a2e] hover:bg-white/90 transition-all duration-200 animate-slide-up"
    >
      <FiArrowUp size={14} />
      <span className="text-xs font-semibold">Top</span>
    </button>
  );
}
