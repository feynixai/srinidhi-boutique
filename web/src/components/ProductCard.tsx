'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiHeart, FiShoppingBag, FiBarChart2, FiEye } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { Product, addToCart } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useCompareStore } from '@/lib/compare-store';
import { useLanguage } from '@/lib/language-context';
import { QuickViewModal } from './QuickViewModal';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const { toggle: toggleWishlist, has: inWishlist } = useWishlistStore();
  const { sessionId, itemCount, setItemCount, openCart } = useCartStore();
  const { add: addCompare, remove: removeCompare, has: inCompare } = useCompareStore();
  const { t } = useLanguage();

  const salePrice = product.salePrice;
  const displayPrice = salePrice ?? Number(product.price);
  const salePct = product.salePct;
  const discountPct = salePct && salePct > 0
    ? salePct
    : product.onOffer && product.offerPercent
    ? product.offerPercent
    : product.comparePrice
    ? Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)
    : null;

  const isNew = product.createdAt
    ? (Date.now() - new Date(product.createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000
    : false;
  const isSale = !!(discountPct && discountPct > 0) || product.onOffer;

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (product.stock === 0) return;
    setAdding(true);
    try {
      await addToCart({
        sessionId,
        productId: product.id,
        quantity: 1,
        size: product.sizes[0],
        color: product.colors[0],
      });
      setItemCount(itemCount + 1);
      setAdded(true);
      setTimeout(() => { setAdded(false); openCart(); }, 700);
      toast.success('Added to cart');
    } catch {
      toast.error('Could not add to cart');
    } finally {
      setAdding(false);
    }
  }

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="block group bg-white/60 backdrop-blur-lg border border-white/30 rounded-3xl overflow-hidden shadow-card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300"
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f0eb]">
        {product.images[0] ? (
          <>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmMCIvPjwvc3ZnPg=="
              className={`object-cover transition-all duration-500 ${product.images[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {product.images[1] && (
              <Image
                src={product.images[1]}
                alt={`${product.name} — alternate view`}
                fill
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmMCIvPjwvc3ZnPg=="
                className="object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-[#f5e8d8] flex items-center justify-center">
            <span className="text-[#c5a55a] font-serif text-lg">SB</span>
          </div>
        )}

        {/* Top-left badge stack */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isSale && (
            <span className="bg-blue-600/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
              {discountPct ? `${discountPct}% OFF` : 'SALE'}
            </span>
          )}
          {isNew && !isSale && (
            <span className="bg-[#1a1a2e]/80 backdrop-blur-sm text-[#c5a55a] text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
              NEW
            </span>
          )}
          {product.bestSeller && !isSale && !isNew && (
            <span className="bg-[#c5a55a]/90 backdrop-blur-sm text-[#1a1a2e] text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
              {t.bestSeller}
            </span>
          )}
          {(product as Product & { trending?: boolean }).trending && !product.bestSeller && !isSale && !isNew && (
            <span className="bg-orange-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm flex items-center gap-1">
              {t.trending}
            </span>
          )}
        </div>

        {/* Urgency: Low stock */}
        {product.stock > 0 && product.stock < 5 && (
          <span className="absolute bottom-14 left-3 bg-red-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold z-10 shadow-sm">
            LOW STOCK · {t.onlyLeft(product.stock)}
          </span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-white/80 text-[#1a1a2e] font-medium text-sm px-4 py-1.5 rounded-full border border-black/10">
              {t.outOfStock}
            </span>
          </div>
        )}

        {/* Hover quick-add + quick-view */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex">
            <button
              onClick={handleQuickAdd}
              disabled={adding || product.stock === 0}
              className={`flex-1 py-3 text-xs font-semibold tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-[#1a1a2e] text-white hover:bg-[#2d2d4e]'
              }`}
            >
              {added ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  ADDED!
                </>
              ) : adding ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiShoppingBag size={14} />
                  {t.quickAdd}
                </>
              )}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
              className="bg-[#2d2d4e] text-white/70 hover:text-white px-3 py-3 transition-colors border-l border-white/10 flex items-center"
              aria-label="Quick view"
            >
              <FiEye size={15} />
            </button>
          </div>
        </div>

        {/* Wishlist + Compare buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist({ id: product.id, name: product.name, slug: product.slug, price: Number(product.price), comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined, images: product.images });
              toast(inWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
            }}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all"
            aria-label="Add to wishlist"
          >
            <FiHeart
              size={16}
              className={inWishlist(product.id) ? 'fill-[#c5a55a] text-[#c5a55a]' : 'text-[#1a1a2e]'}
            />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              if (inCompare(product.id)) {
                removeCompare(product.id);
                toast('Removed from compare');
              } else {
                addCompare(product);
                toast('Added to compare');
              }
            }}
            className={`p-2 backdrop-blur-sm rounded-full shadow-sm transition-all ${
              inCompare(product.id) ? 'bg-[#1a1a2e] text-white' : 'bg-white/80 hover:bg-white text-[#1a1a2e]'
            }`}
            aria-label="Compare product"
          >
            <FiBarChart2 size={16} />
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="p-3 pb-4">
        <p className="text-xs text-gray-600 mb-0.5 uppercase tracking-wider">
          {product.category?.name || product.occasion[0]}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">{product.name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            &#x20B9;{displayPrice.toLocaleString('en-IN')}
          </span>
          {(displayPrice < Number(product.price) || product.comparePrice) && (
            <span className="text-gray-600 text-xs line-through">
              &#x20B9;{(displayPrice < Number(product.price) ? Number(product.price) : Number(product.comparePrice)).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {quickViewOpen && (
        <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />
      )}
    </Link>
  );
}
