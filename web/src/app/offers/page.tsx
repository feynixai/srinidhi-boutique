import { getOffers } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

export default async function OffersPage() {
  const products = await getOffers().catch(() => []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <p className="text-rose-gold uppercase tracking-widest text-sm mb-2">Limited Time</p>
        <h1 className="font-serif text-4xl">Sale Collection</h1>
        <p className="text-gray-500 mt-2">Exclusive offers on selected styles</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-600">No offers available right now.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
