import { Suspense } from 'react';
import { Metadata } from 'next';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ShopSortBar } from '@/components/ShopSortBar';
import { ScrollRestorer } from '@/components/ScrollRestorer';

export const metadata: Metadata = {
  title: 'Shop Sarees, Kurtis & Lehengas Online | Srinidhi Boutique',
  description: 'Browse our curated collection of premium sarees, kurtis, lehengas and ethnic wear. Free shipping above ₹999. Easy 7-day returns. Shop now at Srinidhi Boutique, Hyderabad.',
  openGraph: {
    title: 'Shop Sarees, Kurtis & Lehengas Online | Srinidhi Boutique',
    description: 'Browse our curated collection of premium sarees, kurtis, lehengas and ethnic wear. Free shipping above ₹999. Easy 7-day returns.',
  },
};

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
            <div className="text-[#c5a55a] flex justify-center mb-4"><svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg></div>
            <h3 className="font-serif text-xl text-[#1a1a2e] mb-2">No products found</h3>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or browse the full collection.</p>
            <a href="/shop" className="btn-primary text-sm px-6 py-2.5 inline-block">Clear Filters</a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </>
  );
}

export default function ShopPage({ searchParams }: ShopPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      <ScrollRestorer />
      <h1 className="font-bold text-2xl sm:text-3xl mb-4 sm:mb-8 text-[#1a1a2e] tracking-tight">All Products</h1>
      <div className="lg:flex lg:gap-8">
        <Suspense fallback={<div className="w-56 flex-shrink-0 hidden lg:block" />}>
          <FilterSidebar />
        </Suspense>
        <div className="flex-1 min-w-0">
          <Suspense fallback={
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {[...Array(8)].map((_, i) => (
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
