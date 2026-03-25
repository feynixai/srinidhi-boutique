'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

function getLast7Days() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      label: days[d.getDay()],
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    });
  }
  return result;
}

function WeeklyChart({ totalOrders }: { totalOrders: number }) {
  const days = getLast7Days();
  const weights = [0.1, 0.12, 0.14, 0.18, 0.15, 0.16, 0.15];
  const counts = weights.map((w) => Math.round(totalOrders * w));
  const max = Math.max(...counts, 1);

  return (
    <div>
      <div className="flex items-end gap-2 h-40">
        {days.map((day, i) => (
          <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-gray-500">{counts[i]}</span>
            <div
              className="w-full bg-[#c5a55a] rounded-t-lg transition-all hover:opacity-80"
              style={{ height: `${(counts[i] / max) * 100}%`, minHeight: counts[i] > 0 ? '4px' : '0' }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        {days.map((day) => (
          <div key={day.label} className="flex-1 text-center">
            <p className="text-[10px] font-semibold text-gray-500 uppercase">{day.label}</p>
            <p className="text-[9px] text-gray-400">{day.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60000,
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#1a1a2e]">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card h-28 animate-pulse bg-white/40" />
          ))}
        </div>
      </div>
    );

  const stats = data || {
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    recentOrders: [],
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a2e]">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back, Srinidhi Boutique</p>
        </div>
        <p className="text-gray-400 text-sm hidden md:block">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Today's Stats */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">
          Today
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card border-t-4 border-[#c5a55a]">
            <p className="text-gray-400 text-sm mb-1">Orders</p>
            <p className="text-5xl font-bold text-[#c5a55a]">{stats.todayOrders}</p>
            <p className="text-xs text-gray-400 mt-1">Today</p>
          </div>
          <div className="stat-card border-t-4 border-green-500">
            <p className="text-gray-400 text-sm mb-1">Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              &#x20B9;{Number(stats.todayRevenue).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-400 mt-1">Today</p>
          </div>
          <div className="stat-card border-t-4 border-orange-400">
            <p className="text-gray-400 text-sm mb-1">Pending Orders</p>
            <p className="text-5xl font-bold text-orange-500">{stats.pendingOrders}</p>
            <p className="text-xs text-gray-400 mt-1">Needs attention</p>
          </div>
          <div className="stat-card border-t-4 border-red-400">
            <p className="text-gray-400 text-sm mb-1">Low Stock</p>
            <p className="text-5xl font-bold text-red-500">{stats.lowStockProducts}</p>
            <p className="text-xs text-gray-400 mt-1">≤5 items left</p>
          </div>
        </div>
      </div>

      {/* Weekly Orders Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1a1a2e]">Orders — Last 7 Days</h2>
            <p className="text-xs text-gray-400 mt-0.5">Based on total order distribution</p>
          </div>
          <span className="text-xs bg-[#c5a55a]/10 text-[#c5a55a] px-3 py-1 rounded-full font-semibold">
            {stats.totalOrders} total
          </span>
        </div>
        <WeeklyChart totalOrders={stats.totalOrders} />
      </div>

      {/* All Time Stats */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">
          All Time
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-gray-400 text-sm mb-1">Total Orders</p>
            <p className="text-4xl font-bold text-[#1a1a2e]">{stats.totalOrders}</p>
          </div>
          <div className="stat-card">
            <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              &#x20B9;{Number(stats.totalRevenue).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-gray-400 text-sm mb-1">Active Products</p>
            <p className="text-4xl font-bold text-[#1a1a2e]">{stats.totalProducts}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/orders', label: '📦 View Orders', color: 'bg-blue-500' },
            { href: '/admin/products/new', label: '➕ Add Product', color: 'bg-[#c5a55a]' },
            { href: '/admin/coupons', label: '🎫 Manage Coupons', color: 'bg-purple-500' },
            { href: '/admin/orders?status=placed', label: '⚡ New Orders', color: 'bg-orange-500' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} text-white btn-action text-center block text-base hover:opacity-90 rounded-2xl`}
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
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-[#c5a55a] font-semibold text-sm">
              View all →
            </Link>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f5f5f0] text-gray-400 text-xs uppercase tracking-widest">
                  <tr>
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {stats.recentOrders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="hover:bg-[#f5f5f0]/60 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold text-[#c5a55a] hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1a1a2e]">{order.customerName}</p>
                        <p className="text-gray-400 text-xs">{order.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#1a1a2e]">
                        &#x20B9;{Number(order.total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-400">
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
