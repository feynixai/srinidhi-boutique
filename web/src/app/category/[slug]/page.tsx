import Link from 'next/link';
import { getProducts, getCategories, Product } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { ScrollRestorer } from '@/components/ScrollRestorer';
import { notFound } from 'next/navigation';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [data, categories] = await Promise.all([
    getProducts({ category: slug }).catch(() => ({ products: [], total: 0 })),
    getCategories().catch(() => []),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <ScrollRestorer />

      {/* Breadcrumb */}
      <nav className="inline-flex items-center gap-1.5 bg-white/60 backdrop-blur-xl border border-white/40 px-4 py-2 rounded-full text-xs shadow-sm mb-8">
        <Link href="/" className="text-[#1a1a2e]/50 hover:text-[#c5a55a] transition-colors">Home</Link>
        <span className="text-[#1a1a2e]/20">/</span>
        <Link href="/shop" className="text-[#1a1a2e]/50 hover:text-[#c5a55a] transition-colors">Shop</Link>
        <span className="text-[#1a1a2e]/20">/</span>
        <span className="text-[#1a1a2e]/80 font-medium">{category.name}</span>
      </nav>

      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-[#1a1a2e]">{category.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{data.total} product{data.total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {data.products.length === 0 ? (
        <div className="py-16 flex justify-center">
          <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-card p-12 text-center max-w-sm w-full">
            <div className="text-[#c5a55a] flex justify-center mb-4"><svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/></svg></div>
            <h3 className="font-serif text-xl text-[#1a1a2e] mb-2">No products yet</h3>
            <p className="text-gray-500 text-sm mb-6">Nothing in {category.name} right now — check back soon!</p>
            <Link href="/shop" className="btn-primary text-sm px-6 py-2.5 inline-block">Browse All</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {data.products.map((p: Product) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
