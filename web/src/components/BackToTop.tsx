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
      className="fixed z-40 w-10 h-10 flex items-center justify-center rounded-full
        bottom-[140px] right-4 md:bottom-20 md:right-6
        bg-white/80 backdrop-blur-xl border border-white/40 shadow-card
        text-[#1a1a2e] hover:bg-white transition-all duration-200 animate-slide-up"
    >
      <FiArrowUp size={16} />
    </button>
  );
}
