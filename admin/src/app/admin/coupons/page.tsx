'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FiTrash2, FiToggleLeft, FiToggleRight, FiBarChart2, FiTag } from 'react-icons/fi';
import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type CouponAnalytic = {
  id: string;
  code: string;
  discount: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
  maxUses?: number;
  minOrder?: number;
  revenueGenerated: number;
  totalDiscount: number;
  orderCount: number;
};

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [form, setForm] = useState({
    code: '',
    discount: '',
    minOrder: '',
    maxUses: '',
    expiresAt: '',
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: getAdminCoupons,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['coupon-analytics'],
    queryFn: () => fetch(`${API}/reports/coupon-analytics`).then((r) => r.json()) as Promise<CouponAnalytic[]>,
    enabled: activeTab === 'analytics',
  });

  const createMutation = useMutation({
    mutationFn: () => createCoupon({
      code: form.code.toUpperCase(),
      discount: Number(form.discount),
      minOrder: form.minOrder ? Number(form.minOrder) : undefined,
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      expiresAt: form.expiresAt || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', discount: '', minOrder: '', maxUses: '', expiresAt: '' });
    },
    onError: () => toast.error('Failed to create coupon'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateCoupon(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted');
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: () => fetch(`${API}/reports/coupons/expired`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: (data: { deleted: number }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['coupon-analytics'] });
      toast.success(`Cleaned up ${data.deleted} expired coupon${data.deleted !== 1 ? 's' : ''}`);
    },
    onError: () => toast.error('Cleanup failed'),
  });

  const expiredCount = coupons?.filter((c) => c.expiresAt && new Date(c.expiresAt) < new Date() && !c.active).length || 0;
  const sortedAnalytics = analytics ? [...analytics].sort((a, b) => b.revenueGenerated - a.revenueGenerated) : [];
  const maxRevenue = sortedAnalytics[0]?.revenueGenerated || 1;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <div className="flex items-center gap-2">
          {expiredCount > 0 && (
            <button
              onClick={() => {
                if (confirm(`Delete ${expiredCount} expired inactive coupon(s)?`)) cleanupMutation.mutate();
              }}
              disabled={cleanupMutation.isPending}
              className="btn-action bg-red-100 text-red-600 border border-red-200 text-sm"
            >
              {cleanupMutation.isPending ? 'Cleaning...' : `🧹 Clean ${expiredCount} Expired`}
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-action bg-rose-gold text-white"
          >
            {showForm ? '✕ Cancel' : '➕ New Coupon'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
        >
          <FiTag size={14} /> Coupons
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
        >
          <FiBarChart2 size={14} /> Analytics
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h2 className="text-xl font-bold">Create New Coupon</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Coupon Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold font-mono uppercase"
                placeholder="e.g. SAVE20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Discount % *</label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
                placeholder="e.g. 20"
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                value={form.minOrder}
                onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Max Uses</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
                placeholder="Unlimited if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
              />
            </div>
          </div>
          <button
            onClick={() => {
              if (!form.code || !form.discount) { toast.error('Code and discount are required'); return; }
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
            className="btn-action bg-rose-gold text-white w-full text-lg disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
          </button>
        </div>
      )}

      {/* Coupon List */}
      {activeTab === 'list' && (
        isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
          </div>
        ) : !coupons?.length ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🎫</p>
            <p className="text-xl">No coupons yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => {
              const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
              return (
                <div key={coupon.id} className={`card flex flex-col sm:flex-row sm:items-center gap-4 ${!coupon.active ? 'opacity-60' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xl font-bold text-rose-gold">{coupon.code}</span>
                      <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                        isExpired ? 'bg-red-100 text-red-600' : coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isExpired ? 'Expired' : coupon.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>{coupon.discount}% off</span>
                      {coupon.minOrder && <span>Min ₹{Number(coupon.minOrder).toLocaleString('en-IN')}</span>}
                      {coupon.maxUses && <span>Used: {coupon.usedCount}/{coupon.maxUses}</span>}
                      {!coupon.maxUses && coupon.usedCount > 0 && <span>Used: {coupon.usedCount}×</span>}
                      {coupon.expiresAt && (
                        <span className={isExpired ? 'text-red-500' : ''}>
                          Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMutation.mutate({ id: coupon.id, active: !coupon.active })}
                      className="text-2xl text-gray-500 hover:text-rose-gold transition-colors p-2"
                      title={coupon.active ? 'Deactivate' : 'Activate'}
                    >
                      {coupon.active ? <FiToggleRight className="text-rose-gold" /> : <FiToggleLeft />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this coupon?')) deleteMutation.mutate(coupon.id);
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors p-2"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {analyticsLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}</div>
          ) : !sortedAnalytics.length ? (
            <div className="card text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-xl">No coupon data yet</p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card text-center py-4">
                  <p className="text-2xl font-bold text-emerald-600">
                    ₹{Math.round(sortedAnalytics.reduce((s, c) => s + c.revenueGenerated, 0)).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Revenue from coupons</p>
                </div>
                <div className="card text-center py-4">
                  <p className="text-2xl font-bold text-blue-600">
                    {sortedAnalytics.reduce((s, c) => s + c.orderCount, 0)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Coupon orders</p>
                </div>
                <div className="card text-center py-4">
                  <p className="text-2xl font-bold text-orange-500">
                    ₹{Math.round(sortedAnalytics.reduce((s, c) => s + c.totalDiscount, 0)).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Total discount given</p>
                </div>
              </div>

              {/* Revenue per coupon */}
              <div className="card space-y-4">
                <h2 className="font-semibold text-gray-800">Revenue Generated per Coupon</h2>
                {sortedAnalytics.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-gold">{c.code}</span>
                        <span className="text-xs text-gray-400">{c.discount}% off · {c.usedCount} uses</span>
                        {c.expiresAt && new Date(c.expiresAt) < new Date() && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">expired</span>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-bold text-gray-800">₹{Math.round(c.revenueGenerated).toLocaleString('en-IN')}</span>
                        <span className="text-gray-400 ml-2">({c.orderCount} orders)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full transition-all duration-500"
                        style={{ width: `${maxRevenue > 0 ? Math.max(3, (c.revenueGenerated / maxRevenue) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
