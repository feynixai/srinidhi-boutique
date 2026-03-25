'use client';
import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useCompareStore } from '@/lib/compare-store';
import { useLanguage } from '@/lib/language-context';
import { useCartStore } from '@/lib/cart-store';
import { addToCart } from '@/lib/api';

const ROWS = [
  { key: 'price', label: 'Price' },
  { key: 'fabric', label: 'Fabric' },
  { key: 'sizes', label: 'Sizes' },
  { key: 'colors', label: 'Colors' },
  { key: 'category', label: 'Category' },
  { key: 'stock', label: 'Availability' },
];

export default function ComparePage() {
  const { items, remove, clear } = useCompareStore();
  const { t } = useLanguage();
  const { sessionId, itemCount, setItemCount, openCart } = useCartStore();

  async function handleAddToCart(productId: string, sizes: string[], colors: string[]) {
    try {
      await addToCart({ sessionId, productId, quantity: 1, size: sizes[0], color: colors[0] });
      setItemCount(itemCount + 1);
      openCart();
      toast.success(t.addToCart);
    } catch {
      toast.error('Could not add to cart');
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
        <p className="font-serif text-2xl text-[#1a1a2e]">{t.compareProducts}</p>
        <p className="text-gray-500 text-center max-w-sm">
          Add up to 3 products to compare side by side. Look for the{' '}
          <span className="text-[#c5a55a] font-medium">compare icon</span> on product cards.
        </p>
        <Link
          href="/shop"
          className="bg-[#1a1a2e] text-white px-8 py-3 rounded-full font-medium hover:bg-[#2d2d4e] transition-colors"
        >
          {t.shop}
        </Link>
      </div>
    );
  }

  // Find lowest price index
  const prices = items.map((p) => Number(p.salePrice ?? p.price));
  const minPrice = Math.min(...prices);

  function getCellValue(product: (typeof items)[0], key: string) {
    switch (key) {
      case 'price':
        return (
          <div className="flex flex-col items-center gap-1">
            <span
              className={`text-lg font-bold ${Number(product.salePrice ?? product.price) === minPrice ? 'text-green-600' : 'text-[#1a1a2e]'}`}
            >
              &#x20B9;{Number(product.salePrice ?? product.price).toLocaleString('en-IN')}
            </span>
            {Number(product.salePrice ?? product.price) === minPrice && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Best Value
              </span>
            )}
            {product.comparePrice && (
              <span className="text-xs text-gray-600 line-through">
                &#x20B9;{Number(product.comparePrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        );
      case 'fabric':
        return <span className="text-sm text-gray-700">{product.fabric || '—'}</span>;
      case 'sizes':
        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {product.sizes.length > 0
              ? product.sizes.map((s) => (
                  <span key={s} className="text-xs bg-[#f5f0eb] text-[#1a1a2e] px-2 py-0.5 rounded-full border border-[#e8d8c8]">
                    {s}
                  </span>
                ))
              : <span className="text-sm text-gray-600">—</span>}
          </div>
        );
      case 'colors':
        return (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {product.colors.length > 0
              ? product.colors.map((c) => (
                  <span key={c} className="text-xs bg-[#f5f0eb] text-[#1a1a2e] px-2 py-0.5 rounded-full border border-[#e8d8c8]">
                    {c}
                  </span>
                ))
              : <span className="text-sm text-gray-600">—</span>}
          </div>
        );
      case 'category':
        return <span className="text-sm text-gray-700">{product.category?.name || '—'}</span>;
      case 'stock':
        return product.stock === 0 ? (
          <span className="text-sm text-red-500 font-medium">{t.outOfStock}</span>
        ) : product.stock < 5 ? (
          <span className="text-sm text-orange-500 font-medium">{t.onlyLeft(product.stock)}</span>
        ) : (
          <span className="text-sm text-green-600 font-medium">In Stock</span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-[#1a1a2e]">{t.compareProducts}</h1>
        <button
          onClick={clear}
          className="text-sm text-gray-500 hover:text-[#1a1a2e] flex items-center gap-1 transition-colors"
        >
          <FiX size={16} /> {t.clearAll}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#e8d8c8] bg-white/70 backdrop-blur-lg shadow-card">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-[#e8d8c8]">
              <th className="w-36 p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-[#f5f0eb]/60">
                Feature
              </th>
              {items.map((product) => (
                <th key={product.id} className="p-4 text-center relative">
                  <button
                    onClick={() => remove(product.id)}
                    className="absolute top-3 right-3 p-1 bg-gray-100 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"
                    aria-label="Remove from compare"
                  >
                    <FiX size={12} />
                  </button>
                  <Link href={`/shop/${product.slug}`} className="block group">
                    <div className="relative w-24 h-32 mx-auto rounded-xl overflow-hidden mb-2 bg-[#f5e8d8]">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#c5a55a] font-serif">SB</div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#1a1a2e] line-clamp-2 leading-snug group-hover:text-[#c5a55a] transition-colors">
                      {product.name}
                    </p>
                  </Link>
                  <button
                    onClick={() => handleAddToCart(product.id, product.sizes, product.colors)}
                    disabled={product.stock === 0}
                    className="mt-3 w-full bg-[#1a1a2e] text-white text-xs font-semibold py-2 rounded-full hover:bg-[#2d2d4e] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <FiShoppingBag size={12} />
                    {t.addToCart}
                  </button>
                </th>
              ))}
              {/* Empty columns if fewer than 3 */}
              {Array.from({ length: 3 - items.length }).map((_, i) => (
                <th key={i} className="p-4 text-center">
                  <div className="w-24 h-32 mx-auto rounded-xl border-2 border-dashed border-[#e8d8c8] flex items-center justify-center mb-2">
                    <span className="text-gray-500 text-2xl">+</span>
                  </div>
                  <Link href="/shop" className="text-xs text-[#c5a55a] hover:underline">
                    Add product
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, rowIdx) => (
              <tr key={row.key} className={rowIdx % 2 === 0 ? 'bg-white/40' : 'bg-[#f5f0eb]/30'}>
                <td className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-[#f5f0eb]/60 whitespace-nowrap">
                  {row.label}
                </td>
                {items.map((product) => (
                  <td key={product.id} className="p-4 text-center align-middle">
                    {getCellValue(product, row.key)}
                  </td>
                ))}
                {Array.from({ length: 3 - items.length }).map((_, i) => (
                  <td key={i} className="p-4" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
