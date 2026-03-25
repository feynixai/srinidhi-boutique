'use client';
import Link from 'next/link';
import Image from 'next/image';
import { FiPlay } from 'react-icons/fi';

const OCCASIONS = [
  {
    slug: 'wedding',
    label: 'Wedding',
    desc: 'Bridal & Festive Looks',
    image: 'https://picsum.photos/seed/wedding-saree/400/711',
    looks: 24,
  },
  {
    slug: 'festival',
    label: 'Festival',
    desc: 'Navratri, Diwali & More',
    image: 'https://picsum.photos/seed/festival-saree/400/711',
    looks: 18,
  },
  {
    slug: 'office',
    label: 'Office',
    desc: 'Elegant Daily Wear',
    image: 'https://picsum.photos/seed/office-wear/400/711',
    looks: 15,
  },
  {
    slug: 'casual',
    label: 'Casual',
    desc: 'Everyday Comfort',
    image: 'https://picsum.photos/seed/casual-saree/400/711',
    looks: 12,
  },
  {
    slug: 'party',
    label: 'Party',
    desc: 'Glamour & Sparkle',
    image: 'https://picsum.photos/seed/party-saree/400/711',
    looks: 14,
  },
  {
    slug: 'pooja',
    label: 'Pooja',
    desc: 'Traditional & Auspicious',
    image: 'https://picsum.photos/seed/pooja-saree/400/711',
    looks: 10,
  },
];

export function ShopByOccasion() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16" data-testid="shop-by-occasion">
      {/* Section heading */}
      <div className="text-center mb-10">
        <h2 className="section-heading">Shop by Occasion</h2>
        <div className="divider-gold mx-auto" />
        <p className="text-[#1a1a2e]/50 text-sm mt-2 tracking-wide">
          Find the perfect outfit for every moment
        </p>
      </div>

      {/* Cards: horizontal snap-scroll on mobile, 6-col grid on desktop */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-x-visible">
        {OCCASIONS.map((occ) => (
          <Link
            key={occ.slug}
            href={`/shop?occasion=${occ.slug}`}
            className="group relative flex-shrink-0 w-[55vw] sm:w-[40vw] md:w-auto snap-center rounded-3xl overflow-hidden aspect-[9/16]"
            data-testid={`occasion-${occ.slug}`}
          >
            {/* Background image */}
            <Image
              src={occ.image}
              alt={occ.label}
              fill
              sizes="(max-width: 768px) 55vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Reel count badge */}
            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
              {occ.looks} Looks
            </div>

            {/* Play button — glass morphism */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse">
                <FiPlay className="text-white ml-0.5" size={22} />
              </div>
            </div>

            {/* Bottom text */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-serif text-xl font-bold text-white leading-tight">
                {occ.label}
              </h3>
              <p className="text-white/70 text-xs mt-1 tracking-wide">
                {occ.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
