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

export default function ReportsPage() {
  const [salesMonth, setSalesMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['reports', 'sales', salesMonth],
    queryFn: () => fetch(`${API}/reports/sales?month=${salesMonth}`).then((r) => r.json()),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['reports', 'products'],
    queryFn: () => fetch(`${API}/reports/products`).then((r) => r.json()),
  });

  const { data: returnsData } = useQuery({
    queryKey: ['reports', 'returns'],
    queryFn: () => fetch(`${API}/reports/returns`).then((r) => r.json()),
  });

  const { data: regionData } = useQuery({
    queryKey: ['reports', 'region'],
    queryFn: () => fetch(`${API}/reports/revenue-by-region`).then((r) => r.json()),
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Reports</h1>
        <p className="text-gray-500 text-sm">Download CSV reports for analysis</p>
      </div>

      {/* Sales Report */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Monthly Sales Report</h2>
            <p className="text-sm text-gray-500">Revenue, orders, and items sold for a given month</p>
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

        {salesLoading ? (
          <div className="h-24 bg-gray-50 animate-pulse rounded" />
        ) : salesData?.summary ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded p-4">
              <p className="text-2xl font-bold text-blue-700">{salesData.summary.totalOrders}</p>
              <p className="text-sm text-blue-600">Paid Orders</p>
            </div>
            <div className="bg-green-50 rounded p-4">
              <p className="text-2xl font-bold text-green-700">
                ₹{Number(salesData.summary.totalRevenue).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-green-600">Total Revenue</p>
            </div>
            <div className="bg-purple-50 rounded p-4">
              <p className="text-2xl font-bold text-purple-700">
                {salesData.summary.totalOrders > 0
                  ? `₹${Math.round(salesData.summary.totalRevenue / salesData.summary.totalOrders).toLocaleString('en-IN')}`
                  : '—'}
              </p>
              <p className="text-sm text-purple-600">Avg Order Value</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Customer Acquisition */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Customer Report</h2>
            <p className="text-sm text-gray-500">All customers with order counts</p>
          </div>
          <button
            onClick={() => downloadCSV(`${API}/reports/customers?format=csv`, 'customers.csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Product Performance</h2>
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
        <div className="flex items-center justify-between mb-4">
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

      {/* Revenue by Region */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800">Revenue by Region</h2>
            <p className="text-sm text-gray-500">India vs International breakdown</p>
          </div>
          <button
            onClick={() => downloadCSV(`${API}/reports/revenue-by-region?format=csv`, 'revenue-by-region.csv')}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Download CSV
          </button>
        </div>
        {Array.isArray(regionData) && regionData.length > 0 && (
          <div className="space-y-2">
            {regionData.map((r: Record<string, unknown>) => (
              <div key={String(r.country)} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="font-medium text-sm">{String(r.country)}</span>
                <div className="text-right">
                  <p className="font-semibold text-sm">₹{Number(r.revenue).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">{String(r.orders)} orders</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
