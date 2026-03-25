'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { getAdminOrders, bulkUpdateOrderStatus, updateOrderStatus } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

const TABS = [
  { label: 'All Orders', value: 'all' },
  { label: 'New', value: 'placed' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Packed', value: 'packed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const BULK_STATUSES = [
  { value: 'confirmed', label: 'Confirm' },
  { value: 'packed', label: 'Mark Packed' },
  { value: 'shipped', label: 'Mark Shipped' },
  { value: 'delivered', label: 'Mark Delivered' },
  { value: 'cancelled', label: 'Cancel' },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('confirmed');
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', activeTab],
    queryFn: () => getAdminOrders(activeTab !== 'all' ? { status: activeTab } : {}),
  });

  const bulkMutation = useMutation({
    mutationFn: () => bulkUpdateOrderStatus(selected, bulkStatus),
    onSuccess: (result) => {
      toast.success(`Updated ${result.updated} order${result.updated !== 1 ? 's' : ''} to "${bulkStatus}"`);
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to update orders'),
  });

  const orders = data?.orders || [];

  const quickShipMutation = useMutation({
    mutationFn: (id: string) => updateOrderStatus(id, 'shipped'),
    onSuccess: () => {
      toast.success('Marked as shipped');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  function toggleSelect(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    setSelected(selected.length === orders.length ? [] : orders.map((o) => o.id));
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/orders/export`}
            download
            className="btn-action bg-green-50 text-green-700 border border-green-200 px-4 py-2 text-sm hover:bg-green-100 transition-colors"
          >
            Export CSV
          </a>
          <button onClick={() => refetch()} className="btn-action bg-gray-100 text-gray-700 px-4 py-2 text-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setSelected([]); }}
            className={`px-4 py-2.5 rounded-lg font-medium text-base transition-all ${
              activeTab === tab.value
                ? 'bg-rose-gold text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {orders.length > 0 && (
        <div className="card flex flex-wrap items-center gap-4 py-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.length === orders.length && orders.length > 0}
              onChange={toggleSelectAll}
              className="w-5 h-5 accent-rose-gold cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">
              {selected.length > 0 ? `${selected.length} selected` : 'Select all'}
            </span>
          </label>
          {selected.length > 0 && (
            <>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
              >
                {BULK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                onClick={() => bulkMutation.mutate()}
                disabled={bulkMutation.isPending}
                className="btn-action bg-rose-gold text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {bulkMutation.isPending ? 'Updating...' : `Apply to ${selected.length} order${selected.length !== 1 ? 's' : ''}`}
              </button>
              <button
                onClick={() => setSelected([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-xl">No orders here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className={`card hover:shadow-md transition-shadow p-4 md:p-6 flex gap-3 items-start ${selected.includes(order.id) ? 'ring-2 ring-rose-gold' : ''}`}>
              <input
                type="checkbox"
                checked={selected.includes(order.id)}
                onChange={() => toggleSelect(order.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 accent-rose-gold cursor-pointer flex-shrink-0 mt-1"
              />
              <Link href={`/admin/orders/${order.id}`} className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-rose-gold text-lg">{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-base font-medium truncate">{order.customerName}</p>
                  <p className="text-gray-500 text-sm">{order.customerPhone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold">₹{Number(order.total).toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{order.paymentMethod}</p>
                </div>
              </Link>
              {['placed', 'confirmed', 'packed'].includes(order.status) && (
                <button
                  onClick={(e) => { e.preventDefault(); quickShipMutation.mutate(order.id); }}
                  disabled={quickShipMutation.isPending}
                  className="flex-shrink-0 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                  title="Mark as Shipped"
                >
                  Ship
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
