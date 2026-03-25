import { getProducts, getCategories, Product } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
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
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-1">Shop</p>
        <h1 className="font-serif text-3xl">{category.name}</h1>
        <p className="text-sm text-gray-500 mt-1">{data.total} products</p>
      </div>

      {data.products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No products in this category yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {data.products.map((p: Product) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
