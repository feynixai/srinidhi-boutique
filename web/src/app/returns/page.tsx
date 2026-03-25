import type { Metadata } from 'next';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Returns & Exchange Policy | Srinidhi Boutique',
  description: '7-day hassle-free returns and exchange policy at Srinidhi Boutique.',
};

const STEPS = [
  { step: '01', title: 'Contact Us Within 7 Days', desc: 'WhatsApp or call us within 7 days of delivery with your order number and reason for return.' },
  { step: '02', title: 'Share Photos', desc: 'Send us photos of the item showing the issue. This helps us process your request faster.' },
  { step: '03', title: 'Ship It Back', desc: 'Pack the item securely and ship it to our address. We\'ll share the details via WhatsApp.' },
  { step: '04', title: 'Refund or Exchange', desc: 'Once we receive and verify the item, we\'ll process your exchange or refund within 3–5 business days.' },
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

export default function ReturnsPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210';
  const waLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Hi! I'd like to initiate a return for my order.`;

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-cream py-16 text-center px-4 border-b border-gold/20">
        <p className="text-gold uppercase tracking-[0.3em] text-xs font-medium mb-3">Hassle-Free</p>
        <h1 className="font-serif text-4xl text-charcoal mb-3">Returns & Exchanges</h1>
        <div className="divider-gold" />
        <p className="text-charcoal/60 text-sm mt-3 max-w-md mx-auto">
          Your satisfaction is our priority. If something isn't right, we'll make it right — within 7 days.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-14">
        {/* Policy Summary */}
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: '📅', title: '7-Day Window', desc: 'Initiate returns within 7 days of delivery' },
            { icon: '🔄', title: 'Easy Exchange', desc: 'Exchange for a different size or style' },
            { icon: '💰', title: 'Quick Refund', desc: 'Refunds processed in 3–5 business days' },
          ].map((c) => (
            <div key={c.title} className="text-center bg-cream p-6 rounded-sm">
              <div className="text-3xl mb-3">{c.icon}</div>
              <h3 className="font-serif text-lg text-charcoal mb-1">{c.title}</h3>
              <p className="text-charcoal/60 text-sm">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div>
          <h2 className="font-serif text-2xl text-charcoal mb-6">How to Return or Exchange</h2>
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

        {/* CTA */}
        <div className="text-center">
          <p className="text-charcoal/60 text-sm mb-4">Ready to start a return or have questions?</p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-10 py-3.5 text-sm font-medium tracking-widest hover:bg-green-600 transition-colors"
          >
            <FaWhatsapp size={18} /> CONTACT US ON WHATSAPP
          </a>
          <p className="text-charcoal/40 text-xs mt-3">
            Or email us at <a href="mailto:hello@srinidhiboutique.com" className="underline">hello@srinidhiboutique.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
