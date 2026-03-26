'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiHeart, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { Product, addToCart } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '');
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { sessionId, itemCount, setItemCount, openCart } = useCartStore();
  const { toggle: toggleWishlist, has: inWishlist } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
    // Lock background scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Close on ESC
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayPrice = product.salePrice ?? Number(product.price);
  const originalPrice = Number(product.price);
  const discountPct = product.salePct && product.salePct > 0
    ? product.salePct
    : product.comparePrice
    ? Math.round(((Number(product.comparePrice) - originalPrice) / Number(product.comparePrice)) * 100)
    : null;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        sessionId,
        productId: product.id,
        quantity: 1,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
      });
      setItemCount(itemCount + 1);
      openCart();
      toast.success('Added to bag!');
      onClose();
    } catch {
      toast.error('Could not add to bag');
    } finally {
      setAdding(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div
        className="relative bg-white/95 backdrop-blur-xl shadow-2xl w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag indicator on mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Close"
        >
          <FiX size={18} className="text-[#1a1a2e]" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {/* Image — max 50vh on mobile */}
          <div className="relative w-full bg-[#f5f0eb] rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none overflow-hidden" style={{ maxHeight: '50vh' }}>
            <div className="relative aspect-[3/4] sm:aspect-auto sm:h-full">
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 300px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center min-h-[200px]">
                  <span className="text-[#c5a55a] font-serif text-2xl">SB</span>
                </div>
              )}
              {discountPct && (
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {discountPct}% OFF
                </span>
              )}
              {/* Dot indicators */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {product.images.slice(0, 5).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === selectedImage ? 'bg-white w-5' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-5 sm:p-6 space-y-4">
            {product.category && (
              <p className="text-xs text-[#c5a55a] uppercase tracking-[0.2em] font-semibold">{product.category.name}</p>
            )}
            <h2 className="font-serif text-lg sm:text-xl leading-snug text-[#1a1a2e]">{product.name}</h2>

            {/* Price */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#1a1a2e] font-bold text-xl sm:text-2xl">
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
              {displayPrice < originalPrice && (
                <span className="text-gray-600 text-sm line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#1a1a2e]/60 mb-2">
                  Colour: {selectedColor && <span className="text-[#1a1a2e] normal-case tracking-normal font-normal">{selectedColor}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`min-w-[44px] min-h-[44px] px-4 py-2 text-sm rounded-full border transition-all ${
                        selectedColor === color
                          ? 'border-[#c5a55a] bg-[#c5a55a] text-[#1a1a2e] font-semibold'
                          : 'border-gray-200 hover:border-[#c5a55a] text-[#1a1a2e]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#1a1a2e]/60 mb-2">
                  Size: {selectedSize && <span className="text-[#1a1a2e] normal-case tracking-normal font-normal">{selectedSize}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-[44px] px-4 rounded-full border text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'border-[#1a1a2e] bg-[#1a1a2e] text-white'
                          : 'border-gray-200 hover:border-[#1a1a2e] text-[#1a1a2e]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock warning */}
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-orange-500 text-sm font-medium">Only {product.stock} left!</p>
            )}

            {/* CTA */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={adding || product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a2e] text-white py-3.5 rounded-full text-sm font-semibold tracking-wide hover:bg-[#2d2d4e] transition-colors disabled:opacity-50"
              >
                <FiShoppingBag size={16} />
                {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Bag'}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishlist({ id: product.id, name: product.name, slug: product.slug, price: Number(product.price), comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined, images: product.images });
                  toast(inWishlist(product.id) ? 'Removed from wishlist' : 'Saved to wishlist!');
                }}
                className={`min-w-[44px] min-h-[44px] p-3 rounded-full border transition-all ${inWishlist(product.id) ? 'border-red-400 text-red-500 bg-red-50' : 'border-gray-200 text-[#1a1a2e]/50 hover:border-red-300 hover:text-red-400'}`}
                aria-label="Wishlist"
              >
                <FiHeart size={18} fill={inWishlist(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <Link
              href={`/shop/${product.slug}`}
              onClick={onClose}
              className="block text-center text-sm text-[#c5a55a] hover:text-[#1a1a2e] transition-colors pt-1 font-medium"
            >
              View full details →
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
