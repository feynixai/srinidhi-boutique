'use client';
import { useRouter } from 'next/navigation';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Popular', value: 'popular' },
];

interface ShopSortBarProps {
  total: number;
  searchParams: Record<string, string>;
}

export function ShopSortBar({ total, searchParams }: ShopSortBarProps) {
  const router = useRouter();
  const activeSort = searchParams.sort || 'newest';

  function handleSort(value: string) {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(searchParams).filter(([k]) => k !== 'page'))
    );
    params.set('sort', value);
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between mb-6 gap-4">
      <p className="text-sm text-gray-500 flex-shrink-0">{total} products</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 hidden sm:block">Sort:</span>
        <select
          value={activeSort}
          onChange={(e) => handleSort(e.target.value)}
          className="text-sm border border-gray-200 rounded-sm px-3 py-1.5 focus:outline-none focus:border-rose-gold bg-white"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
