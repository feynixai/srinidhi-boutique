'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60000,
  });

  if (isLoading) return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card h-28 animate-pulse bg-gray-100" />
        ))}
      </div>
    </div>
  );

  const stats = data || {
    todayOrders: 0, todayRevenue: 0, pendingOrders: 0, totalOrders: 0,
    totalRevenue: 0, totalProducts: 0, lowStockProducts: 0, recentOrders: [],
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Today's Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-500 mb-3 uppercase tracking-wide">Today</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-gray-500 text-sm mb-1">Orders</p>
            <p className="text-5xl font-bold text-rose-gold">{stats.todayOrders}</p>
          </div>
          <div className="stat-card">
            <p className="text-gray-500 text-sm mb-1">Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{Number(stats.todayRevenue).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-gray-500 text-sm mb-1">Pending Orders</p>
            <p className="text-5xl font-bold text-orange-500">{stats.pendingOrders}</p>
          </div>
          <div className="stat-card">
            <p className="text-gray-500 text-sm mb-1">Low Stock</p>
            <p className="text-5xl font-bold text-red-500">{stats.lowStockProducts}</p>
            <p className="text-xs text-gray-400 mt-1">≤5 items left</p>
          </div>
        </div>
      </div>

      {/* All Time Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-500 mb-3 uppercase tracking-wide">All Time</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-gray-500 text-sm mb-1">Total Orders</p>
            <p className="text-4xl font-bold">{stats.totalOrders}</p>
          </div>
          <div className="stat-card">
            <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{Number(stats.totalRevenue).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-gray-500 text-sm mb-1">Active Products</p>
            <p className="text-4xl font-bold">{stats.totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-500 mb-3 uppercase tracking-wide">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/orders', label: '📦 View Orders', color: 'bg-blue-500' },
            { href: '/admin/products/new', label: '➕ Add Product', color: 'bg-rose-gold' },
            { href: '/admin/coupons', label: '🎫 Manage Coupons', color: 'bg-purple-500' },
            { href: '/admin/orders?status=placed', label: '⚡ New Orders', color: 'bg-orange-500' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} text-white btn-action text-center block text-base hover:opacity-90`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {stats.recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-500 uppercase tracking-wide">Recent Orders</h2>
            <Link href="/admin/orders" className="text-rose-gold font-medium">View all →</Link>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentOrders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-rose-gold hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-gray-400 text-xs">{order.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">₹{Number(order.total).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
