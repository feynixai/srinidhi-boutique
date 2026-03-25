'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminCustomers } from '@/lib/api';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () => getAdminCustomers(search ? { search, page: String(page) } : { page: String(page) }),
  });

  const customers = data?.customers || [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total || 0} total customers</p>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/orders/export`}
          download
          className="btn-action bg-green-50 text-green-700 border border-green-200 px-4 py-2 text-sm hover:bg-green-100 transition-colors"
        >
          Export CSV
        </a>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name, phone, or email..."
        className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-xl">No customers found</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Orders</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Spend</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.phone} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell font-mono text-sm">{customer.phone}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-gold">
                      ₹{customer.totalSpend.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs hidden md:table-cell">
                      {new Date(customer.lastOrder).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-action px-4 py-2 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {data.totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === data.totalPages}
                className="btn-action px-4 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
