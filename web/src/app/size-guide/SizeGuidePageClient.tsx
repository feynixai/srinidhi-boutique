'use client';
import Link from 'next/link';
import { SizeGuideContent } from '@/components/SizeGuideContent';

export function SizeGuidePageClient() {
  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-8">
          <Link href="/" className="hover:text-[#c5a55a] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-white/70">Size Guide</span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2">Size Guide</h1>
        <p className="text-white/50 text-sm mb-8">
          Find your perfect fit across our Indian ethnic wear collection.
        </p>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8">
          <SizeGuideContent />
        </div>
      </div>
    </div>
  );
}
