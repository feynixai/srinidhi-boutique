'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, source: 'homepage' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');

      setSubscribed(true);
      toast.success(data.message || 'Subscribed!');
    } catch {
      toast.error('Could not subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="glass-card py-14 px-6 text-center">
        <p className="text-[#c5a55a] uppercase tracking-[0.25em] text-xs font-semibold mb-2">Stay in the Loop</p>
        <h2 className="font-bold text-3xl text-[#1a1a2e] mb-2 tracking-tight">Join Our Community</h2>
        <div className="divider-gold mx-auto" />
        <p className="text-[#6b7280] text-sm mt-4 mb-8 leading-relaxed max-w-md mx-auto">
          Get early access to new collections, exclusive offers, and styling tips straight to your inbox.
        </p>

        {subscribed ? (
          <div className="glass-card-sm px-6 py-5 inline-block">
            <p className="text-green-700 font-semibold text-base">You&apos;re subscribed!</p>
            <p className="text-green-600 text-sm mt-1">Watch your inbox for exclusive updates.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="flex-1 bg-white/70 border border-white/50 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[#c5a55a] text-[#1a1a2e] placeholder:text-[#6b7280]"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-[1.5] bg-white/70 border border-white/50 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-[#c5a55a] text-[#1a1a2e] placeholder:text-[#6b7280]"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-3 text-xs tracking-widest whitespace-nowrap disabled:opacity-60"
            >
              {loading ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
            </button>
          </form>
        )}

        <p className="text-[#6b7280]/50 text-xs mt-4">No spam, ever. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
