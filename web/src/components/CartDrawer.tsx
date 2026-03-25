'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiTrash2, FiPlus, FiMinus, FiTag, FiMessageCircle } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/lib/cart-store';
import { getCart, updateCartItem, removeCartItem, getBestSellers } from '@/lib/api';

export function CartDrawer() {
  const { sessionId, isCartOpen, closeCart, setItemCount } = useCartStore();
  const queryClient = useQueryClient();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const { data: cart } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: () => getCart(sessionId),
    enabled: isCartOpen,
  });

  useEffect(() => {
    if (cart) {
      setItemCount(cart.items.reduce((s, i) => s + i.quantity, 0));
    }
  }, [cart, setItemCount]);

  const updateMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => updateCartItem(id, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart', sessionId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
      toast.success('Item removed');
    },
  });

  const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+918309949805').replace('+', '');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://srinidhiboutique.com';

  function getWhatsAppLink(item: { product: { name: string; slug: string; price: unknown }; size?: string; color?: string }) {
    const details = [item.size, item.color].filter(Boolean).join(', ');
    const msg = `Hi! I have a question about this product:\n\n*${item.product.name}*${details ? ` (${details})` : ''}\nPrice: ₹${Number(item.product.price).toLocaleString('en-IN')}\n${siteUrl}/shop/${item.product.slug}\n\nCan you help me with this?`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  }

  function getAllItemsWhatsAppLink() {
    const itemLines = items.map((item) => {
      const details = [item.size, item.color].filter(Boolean).join(', ');
      return `• ${item.product.name}${details ? ` (${details})` : ''} × ${item.quantity} — ₹${(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}\n  ${siteUrl}/shop/${item.product.slug}`;
    }).join('\n\n');
    const msg = `Hi! I need help with my cart:\n\n${itemLines}\n\nTotal: ₹${subtotal.toLocaleString('en-IN')}\n\nCan you help me?`;
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const FREE_SHIPPING_THRESHOLD = 999;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const { data: upsellProducts } = useQuery({
    queryKey: ['cart-upsell'],
    queryFn: () => getBestSellers(),
    enabled: isCartOpen && items.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={closeCart} />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-[#f5f5f0]/95 backdrop-blur-xl z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white/60 backdrop-blur-lg border-b border-white/30">
          <h2 className="font-serif text-lg text-[#1a1a2e]">
            Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-white/60 rounded-full transition-all text-[#1a1a2e]/60 hover:text-[#1a1a2e]"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div className="px-5 pt-3 pb-1">
            {shipping === 0 ? (
              <p className="text-xs text-center text-green-600 font-semibold bg-green-50 rounded-full py-1.5 px-3">
                You've unlocked FREE shipping!
              </p>
            ) : (
              <div>
                <p className="text-xs text-[#1a1a2e]/60 mb-1.5 text-center">
                  Add <span className="font-semibold text-[#c5a55a]">₹{amountToFreeShipping.toLocaleString('en-IN')}</span> more for FREE shipping
                </p>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#c5a55a] to-[#B76E79] rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <svg className="mx-auto mb-5 w-24 h-24 opacity-70" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="48" cy="48" r="44" fill="#1a1a2e" fillOpacity="0.04"/>
                <path d="M28 32h4l6 24h24l4-16H36" stroke="#c5a55a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="42" cy="62" r="2.5" fill="#1a1a2e" fillOpacity="0.3"/>
                <circle cx="56" cy="62" r="2.5" fill="#1a1a2e" fillOpacity="0.3"/>
                <path d="M48 22 C44 22 41 25 41 29 L55 29 C55 25 52 22 48 22Z" stroke="#c5a55a" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeOpacity="0.5"/>
              </svg>
              <p className="font-serif text-lg text-[#1a1a2e] mb-1">Your bag is empty</p>
              <p className="text-gray-600 text-xs mb-5">Add your favourite pieces to get started</p>
              <button onClick={closeCart} className="btn-primary text-sm px-6">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl p-3"
              >
                <div className="relative w-20 h-24 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                  {item.product.images[0] && (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 leading-tight text-[#1a1a2e]">
                    {item.product.name}
                  </p>
                  {(item.size || item.color) && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {[item.size, item.color].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-sm font-bold mt-1 text-[#1a1a2e]">
                    &#x20B9;{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {/* Pill quantity control */}
                    <div className="flex items-center border border-gray-200 rounded-full overflow-hidden bg-white/80">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? updateMutation.mutate({ id: item.id, qty: item.quantity - 1 })
                            : removeMutation.mutate(item.id)
                        }
                        className="px-2.5 py-1 hover:bg-gray-100 transition-colors"
                      >
                        <FiMinus size={11} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateMutation.mutate({ id: item.id, qty: item.quantity + 1 })
                        }
                        className="px-2.5 py-1 hover:bg-gray-100 transition-colors"
                      >
                        <FiPlus size={11} />
                      </button>
                    </div>
                    <a
                      href={getWhatsAppLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-all"
                      title="Ask about this on WhatsApp"
                    >
                      <FiMessageCircle size={14} />
                    </a>
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Frequently Bought Together / Upsell */}
        {items.length > 0 && upsellProducts && upsellProducts.length > 0 && (
          <div className="px-5 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1a1a2e]/50 mb-2">You may also like</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {upsellProducts
                .filter((p) => !items.some((i) => i.productId === p.id))
                .slice(0, 4)
                .map((p) => (
                  <div key={p.id} className="flex-shrink-0 w-28 bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl overflow-hidden">
                    <Link href={`/shop/${p.slug}`} onClick={closeCart}>
                      <div className="relative w-28 h-32 bg-gray-50">
                        {p.images[0] && (
                          <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="112px" />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium line-clamp-1 text-[#1a1a2e]">{p.name}</p>
                        <p className="text-xs font-bold text-[#c5a55a] mt-0.5">₹{Number(p.price).toLocaleString('en-IN')}</p>
                      </div>
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer summary */}
        {items.length > 0 && (
          <div className="px-5 py-4 bg-white/70 backdrop-blur-lg border-t border-white/30">
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
              <div className="flex justify-between font-bold text-base border-t border-black/5 pt-2 mt-2 text-[#1a1a2e]">
                <span>Total</span>
                <span>&#x20B9;{(subtotal + shipping).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Coupon */}
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-full px-4 py-2 mb-3 text-sm">
                <span className="text-green-700 flex items-center gap-1.5">
                  <FiTag size={13} />
                  <span className="font-semibold">{appliedCoupon}</span> applied
                </span>
                <button
                  onClick={() => setAppliedCoupon('')}
                  className="text-green-600 hover:text-green-800 text-xs underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="flex-1 bg-white/80 border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#c5a55a]"
                />
                <button
                  onClick={() => {
                    if (couponInput.trim()) {
                      setAppliedCoupon(couponInput.trim());
                      setCouponInput('');
                      toast.success('Coupon applied!');
                    }
                  }}
                  className="bg-[#c5a55a] text-[#1a1a2e] px-4 py-2 text-xs rounded-full font-semibold hover:opacity-90 transition-all"
                >
                  Apply
                </button>
              </div>
            )}

            <Link
              href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon}` : ''}`}
              onClick={closeCart}
              className="btn-primary w-full text-center block text-sm tracking-widest"
            >
              PROCEED TO CHECKOUT
            </Link>

            {/* WhatsApp help — sends all items with product links */}
            <a
              href={getAllItemsWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
              Need help? WhatsApp us with your cart
            </a>

            <button
              onClick={closeCart}
              className="w-full text-center text-xs text-gray-600 hover:text-[#1a1a2e] mt-2 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
