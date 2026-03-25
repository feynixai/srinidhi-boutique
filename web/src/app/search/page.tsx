import { Suspense } from 'react';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

async function SearchResults({ query }: { query: string }) {
  if (!query) return <p className="text-gray-400 text-center py-10">Enter a search term above</p>;

  const data = await getProducts({ search: query }).catch(() => ({ products: [], total: 0 }));

  return (
    <>
      <p className="text-sm text-gray-500 mb-6">
        {data.total} results for &ldquo;{query}&rdquo;
      </p>
      {data.products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-2">No products found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </>
  );
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-2xl mb-6">Search</h1>
      <form method="GET" action="/search" className="mb-8">
        <div className="flex gap-3 max-w-lg">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search sarees, kurtis, lehengas..."
            className="flex-1 border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-rose-gold rounded-sm"
          />
          <button type="submit" className="btn-primary px-6 py-2.5 text-sm">
            Search
          </button>
        </div>
      </form>

      <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse" />)}
      </div>}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
