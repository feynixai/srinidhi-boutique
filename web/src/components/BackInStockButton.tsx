'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  productId: string;
  productName: string;
}

export default function BackInStockButton({ productId, productName }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email && !phone) {
      setError('Enter email or phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/inventory/back-in-stock', {
        productId,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-rose-gold text-rose-gold py-3 rounded-lg font-medium hover:bg-rose-gold hover:text-white transition-colors"
      >
        Notify When Back in Stock
      </button>
    );
  }

  return (
    <div className="border border-rose-gold/30 rounded-lg p-4 bg-rose-gold/5">
      <p className="font-serif text-sm text-charcoal mb-3">
        Get notified when <strong>{productName}</strong> is back in stock
      </p>
      {done ? (
        <p className="text-green-600 text-sm font-medium">
          You&apos;re on the list! We&apos;ll notify you when it&apos;s back.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
          />
          <p className="text-xs text-center text-gray-600">or</p>
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-gold text-white py-2 rounded text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Notify Me'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
