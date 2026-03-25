'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/api';

export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('sb-recently-viewed') || '[]');
      setIds(stored.filter((id) => id !== excludeId).slice(0, 6));
    } catch {}
  }, [excludeId]);

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
    <section className="py-8 border-t border-gray-100">
      <h2 className="font-serif text-xl text-charcoal mb-4">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
