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

  const discountPct = product.onOffer && product.offerPercent
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
    <Link href={`/shop/${product.slug}`} className="product-card block group">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-soft-pink/20 flex items-center justify-center">
            <span className="text-rose-gold font-serif text-lg">SB</span>
          </div>
        )}

        {discountPct && (
          <span className="badge-offer">{discountPct}% OFF</span>
        )}

        {product.bestSeller && !discountPct && (
          <span className="badge-bestseller">Best Seller</span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-charcoal font-medium text-sm">Out of Stock</span>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex">
          <button
            onClick={handleQuickAdd}
            disabled={adding || product.stock === 0}
            className="flex-1 bg-charcoal text-white py-3 text-xs font-medium tracking-wider hover:bg-rose-gold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiShoppingBag size={14} />
            {adding ? 'Adding...' : 'Quick Add'}
          </button>
        </div>

        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
          className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
          aria-label="Add to wishlist"
        >
          <FiHeart
            size={16}
            className={inWishlist(product.id) ? 'fill-rose-gold text-rose-gold' : 'text-charcoal'}
          />
        </button>
      </div>

      <div className="pt-3 pb-1">
        <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">
          {product.category?.name || product.occasion[0]}
        </p>
        <h3 className="text-sm font-medium text-charcoal line-clamp-2 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-semibold text-charcoal">₹{Number(product.price).toLocaleString('en-IN')}</span>
          {product.comparePrice && (
            <span className="text-gray-400 text-sm line-through">
              ₹{Number(product.comparePrice).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
