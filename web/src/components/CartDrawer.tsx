'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiTrash2, FiPlus, FiMinus, FiTag } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/lib/cart-store';
import { getCart, updateCartItem, removeCartItem } from '@/lib/api';

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

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= 999 ? 0 : 99;

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

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 mb-4">Your bag is empty</p>
              <button onClick={closeCart} className="btn-primary text-sm">
                Continue Shopping
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
                    <p className="text-xs text-gray-400 mt-0.5">
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
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      className="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
              {shipping > 0 && (
                <p className="text-xs text-[#c5a55a]">
                  Add &#x20B9;{(999 - subtotal).toLocaleString('en-IN')} more for free shipping
                </p>
              )}
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
            <button
              onClick={closeCart}
              className="w-full text-center text-xs text-gray-400 hover:text-[#1a1a2e] mt-3 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
