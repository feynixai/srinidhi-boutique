import { Suspense } from 'react';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';

interface ShopPageProps {
  searchParams: Record<string, string>;
}

async function ProductGrid({ searchParams }: { searchParams: Record<string, string> }) {
  const data = await getProducts(searchParams).catch(() => ({ products: [], total: 0 }));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{data.total} products</p>
      </div>
      {data.products.length === 0 ? (
        <div className="col-span-full text-center py-16 text-gray-400">
          No products found. Try adjusting your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </>
  );
}

export default function ShopPage({ searchParams }: ShopPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-3xl mb-8">All Products</h1>
      <div className="flex gap-10">
        <Suspense fallback={<div className="w-64 flex-shrink-0" />}>
          <FilterSidebar />
        </Suspense>
        <div className="flex-1">
          <Suspense fallback={
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          }>
            <ProductGrid searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
