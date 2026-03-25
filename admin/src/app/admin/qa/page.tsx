'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface QAItem {
  id: string;
  productId: string;
  question: string;
  answer?: string;
  askedBy?: string;
  approved: boolean;
  createdAt: string;
  product?: { name: string; slug: string };
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function QAAdminPage() {
  const qc = useQueryClient();
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unanswered'>('unanswered');

  const { data: items = [], isLoading } = useQuery<QAItem[]>({
    queryKey: ['admin-qa', filter],
    queryFn: () =>
      fetch(`${API}/qa/admin/all${filter === 'unanswered' ? '?unanswered=true' : ''}`).then((r) => r.json()),
  });

  const answerMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const res = await fetch(`${API}/qa/${id}/answer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-qa'] });
      setAnswering(null);
      setAnswerText('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${API}/qa/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-qa'] }),
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Q&A</h1>
          <p className="text-gray-500 text-sm mt-1">Answer customer questions on product pages</p>
        </div>
        <div className="flex gap-2">
          {(['unanswered', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded text-sm font-medium capitalize ${
                filter === f ? 'bg-gray-800 text-white' : 'border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {filter === 'unanswered' ? 'No unanswered questions!' : 'No questions yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border shadow-sm p-5">
              {item.product && (
                <p className="text-xs text-blue-600 font-medium mb-2 uppercase tracking-wide">
                  {item.product.name}
                </p>
              )}
              <div className="flex gap-2 mb-2">
                <span className="text-rose-600 font-bold text-sm">Q:</span>
                <p className="text-sm text-gray-800">{item.question}</p>
              </div>
              {item.askedBy && (
                <p className="text-xs text-gray-400 mb-2">Asked by {item.askedBy} · {new Date(item.createdAt).toLocaleDateString('en-IN')}</p>
              )}
              {item.answer ? (
                <div className="flex gap-2 bg-green-50 rounded p-3 mt-2">
                  <span className="text-green-600 font-bold text-sm">A:</span>
                  <p className="text-sm text-gray-700">{item.answer}</p>
                </div>
              ) : answering === item.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                    rows={3}
                    placeholder="Type your answer..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => answerText.trim() && answerMutation.mutate({ id: item.id, answer: answerText.trim() })}
                      disabled={!answerText.trim() || answerMutation.isPending}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {answerMutation.isPending ? 'Saving...' : 'Post Answer'}
                    </button>
                    <button
                      onClick={() => { setAnswering(null); setAnswerText(''); }}
                      className="border px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setAnswering(item.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                  >
                    Answer
                  </button>
                  <button
                    onClick={() => confirm('Delete this question?') && deleteMutation.mutate(item.id)}
                    className="border border-red-200 text-red-500 px-4 py-2 rounded text-sm hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
