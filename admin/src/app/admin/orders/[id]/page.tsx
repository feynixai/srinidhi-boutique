'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { api, updateOrderStatus } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

const STATUS_FLOW = [
  { value: 'confirmed', label: '✅ Confirm Order', color: 'bg-purple-500' },
  { value: 'packed', label: '📦 Mark Packed', color: 'bg-yellow-500' },
  { value: 'shipped', label: '🚚 Mark Shipped', color: 'bg-orange-500' },
  { value: 'delivered', label: '🎉 Mark Delivered', color: 'bg-green-500' },
  { value: 'cancelled', label: '❌ Cancel Order', color: 'bg-red-500' },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [trackingId, setTrackingId] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => api.get(`/api/admin/orders`).then(() =>
      api.get(`/api/orders/${id}`).then((r) => r.data)
    ),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      updateOrderStatus(id, status, trackingId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Order status updated!');
    },
    onError: () => toast.error('Failed to update status'),
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-10 bg-gray-100 animate-pulse rounded-lg w-48" />
      <div className="card h-48 animate-pulse bg-gray-100" />
    </div>
  );

  if (!order) return <div className="text-center py-20 text-gray-400 text-xl">Order not found</div>;

  const address = order.address as Record<string, string>;
  const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210').replace('+', '');
  const waMsg = encodeURIComponent(`Hello ${order.customerName}! Your order ${order.orderNumber} from Srinidhi Boutique has been ${order.status}. ${order.trackingId ? `Tracking ID: ${order.trackingId}` : ''}`);
  const waLink = `https://wa.me/${order.customerPhone}?text=${waMsg}`;

  const nextStatuses = STATUS_FLOW.filter((s) => {
    if (order.status === 'delivered' || order.status === 'cancelled') return false;
    if (s.value === 'cancelled') return order.status !== 'delivered';
    const currentIndex = STATUS_FLOW.findIndex((sf) => sf.value === order.status) ?? -1;
    return STATUS_FLOW.indexOf(s) > currentIndex || s.value === 'cancelled';
  }).slice(0, 3);

  return (
    <div className="space-y-6 pb-10 max-w-3xl">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>

      {/* Status Update - Big Buttons */}
      {nextStatuses.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Update Status</h2>
          {nextStatuses.some((s) => s.value === 'shipped') && (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Tracking ID (optional)</label>
              <input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter tracking ID (e.g. DELHIVERY123)"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nextStatuses.map((s) => (
              <button
                key={s.value}
                onClick={() => statusMutation.mutate({ status: s.value })}
                disabled={statusMutation.isPending}
                className={`${s.color} text-white btn-action text-lg font-bold tracking-wide disabled:opacity-50`}
              >
                {s.label}
              </button>
            ))}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white btn-action text-lg font-bold flex items-center justify-center gap-2"
            >
              <FaWhatsapp size={22} /> Notify Customer
            </a>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Items Ordered</h2>
        <div className="space-y-3">
          {order.items?.map((item: { id: string; name: string; size?: string; color?: string; quantity: number; price: number }) => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <p className="text-base font-semibold">{item.name}</p>
                <p className="text-gray-500 text-sm">
                  {[item.size, item.color].filter(Boolean).join(' · ')} × {item.quantity}
                </p>
              </div>
              <p className="text-base font-bold">
                ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between text-base">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-gray-600">Shipping</span>
            <span>{Number(order.shipping) === 0 ? 'FREE' : `₹${Number(order.shipping)}`}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-base text-green-600">
              <span>Discount ({order.couponCode})</span>
              <span>-₹{Number(order.discount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold border-t pt-2">
            <span>Total</span>
            <span>₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Customer & Delivery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-lg font-bold mb-3">Customer</h2>
          <p className="text-lg font-semibold">{order.customerName}</p>
          <a href={`tel:${order.customerPhone}`} className="text-rose-gold text-base block mt-1 hover:underline">
            📞 {order.customerPhone}
          </a>
          {order.customerEmail && (
            <p className="text-gray-500 text-sm mt-1">✉️ {order.customerEmail}</p>
          )}
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-green-600 font-medium text-sm hover:underline">
            <FaWhatsapp size={18} /> Chat on WhatsApp
          </a>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold mb-3">Delivery Address</h2>
          <p className="text-base">{address.line1}</p>
          {address.line2 && <p className="text-gray-600">{address.line2}</p>}
          <p className="text-gray-600">{address.city}, {address.state}</p>
          <p className="font-semibold">PIN: {address.pincode}</p>
        </div>
      </div>

      {/* Payment & Tracking */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3">Payment & Tracking</h2>
        <div className="grid grid-cols-2 gap-4 text-base">
          <div>
            <p className="text-gray-500 text-sm">Payment Method</p>
            <p className="font-semibold capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Payment Status</p>
            <StatusBadge status={order.paymentStatus} />
          </div>
          {order.trackingId && (
            <div>
              <p className="text-gray-500 text-sm">Tracking ID</p>
              <p className="font-semibold">{order.trackingId}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500 text-sm">Order Date</p>
            <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
