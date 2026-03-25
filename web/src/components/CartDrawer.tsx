'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiX, FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/lib/cart-store';
import { getCart, updateCartItem, removeCartItem } from '@/lib/api';

export function CartDrawer() {
  const { sessionId, isCartOpen, closeCart, setItemCount } = useCartStore();
  const queryClient = useQueryClient();

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
        <div className="fixed inset-0 bg-black/50 z-50" onClick={closeCart} />
      )}

      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-serif text-lg">Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
          <button onClick={closeCart} className="p-2 hover:text-rose-gold transition-colors">
            <FiX size={20} />
          </button>
        </div>

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
              <div key={item.id} className="flex gap-3">
                <div className="relative w-20 h-24 flex-shrink-0 bg-gray-50 rounded overflow-hidden">
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
                  <p className="text-sm font-medium line-clamp-2 leading-tight">{item.product.name}</p>
                  {(item.size || item.color) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[item.size, item.color].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-sm font-semibold mt-1">
                    ₹{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => item.quantity > 1
                        ? updateMutation.mutate({ id: item.id, qty: item.quantity - 1 })
                        : removeMutation.mutate(item.id)}
                      className="p-1 border border-gray-200 rounded hover:border-rose-gold transition-colors"
                    >
                      <FiMinus size={12} />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateMutation.mutate({ id: item.id, qty: item.quantity + 1 })}
                      className="p-1 border border-gray-200 rounded hover:border-rose-gold transition-colors"
                    >
                      <FiPlus size={12} />
                    </button>
                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t bg-warm-white">
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
              {shipping > 0 && (
                <p className="text-xs text-rose-gold">
                  Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free shipping
                </p>
              )}
              <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2">
                <span>Total</span>
                <span>₹{(subtotal + shipping).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-center block text-sm tracking-widest"
            >
              PROCEED TO CHECKOUT
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-center text-xs text-gray-500 hover:text-charcoal mt-3 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
