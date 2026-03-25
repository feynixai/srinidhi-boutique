'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';

const STEPS = [
  { step: '01', title: 'Fill the Form Below', desc: 'Submit your return request with your order number and reason.' },
  { step: '02', title: 'Share Photos', desc: 'We\'ll contact you to collect photos of the item. This helps us process faster.' },
  { step: '03', title: 'Ship It Back', desc: 'Pack the item securely and ship it to our address. We\'ll share the details via WhatsApp.' },
  { step: '04', title: 'Refund or Exchange', desc: 'Once we receive and verify, we\'ll process your exchange or refund within 3–5 business days.' },
];

const ACCEPTED = [
  'Defective or damaged items',
  'Wrong item delivered',
  'Size issue (exchange only, subject to availability)',
  'Significantly different from description',
];

const NOT_ACCEPTED = [
  'Items worn, washed, or altered',
  'Items without original tags/packaging',
  'Customized or stitched items',
  'Sarees that have been unwrapped',
  'Items returned after 7 days of delivery',
  'Discounted or sale items (unless defective)',
];

const REASONS = [
  { value: 'defective', label: 'Defective / Damaged item' },
  { value: 'wrong_item', label: 'Wrong item delivered' },
  { value: 'size_issue', label: 'Size issue' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'other', label: 'Other' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ReturnsPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210';
  const waLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Hi! I'd like to initiate a return for my order.`;

  const [form, setForm] = useState({
    orderNumber: '',
    customerName: '',
    customerPhone: '',
    reason: '',
    description: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.orderNumber || !form.customerName || !form.customerPhone || !form.reason) {
      setErrorMsg('Please fill all required fields.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || data.message || 'Something went wrong.');
        setStatus('error');
        return;
      }
      setStatus('success');
    } catch {
      setErrorMsg('Failed to submit. Please try again or contact us on WhatsApp.');
      setStatus('error');
    }
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-cream py-16 text-center px-4 border-b border-gold/20">
        <p className="text-gold uppercase tracking-[0.3em] text-xs font-medium mb-3">Hassle-Free</p>
        <h1 className="font-serif text-4xl text-charcoal mb-3">Returns & Exchanges</h1>
        <div className="divider-gold" />
        <p className="text-charcoal/60 text-sm mt-3 max-w-md mx-auto">
          Your satisfaction is our priority. If something isn't right, we'll make it right - within 7 days.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-14">
        {/* Policy Summary */}
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg>, title: '7-Day Window', desc: 'Initiate returns within 7 days of delivery' },
            { icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>, title: 'Easy Exchange', desc: 'Exchange for a different size or style' },
            { icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, title: 'Quick Refund', desc: 'Refunds processed in 3–5 business days' },
          ].map((c) => (
            <div key={c.title} className="text-center bg-cream p-6 rounded-sm">
              <div className="text-[#c5a55a] flex justify-center mb-3">{c.icon}</div>
              <h3 className="font-serif text-lg text-charcoal mb-1">{c.title}</h3>
              <p className="text-charcoal/60 text-sm">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Return Request Form */}
        <div className="border border-gold/20 rounded-sm p-6 md:p-8">
          <h2 className="font-serif text-2xl text-charcoal mb-2">Request a Return or Exchange</h2>
          <p className="text-charcoal/50 text-sm mb-6">Fill the form and we'll get back to you within 24 hours.</p>

          {status === 'success' ? (
            <div className="text-center py-10">
              <div className="text-green-500 flex justify-center mb-4"><svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
              <h3 className="font-serif text-2xl text-charcoal mb-2">Request Submitted!</h3>
              <p className="text-charcoal/60 text-sm mb-6">
                We've received your return request. Our team will contact you within 24 hours via WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 text-sm font-medium hover:bg-green-600 transition-colors">
                  <FaWhatsapp size={16} /> Chat with Us
                </a>
                <Link href="/shop" className="inline-flex items-center justify-center px-6 py-3 text-sm border border-charcoal/20 hover:border-charcoal transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1.5">
                    Order Number <span className="text-rose-gold">*</span>
                  </label>
                  <input
                    value={form.orderNumber}
                    onChange={(e) => setForm({ ...form, orderNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. SB-0042"
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-rose-gold rounded-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1.5">
                    Your Name <span className="text-rose-gold">*</span>
                  </label>
                  <input
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Full name"
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-rose-gold rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1.5">
                    Phone Number <span className="text-rose-gold">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-rose-gold rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1.5">
                    Reason <span className="text-rose-gold">*</span>
                  </label>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-rose-gold rounded-sm bg-white"
                  >
                    <option value="">Select a reason</option>
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1.5">
                  Additional Details
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-rose-gold rounded-sm resize-none"
                />
              </div>
              {errorMsg && (
                <p className="text-red-500 text-sm">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary w-full py-3.5 text-sm tracking-widest disabled:opacity-50"
              >
                {status === 'loading' ? 'SUBMITTING...' : 'SUBMIT RETURN REQUEST'}
              </button>
              <p className="text-xs text-charcoal/40 text-center">
                Or contact us directly on{' '}
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                  WhatsApp
                </a>
              </p>
            </form>
          )}
        </div>

        {/* How It Works */}
        <div>
          <h2 className="font-serif text-2xl text-charcoal mb-6">How It Works</h2>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.step} className="flex gap-5">
                <div className="w-10 h-10 bg-charcoal text-gold font-serif text-sm flex items-center justify-center flex-shrink-0 rounded-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-medium text-charcoal mb-0.5">{s.title}</h3>
                  <p className="text-charcoal/60 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accepted / Not Accepted */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="font-serif text-xl text-charcoal mb-4">We Accept Returns For</h2>
            <ul className="space-y-2">
              {ACCEPTED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-charcoal/70">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-xl text-charcoal mb-4">We Don't Accept Returns For</h2>
            <ul className="space-y-2">
              {NOT_ACCEPTED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-charcoal/70">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Refund Info */}
        <div className="bg-cream p-6 rounded-sm">
          <h2 className="font-serif text-xl text-charcoal mb-3">Refund Information</h2>
          <div className="space-y-2 text-sm text-charcoal/70 leading-relaxed">
            <p><strong className="text-charcoal">Online payments (Razorpay/UPI):</strong> Refunded to your original payment method within 5–7 business days.</p>
            <p><strong className="text-charcoal">Cash on Delivery:</strong> Refunded as store credit or bank transfer (NEFT/IMPS) within 3–5 business days.</p>
            <p><strong className="text-charcoal">Shipping charges:</strong> Non-refundable unless the item was defective or wrong.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
