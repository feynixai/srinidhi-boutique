'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  FiShoppingCart,
  FiCheckCircle,
  FiTrendingUp,
  FiTrash2,
  FiSend,
  FiAlertCircle,
  FiFilter,
  FiRefreshCw,
} from 'react-icons/fi';
import { api } from '@/lib/api';

/* ── Types ─────────────────────────────────────────────────────────── */

interface AbandonedCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface AbandonedCart {
  id: string;
  sessionId: string;
  items: AbandonedCartItem[];
  totalValue: number;
  status: 'abandoned' | 'recovered';
  reminderSent: boolean;
  createdAt: string;
  recoveredAt?: string;
}

interface AbandonedCartStats {
  totalAbandoned: number;
  totalRecovered: number;
  recoveryRate: number;
}

type FilterType = 'all' | 'abandoned' | 'recovered';

/* ── Mock Data ──────────────────────────────────────────────────────── */

const MOCK_CARTS: AbandonedCart[] = [
  {
    id: '1',
    sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    items: [
      { productId: 'p1', name: 'Banarasi Silk Saree - Royal Blue', price: 4999, quantity: 1, image: '' },
      { productId: 'p2', name: 'Embroidered Blouse Piece', price: 799, quantity: 1, image: '' },
    ],
    totalValue: 5798,
    status: 'abandoned',
    reminderSent: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: '2',
    sessionId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    items: [
      { productId: 'p3', name: 'Cotton Kurti - Floral Print', price: 1299, quantity: 2, image: '' },
    ],
    totalValue: 2598,
    status: 'abandoned',
    reminderSent: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: '3',
    sessionId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    items: [
      { productId: 'p4', name: 'Bridal Lehenga Set - Maroon', price: 12999, quantity: 1, image: '' },
    ],
    totalValue: 12999,
    status: 'recovered',
    reminderSent: true,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    recoveredAt: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
  {
    id: '4',
    sessionId: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    items: [
      { productId: 'p5', name: 'Georgette Saree - Pink', price: 2499, quantity: 1, image: '' },
      { productId: 'p6', name: 'Matching Petticoat', price: 499, quantity: 1, image: '' },
      { productId: 'p7', name: 'Designer Blouse', price: 1299, quantity: 1, image: '' },
    ],
    totalValue: 4297,
    status: 'abandoned',
    reminderSent: false,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
];

/* ── Component ──────────────────────────────────────────────────────── */

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<AbandonedCartStats>({ totalAbandoned: 0, totalRecovered: 0, recoveryRate: 0 });
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCarts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/abandoned-carts/admin/list', {
        params: { filter, page: 1, limit: 50 },
      });
      setCarts(res.data.carts || []);
      setStats(res.data.stats || { totalAbandoned: 0, totalRecovered: 0, recoveryRate: 0 });
      setBackendConnected(true);
    } catch {
      // Backend not available — use mock data
      setBackendConnected(false);
      const filtered =
        filter === 'all'
          ? MOCK_CARTS
          : MOCK_CARTS.filter((c) => c.status === filter);
      setCarts(filtered);
      const abandoned = MOCK_CARTS.filter((c) => c.status === 'abandoned').length;
      const recovered = MOCK_CARTS.filter((c) => c.status === 'recovered').length;
      setStats({
        totalAbandoned: abandoned + recovered,
        totalRecovered: recovered,
        recoveryRate: Math.round((recovered / (abandoned + recovered)) * 100) || 0,
      });
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

  async function handleSendReminder(sessionId: string) {
    setActionLoading(`remind-${sessionId}`);
    try {
      await api.post(`/api/abandoned-carts/send-reminder/${sessionId}`);
      await fetchCarts();
    } catch {
      // Update local state for demo
      setCarts((prev) =>
        prev.map((c) => (c.sessionId === sessionId ? { ...c, reminderSent: true } : c)),
      );
    }
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this abandoned cart record?')) return;
    setActionLoading(`delete-${id}`);
    try {
      await api.delete(`/api/abandoned-carts/admin/${id}`);
      await fetchCarts();
    } catch {
      setCarts((prev) => prev.filter((c) => c.id !== id));
    }
    setActionLoading(null);
  }

  function truncateId(id: string) {
    return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  const FILTERS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'abandoned', label: 'Abandoned' },
    { value: 'recovered', label: 'Recovered' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Abandoned Carts</h1>
          <p className="text-sm text-gray-500 mt-1">Track and recover abandoned shopping carts</p>
        </div>
        <button
          onClick={fetchCarts}
          className="p-2 hover:bg-white/60 rounded-full transition-all text-gray-600 hover:text-[#1a1a2e]"
          title="Refresh"
        >
          <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Backend notice */}
      {!backendConnected && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <FiAlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium text-amber-800">Backend not connected</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Showing demo data. Connect the backend server to see real abandoned carts.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<FiShoppingCart size={20} />}
          label="Total Abandoned"
          value={stats.totalAbandoned}
          color="text-orange-500"
          bg="bg-orange-50"
        />
        <StatCard
          icon={<FiCheckCircle size={20} />}
          label="Recovered"
          value={stats.totalRecovered}
          color="text-green-500"
          bg="bg-green-50"
        />
        <StatCard
          icon={<FiTrendingUp size={20} />}
          label="Recovery Rate"
          value={`${stats.recoveryRate}%`}
          color="text-blue-500"
          bg="bg-blue-50"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <FiFilter size={14} className="text-gray-400" />
        <div className="flex bg-white/60 border border-white/30 rounded-full p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                filter === f.value
                  ? 'bg-[#1a1a2e] text-white'
                  : 'text-gray-500 hover:text-[#1a1a2e]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cart list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/60 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl p-12 text-center">
          <FiShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No abandoned carts found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Session</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Items</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => (
                  <tr key={cart.id} className="border-t border-black/5 hover:bg-white/40 transition-colors">
                    <td className="py-3 px-4">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                        {truncateId(cart.sessionId)}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-[#1a1a2e]">
                      {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1a1a2e]">
                      ₹{cart.totalValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(cart.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cart.status === 'recovered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {cart.status === 'recovered' ? 'Recovered' : 'Abandoned'}
                        </span>
                        {cart.reminderSent && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600">
                            Reminded
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {cart.status === 'abandoned' && !cart.reminderSent && (
                          <button
                            onClick={() => handleSendReminder(cart.sessionId)}
                            disabled={actionLoading === `remind-${cart.sessionId}`}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50"
                            title="Send Reminder"
                          >
                            <FiSend size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(cart.id)}
                          disabled={actionLoading === `delete-${cart.id}`}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {carts.map((cart) => (
              <div
                key={cart.id}
                className="bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">
                      {truncateId(cart.sessionId)}
                    </code>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(cart.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cart.status === 'recovered'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {cart.status === 'recovered' ? 'Recovered' : 'Abandoned'}
                    </span>
                    {cart.reminderSent && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600">
                        Reminded
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500">
                    {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-[#1a1a2e]">
                    ₹{cart.totalValue.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Item names */}
                <div className="text-xs text-gray-500 mb-3 space-y-0.5">
                  {cart.items.slice(0, 2).map((item, i) => (
                    <p key={i} className="truncate">• {item.name}</p>
                  ))}
                  {cart.items.length > 2 && (
                    <p className="text-gray-400">+{cart.items.length - 2} more</p>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t border-black/5 pt-3">
                  {cart.status === 'abandoned' && !cart.reminderSent && (
                    <button
                      onClick={() => handleSendReminder(cart.sessionId)}
                      disabled={actionLoading === `remind-${cart.sessionId}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-full font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <FiSend size={12} />
                      Send Reminder
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(cart.id)}
                    disabled={actionLoading === `delete-${cart.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 ml-auto"
                  >
                    <FiTrash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl p-4 flex items-center gap-4">
      <div className={`${bg} ${color} p-3 rounded-xl`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#1a1a2e]">{value}</p>
      </div>
    </div>
  );
}
