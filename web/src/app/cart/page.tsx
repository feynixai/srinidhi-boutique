'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiTrash2, FiPlus, FiMinus, FiBookmark } from 'react-icons/fi';
import { MdBookmarkRemove } from 'react-icons/md';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { getCart, updateCartItem, removeCartItem, validateCoupon, getProducts } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

const FREE_SHIPPING_THRESHOLD = 999;

export default function CartPage() {
  const { sessionId, setItemCount } = useCartStore();
  const { toggle: toggleWishlist, has: inWishlist, items: wishlistItems } = useWishlistStore();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    discountAmount: number;
  } | null>(null);
  const [savedForLater, setSavedForLater] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: () => getCart(sessionId),
  });

  const { data: recommendedData } = useQuery({
    queryKey: ['recommended-cart'],
    queryFn: () => getProducts({ featured: 'true', limit: '6' }),
    enabled: !isLoading,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => updateCartItem(id, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart', sessionId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
      const current = cart?.items.find((i) => i.id === id);
      if (current)
        setItemCount(
          Math.max(0, (cart?.items.reduce((s, i) => s + i.quantity, 0) || 0) - current.quantity),
        );
      toast.success('Item removed');
    },
  });

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    try {
      const result = await validateCoupon(couponInput.trim(), cart?.subtotal || 0);
      if (result.valid) {
        setAppliedCoupon({ code: couponInput.trim().toUpperCase(), ...result });
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to apply coupon');
    }
  }

  function handleSaveForLater(
    itemId: string,
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      comparePrice?: number;
      images: string[];
    },
  ) {
    toggleWishlist({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      images: product.images,
    });
    setSavedForLater((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
    const alreadySaved = inWishlist(product.id);
    toast(alreadySaved ? 'Removed from saved items' : 'Saved for later!');
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
  const discount = appliedCoupon?.discountAmount || 0;
  const total = subtotal + shipping - discount;
  const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  // Smart category-based suggestions
  const cartCategories = items.map((i) => (i.product as unknown as { category?: { slug?: string } }).category?.slug?.toLowerCase() || '');
  const hasSaree = cartCategories.some((c) => c.includes('saree') || c.includes('sari'));
  const hasLehenga = cartCategories.some((c) => c.includes('lehenga') || c.includes('ghagra'));
  const hasHeavyEthnic = hasSaree || hasLehenga;
  const suggestLabel = hasSaree
    ? 'Complete Your Look — Blouses'
    : hasHeavyEthnic
    ? 'Complete Your Look — Accessories'
    : 'You Might Also Like';

  const recommendedProducts = (recommendedData?.products || [])
    .filter((p) => !items.some((item) => item.product.id === p.id))
    .slice(0, 4);

  if (isLoading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white/60 animate-pulse rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-white/60 animate-pulse rounded-2xl" />
        </div>
      </div>
    );

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-card p-12">
          <div className="text-[#c5a55a] flex justify-center mb-4"><svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/></svg></div>
          <h1 className="font-serif text-2xl md:text-3xl mb-3 text-[#1a1a2e]">Your Bag is Empty</h1>
          <p className="text-gray-500 text-sm mb-8">Looks like you haven&apos;t added anything yet. Browse our beautiful collection!</p>
          <Link href="/shop" className="btn-primary px-8 py-3 inline-block tracking-widest text-sm">
            BROWSE COLLECTION
          </Link>
        </div>
        {wishlistItems.length > 0 && (
          <div className="mt-6 bg-white/40 backdrop-blur-sm border border-white/30 rounded-2xl p-4">
            <p className="text-sm text-[#1a1a2e]/60 mb-2">
              You have {wishlistItems.length} item{wishlistItems.length > 1 ? 's' : ''} saved for later
            </p>
            <Link href="/wishlist" className="text-[#c5a55a] hover:underline text-sm font-medium">
              View Saved Items →
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 bg-[#f5f5f0]">
      <h1 className="font-serif text-3xl mb-8 text-[#1a1a2e] font-bold">
        Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)} items)
      </h1>

      {/* Free Shipping Progress */}
      {amountForFreeShipping > 0 && (
        <div className="mb-6 bg-white/60 backdrop-blur-lg border border-white/30 p-4 rounded-2xl">
          <p className="text-sm text-[#1a1a2e]/70 mb-2">
            Add{' '}
            <span className="font-semibold text-[#1a1a2e]">
              &#x20B9;{amountForFreeShipping.toLocaleString('en-IN')}
            </span>{' '}
            more for <span className="font-semibold text-green-600">FREE shipping!</span>
          </p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>
      )}
      {shipping === 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 p-3 rounded-2xl text-sm text-green-700 font-medium">
          You&apos;ve unlocked free shipping!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex gap-4 p-4 bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl transition-opacity ${
                savedForLater.includes(item.id) ? 'opacity-50' : ''
              }`}
            >
              <div className="relative w-24 h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                {item.product.images[0] && (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex-1">
                <Link
                  href={`/shop/${item.product.slug}`}
                  className="font-medium hover:text-[#c5a55a] transition-colors line-clamp-2 text-[#1a1a2e]"
                >
                  {item.product.name}
                </Link>
                {(item.size || item.color) && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {[item.size, item.color].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="font-bold mt-1 text-[#1a1a2e]">
                  &#x20B9;{Number(item.product.price).toLocaleString('en-IN')}
                </p>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  {/* Pill quantity control */}
                  <div className="flex items-center border border-gray-200 rounded-full overflow-hidden bg-white/80">
                    <button
                      onClick={() =>
                        item.quantity > 1
                          ? updateMutation.mutate({ id: item.id, qty: item.quantity - 1 })
                          : removeMutation.mutate(item.id)
                      }
                      className="px-3 py-1.5 hover:bg-gray-100 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="text-sm font-semibold px-1">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateMutation.mutate({ id: item.id, qty: item.quantity + 1 })
                      }
                      className="px-3 py-1.5 hover:bg-gray-100 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#1a1a2e]">
                      &#x20B9;
                      {(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() =>
                        handleSaveForLater(item.id, {
                          id: item.product.id,
                          name: item.product.name,
                          slug: item.product.slug,
                          price: Number(item.product.price),
                          images: item.product.images,
                        })
                      }
                      className={`transition-colors p-1.5 rounded-full ${
                        inWishlist(item.product.id)
                          ? 'text-[#c5a55a] bg-[#c5a55a]/10'
                          : 'text-gray-600 hover:text-[#c5a55a] hover:bg-[#c5a55a]/10'
                      }`}
                      title="Save for later"
                    >
                      {inWishlist(item.product.id) ? (
                        <MdBookmarkRemove size={16} />
                      ) : (
                        <FiBookmark size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Remove this item?')) removeMutation.mutate(item.id);
                      }}
                      className="text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all p-1.5 rounded-full"
                      aria-label="Remove item"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {wishlistItems.length > 0 && (
            <div className="bg-white/60 backdrop-blur-lg border border-white/30 p-4 rounded-2xl flex items-center justify-between">
              <p className="text-sm text-[#1a1a2e]/70">
                {wishlistItems.length} item{wishlistItems.length > 1 ? 's' : ''} saved for later
              </p>
              <Link href="/wishlist" className="text-[#c5a55a] text-sm font-medium hover:underline">
                View Saved →
              </Link>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl p-4">
            <h3 className="font-semibold mb-3 text-[#1a1a2e]">Coupon Code</h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-xl">
                <div>
                  <p className="text-green-700 font-semibold text-sm">{appliedCoupon.code}</p>
                  <p className="text-green-600 text-xs">
                    -&#x20B9;{appliedCoupon.discountAmount.toFixed(0)} saved
                  </p>
                </div>
                <button
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 bg-white/80 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#c5a55a]"
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <button onClick={applyCoupon} className="btn-outline text-sm px-4 py-2">
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl p-4">
            <h3 className="font-serif text-lg mb-4 text-[#1a1a2e] font-bold">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-[#1a1a2e]/70">
                <span>Subtotal</span>
                <span>&#x20B9;{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#1a1a2e]/70">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-&#x20B9;{discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-black/5 pt-3 mt-2 text-[#1a1a2e]">
                <span>Total</span>
                <span>&#x20B9;{total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
              </div>
            </div>
            {/* Estimated delivery */}
            {(() => {
              const start = new Date(Date.now() + 3 * 864e5);
              const end = new Date(Date.now() + 5 * 864e5);
              const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              return (
                <div className="flex items-center gap-2 text-xs text-[#1a1a2e]/60 bg-blue-50/80 border border-blue-100 rounded-xl px-3 py-2.5 mb-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>
                  <span>Est. delivery: <strong className="text-[#1a1a2e]/80">{fmt(start)} – {fmt(end)}</strong></span>
                </div>
              );
            })()}
            <Link
              href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ''}`}
              className="btn-primary w-full text-center block text-sm tracking-widest"
            >
              CHECKOUT
            </Link>
            <Link
              href="/shop"
              className="block text-center text-xs text-gray-600 hover:text-[#1a1a2e] mt-3"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Smart suggestions */}
      {recommendedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl mb-2 text-[#1a1a2e] font-bold">
            {suggestLabel}
          </h2>
          {hasHeavyEthnic && (
            <p className="text-sm text-[#1a1a2e]/50 mb-2">
              {hasSaree
                ? 'A perfect blouse makes all the difference — here are some that pair beautifully.'
                : 'Accessories that pair beautifully with your selection.'}
            </p>
          )}
          <div className="divider-gold mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recommendedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
