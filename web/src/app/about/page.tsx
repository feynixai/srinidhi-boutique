import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'About Us | Srinidhi Boutique',
  description: 'The story behind Srinidhi Boutique — a family-run women\'s ethnic fashion store from Hyderabad.',
};

const VALUES = [
  { icon: '🌸', title: 'Handpicked Selection', desc: 'Every piece is personally chosen for quality, design, and wearability.' },
  { icon: '🤝', title: 'Family Values', desc: 'We treat every customer like family — with warmth, honesty, and care.' },
  { icon: '✨', title: 'Premium Quality', desc: 'From fabric to finish, we never compromise on the quality you deserve.' },
  { icon: '🇮🇳', title: 'Made in India', desc: 'Supporting Indian weavers, artisans, and designers at every step.' },
];

export default function AboutPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210';
  const waLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Hi Srinidhi Boutique! I'd love to know more.`;

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-charcoal py-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://picsum.photos/seed/about-hero/1400/600"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3 font-medium">Est. 2015 · Hyderabad</p>
          <h1 className="font-serif text-5xl text-white mb-4">Our Story</h1>
          <div className="divider-gold" />
          <p className="text-white/70 mt-4 text-base leading-relaxed">
            A boutique born from a mother's love for beautiful clothes and a family's dream to share that with every woman.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">Who We Are</p>
            <h2 className="font-serif text-3xl text-charcoal mb-5">More Than a Boutique — A Family Dream</h2>
            <div className="space-y-4 text-charcoal/70 leading-relaxed text-base">
              <p>
                Srinidhi Boutique was born in 2015 in the heart of Hyderabad, from a simple idea: every woman deserves to
                feel beautiful without spending a fortune. What started as a small shop with a rack of carefully chosen
                sarees has grown into a beloved destination for ethnic fashion across Telangana.
              </p>
              <p>
                Our founder, Srinidhi, spent years sourcing fabrics from Kanchipuram, Banarasi weavers, and local
                craftsmen in Hyderabad. Her eye for design and her deep belief in quality over quantity became the soul
                of this boutique.
              </p>
              <p>
                Today, we carry everything from everyday kurtis to bridal lehengas — each piece chosen with the same
                care as if it were for someone in our own family.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/5] rounded-sm overflow-hidden">
            <Image
              src="https://picsum.photos/seed/boutique-story/600/750"
              alt="Srinidhi Boutique store"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-cream py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-heading">What We Stand For</h2>
            <div className="divider-gold" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="text-center px-4">
                <div className="text-4xl mb-3">{v.icon}</div>
                <h3 className="font-serif text-lg text-charcoal mb-2">{v.title}</h3>
                <p className="text-charcoal/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '10+', label: 'Years in Business' },
              { num: '5,000+', label: 'Happy Customers' },
              { num: '500+', label: 'Styles Available' },
              { num: '₹999', label: 'Free Shipping Above' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-serif text-4xl text-rose-gold mb-1">{s.num}</p>
                <p className="text-charcoal/60 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-charcoal py-14 text-center px-4">
        <p className="text-gold uppercase tracking-[0.2em] text-xs mb-3 font-medium">Come Visit Us</p>
        <h2 className="font-serif text-3xl text-white mb-4">Let's Find Your Perfect Look</h2>
        <p className="text-white/60 mb-6 text-sm max-w-sm mx-auto">
          Shop online or visit our store in Hyderabad. We're always happy to help you find exactly what you're looking for.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="btn-gold px-10 py-3 text-sm tracking-widest inline-block">
            SHOP NOW
          </Link>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-green-400 text-green-400 px-10 py-3 text-sm tracking-widest hover:bg-green-400 hover:text-charcoal transition-colors"
          >
            <FaWhatsapp size={16} /> WHATSAPP US
          </a>
        </div>
      </section>
    </div>
  );
}
