'use client';
import { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-rose-gold text-white shadow-lg flex items-center justify-center hover:bg-rose-gold/90 transition-all"
    >
      <FiArrowUp size={18} />
    </button>
  );
}
