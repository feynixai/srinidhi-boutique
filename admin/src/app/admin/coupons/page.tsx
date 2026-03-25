'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/api';

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-action bg-rose-gold text-white"
        >
          {showForm ? '✕ Cancel' : '➕ New Coupon'}
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
            {createMutation.isPending ? 'Creating...' : '✅ Create Coupon'}
          </button>
        </div>
      )}

      {isLoading ? (
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
          {coupons.map((coupon) => (
            <div key={coupon.id} className={`card flex flex-col sm:flex-row sm:items-center gap-4 ${!coupon.active ? 'opacity-60' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xl font-bold text-rose-gold">{coupon.code}</span>
                  <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {coupon.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span>💰 {coupon.discount}% off</span>
                  {coupon.minOrder && <span>Min ₹{Number(coupon.minOrder).toLocaleString('en-IN')}</span>}
                  {coupon.maxUses && <span>Used: {coupon.usedCount}/{coupon.maxUses}</span>}
                  {coupon.expiresAt && (
                    <span className={new Date(coupon.expiresAt) < new Date() ? 'text-red-500' : ''}>
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
          ))}
        </div>
      )}
    </div>
  );
}
