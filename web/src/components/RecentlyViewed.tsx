'use client';
import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/api';

const STORAGE_KEY = 'sb-recently-viewed';

export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [ids, setIds] = useState<string[]>([]);

  const loadIds = useCallback(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setIds(stored.filter((id) => id !== excludeId).slice(0, 8));
    } catch {}
  }, [excludeId]);

  useEffect(() => { loadIds(); }, [loadIds]);

  function clearHistory() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setIds([]);
  }

  const { data: products } = useQuery({
    queryKey: ['recently-viewed', ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const results = await Promise.allSettled(
        ids.map((id) => api.get<Product>(`/api/products/id/${id}`).then((r) => r.data))
      );
      return results
        .filter((r): r is PromiseFulfilledResult<Product> => r.status === 'fulfilled')
        .map((r) => r.value);
    },
    enabled: ids.length > 0,
  });

  if (!products || products.length === 0) return null;

  return (
    <section className="py-10 border-t border-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-[#1a1a2e]">Recently Viewed</h2>
          <button
            onClick={clearHistory}
            className="text-xs text-[#1a1a2e]/40 hover:text-red-400 transition-colors"
          >
            Clear History
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-40 sm:w-48 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
