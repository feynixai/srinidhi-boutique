import { Suspense } from 'react';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ShopSortBar } from '@/components/ShopSortBar';
import { ScrollRestorer } from '@/components/ScrollRestorer';

interface ShopPageProps {
  searchParams: Record<string, string>;
}

async function ProductGrid({ searchParams }: { searchParams: Record<string, string> }) {
  const data = await getProducts(searchParams).catch(() => ({ products: [], total: 0 }));

  return (
    <>
      <ShopSortBar total={data.total} shown={data.products.length} searchParams={searchParams} />
      {data.products.length === 0 ? (
        <div className="col-span-full py-16 flex justify-center">
          <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-card p-12 text-center max-w-sm w-full">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-serif text-xl text-[#1a1a2e] mb-2">No products found</h3>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or browse the full collection.</p>
            <a href="/shop" className="btn-primary text-sm px-6 py-2.5 inline-block">Clear Filters</a>
          </div>
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
      <ScrollRestorer />
      <h1 className="font-bold text-3xl mb-8 text-[#1a1a2e] tracking-tight">All Products</h1>
      <div className="flex gap-10">
        <Suspense fallback={<div className="w-64 flex-shrink-0" />}>
          <FilterSidebar />
        </Suspense>
        <div className="flex-1 min-w-0">
          <Suspense fallback={
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-white/60 animate-pulse rounded-2xl" />
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
