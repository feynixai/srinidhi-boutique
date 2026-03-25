'use client';
import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaWhatsapp } from 'react-icons/fa';
import { getOrder } from '@/lib/api';

const STATUS_STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210').replace('+', '');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
  });

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="flex justify-center mb-4"><svg className="w-10 h-10 animate-spin text-[#c5a55a]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
      <p className="text-gray-500">Loading your order...</p>
    </div>
  );

  if (!order) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-600">Order not found</p>
    </div>
  );

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const address = order.address as { line1: string; line2?: string; city: string; state: string; pincode: string };

  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'upi' ? 'UPI' : 'Online Payment';
  const notifyMsg = encodeURIComponent(
    `Hi, I just placed order #${order.orderNumber} on Srinidhi Boutique. Total: ₹${Number(order.total).toLocaleString('en-IN')}. Payment: ${paymentLabel}.`
  );
  const notifyLink = `https://wa.me/${waNumber}?text=${notifyMsg}`;
  const trackMsg = encodeURIComponent(`Hi! I'd like to track my order ${order.orderNumber}. Can you help?`);
  const waLink = `https://wa.me/${waNumber}?text=${trackMsg}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Success Header */}
      <div className="text-center mb-8">
        {order.status === 'cancelled' ? (
          <div className="text-red-500 flex justify-center mb-4"><svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-20 h-20">
                <circle
                  cx="40" cy="40" r="36"
                  fill="none"
                  stroke="#e8f5e9"
                  strokeWidth="4"
                />
                <circle
                  cx="40" cy="40" r="36"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="4"
                  strokeDasharray="226"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{
                    animation: 'dash 0.6s ease-out forwards',
                    transformOrigin: 'center',
                    transform: 'rotate(-90deg)',
                  }}
                />
                <polyline
                  points="24,42 36,54 56,30"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: 'checkmark 0.4s 0.5s ease-out both' }}
                />
              </svg>
            </div>
          </div>
        )}
        <style>{`
          @keyframes dash {
            from { stroke-dashoffset: 226; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes checkmark {
            from { stroke-dashoffset: 60; stroke-dasharray: 60; opacity: 0; }
            to { stroke-dashoffset: 0; stroke-dasharray: 60; opacity: 1; }
          }
        `}</style>
        <h1 className="font-serif text-3xl mb-2">
          {order.status === 'placed' ? 'Order Placed!' : `Order ${STATUS_LABELS[order.status] || order.status}`}
        </h1>
        <p className="text-gray-500">Order #{order.orderNumber}</p>
      </div>

      {/* WhatsApp Notify Store - shown on new order */}
      {order.status === 'placed' && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-sm p-4">
          <p className="text-sm font-semibold text-green-800 mb-1">Let us know you've ordered!</p>
          <p className="text-xs text-green-700 mb-3">
            Tap below to send your order confirmation on WhatsApp. We'll confirm and pack your order faster.
          </p>
          <a
            href={notifyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 text-sm font-semibold hover:bg-green-600 transition-colors rounded-sm"
          >
            <FaWhatsapp size={18} />
            Notify on WhatsApp: Order #{order.orderNumber} · ₹{Number(order.total).toLocaleString('en-IN')}
          </a>
        </div>
      )}

      {/* Share purchase */}
      {order.status === 'placed' && (
        <div className="mb-8 bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-4">
          <p className="text-sm font-semibold text-[#1a1a2e] mb-1">Share the love! 💕</p>
          <p className="text-xs text-gray-500 mb-3">Tell your friends about your new find from Srinidhi Boutique.</p>
          {(() => {
            const firstItem = order.items[0];
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://proofcrest.com';
            const shareMsg = encodeURIComponent(
              `Just ordered "${firstItem?.name || 'something beautiful'}" from Srinidhi Boutique! Check out their amazing collection at ${siteUrl}`
            );
            return (
              <a
                href={`https://wa.me/?text=${shareMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-green-400 text-green-600 py-2.5 text-sm font-medium hover:bg-green-50 transition-colors rounded-xl"
              >
                <FaWhatsapp size={16} />
                Share on WhatsApp
              </a>
            );
          })()}
        </div>
      )}

      {/* Tracking */}
      {!['cancelled', 'returned'].includes(order.status) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                  i <= currentStepIndex ? 'bg-rose-gold text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {i <= currentStepIndex ? '✓' : i + 1}
                </div>
                <span className="text-[10px] text-center text-gray-500 hidden sm:block capitalize">{s}</span>
              </div>
            ))}
          </div>
          <div className="relative h-1 bg-gray-100 rounded mt-1">
            <div
              className="absolute h-full bg-rose-gold rounded transition-all"
              style={{ width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
            />
          </div>
          {(order.trackingId || order.awbNumber) && (
            <div className="text-sm text-gray-600 mt-3 text-center space-y-1">
              {order.trackingId && (
                <p>Tracking ID: <span className="font-medium">{order.trackingId}</span></p>
              )}
              {order.awbNumber && (
                <p>AWB: <span className="font-medium">{order.awbNumber}</span>
                  {order.courierName && <span className="text-gray-600"> via {order.courierName}</span>}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Order Details */}
      <div className="border border-gray-100 rounded-sm divide-y divide-gray-100">
        <div className="p-4">
          <h2 className="font-medium mb-3">Order Items</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500 text-xs">{[item.size, item.color].filter(Boolean).join(' · ')} × {item.quantity}</p>
                </div>
                <span className="font-medium">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span className={Number(order.shipping) === 0 ? 'text-green-600' : ''}>
              {Number(order.shipping) === 0 ? 'FREE' : `₹${Number(order.shipping)}`}
            </span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({order.couponCode})</span>
              <span>-₹{Number(order.discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total</span><span>₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Delivery Address</p>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-gray-600">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
            <p className="text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Payment</p>
            <p className="font-medium capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>
            <p className="text-xs text-gray-500 mt-1 capitalize">Status: {order.paymentStatus}</p>
          </div>
        </div>
      </div>

      {/* Share your purchase */}
      {order.status === 'placed' && (
        <div className="mt-6 border border-rose-gold/30 rounded-sm p-4 bg-rose-50/50">
          <p className="font-serif text-base text-charcoal mb-1">Share your purchase!</p>
          <p className="text-xs text-charcoal/60 mb-3">Spread the love - share on WhatsApp or Instagram Stories.</p>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Just shopped at Srinidhi Boutique! Gorgeous ethnic wear from Hyderabad. Check them out at ${process.env.NEXT_PUBLIC_SITE_URL || 'https://srinidhiboutique.com'}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 text-xs font-medium hover:bg-green-600 transition-colors rounded-sm"
            >
              <FaWhatsapp size={14} /> WhatsApp
            </a>
            <a
              href={`https://www.instagram.com/`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white px-4 py-2 text-xs font-medium hover:opacity-90 transition-opacity rounded-sm"
            >
              📸 Instagram Story
            </a>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <a href={waLink} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 border border-green-500 text-green-600 py-3 text-sm hover:bg-green-50 transition-colors rounded-sm">
          <FaWhatsapp size={18} /> Track via WhatsApp
        </a>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}/invoice-pdf`}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 border border-charcoal text-charcoal py-3 text-sm hover:bg-charcoal hover:text-white transition-colors rounded-sm"
        >
          📄 Download Invoice
        </a>
        <Link href="/shop" className="flex-1 btn-primary text-center py-3 text-sm">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
