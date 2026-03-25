'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '@/lib/api';

const PERIODS = [
  { label: '7 Days', value: '7' },
  { label: '30 Days', value: '30' },
  { label: '90 Days', value: '90' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => getAnalytics(period),
  });

  const maxRevenue = data ? Math.max(...data.dailyRevenue.map((d) => d.revenue), 1) : 1;

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-rose-gold">₹{Math.round(data.totalRevenue).toLocaleString('en-IN')}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-500 text-sm mb-1">Total Orders</p>
              <p className="text-3xl font-bold">{data.totalOrders}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-500 text-sm mb-1">Avg Order Value</p>
              <p className="text-3xl font-bold">₹{Math.round(data.avgOrderValue).toLocaleString('en-IN')}</p>
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
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            ₹{Math.round(d.revenue).toLocaleString('en-IN')}
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

          {/* Payment Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Top Products */}
            <div className="card">
              <h2 className="font-bold text-lg mb-4">Top Products by Quantity</h2>
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
          </div>
        </>
      ) : null}
    </div>
  );
}
