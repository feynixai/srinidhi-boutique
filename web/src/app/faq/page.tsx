'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const FAQS = [
  {
    category: 'Orders & Payments',
    items: [
      {
        q: 'How do I place an order?',
        a: 'Browse our collections, select your size and colour, and add to cart. Proceed to checkout and choose your payment method — we accept UPI, cards, net banking via Razorpay, and Cash on Delivery.',
      },
      {
        q: 'Is Cash on Delivery available?',
        a: 'Yes! COD is available for orders up to ₹5,000 at most pin codes across India. You can check availability at checkout by entering your pin code.',
      },
      {
        q: 'Can I modify or cancel my order after placing it?',
        a: 'You can modify or cancel within 2 hours of placing the order. After that, the order may already be packed. Please WhatsApp us immediately at +91-9876543210 and we will do our best to help.',
      },
      {
        q: 'Are my payment details secure?',
        a: 'Absolutely. We use Razorpay for all online payments, which is PCI-DSS compliant. We never store your card details on our servers.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery within India takes 5–7 business days. Express delivery (2–3 days) is available in select cities. International orders take 10–14 business days.',
      },
      {
        q: 'Do you offer free shipping?',
        a: 'Yes! Free shipping on all orders above ₹999 within India. Orders below ₹999 attract a flat ₹99 shipping fee.',
      },
      {
        q: 'How do I track my order?',
        a: 'Once your order is shipped, you will receive a tracking number via WhatsApp and email. You can also track your order on our Track Order page using your order number and phone number.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Yes, we ship to the USA, UK, UAE, Canada, Australia, and Singapore. International shipping charges apply. Customs/import duties are the buyer\'s responsibility.',
      },
    ],
  },
  {
    category: 'Returns & Exchanges',
    items: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery for unused, unwashed items with original tags intact. Simply WhatsApp us or visit our Returns page to initiate a return.',
      },
      {
        q: 'Can I exchange for a different size?',
        a: 'Yes! Size exchanges are free of charge, subject to availability. Contact us within 7 days of receiving your order.',
      },
      {
        q: 'When will I get my refund?',
        a: 'Refunds are processed within 5–7 business days after we receive and inspect the returned item. The amount is credited back to your original payment method.',
      },
      {
        q: 'What items cannot be returned?',
        a: 'Sale items (marked as final sale), customised/altered garments, and innerwear are not eligible for return or exchange.',
      },
    ],
  },
  {
    category: 'Products & Sizing',
    items: [
      {
        q: 'How do I find my size?',
        a: 'Each product page has a detailed size chart. We recommend measuring your bust, waist, and hip in inches and comparing with the chart. When in doubt, size up — or WhatsApp us for personalised sizing help.',
      },
      {
        q: 'Are the colours accurate in photos?',
        a: 'We make every effort to photograph products in natural light with accurate colour representation. However, slight variations may occur due to your screen\'s calibration. If you are unsure, WhatsApp us for a live photo.',
      },
      {
        q: 'Do you do customisations or alterations?',
        a: 'We offer minor alterations (blouse fitting, length adjustments) for select products. WhatsApp us before placing your order to check availability and pricing.',
      },
    ],
  },
  {
    category: 'Account & Loyalty',
    items: [
      {
        q: 'Do I need an account to shop?',
        a: 'No — guest checkout is available! However, creating an account helps you track orders, save addresses, earn loyalty points, and get personalised recommendations.',
      },
      {
        q: 'How does the loyalty programme work?',
        a: 'Earn 1 point per ₹10 spent. Accumulate points and redeem them on future purchases (100 points = ₹10 off). You also earn bonus points for writing reviews and referring friends.',
      },
      {
        q: 'How does the referral programme work?',
        a: 'Share your unique referral link with friends. When they make their first purchase, you both earn bonus loyalty points worth ₹100.',
      },
    ],
  },
  {
    category: 'Care & Fabric',
    items: [
      {
        q: 'How should I wash silk sarees?',
        a: 'Silk sarees should be dry cleaned or hand washed in cold water using a mild silk-friendly detergent. Never wring or machine wash. Dry flat in shade — never in direct sunlight which can fade the colour. Store wrapped in a soft muslin cloth.',
      },
      {
        q: 'How do I care for embroidered or zari work garments?',
        a: 'Dry clean is strongly recommended for all embroidered and zari work garments. Avoid spraying perfume directly on embellishments as alcohol can damage threads and stones. Store folded with the embroidery side inward, wrapped in a muslin cloth.',
      },
      {
        q: 'Can cotton kurtis and suits be machine washed?',
        a: 'Yes — most cotton kurtis can be machine washed in gentle/delicate mode with cold water. Wash dark colours separately for the first two washes. Avoid tumble drying; instead, dry flat or hang in shade to prevent shrinkage and colour fading.',
      },
      {
        q: 'How do I prevent colours from fading?',
        a: 'Always wash in cold water — hot water causes colour bleed and fading. Turn garments inside out before washing. Use colour-safe or mild detergents. For printed fabrics, add 1 tablespoon of salt or white vinegar to the first wash to set the colour.',
      },
      {
        q: 'What is the difference between georgette, chiffon, and organza?',
        a: 'Georgette is slightly heavier with a grainy texture — drapes beautifully and is easy to wear. Chiffon is lighter and more sheer — flowy and elegant for evenings. Organza is crisp and semi-transparent — holds its shape well, great for structured drapes and lehenga skirts. All three are best dry cleaned or gently hand washed.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        className="w-full flex justify-between items-center py-4 text-left gap-4"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-charcoal">{q}</span>
        <ChevronDownIcon
          className={`w-4 h-4 text-rose-gold flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-charcoal/70 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="bg-white">
      <section className="bg-cream py-16 px-4 text-center">
        <p className="text-rose-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">Help Centre</p>
        <h1 className="font-serif text-4xl text-charcoal mb-4">Frequently Asked Questions</h1>
        <div className="divider-gold" />
        <p className="text-charcoal/60 mt-4 text-sm max-w-md mx-auto">
          Can't find what you're looking for? We're always here to help.
        </p>
        <a
          href="https://wa.me/919876543210?text=Hi! I have a question."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-sm text-green-600 font-medium hover:underline"
        >
          WhatsApp us directly →
        </a>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {FAQS.map((section) => (
          <div key={section.category} className="mb-10">
            <h2 className="font-serif text-xl text-charcoal mb-4 pb-2 border-b border-rose-gold/30">
              {section.category}
            </h2>
            <div>
              {section.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 bg-cream rounded p-8 text-center">
          <p className="font-serif text-lg text-charcoal mb-2">Still have questions?</p>
          <p className="text-charcoal/60 text-sm mb-4">Our team is available 9 AM – 9 PM, 7 days a week.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold px-8 py-3 text-sm tracking-widest inline-block"
            >
              WHATSAPP US
            </a>
            <Link href="/contact" className="border border-charcoal text-charcoal px-8 py-3 text-sm tracking-widest hover:bg-charcoal hover:text-white transition-colors">
              CONTACT FORM
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
