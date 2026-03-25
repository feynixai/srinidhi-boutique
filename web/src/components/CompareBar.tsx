'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FiX, FiBarChart2 } from 'react-icons/fi';
import { useCompareStore } from '@/lib/compare-store';
import { useLanguage } from '@/lib/language-context';

export function CompareBar() {
  const { items, remove, clear } = useCompareStore();
  const { t } = useLanguage();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <FiBarChart2 size={18} className="text-[#c5a55a] flex-shrink-0" />
        <div className="flex items-center gap-2">
          {items.map((p) => (
            <div key={p.id} className="relative group">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#2d2d4e] border border-white/10 flex-shrink-0">
                {p.images[0] ? (
                  <Image src={p.images[0]} alt={p.name} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#c5a55a] text-xs font-serif">SB</div>
                )}
              </div>
              <button
                onClick={() => remove(p.id)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove from compare"
              >
                <FiX size={10} />
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: 3 - items.length }).map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-xl border border-white/10 border-dashed flex items-center justify-center">
              <span className="text-white/30 text-lg">+</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-1">
          <Link
            href="/compare"
            className="bg-[#c5a55a] text-[#1a1a2e] text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#d4b46a] transition-colors whitespace-nowrap"
          >
            {t.compareProducts}
          </Link>
          <button
            onClick={clear}
            className="text-white/40 hover:text-white/70 text-xs transition-colors whitespace-nowrap"
          >
            {t.clearAll}
          </button>
        </div>
      </div>
    </div>
  );
}
