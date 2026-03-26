'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  placed: { label: 'Order Placed', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmed', color: 'bg-indigo-100 text-indigo-700' },
  packed: { label: 'Packed', color: 'bg-yellow-100 text-yellow-700' },
  shipped: { label: 'Shipped', color: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  returned: { label: 'Returned', color: 'bg-gray-100 text-gray-600' },
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
  product?: { name: string; images: string[]; slug: string };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  createdAt: string;
  trackingId?: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = (session?.user as ({ id?: string } | null | undefined))?.id;
    const phoneUser = (() => {
      try { return JSON.parse(localStorage.getItem('sb_user') || 'null'); } catch { return null; }
    })();
    const uid = userId || phoneUser?.id;

    if (uid) {
      setLoading(true);
      fetch(`${API_URL}/api/users/${uid}/orders`)
        .then((r) => r.json())
        .then((data) => {
          setOrders(Array.isArray(data) ? data : []);
          setSearched(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [session]);

  async function fetchOrders() {
    if (!phone.match(/^\d{10}$/)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/orders/by-phone/${phone}`);
      const data = await res.json();
      setOrders(data);
      setSearched(true);
    } catch {
      setError('Could not fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isLoggedIn = !!(session?.user || (() => { try { return localStorage.getItem('sb_user'); } catch { return null; } })());

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="font-bold text-3xl mb-2 text-[#1a1a2e] tracking-tight">My Orders</h1>
        <p className="text-[#6b7280] text-sm">
          {isLoggedIn ? 'Your order history' : 'Enter your phone number to view your orders'}
        </p>
      </div>

      {!isLoggedIn && (
        <div className="glass-card p-6 mb-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#1a1a2e] mb-1">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                placeholder="10-digit mobile number"
                className="w-full bg-white/70 border border-white/50 rounded-full px-4 py-2.5 focus:outline-none focus:border-[#c5a55a] text-sm"
              />
            </div>
            <button onClick={fetchOrders} disabled={loading} className="btn-primary px-6 py-2.5 self-end text-sm disabled:opacity-50">
              {loading ? '...' : 'View Orders'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <p className="text-xs text-[#6b7280] mt-3">
            <Link href="/login" className="text-[#c5a55a] hover:underline">Sign in</Link> to see your full order history automatically.
          </p>
        </div>
      )}

      {loading && !searched && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#c5a55a] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {searched && orders.length === 0 && (
        <div className="text-center py-12">
          <div className="glass-card inline-block p-10">
            <div className="text-[#c5a55a] flex justify-center mb-3"><svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>
            <p className="text-lg font-bold text-[#1a1a2e]">No orders found</p>
            <p className="text-sm text-[#6b7280] mt-1">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className="btn-primary mt-6 inline-block px-8 py-3 text-sm">START SHOPPING</Link>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-[#6b7280]">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' };
            return (
              <div key={order.id} className="glass-card-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-[#c5a55a]">{order.orderNumber}</span>
                    <span className="text-[#6b7280] text-xs ml-3">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.product?.images?.[0] && (
                        <div className="relative w-12 h-16 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                          <Image src={item.product.images[0]} alt={item.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1 text-[#1a1a2e]">{item.name}</p>
                        <p className="text-xs text-[#6b7280]">
                          Qty: {item.quantity}{item.size ? ` · ${item.size}` : ''}{item.color ? ` · ${item.color}` : ''}
                        </p>
                        <span className="text-[#1a1a2e] text-sm font-bold inline-block mt-0.5">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/40 pt-3 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-[#6b7280]">Total: </span>
                    <span className="font-bold text-[#1a1a2e]">₹{Number(order.total).toLocaleString('en-IN')}</span>
                    <span className="text-[#6b7280] text-xs ml-2 capitalize">· {order.paymentMethod}</span>
                  </div>
                  <Link href={`/order/${order.id}`} className="text-sm text-[#c5a55a] hover:underline font-medium">View Details →</Link>
                </div>

                {order.trackingId && (
                  <div className="mt-2 bg-blue-50 rounded-xl px-3 py-1.5 text-xs text-blue-700">
                    Tracking ID: <span className="font-mono font-medium">{order.trackingId}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
