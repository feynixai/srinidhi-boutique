'use client';
import Link from 'next/link';
import { FiHeart, FiSun, FiBriefcase, FiFeather } from 'react-icons/fi';

const OCCASIONS = [
  {
    slug: 'wedding',
    label: 'Wedding',
    icon: <FiHeart size={32} />,
    desc: 'Bridal & festive looks',
    gradient: 'from-rose-100 to-pink-50',
    border: 'border-rose-200',
    textColor: 'text-rose-700',
  },
  {
    slug: 'festival',
    label: 'Festival',
    icon: <FiSun size={32} />,
    desc: 'Navratri, Diwali & more',
    gradient: 'from-amber-100 to-yellow-50',
    border: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  {
    slug: 'office',
    label: 'Office',
    icon: <FiBriefcase size={32} />,
    desc: 'Elegant daily wear',
    gradient: 'from-blue-100 to-indigo-50',
    border: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    slug: 'casual',
    label: 'Casual',
    icon: <FiFeather size={32} />,
    desc: 'Everyday comfort',
    gradient: 'from-green-100 to-emerald-50',
    border: 'border-green-200',
    textColor: 'text-green-700',
  },
];

export function ShopByOccasion() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16" data-testid="shop-by-occasion">
      <div className="text-center mb-10">
        <h2 className="section-heading">Shop by Occasion</h2>
        <div className="divider-gold mx-auto" />
        <p className="text-[#1a1a2e]/50 text-sm mt-2 tracking-wide">
          Find the perfect outfit for every moment
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {OCCASIONS.map((occ) => (
          <Link
            key={occ.slug}
            href={`/shop?occasion=${occ.slug}`}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${occ.gradient} border ${occ.border} p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}
            data-testid={`occasion-${occ.slug}`}
          >
            <div className={`mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center ${occ.textColor}`}>
              {occ.icon}
            </div>
            <h3 className={`font-serif text-xl font-bold ${occ.textColor} mb-1`}>{occ.label}</h3>
            <p className="text-xs text-[#1a1a2e]/60 tracking-wide">{occ.desc}</p>
            <div className={`mt-3 text-xs font-semibold ${occ.textColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
              Shop Now →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
