'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface HotCollection {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  badge: string;
}

const DEFAULT_COLLECTIONS: HotCollection[] = [
  { id: 1, title: 'Wedding Season', subtitle: 'Sarees · Lehengas · Kurtis', image: 'https://picsum.photos/seed/hot-wedding/600/400', href: '/shop?occasion=wedding', badge: '' },
  { id: 2, title: 'Festive Favorites', subtitle: 'Diwali · Navratri · Onam', image: 'https://picsum.photos/seed/hot-festival/600/400', href: '/shop?occasion=festival', badge: '' },
  { id: 3, title: 'Under ₹2,000', subtitle: 'Great Picks, Great Prices', image: 'https://picsum.photos/seed/hot-budget/600/400', href: '/shop?maxPrice=2000', badge: 'Budget Picks' },
  { id: 4, title: 'New Arrivals', subtitle: 'Just In This Season', image: 'https://picsum.photos/seed/hot-new/600/400', href: '/shop?sort=newest', badge: 'New' },
  { id: 5, title: 'Office Ready', subtitle: 'Elegant · Professional · Comfortable', image: 'https://picsum.photos/seed/hot-office/600/400', href: '/shop?occasion=office', badge: '' },
  { id: 6, title: 'Party Glam', subtitle: 'Shine at Every Celebration', image: 'https://picsum.photos/seed/hot-party/600/400', href: '/shop?occasion=party', badge: '' },
];

export function HotCollections() {
  const [collections, setCollections] = useState<HotCollection[]>(DEFAULT_COLLECTIONS);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sb-hot-collections') || 'null');
      if (stored) setCollections(stored);
    } catch {}
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="section-heading">Hot Collections</h2>
        <div className="divider-gold mx-auto" />
        <p className="text-[#1a1a2e]/70 text-base mt-2 tracking-wide">
          Shop by mood, season &amp; occasion
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={col.href}
            className="group relative overflow-hidden rounded-3xl aspect-[4/3] bg-gray-200 shadow-card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300"
          >
            <Image
              src={col.image}
              alt={col.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 640px) 50vw, 33vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/80 via-[#1a1a2e]/20 to-transparent group-hover:from-[#1a1a2e]/90 transition-all duration-300" />
            {col.badge && (
              <div className="absolute top-3 left-3 bg-[#c5a55a] text-[#1a1a2e] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                {col.badge}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3">
                <h3 className="text-white font-bold text-base leading-tight group-hover:text-[#c5a55a] transition-colors">{col.title}</h3>
                <p className="text-white/80 text-xs mt-0.5 tracking-wide">{col.subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
