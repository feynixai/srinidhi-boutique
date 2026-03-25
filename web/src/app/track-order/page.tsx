'use client';
import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { api } from '@/lib/api';

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: '🛍️', desc: 'Your order has been placed successfully.' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅', desc: 'Your order has been confirmed by our team.' },
  { key: 'packed', label: 'Packed', icon: '📦', desc: 'Your items have been packed and are ready to ship.' },
  { key: 'shipped', label: 'Shipped', icon: '🚚', desc: 'Your order is on its way!' },
  { key: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Your order has been delivered. Enjoy!' },
];

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  trackingId?: string;
  total: number;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210';
  const waBase = whatsappNumber.replace('+', '');

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please enter both your order number and phone number.');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api.get(`/api/orders/track`, { params: { orderNumber: orderNumber.trim(), phone: phone.trim() } });
      setOrder(res.data);
    } catch {
      setError('Order not found. Please check your order number and phone number.');
    } finally {
      setLoading(false);
    }
  }

  const currentStepIndex = order
    ? order.status === 'cancelled'
      ? -1
      : STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1;

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-cream py-16 text-center px-4 border-b border-gold/20">
        <p className="text-gold uppercase tracking-[0.3em] text-xs font-medium mb-3">Real-Time Tracking</p>
        <h1 className="font-serif text-4xl text-charcoal mb-3">Track Your Order</h1>
        <div className="divider-gold" />
        <p className="text-charcoal/60 text-sm mt-3">Enter your order number and phone to see your order status.</p>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        {/* Search Form */}
        <form onSubmit={handleTrack} className="space-y-4 mb-10">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Order Number *</label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. SB-0042"
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-rose-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Phone Number *</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number used at checkout"
              maxLength={10}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-rose-gold"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-charcoal text-white py-3.5 text-sm font-medium tracking-widest hover:bg-charcoal/80 transition-colors disabled:opacity-50"
          >
            {loading ? 'SEARCHING...' : 'TRACK ORDER'}
          </button>
        </form>

        {/* Order Result */}
        {order && (
          <div className="space-y-6">
            <div className="bg-cream p-5 rounded-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-charcoal/50 uppercase tracking-wide mb-0.5">Order Number</p>
                  <p className="font-serif text-2xl text-charcoal">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-charcoal/50 uppercase tracking-wide mb-0.5">Total</p>
                  <p className="font-semibold text-charcoal">₹{Number(order.total).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <p className="text-charcoal/50 text-xs mt-2">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Status Timeline */}
            {order.status === 'cancelled' ? (
              <div className="bg-red-50 border border-red-200 p-5 rounded-sm text-center">
                <p className="text-2xl mb-2">❌</p>
                <p className="font-medium text-red-700">Order Cancelled</p>
                <p className="text-red-500 text-sm mt-1">This order has been cancelled. Contact us for more details.</p>
              </div>
            ) : (
              <div>
                <h2 className="font-serif text-xl text-charcoal mb-5">Order Status</h2>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 -translate-x-0.5" />
                  <div className="space-y-6">
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= currentStepIndex;
                      const current = i === currentStepIndex;
                      return (
                        <div key={step.key} className="flex gap-4 relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm z-10 border-2 transition-colors ${
                            done ? 'bg-charcoal border-charcoal' : 'bg-white border-gray-200'
                          }`}>
                            {done ? (current ? <span>{step.icon}</span> : <span className="text-gold text-xs font-bold">✓</span>) : <span className="text-gray-300">{step.icon}</span>}
                          </div>
                          <div className={`pt-1 ${done ? '' : 'opacity-40'}`}>
                            <p className={`font-medium text-sm ${current ? 'text-charcoal' : done ? 'text-charcoal' : 'text-charcoal/40'}`}>
                              {step.label}
                              {current && <span className="ml-2 text-xs bg-gold text-charcoal px-2 py-0.5 rounded-sm font-normal">Current</span>}
                            </p>
                            {current && <p className="text-charcoal/60 text-xs mt-0.5">{step.desc}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {order.trackingId && (
                  <div className="mt-5 bg-cream p-4 rounded-sm">
                    <p className="text-xs text-charcoal/50 uppercase tracking-wide mb-0.5">Tracking ID</p>
                    <p className="font-semibold text-charcoal">{order.trackingId}</p>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="font-serif text-lg text-charcoal mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-charcoal/70">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Help */}
            <a
              href={`https://wa.me/${waBase}?text=Hi! I need help with my order ${order.orderNumber}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3.5 text-sm font-medium tracking-widest hover:bg-green-600 transition-colors"
            >
              <FaWhatsapp size={18} /> NEED HELP? CHAT ON WHATSAPP
            </a>
          </div>
        )}

        {/* Help text when no order searched yet */}
        {!order && !error && (
          <div className="text-center border-t border-gray-100 pt-8">
            <p className="text-charcoal/50 text-sm mb-3">Don't have your order number?</p>
            <a
              href={`https://wa.me/${waBase}?text=Hi! Can you help me track my order?`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 text-sm font-medium hover:underline"
            >
              <FaWhatsapp size={16} /> Ask us on WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
