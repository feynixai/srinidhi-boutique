'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Category {
  id: number;
  label: string;
  image: string;
  href: string;
  rowSpan: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, label: 'Sarees', image: 'https://picsum.photos/seed/cat-sarees/600/750', href: '/category/sarees', rowSpan: 2 },
  { id: 2, label: 'Kurtis', image: 'https://picsum.photos/seed/cat-kurtis/600/600', href: '/category/kurtis', rowSpan: 1 },
  { id: 3, label: 'Lehengas', image: 'https://picsum.photos/seed/cat-lehengas/600/600', href: '/category/lehengas', rowSpan: 1 },
  { id: 4, label: 'Blouses', image: 'https://picsum.photos/seed/cat-blouses/600/600', href: '/category/blouses', rowSpan: 1 },
  { id: 5, label: 'Accessories', image: 'https://picsum.photos/seed/cat-accessories/600/600', href: '/category/accessories', rowSpan: 1 },
  { id: 6, label: 'Offers', image: 'https://picsum.photos/seed/cat-offers/600/600', href: '/offers', rowSpan: 1 },
];

export function ShopByCategory() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sb-categories') || 'null');
      if (stored) setCategories(stored);
    } catch {}
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="section-heading">Shop by Category</h2>
        <div className="divider-gold mx-auto" />
        <p className="text-[#1a1a2e]/70 text-base mt-2 tracking-wide">
          Curated for every occasion
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {categories.slice(0, 6).map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className={`group relative overflow-hidden rounded-3xl bg-gray-100 shadow-card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 ${
              cat.rowSpan === 2 ? 'row-span-2 aspect-[4/5] md:aspect-square' : 'aspect-square'
            }`}
          >
            <Image
              src={cat.image}
              alt={cat.label}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 640px) 50vw, 33vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/70 via-[#1a1a2e]/10 to-transparent group-hover:from-[#1a1a2e]/80 transition-all duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-serif text-xl group-hover:text-[#c5a55a] transition-colors">
                {cat.label}
              </h3>
              <p className="text-white/90 text-xs mt-0.5 tracking-wide">Explore →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
