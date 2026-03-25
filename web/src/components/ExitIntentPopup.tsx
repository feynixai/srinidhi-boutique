'use client';
import { useEffect, useState } from 'react';
import { FiX, FiMail } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const STORAGE_KEY = 'sb-exit-popup-shown';

export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 5) {
        setVisible(true);
        sessionStorage.setItem(STORAGE_KEY, '1');
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    }

    // Delay attaching listener so it doesn't fire immediately on page load
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  function dismiss() {
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    // Subscribe to newsletter
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
    toast.success('Coupon sent! Check your inbox.');
    setTimeout(() => setVisible(false), 2000);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Glass card */}
      <div className="relative bg-white/90 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-scale-in overflow-hidden">
        {/* Decorative gradient blob */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#B76E79]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#c5a55a]/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all z-10"
          aria-label="Close"
        >
          <FiX size={18} />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-green-500 flex justify-center mb-3"><svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <h3 className="font-serif text-xl text-[#1a1a2e] mb-1">You're all set!</h3>
            <p className="text-sm text-gray-500">Your 10% off coupon is on its way.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-[#c5a55a] flex justify-center mb-3"><svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/></svg></div>
              <h3 className="font-serif text-2xl text-[#1a1a2e] mb-2">Wait! Get 10% off</h3>
              <p className="text-sm text-[#1a1a2e]/60 leading-relaxed">
                Your first order is on us. Enter your email and we'll send your exclusive discount code.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={15} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#c5a55a] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#1a1a2e] text-[#c5a55a] py-3 rounded-full text-sm font-semibold tracking-wider hover:bg-[#2d2d4e] transition-colors"
              >
                CLAIM MY 10% OFF
              </button>
            </form>

            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-gray-600 hover:text-gray-600 mt-3 transition-colors"
            >
              No thanks, I'll pay full price
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.25s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>
    </div>
  );
}
