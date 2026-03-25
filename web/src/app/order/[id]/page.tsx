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
      <div className="animate-spin text-4xl mb-4">⏳</div>
      <p className="text-gray-500">Loading your order...</p>
    </div>
  );

  if (!order) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-400">Order not found</p>
    </div>
  );

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const address = order.address as { line1: string; line2?: string; city: string; state: string; pincode: string };

  const waMsg = encodeURIComponent(`Hi! I'd like to track my order ${order.orderNumber}. Can you help?`);
  const waLink = `https://wa.me/${waNumber}?text=${waMsg}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">{order.status === 'cancelled' ? '❌' : '🎉'}</div>
        <h1 className="font-serif text-3xl mb-2">
          {order.status === 'placed' ? 'Order Placed!' : `Order ${STATUS_LABELS[order.status] || order.status}`}
        </h1>
        <p className="text-gray-500">Order #{order.orderNumber}</p>
        {order.status === 'placed' && (
          <p className="text-sm text-gray-500 mt-2">
            We'll confirm your order via WhatsApp soon.
          </p>
        )}
      </div>

      {/* Tracking */}
      {!['cancelled', 'returned'].includes(order.status) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                  i <= currentStepIndex ? 'bg-rose-gold text-white' : 'bg-gray-100 text-gray-400'
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
          {order.trackingId && (
            <p className="text-sm text-gray-600 mt-3 text-center">
              Tracking ID: <span className="font-medium">{order.trackingId}</span>
            </p>
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
            <p className="text-gray-600">{address.city}, {address.state} — {address.pincode}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Payment</p>
            <p className="font-medium capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>
            <p className="text-xs text-gray-500 mt-1 capitalize">Status: {order.paymentStatus}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <a href={waLink} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 border border-green-500 text-green-600 py-3 text-sm hover:bg-green-50 transition-colors rounded-sm">
          <FaWhatsapp size={18} /> Track via WhatsApp
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`I just ordered from Srinidhi Boutique! Check them out at srinidhiboutique.com`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3 text-sm hover:bg-green-600 transition-colors rounded-sm"
        >
          <FaWhatsapp size={18} /> Share on WhatsApp
        </a>
        <Link href="/shop" className="flex-1 btn-primary text-center py-3 text-sm">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
