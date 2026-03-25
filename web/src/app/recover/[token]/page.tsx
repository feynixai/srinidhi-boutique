'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';

interface RecoveredItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface RecoveryData {
  items: RecoveredItem[];
  recovered: boolean;
}

export default function RecoverCartPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/api/abandoned-carts/recover/${token}`)
      .then((r) => setData(r.data))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('Cart not found or link has expired.');
        } else {
          setError('Unable to load cart. Please try again later.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleRestore() {
    if (!data) return;
    setRestoring(true);
    try {
      // Mark as recovered
      await api.post(`/api/abandoned-carts/recover/${token}`);
      // Redirect to cart
      router.push('/cart');
    } catch {
      // Even if marking fails, redirect to shop
      router.push('/shop');
    }
  }

  const total = data?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#c5a55a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#1a1a2e]/60 text-sm">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
        <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="font-serif text-2xl text-[#1a1a2e] mb-3">Oops!</h1>
          <p className="text-[#1a1a2e]/60 text-sm mb-6">{error}</p>
          <Link
            href="/shop"
            className="inline-block bg-[#1a1a2e] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#1a1a2e]/90 transition-colors"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  if (data?.recovered) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
        <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="font-serif text-2xl text-[#1a1a2e] mb-3">Already Restored</h1>
          <p className="text-[#1a1a2e]/60 text-sm mb-6">
            This cart has already been restored. Check your shopping bag!
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/cart"
              className="inline-block bg-[#1a1a2e] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#1a1a2e]/90 transition-colors"
            >
              Go to Cart
            </Link>
            <Link
              href="/shop"
              className="inline-block bg-white border border-[#1a1a2e]/20 text-[#1a1a2e] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#1a1a2e]/5 transition-colors"
            >
              Shop More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-lg p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🛍️</div>
            <h1 className="font-serif text-2xl text-[#1a1a2e] mb-1">Your Cart is Waiting!</h1>
            <p className="text-[#1a1a2e]/60 text-sm">
              You left some beautiful items behind. Ready to continue?
            </p>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-6">
            {data?.items.map((item, idx) => (
              <div
                key={`${item.productId}-${idx}`}
                className="flex gap-3 bg-white/60 rounded-2xl p-3 border border-white/30"
              >
                {item.image && (
                  <div className="relative w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1a1a2e] text-sm line-clamp-2">{item.name}</p>
                  {(item.size || item.color) && (
                    <p className="text-xs text-[#1a1a2e]/50 mt-0.5">
                      {[item.size, item.color].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[#1a1a2e]/50">Qty: {item.quantity}</span>
                    <span className="font-semibold text-sm text-[#1a1a2e]">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-3 border-t border-black/5 mb-6">
            <span className="font-medium text-[#1a1a2e]">Total</span>
            <span className="font-bold text-lg text-[#1a1a2e]">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Actions */}
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="w-full bg-[#c5a55a] hover:bg-[#b8963f] text-white py-3.5 rounded-full font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {restoring ? 'Restoring...' : 'Continue Shopping →'}
          </button>

          <Link
            href="/shop"
            className="block text-center text-xs text-[#1a1a2e]/50 hover:text-[#1a1a2e] mt-3 transition-colors"
          >
            Browse new arrivals instead
          </Link>
        </div>
      </div>
    </div>
  );
}
