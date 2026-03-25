'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function downloadCSV(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(3, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const PERIOD_OPTIONS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

const PAYMENT_COLORS: Record<string, string> = {
  upi: 'bg-purple-500',
  razorpay: 'bg-blue-500',
  cod: 'bg-orange-500',
  card: 'bg-green-500',
  netbanking: 'bg-indigo-500',
};

export default function ReportsPage() {
  const [period, setPeriod] = useState('30');
  const [salesMonth, setSalesMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: advanced, isLoading: advLoading } = useQuery({
    queryKey: ['reports', 'advanced', period],
    queryFn: () => fetch(`${API}/reports/advanced?period=${period}`).then((r) => r.json()),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['reports', 'products'],
    queryFn: () => fetch(`${API}/reports/products`).then((r) => r.json()),
  });

  const { data: returnsData } = useQuery({
    queryKey: ['reports', 'returns'],
    queryFn: () => fetch(`${API}/reports/returns`).then((r) => r.json()),
  });

  const summary = advanced?.summary;
  const maxCatRevenue = advanced?.revenueByCategory?.[0]?.revenue || 1;
  const maxPayRevenue = advanced?.revenueByPayment?.[0]?.revenue || 1;
  const totalPayRevenue = advanced?.revenueByPayment?.reduce((s: number, p: { revenue: number }) => s + p.revenue, 0) || 1;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Sales Reports</h1>
          <p className="text-gray-500 text-sm">Revenue analytics and CSV exports</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === opt.value ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {advLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-xl" />)
        ) : summary ? (
          <>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <p className="text-sm text-blue-600 font-medium mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-700">₹{Number(summary.totalRevenue).toLocaleString('en-IN')}</p>
              <p className="text-xs text-blue-400 mt-1">Last {period} days · paid orders</p>
            </div>
            <div className="bg-green-50 rounded-xl p-5 border border-green-100">
              <p className="text-sm text-green-600 font-medium mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-green-700">{summary.totalOrders}</p>
              <p className="text-xs text-green-400 mt-1">Paid orders in period</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
              <p className="text-sm text-purple-600 font-medium mb-1">Avg Order Value</p>
              <p className="text-3xl font-bold text-purple-700">
                {summary.totalOrders > 0 ? `₹${Math.round(summary.avgOrderValue).toLocaleString('en-IN')}` : '—'}
              </p>
              <p className="text-xs text-purple-400 mt-1">Per paid order</p>
            </div>
          </>
        ) : null}
      </div>

      {/* New vs Returning Customers */}
      {!advLoading && advanced?.customerSegments && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Customer Segments</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-600">{advanced.customerSegments.newCustomers}</p>
              <p className="text-sm text-gray-500 mt-1">New Customers</p>
              <p className="text-xs text-gray-400">First order in this period</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{advanced.customerSegments.returningCustomers}</p>
              <p className="text-sm text-gray-500 mt-1">Returning Customers</p>
              <p className="text-xs text-gray-400">Ordered before this period</p>
            </div>
          </div>
          {(advanced.customerSegments.newCustomers + advanced.customerSegments.returningCustomers) > 0 && (
            <div className="mt-4">
              <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                <div
                  className="bg-emerald-400 transition-all"
                  style={{ width: `${(advanced.customerSegments.newCustomers / (advanced.customerSegments.newCustomers + advanced.customerSegments.returningCustomers)) * 100}%` }}
                />
                <div className="bg-blue-400 flex-1" />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" /> New</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full inline-block" /> Returning</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue by Category */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Revenue by Category</h2>
          <span className="text-xs text-gray-400">Last {period} days</span>
        </div>
        {advLoading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-8 bg-gray-50 animate-pulse rounded" />)}</div>
        ) : advanced?.revenueByCategory?.length > 0 ? (
          <div className="space-y-4">
            {advanced.revenueByCategory.map((cat: { name: string; revenue: number; orders: number }) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-800">₹{Math.round(cat.revenue).toLocaleString('en-IN')}</span>
                    <span className="text-xs text-gray-400 ml-2">{cat.orders} items</span>
                  </div>
                </div>
                <Bar value={cat.revenue} max={maxCatRevenue} color="bg-rose-400" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No data for this period</p>
        )}
      </div>

      {/* Revenue by Payment Method */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Revenue by Payment Method</h2>
          <span className="text-xs text-gray-400">Last {period} days</span>
        </div>
        {advLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-50 animate-pulse rounded" />)}</div>
        ) : advanced?.revenueByPayment?.length > 0 ? (
          <div className="space-y-4">
            {advanced.revenueByPayment.map((p: { method: string; revenue: number; orders: number }) => {
              const pct = Math.round((p.revenue / totalPayRevenue) * 100);
              const color = PAYMENT_COLORS[p.method.toLowerCase()] || 'bg-gray-400';
              return (
                <div key={p.method}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">{p.method}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{pct}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-800">₹{Math.round(p.revenue).toLocaleString('en-IN')}</span>
                      <span className="text-xs text-gray-400 ml-2">{p.orders} orders</span>
                    </div>
                  </div>
                  <Bar value={p.revenue} max={maxPayRevenue} color={color} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No data for this period</p>
        )}
      </div>

      {/* Top 10 Products by Revenue */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Top 10 Products by Revenue</h2>
          <span className="text-xs text-gray-400">Last {period} days</span>
        </div>
        {advLoading ? (
          <div className="h-40 bg-gray-50 animate-pulse rounded" />
        ) : advanced?.topProducts?.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-gray-500">#</th>
                  <th className="pb-2 font-medium text-gray-500">Product</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Units Sold</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {advanced.topProducts.map((p: { productId: string; name: string; revenue: number; unitsSold: number }, i: number) => (
                  <tr key={p.productId} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 text-gray-400 font-medium w-8">{i + 1}</td>
                    <td className="py-2.5 font-medium text-gray-800 max-w-[260px] truncate">{p.name}</td>
                    <td className="py-2.5 text-right text-gray-600">{p.unitsSold}</td>
                    <td className="py-2.5 text-right font-bold text-gray-800">₹{Math.round(p.revenue).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No sales data for this period</p>
        )}
      </div>

      {/* Monthly Sales Report — CSV Export */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Monthly Sales Export</h2>
            <p className="text-sm text-gray-500">Detailed order-level CSV for a specific month</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={salesMonth}
              onChange={(e) => setSalesMonth(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={() => downloadCSV(`${API}/reports/sales?month=${salesMonth}&format=csv`, `sales-${salesMonth}.csv`)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Product Performance (All Time)</h2>
            <p className="text-sm text-gray-500">Orders, units sold, and stock per product</p>
          </div>
          <button
            onClick={() => downloadCSV(`${API}/reports/products?format=csv`, 'product-performance.csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Download CSV
          </button>
        </div>
        {productsLoading ? (
          <div className="h-24 bg-gray-50 animate-pulse rounded" />
        ) : Array.isArray(productsData) && productsData.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-gray-600">Product</th>
                  <th className="pb-2 font-medium text-gray-600 text-right">Price</th>
                  <th className="pb-2 font-medium text-gray-600 text-right">Stock</th>
                  <th className="pb-2 font-medium text-gray-600 text-right">Orders</th>
                  <th className="pb-2 font-medium text-gray-600 text-right">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {productsData.slice(0, 10).map((p: Record<string, unknown>) => (
                  <tr key={String(p.id)} className="border-b last:border-0">
                    <td className="py-2 max-w-[200px] truncate">{String(p.name)}</td>
                    <td className="py-2 text-right">₹{Number(p.price).toLocaleString('en-IN')}</td>
                    <td className={`py-2 text-right ${Number(p.stock) <= 5 ? 'text-red-600 font-medium' : ''}`}>
                      {String(p.stock)}
                    </td>
                    <td className="py-2 text-right">{String(p.totalOrders)}</td>
                    <td className="py-2 text-right">{String(p.unitsSold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productsData.length > 10 && (
              <p className="text-xs text-gray-400 mt-2">Showing 10 of {productsData.length}. Download CSV for full report.</p>
            )}
          </div>
        ) : null}
      </div>

      {/* Returns */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Returns Report</h2>
            {returnsData?.summary && (
              <p className="text-sm text-gray-500">
                {returnsData.summary.totalReturns} returns · Return rate: {returnsData.summary.returnRate}
              </p>
            )}
          </div>
          <button
            onClick={() => downloadCSV(`${API}/reports/returns?format=csv`, 'returns.csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* CSV Exports */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Bulk CSV Exports</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'All Customers', file: 'customers.csv', url: `${API}/reports/customers?format=csv` },
            { label: 'Revenue by Region', file: 'revenue-by-region.csv', url: `${API}/reports/revenue-by-region?format=csv` },
          ].map((exp) => (
            <button
              key={exp.file}
              onClick={() => downloadCSV(exp.url, exp.file)}
              className="bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200"
            >
              ⬇ {exp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
