'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/lib/cart-store';
import { getCart, updateCartItem, removeCartItem, validateCoupon } from '@/lib/api';

export default function CartPage() {
  const { sessionId, setItemCount } = useCartStore();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string; discount: number; discountAmount: number;
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: () => getCart(sessionId),
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
      if (current) setItemCount(Math.max(0, (cart?.items.reduce((s, i) => s + i.quantity, 0) || 0) - current.quantity));
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

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const discount = appliedCoupon?.discountAmount || 0;
  const total = subtotal + shipping - discount;

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 animate-pulse rounded" />
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl mb-4">Your Bag is Empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything yet</p>
        <Link href="/shop" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-3xl mb-8">Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)} items)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-sm">
              <div className="relative w-24 h-32 flex-shrink-0 bg-gray-50 rounded overflow-hidden">
                {item.product.images[0] && (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                )}
              </div>
              <div className="flex-1">
                <Link href={`/shop/${item.product.slug}`}
                  className="font-medium hover:text-rose-gold transition-colors line-clamp-2">
                  {item.product.name}
                </Link>
                {(item.size || item.color) && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {[item.size, item.color].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="font-semibold mt-1">₹{Number(item.product.price).toLocaleString('en-IN')}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-sm">
                    <button
                      onClick={() => item.quantity > 1
                        ? updateMutation.mutate({ id: item.id, qty: item.quantity - 1 })
                        : removeMutation.mutate(item.id)}
                      className="px-3 py-1.5 hover:text-rose-gold transition-colors"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="text-sm font-medium px-1">{item.quantity}</span>
                    <button
                      onClick={() => updateMutation.mutate({ id: item.id, qty: item.quantity + 1 })}
                      className="px-3 py-1.5 hover:text-rose-gold transition-colors"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      ₹{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="border border-gray-200 rounded-sm p-4">
            <h3 className="font-medium mb-3">Coupon Code</h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                <div>
                  <p className="text-green-700 font-medium text-sm">{appliedCoupon.code}</p>
                  <p className="text-green-600 text-xs">-₹{appliedCoupon.discountAmount.toFixed(0)} saved</p>
                </div>
                <button onClick={() => setAppliedCoupon(null)} className="text-xs text-gray-500 hover:text-red-500">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-rose-gold rounded-sm"
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <button onClick={applyCoupon} className="btn-outline text-sm px-4 py-2">
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="border border-gray-200 rounded-sm p-4">
            <h3 className="font-serif text-lg mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base border-t pt-3 mt-2">
                <span>Total</span>
                <span>₹{total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
              </div>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-rose-gold mb-4">
                Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping
              </p>
            )}
            <Link
              href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ''}`}
              className="btn-primary w-full text-center block text-sm tracking-widest"
            >
              CHECKOUT
            </Link>
            <Link href="/shop" className="block text-center text-xs text-gray-500 hover:text-charcoal mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
