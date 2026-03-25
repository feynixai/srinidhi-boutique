'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { Product, addToCart } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const { toggle: toggleWishlist, has: inWishlist } = useWishlistStore();
  const { sessionId, itemCount, setItemCount, openCart } = useCartStore();

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
      openCart();
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
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmMCIvPjwvc3ZnPg=="
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-[#f5e8d8] flex items-center justify-center">
            <span className="text-[#c5a55a] font-serif text-lg">SB</span>
          </div>
        )}

        {discountPct && (
          <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold z-10 shadow-sm">
            {discountPct}% OFF
          </span>
        )}

        {product.bestSeller && !discountPct && (
          <span className="absolute top-3 left-3 bg-[#c5a55a] text-[#1a1a2e] text-xs px-3 py-1 rounded-full font-semibold z-10">
            Best Seller
          </span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-white/80 text-[#1a1a2e] font-medium text-sm px-4 py-1.5 rounded-full border border-black/10">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover quick-add */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleQuickAdd}
            disabled={adding || product.stock === 0}
            className="w-full bg-[#1a1a2e] text-white py-3 text-xs font-semibold tracking-wider hover:bg-[#2d2d4e] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiShoppingBag size={14} />
            {adding ? 'Adding...' : 'Quick Add'}
          </button>
        </div>

        {/* Wishlist heart button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist({ id: product.id, name: product.name, slug: product.slug, price: Number(product.price), comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined, images: product.images });
            toast(inWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
          }}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-10"
          aria-label="Add to wishlist"
        >
          <FiHeart
            size={16}
            className={inWishlist(product.id) ? 'fill-[#c5a55a] text-[#c5a55a]' : 'text-[#1a1a2e]'}
          />
        </button>
      </div>

      {/* Product info */}
      <div className="p-3 pb-4">
        <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wider">
          {product.category?.name || product.occasion[0]}
        </p>
        <h3 className="text-sm font-medium text-[#1a1a1a] line-clamp-2 leading-snug mb-2">{product.name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            &#x20B9;{displayPrice.toLocaleString('en-IN')}
          </span>
          {(displayPrice < Number(product.price) || product.comparePrice) && (
            <span className="text-gray-400 text-xs line-through">
              &#x20B9;{(displayPrice < Number(product.price) ? Number(product.price) : Number(product.comparePrice)).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
