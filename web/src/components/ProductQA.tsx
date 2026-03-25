'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface QAItem {
  id: string;
  question: string;
  answer?: string;
  askedBy?: string;
  answeredAt?: string;
  createdAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function ProductQA({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const [question, setQuestion] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: items = [] } = useQuery<QAItem[]>({
    queryKey: ['qa', productId],
    queryFn: () => fetch(`${API}/qa/${productId}`).then((r) => r.json()),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/qa/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), askedBy: name.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qa', productId] });
      setQuestion('');
      setName('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    },
  });

  const answeredItems = items.filter((i) => i.answer);
  const showForm = true;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <QuestionMarkCircleIcon className="w-5 h-5 text-rose-gold" />
        <h2 className="font-serif text-xl text-charcoal">Questions & Answers</h2>
      </div>

      {/* Existing Q&As */}
      {answeredItems.length > 0 && (
        <div className="space-y-4 mb-8">
          {answeredItems.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded p-4">
              <div className="flex gap-2 mb-2">
                <span className="text-rose-gold font-bold text-sm flex-shrink-0">Q:</span>
                <p className="text-sm text-charcoal">{item.question}</p>
              </div>
              {item.answer && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                  <span className="text-green-600 font-bold text-sm flex-shrink-0">A:</span>
                  <p className="text-sm text-charcoal/80">{item.answer}</p>
                </div>
              )}
              {item.askedBy && (
                <p className="text-xs text-charcoal/40 mt-2">Asked by {item.askedBy}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ask a question */}
      {showForm && (
        <div className="bg-cream rounded p-5">
          <p className="font-medium text-sm text-charcoal mb-4">Have a question about this product?</p>
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-green-600 font-medium text-sm">Question submitted!</p>
              <p className="text-charcoal/60 text-xs mt-1">We'll answer it as soon as possible.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-charcoal/60 mb-1">Your question *</label>
                <textarea
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-rose-gold resize-none"
                  rows={3}
                  placeholder="e.g. Is this available in XL? What fabric is it made of?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-xs text-charcoal/60 mb-1">Your name (optional)</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
                  placeholder="e.g. Priya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button
                onClick={() => question.trim().length >= 5 && submit.mutate()}
                disabled={question.trim().length < 5 || submit.isPending}
                className="btn-gold px-6 py-2.5 text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submit.isPending ? 'SUBMITTING...' : 'SUBMIT QUESTION'}
              </button>
            </div>
          )}
        </div>
      )}

      {answeredItems.length === 0 && (
        <p className="text-sm text-charcoal/40 mt-2">No answered questions yet. Be the first to ask!</p>
      )}
    </div>
  );
}
