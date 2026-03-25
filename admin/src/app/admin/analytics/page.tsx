'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/lib/api';

const PERIODS = [
  { label: '7 Days', value: '7' },
  { label: '30 Days', value: '30' },
  { label: '90 Days', value: '90' },
];

const CATEGORY_COLORS = [
  '#B76E79', '#d4a0a7', '#e8c4c8', '#f0d8db', '#7c3d45',
  '#c4849c', '#d9a8b8', '#8b5e6e', '#a67c85',
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => getAnalytics(period),
  });

  const maxRevenue = data ? Math.max(...data.dailyRevenue.map((d) => d.revenue), 1) : 1;
  const totalCategoryRevenue = data ? data.revenueByCategory.reduce((s, c) => s + c.revenue, 0) : 0;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.value ? 'bg-rose-gold text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-gray-500 text-sm mb-1">Revenue</p>
              <p className="text-2xl font-bold text-rose-gold">₹{Math.round(data.totalRevenue).toLocaleString('en-IN')}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-500 text-sm mb-1">Paid Orders</p>
              <p className="text-2xl font-bold">{data.totalOrders}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-500 text-sm mb-1">Avg Order Value</p>
              <p className="text-2xl font-bold">₹{Math.round(data.avgOrderValue).toLocaleString('en-IN')}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-500 text-sm mb-1">Abandoned Carts</p>
              <p className="text-2xl font-bold text-amber-500">{data.abandonedCarts}</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="card">
            <h2 className="font-bold text-lg mb-4">Daily Revenue</h2>
            {data.dailyRevenue.length === 0 || data.totalRevenue === 0 ? (
              <p className="text-gray-400 text-center py-8">No revenue data for this period</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-end gap-1 h-40 min-w-[400px]">
                  {data.dailyRevenue.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center group">
                      <div
                        className="w-full bg-rose-gold/20 hover:bg-rose-gold transition-colors rounded-t relative"
                        style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: d.revenue > 0 ? '4px' : '2px' }}
                      >
                        {d.revenue > 0 && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-charcoal text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            ₹{Math.round(d.revenue).toLocaleString('en-IN')}
                            <br />
                            <span className="text-gray-300">{d.orders} orders</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mt-1 min-w-[400px]">
                  {data.dailyRevenue.filter((_, i) => i % Math.ceil(data.dailyRevenue.length / 7) === 0).map((d) => (
                    <div key={d.date} className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversion Funnel */}
          <div className="card">
            <h2 className="font-bold text-lg mb-4">Conversion Funnel</h2>
            <div className="flex items-end gap-3 justify-center">
              {[
                { label: 'Cart Items', value: data.conversionFunnel.cartItems, color: 'bg-blue-100' },
                { label: 'Checkout Started', value: data.conversionFunnel.checkoutStarted, color: 'bg-amber-100' },
                { label: 'Paid Orders', value: data.conversionFunnel.paid, color: 'bg-green-100' },
              ].map((step, i, arr) => {
                const maxVal = Math.max(...arr.map((s) => s.value), 1);
                const pct = step.value > 0 ? Math.max((step.value / maxVal) * 100, 8) : 8;
                return (
                  <div key={step.label} className="flex-1 text-center">
                    <div className={`${step.color} rounded-lg flex items-end justify-center`} style={{ height: '120px' }}>
                      <div
                        className="w-full rounded-lg bg-rose-gold/60"
                        style={{ height: `${pct}%`, minHeight: '4px' }}
                      />
                    </div>
                    <p className="font-bold text-lg mt-2">{step.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{step.label}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-sm text-gray-400 mt-3">
              Conversion rate: {data.conversionFunnel.checkoutStarted > 0
                ? ((data.conversionFunnel.paid / data.conversionFunnel.checkoutStarted) * 100).toFixed(1)
                : 0}%
            </p>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue by Payment */}
            <div className="card">
              <h2 className="font-bold text-lg mb-4">Revenue by Payment Method</h2>
              {data.revenueByPayment.length === 0 ? (
                <p className="text-gray-400 text-sm">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.revenueByPayment.map((item) => {
                    const pct = data.totalRevenue > 0 ? ((Number(item._sum.total) / data.totalRevenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={item.paymentMethod}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize font-medium">{item.paymentMethod}</span>
                          <span className="text-gray-500">{item._count} orders · ₹{Math.round(Number(item._sum.total)).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-gold rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Revenue by Category */}
            <div className="card">
              <h2 className="font-bold text-lg mb-4">Revenue by Category</h2>
              {data.revenueByCategory.length === 0 ? (
                <p className="text-gray-400 text-sm">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.revenueByCategory.slice(0, 6).map((item, i) => {
                    const pct = totalCategoryRevenue > 0 ? ((item.revenue / totalCategoryRevenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={item.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                            {item.category}
                          </span>
                          <span className="text-gray-500">{pct}% · ₹{Math.round(item.revenue).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Products + Customer Acquisition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-bold text-lg mb-4">Top Selling Products</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-gray-400 text-sm">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.slice(0, 8).map((item, i) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm line-clamp-1">{item.name}</span>
                      <span className="text-sm font-medium text-rose-gold">{item._sum.quantity || 0} sold</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="font-bold text-lg mb-4">Customer Acquisition</h2>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{data.customerAcquisition.newCustomers}</p>
                  <p className="text-xs text-gray-500 mt-1">New Customers</p>
                </div>
                <div className="flex-1 text-center p-4 bg-rose-50 rounded-lg">
                  <p className="text-2xl font-bold text-rose-gold">{data.customerAcquisition.returningCustomers}</p>
                  <p className="text-xs text-gray-500 mt-1">Returning</p>
                </div>
              </div>
              {(data.customerAcquisition.newCustomers + data.customerAcquisition.returningCustomers) > 0 && (
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-blue-400 rounded-l-full"
                    style={{ width: `${(data.customerAcquisition.newCustomers / (data.customerAcquisition.newCustomers + data.customerAcquisition.returningCustomers)) * 100}%` }}
                  />
                  <div className="h-full bg-rose-gold flex-1 rounded-r-full" />
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
