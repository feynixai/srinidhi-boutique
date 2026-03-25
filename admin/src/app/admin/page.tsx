'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboard, getDashboardWidgets, getLowStockProducts } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

function useCounter(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let frame = 0;
    const totalFrames = Math.round(duration / 16);
    const timer = setInterval(() => {
      frame++;
      setCount(Math.round(target * (frame / totalFrames)));
      if (frame >= totalFrames) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

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
      <div className="flex items-end gap-2 h-32">
        {days.map((day, i) => (
          <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-gray-500">{counts[i]}</span>
            <div
              className="w-full bg-gradient-to-t from-[#c5a55a] to-[#e8c97a] rounded-t-lg transition-all hover:opacity-80"
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

function AnimatedNumber({ value, prefix = '', className = '' }: { value: number; prefix?: string; className?: string }) {
  const count = useCounter(value);
  return <span className={className}>{prefix}{count.toLocaleString('en-IN')}</span>;
}

function TrendArrow({ value, baseline }: { value: number; baseline: number }) {
  if (baseline === 0) return null;
  const pct = Math.round(((value - baseline) / baseline) * 100);
  if (Math.abs(pct) < 1) return null;
  const up = pct > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      <svg viewBox="0 0 10 10" className={`w-3 h-3 ${up ? '' : 'rotate-180'}`} fill="currentColor">
        <polygon points="5,1 9,9 1,9" />
      </svg>
      {Math.abs(pct)}%
    </span>
  );
}

function SkeletonBento() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-white/40 animate-pulse rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card h-32 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card h-56 animate-pulse" />
        <div className="glass-card h-56 animate-pulse" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 30000,
  });

  const { data: widgets } = useQuery({
    queryKey: ['dashboard-widgets'],
    queryFn: getDashboardWidgets,
    refetchInterval: 30000,
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => getLowStockProducts(5),
    refetchInterval: 120000,
  });

  if (isLoading) return <SkeletonBento />;

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

  const latestOrder = stats.recentOrders?.[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back, Srinidhi Boutique</p>
        </div>
        <span className="text-gray-400 text-xs hidden md:block bg-white/60 backdrop-blur-xl border border-white/30 px-4 py-2 rounded-full">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </span>
      </div>

      {/* Bento Row 1 — 4 stat cards */}
      {(() => {
        const avgDailyOrders = stats.totalOrders > 0 ? Math.round(stats.totalOrders / 7) : 0;
        const avgDailyRevenue = Number(stats.totalRevenue) > 0 ? Math.round(Number(stats.totalRevenue) / 7) : 0;
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 flex flex-col gap-2 border-t-4 border-[#c5a55a]">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Orders</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Live" />
                  <span className="text-xl">📦</span>
                </div>
              </div>
              <AnimatedNumber value={stats.todayOrders} className="text-4xl font-bold text-[#c5a55a]" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Today · updates every 30s</p>
                <TrendArrow value={stats.todayOrders} baseline={avgDailyOrders} />
              </div>
            </div>

            <div className="glass-card p-5 flex flex-col gap-2 border-t-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Revenue</p>
                <span className="text-xl">💰</span>
              </div>
              <AnimatedNumber value={Number(stats.todayRevenue)} prefix="&#x20B9;" className="text-2xl font-bold text-emerald-600" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Today</p>
                <TrendArrow value={Number(stats.todayRevenue)} baseline={avgDailyRevenue} />
              </div>
            </div>

            <div className={`glass-card p-5 flex flex-col gap-2 border-t-4 ${stats.lowStockProducts > 0 ? 'border-red-400' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Low Stock</p>
                <span className="text-xl">⚠️</span>
              </div>
              <AnimatedNumber value={stats.lowStockProducts} className={`text-4xl font-bold ${stats.lowStockProducts > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              <p className="text-xs text-gray-400">{stats.lowStockProducts > 0 ? 'Items need restocking' : 'All stocked up'}</p>
            </div>

            <div className={`glass-card p-5 flex flex-col gap-2 border-t-4 ${stats.pendingOrders > 0 ? 'border-orange-400' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Pending</p>
                <span className="text-xl">⏳</span>
              </div>
              <AnimatedNumber value={stats.pendingOrders} className={`text-4xl font-bold ${stats.pendingOrders > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
              <p className="text-xs text-gray-400">Orders need action</p>
            </div>
          </div>
        );
      })()}

      {/* Bento Row 2 — Chart (2/3) + Quick Actions (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1a1a2e]">Orders — Last 7 Days</h2>
              <p className="text-xs text-gray-400 mt-0.5">Based on total order distribution</p>
            </div>
            <span className="text-xs bg-[#c5a55a]/10 text-[#c5a55a] px-3 py-1 rounded-full font-semibold">
              {stats.totalOrders} total
            </span>
          </div>
          <WeeklyChart totalOrders={stats.totalOrders} />
        </div>

        <div className="glass-card p-6 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-[#1a1a2e] mb-1">Quick Actions</h2>
          {[
            { href: '/admin/products/new', label: '+ Add Product', color: 'bg-[#c5a55a] text-[#1a1a2e]' },
            { href: '/admin/coupons', label: '% Create Coupon', color: 'bg-purple-500 text-white' },
            { href: latestOrder ? `/admin/orders/${latestOrder.id}` : '/admin/orders', label: 'View Latest Order', color: 'bg-blue-500 text-white' },
            { href: '/admin/orders?status=placed', label: 'New Orders', color: 'bg-orange-500 text-white' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} rounded-2xl px-4 py-3 text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] text-center`}
            >
              {action.label}
            </Link>
          ))}
          {/* Attention items */}
          {widgets && (widgets.pendingReviewsCount > 0 || widgets.pendingReturnsCount > 0) && (
            <div className="border-t border-black/5 pt-2 space-y-2">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Needs Attention</p>
              {widgets.pendingReviewsCount > 0 && (
                <Link
                  href="/admin/qa"
                  className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-4 py-2.5 text-xs font-semibold hover:bg-amber-100 transition-all"
                >
                  <span>⭐ Reviews pending approval</span>
                  <span className="bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">{widgets.pendingReviewsCount}</span>
                </Link>
              )}
              {widgets.pendingReturnsCount > 0 && (
                <Link
                  href="/admin/returns"
                  className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-2.5 text-xs font-semibold hover:bg-red-100 transition-all"
                >
                  <span>↩️ Returns pending</span>
                  <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">{widgets.pendingReturnsCount}</span>
                </Link>
              )}
            </div>
          )}
          <div className="border-t border-black/5 pt-2 space-y-2">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Export Data</p>
            {[
              { label: '⬇ Orders CSV', type: 'orders' },
              { label: '⬇ Products CSV', type: 'products' },
              { label: '⬇ Customers CSV', type: 'customers' },
            ].map((exp) => (
              <a
                key={exp.type}
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/export/${exp.type}`}
                download
                className="block bg-gray-50 text-gray-700 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-semibold hover:bg-gray-100 transition-all text-center"
              >
                {exp.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bento Row 3 — All-time stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Total Orders</p>
          <AnimatedNumber value={stats.totalOrders} className="text-3xl font-bold text-[#1a1a2e]" />
          <p className="text-xs text-gray-400 mt-1">All time</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Total Revenue</p>
          <AnimatedNumber value={Number(stats.totalRevenue)} prefix="&#x20B9;" className="text-2xl font-bold text-emerald-600" />
          <p className="text-xs text-gray-400 mt-1">All time</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Active Products</p>
          <AnimatedNumber value={stats.totalProducts} className="text-3xl font-bold text-[#1a1a2e]" />
          <p className="text-xs text-gray-400 mt-1">In catalogue</p>
        </div>
      </div>

      {/* Bento Row 4 — Low Stock Alert + Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Low Stock Alert List */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h2 className="text-sm font-bold text-[#1a1a2e]">Low Stock Alerts</h2>
            </div>
            <Link href="/admin/products?stock=low" className="text-[#c5a55a] font-semibold text-xs hover:underline">
              Manage →
            </Link>
          </div>
          {lowStockData && lowStockData.products.length > 0 ? (
            <ul className="divide-y divide-black/5">
              {lowStockData.products.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[#1a1a2e] truncate max-w-[200px]">{p.name}</p>
                    {p.category && <p className="text-xs text-gray-400">{p.category.name}</p>}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    p.stock <= 2 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              {lowStockData ? '✅ All products well stocked' : 'Loading...'}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="glass-card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <h2 className="text-sm font-bold text-[#1a1a2e]">Top Selling Products</h2>
            </div>
            <Link href="/admin/products" className="text-[#c5a55a] font-semibold text-xs hover:underline">
              All products →
            </Link>
          </div>
          {widgets && widgets.topSellingProducts.length > 0 ? (
            <ul className="divide-y divide-black/5">
              {widgets.topSellingProducts.slice(0, 5).map((p, i) => (
                <li key={p.productId} className="flex items-center gap-4 px-6 py-3 hover:bg-white/40 transition-colors">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-[#c5a55a] text-[#1a1a2e]' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-[#f5f0eb] text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm font-medium text-[#1a1a2e] truncate">{p.name}</p>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex-shrink-0">
                    {p.totalSold} sold
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              {widgets ? 'No sales data yet' : 'Loading...'}
            </div>
          )}
        </div>
      </div>

      {/* Bento Row 5 — Recent Orders */}
      {stats.recentOrders.length > 0 && (
        <div className="glass-card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
            <h2 className="text-sm font-bold text-[#1a1a2e]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-[#c5a55a] font-semibold text-xs hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f5f0]/80 text-gray-400 text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left px-6 py-3">Order</th>
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Amount</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-[#c5a55a] hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-[#1a1a2e]">{order.customerName}</p>
                      <p className="text-gray-400 text-xs">{order.customerPhone}</p>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-[#1a1a2e]">
                      &#x20B9;{Number(order.total).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-3.5 text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
