'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type FlashSale = {
  id: string;
  title: string;
  discountPercent: number;
  endsAt: string;
  secondsRemaining: number;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function FlashSaleBanner({ sale }: { sale: FlashSale }) {
  const [secondsLeft, setSecondsLeft] = useState(sale.secondsRemaining);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (secondsLeft <= 0) { setVisible(false); return; }
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { setVisible(false); clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  if (!visible) return null;

  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;

  return (
    <div className="relative bg-gradient-to-r from-red-700 via-[#c5a55a] to-red-700 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-[0.15em] bg-white/20 px-2.5 py-1 rounded-full">
            FLASH SALE
          </span>
          <span className="text-sm font-semibold">{sale.title} — {sale.discountPercent}% OFF</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-mono">
            <span className="bg-black/30 px-2 py-0.5 rounded font-bold text-base">{pad(h)}</span>
            <span className="font-bold">:</span>
            <span className="bg-black/30 px-2 py-0.5 rounded font-bold text-base">{pad(m)}</span>
            <span className="font-bold">:</span>
            <span className="bg-black/30 px-2 py-0.5 rounded font-bold text-base">{pad(s)}</span>
          </div>
          <Link
            href="/shop"
            className="bg-white text-red-700 font-bold text-xs px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors tracking-wider whitespace-nowrap"
          >
            SHOP NOW
          </Link>
          <button
            onClick={() => setVisible(false)}
            className="text-white/70 hover:text-white text-lg leading-none ml-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
