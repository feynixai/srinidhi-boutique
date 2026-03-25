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
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="font-serif text-xl text-[#1a1a2e] mb-2">No products found</h2>
          <p className="text-gray-500 text-sm mb-6">
            We couldn&apos;t find anything for &ldquo;{query}&rdquo;. Try different keywords.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            {['Sarees', 'Kurtis', 'Lehengas', 'Kurta Sets', 'Salwar'].map((term) => (
              <a
                key={term}
                href={`/search?q=${term}`}
                className="px-4 py-2 bg-white/60 border border-white/40 rounded-full text-[#1a1a2e]/70 hover:text-[#c5a55a] hover:border-[#c5a55a]/50 transition-colors"
              >
                {term}
              </a>
            ))}
          </div>
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
            className="flex-1 bg-white/60 backdrop-blur-lg border border-white/30 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[#c5a55a] transition-colors shadow-card"
          />
          <button type="submit" className="btn-primary px-6 py-3 text-sm rounded-full">
            Search
          </button>
        </div>
      </form>

      <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white/60 backdrop-blur-lg rounded-3xl animate-pulse" />)}
      </div>}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
