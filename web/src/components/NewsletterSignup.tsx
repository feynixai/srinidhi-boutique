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
    <section className="bg-cream border-y border-gold/20 py-14">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <p className="text-rose-gold uppercase tracking-[0.25em] text-xs font-semibold mb-2">Stay in the Loop</p>
        <h2 className="font-serif text-3xl text-charcoal mb-2">Join Our Community</h2>
        <div className="divider-gold" />
        <p className="text-charcoal/50 text-sm mt-4 mb-8 leading-relaxed max-w-md mx-auto">
          Get early access to new collections, exclusive offers, and styling tips straight to your inbox.
        </p>

        {subscribed ? (
          <div className="bg-green-50 border border-green-200 rounded-sm px-6 py-5 inline-block">
            <p className="text-green-700 font-medium text-base">You&apos;re subscribed!</p>
            <p className="text-green-600 text-sm mt-1">Watch your inbox for exclusive updates.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="flex-1 border border-gold/30 bg-white px-4 py-3 text-sm focus:outline-none focus:border-rose-gold text-charcoal placeholder:text-charcoal/40"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-[1.5] border border-gold/30 bg-white px-4 py-3 text-sm focus:outline-none focus:border-rose-gold text-charcoal placeholder:text-charcoal/40"
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

        <p className="text-charcoal/30 text-xs mt-4">No spam, ever. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
