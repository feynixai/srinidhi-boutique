'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Collection {
  id: number;
  title: string;
  description: string;
  image: string;
  href: string;
  badge: string;
}

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 1, title: 'Bridal Collection', description: 'Exquisite pieces for your special day', image: 'https://picsum.photos/seed/col-bridal/600/800', href: '/shop?occasion=bridal', badge: 'Trending' },
  { id: 2, title: 'Festival Edit', description: 'Celebrate every occasion in style', image: 'https://picsum.photos/seed/col-festival/600/800', href: '/shop?occasion=festival', badge: 'New' },
  { id: 3, title: 'Office Chic', description: 'Elegant workwear for the modern woman', image: 'https://picsum.photos/seed/col-office/600/800', href: '/shop?occasion=office', badge: '' },
  { id: 4, title: 'Casual Luxe', description: 'Comfortable yet stylish everyday wear', image: 'https://picsum.photos/seed/col-casual/600/800', href: '/shop?occasion=casual', badge: '' },
];

export function ShopByCollection() {
  const [collections, setCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sb-collections') || 'null');
      if (stored) setCollections(stored);
    } catch {}
  }, []);

  if (collections.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="section-heading">Shop by Collection</h2>
        <div className="divider-gold mx-auto" />
        <p className="text-[#1a1a2e]/70 text-base mt-2 tracking-wide">
          Thoughtfully curated, just for you
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={col.href}
            className="group relative overflow-hidden rounded-3xl aspect-[3/4] bg-gray-200 shadow-card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300"
          >
            <Image
              src={col.image}
              alt={col.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 640px) 50vw, 25vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/80 via-[#1a1a2e]/10 to-transparent group-hover:from-[#1a1a2e]/90 transition-all duration-300" />
            {col.badge && (
              <div className="absolute top-3 left-3 bg-[#c5a55a] text-[#1a1a2e] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                {col.badge}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-serif text-lg font-bold leading-tight group-hover:text-[#c5a55a] transition-colors">{col.title}</h3>
              <p className="text-white/70 text-xs mt-1 leading-relaxed">{col.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
