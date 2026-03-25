'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminOrders } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

const TABS = [
  { label: 'All Orders', value: 'all' },
  { label: '🆕 New', value: 'placed' },
  { label: '✅ Confirmed', value: 'confirmed' },
  { label: '📦 Packed', value: 'packed' },
  { label: '🚚 Shipped', value: 'shipped' },
  { label: '🎉 Delivered', value: 'delivered' },
  { label: '❌ Cancelled', value: 'cancelled' },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', activeTab],
    queryFn: () => getAdminOrders(activeTab !== 'all' ? { status: activeTab } : {}),
  });

  const orders = data?.orders || [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>
        <button onClick={() => refetch()} className="btn-action bg-gray-100 text-gray-700 px-4 py-2 text-sm">
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
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
            <Link key={order.id} href={`/admin/orders/${order.id}`}>
              <div className="card hover:shadow-md transition-shadow cursor-pointer p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-rose-gold text-lg">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-base font-medium">{order.customerName}</p>
                    <p className="text-gray-500 text-sm">{order.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">₹{Number(order.total).toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">{order.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
