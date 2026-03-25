'use client';
import { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { api, updateOrderStatus } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

const STATUS_TIMELINE_STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
const STATUS_TIMELINE_META: Record<string, { label: string; icon: string }> = {
  placed:    { label: 'Order Placed',  icon: '🛒' },
  confirmed: { label: 'Confirmed',     icon: '✅' },
  packed:    { label: 'Packed',        icon: '📦' },
  shipped:   { label: 'Shipped',       icon: '🚚' },
  delivered: { label: 'Delivered',     icon: '🎉' },
  cancelled: { label: 'Cancelled',     icon: '❌' },
};

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
  const [notes, setNotes] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`order-notes-${id}`);
      if (saved) setNotes(saved);
    } catch {}
  }, [id]);

  function saveNotes() {
    try { localStorage.setItem(`order-notes-${id}`, notes); } catch {}
    toast.success('Notes saved');
  }

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => api.get(`/api/admin/orders/${id}`).then((r) => r.data),
  });

  function printInvoice() {
    if (!order) return;
    const address = order.address as Record<string, string>;
    const html = `
      <html><head><title>Invoice ${order.orderNumber}</title>
      <style>body{font-family:sans-serif;padding:32px;color:#1a1a1a}h1{font-size:24px;margin-bottom:4px}
      .meta{color:#666;font-size:13px;margin-bottom:24px}.divider{border:none;border-top:1px solid #eee;margin:16px 0}
      table{width:100%;border-collapse:collapse;font-size:14px}th{text-align:left;padding:8px 4px;border-bottom:2px solid #eee}
      td{padding:8px 4px;border-bottom:1px solid #f0f0f0}.total{font-weight:700;font-size:16px}
      .footer{margin-top:32px;color:#999;font-size:12px;text-align:center}</style></head>
      <body>
        <h1>Srinidhi Boutique</h1>
        <p class="meta">Invoice #${order.orderNumber} &nbsp;|&nbsp; ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <hr class="divider">
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Phone:</strong> ${order.customerPhone}</p>
        <p><strong>Address:</strong> ${address.line1}${address.line2 ? ', ' + address.line2 : ''}, ${address.city}, ${address.state} — ${address.pincode}</p>
        <hr class="divider">
        <table><thead><tr><th>Item</th><th>Size / Color</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
        ${(order.items || []).map((item: {name:string;size?:string;color?:string;quantity:number;price:number}) =>
          `<tr><td>${item.name}</td><td>${[item.size, item.color].filter(Boolean).join(' / ') || '—'}</td><td>${item.quantity}</td><td>₹${Number(item.price).toLocaleString('en-IN')}</td><td>₹${(Number(item.price) * item.quantity).toLocaleString('en-IN')}</td></tr>`
        ).join('')}
        </tbody></table>
        <hr class="divider">
        <p>Subtotal: ₹${Number(order.subtotal).toLocaleString('en-IN')}</p>
        <p>Shipping: ${Number(order.shipping) === 0 ? 'FREE' : '₹' + Number(order.shipping).toLocaleString('en-IN')}</p>
        ${Number(order.discount) > 0 ? `<p>Discount: -₹${Number(order.discount).toLocaleString('en-IN')}</p>` : ''}
        <p class="total">Total: ₹${Number(order.total).toLocaleString('en-IN')}</p>
        <hr class="divider">
        <p>Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod} (${order.paymentStatus})</p>
        <p class="footer">Thank you for shopping with Srinidhi Boutique • hello@srinidhiboutique.com</p>
      </body></html>
    `;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

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

  const TIMELINE_STEPS = [
    { value: 'placed', label: 'Placed', icon: '🛍️' },
    { value: 'confirmed', label: 'Confirmed', icon: '✅' },
    { value: 'packed', label: 'Packed', icon: '📦' },
    { value: 'shipped', label: 'Shipped', icon: '🚚' },
    { value: 'delivered', label: 'Delivered', icon: '🎉' },
  ];

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

  const isCancelled = order.status === 'cancelled';
  const currentStepIndex = isCancelled ? -1 : TIMELINE_STEPS.findIndex((s) => s.value === order.status);

  return (
    <div className="space-y-6 pb-10 max-w-3xl">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
        <button
          onClick={printInvoice}
          className="ml-auto flex items-center gap-2 btn-action bg-gray-100 text-gray-700 px-4 py-2 text-sm hover:bg-gray-200"
        >
          🖨️ Print Invoice
        </button>
      </div>

      {/* Order Timeline Stepper */}
      <div className="card">
        <h2 className="text-sm font-bold text-[#1a1a2e] mb-4 uppercase tracking-widest">Order Timeline</h2>
        {isCancelled ? (
          <div className="flex items-center gap-3 py-2">
            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-lg flex-shrink-0">❌</span>
            <div>
              <p className="font-semibold text-red-600">Order Cancelled</p>
              <p className="text-xs text-gray-400">This order has been cancelled</p>
            </div>
          </div>
        ) : (
          <div className="relative flex items-start sm:items-center gap-0">
            {TIMELINE_STEPS.map((step, i) => {
              const isDone = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isPending = i > currentStepIndex;
              return (
                <div key={step.value} className="flex-1 flex flex-col sm:flex-row items-center">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-all ${
                      isDone
                        ? 'bg-green-500 text-white shadow-md'
                        : isCurrent
                        ? 'bg-[#c5a55a] text-white shadow-lg ring-4 ring-[#c5a55a]/20'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isDone ? '✓' : step.icon}
                    </div>
                    <p className={`text-[10px] mt-1.5 font-semibold text-center leading-tight w-14 ${
                      isDone ? 'text-green-600' : isCurrent ? 'text-[#c5a55a]' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`hidden sm:block flex-1 h-0.5 mx-1 rounded-full mt-[-20px] transition-all ${
                      i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
        {order.trackingId && (
          <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-2">
            <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Tracking ID</span>
            <span className="font-bold text-[#1a1a2e] text-sm">{order.trackingId}</span>
          </div>
        )}
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

      {/* Order Timeline */}
      {!['cancelled', 'returned'].includes(order.status) && (
        <div className="card">
          <h2 className="text-lg font-bold mb-5">Order Timeline</h2>
          <div className="relative space-y-0">
            {STATUS_TIMELINE_STEPS.map((step, i) => {
              const currentIdx = STATUS_TIMELINE_STEPS.indexOf(order.status);
              const done = i <= currentIdx;
              const active = i === currentIdx;
              const meta = STATUS_TIMELINE_META[step];
              return (
                <div key={step} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                  {i < STATUS_TIMELINE_STEPS.length - 1 && (
                    <div className={`absolute left-5 top-10 w-0.5 h-full -translate-x-1/2 ${done ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2 transition-all ${
                    done ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className={`font-semibold text-sm ${active ? 'text-green-700' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                      {meta.label}
                      {active && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Current</span>}
                    </p>
                    {step === 'placed' && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {active && step !== 'placed' && order.updatedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Internal Notes */}
      <div className="card">
        <h2 className="text-lg font-bold mb-1">Internal Notes</h2>
        <p className="text-xs text-gray-400 mb-3">Saved locally in your browser. Not visible to the customer.</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Customer called about exchange, requested gift wrapping, special size notes..."
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-rose-gold resize-none"
        />
        <button
          onClick={saveNotes}
          className="mt-3 bg-[#1a1a2e] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Save Notes
        </button>
      </div>
    </div>
  );
}
