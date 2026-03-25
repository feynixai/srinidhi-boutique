'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { FaWhatsapp } from 'react-icons/fa';

interface ReturnRequest {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
};

const REASON_LABELS: Record<string, string> = {
  defective: 'Defective / Damaged',
  wrong_item: 'Wrong Item',
  size_issue: 'Size Issue',
  not_as_described: 'Not as Described',
  other: 'Other',
};

const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210').replace('+', '');

export default function ReturnsAdminPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: returns, isLoading } = useQuery<ReturnRequest[]>({
    queryKey: ['admin-returns'],
    queryFn: () => api.get('/api/returns').then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/returns/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const filtered = (returns || []).filter((r) => filter === 'all' || r.status === filter);
  const pendingCount = (returns || []).filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Returns & Exchanges</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-600 font-medium mt-1">{pendingCount} pending request{pendingCount > 1 ? 's' : ''} need attention</p>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-rose-gold text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? `All (${returns?.length || 0})` : s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-[#c5a55a] flex justify-center mb-3"><svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></div>
          <p className="text-xl">No return requests{filter !== 'all' ? ` with status "${filter}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-mono text-lg font-bold text-rose-gold">{req.orderNumber}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                      {req.status}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-base font-semibold">{req.customerName}</p>
                  <p className="text-sm text-gray-500">{req.customerPhone}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Reason:</span> {REASON_LABELS[req.reason] || req.reason}
                  </p>
                  {req.description && (
                    <p className="text-sm text-gray-500 mt-1 italic">"{req.description}"</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 min-w-[160px]">
                  <a
                    href={`https://wa.me/${req.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${req.customerName}! We've received your return request for order ${req.orderNumber}. Let us help you sort this out.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
                  >
                    <FaWhatsapp size={16} /> Contact
                  </a>
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => statusMutation.mutate({ id: req.id, status: 'approved' })}
                        disabled={statusMutation.isPending}
                        className="btn-action bg-blue-500 text-white text-sm py-2 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ id: req.id, status: 'rejected' })}
                        disabled={statusMutation.isPending}
                        className="btn-action bg-red-500 text-white text-sm py-2 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {req.status === 'approved' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: req.id, status: 'completed' })}
                      disabled={statusMutation.isPending}
                      className="btn-action bg-green-600 text-white text-sm py-2 disabled:opacity-50"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
