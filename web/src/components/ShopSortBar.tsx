'use client';
import { useRouter } from 'next/navigation';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Popular', value: 'popular' },
];

const FILTER_KEYS = ['category', 'size', 'color', 'minPrice', 'maxPrice', 'search', 'occasion'];

interface ShopSortBarProps {
  total: number;
  shown: number;
  searchParams: Record<string, string>;
}

export function ShopSortBar({ total, shown, searchParams }: ShopSortBarProps) {
  const router = useRouter();
  const activeSort = searchParams.sort || 'newest';
  const filterCount = FILTER_KEYS.filter((k) => searchParams[k]).length;

  function handleSort(value: string) {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(searchParams).filter(([k]) => k !== 'page'))
    );
    params.set('sort', value);
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-gray-500 flex-shrink-0">
          {shown < total ? `Showing ${shown} of ${total} products` : `${total} product${total !== 1 ? 's' : ''}`}
        </p>
        {filterCount > 0 && (
          <span className="bg-[#1a1a2e] text-white text-xs px-3 py-1 rounded-full font-medium">
            {filterCount} filter{filterCount > 1 ? 's' : ''} applied
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 hidden sm:block">Sort:</span>
        <select
          value={activeSort}
          onChange={(e) => handleSort(e.target.value)}
          className="text-sm bg-white/60 backdrop-blur-lg border border-white/30 rounded-full px-4 py-1.5 focus:outline-none focus:border-[#c5a55a] shadow-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
