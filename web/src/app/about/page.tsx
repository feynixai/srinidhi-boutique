import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import { FiHeart, FiUsers, FiAward, FiFlag } from 'react-icons/fi';

export const metadata: Metadata = {
  title: 'About Us | Srinidhi Boutique',
  description: 'The story behind Srinidhi Boutique — a family-run women\'s ethnic fashion store from Hyderabad.',
};

const VALUES = [
  { icon: <FiHeart size={28} />, title: 'Handpicked Selection', desc: 'Every piece is personally chosen for quality, design, and wearability. Nothing goes on the shelf unless Srinidhi herself loves it.' },
  { icon: <FiUsers size={28} />, title: 'Family Values', desc: 'We treat every customer like family — with warmth, honesty, and care. Our team is always just a WhatsApp away.' },
  { icon: <FiAward size={28} />, title: 'Premium Quality', desc: 'From fabric to finish, we never compromise on the quality you deserve. Every stitch, every thread, every colour is thoughtfully chosen.' },
  { icon: <FiFlag size={28} />, title: 'Made in India', desc: 'Supporting Indian weavers, artisans, and designers at every step — from Kanchipuram to Kutch, from Lucknow to Jaipur.' },
];

const MISSION_POINTS = [
  { title: 'Celebrate Indian Craft', desc: 'We believe every handwoven saree, every block-printed kurti, every hand-embroidered dupatta tells a story of incredible skill. Our mission is to connect you with those stories.' },
  { title: 'Make Fashion Accessible', desc: 'Premium ethnic fashion shouldn\'t cost a fortune. We work directly with weavers and artisans to bring you exceptional quality at honest prices.' },
  { title: 'Build Lasting Relationships', desc: 'We\'re not just a store — we\'re your personal stylist, your trusted fashion partner, your go-to when you need the perfect outfit for life\'s important moments.' },
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

      {/* Why Choose Us — Glass Cards */}
      <section className="bg-gradient-to-br from-[#f5f0eb] to-[#fffff0] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">Why Choose Us</p>
            <h2 className="section-heading">What We Stand For</h2>
            <div className="divider-gold" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="text-[#c5a55a] flex justify-center mb-3">{v.icon}</div>
                <h3 className="font-serif text-lg text-charcoal mb-2">{v.title}</h3>
                <p className="text-charcoal/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-3">Our Purpose</p>
          <h2 className="section-heading">Our Mission</h2>
          <div className="divider-gold" />
          <p className="text-charcoal/60 text-sm mt-4 max-w-xl mx-auto leading-relaxed">
            Every decision we make — every fabric we source, every design we choose — comes back to this.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MISSION_POINTS.map((m) => (
            <div
              key={m.title}
              className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-7 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="w-10 h-px bg-gold mb-4" />
              <h3 className="font-serif text-xl text-charcoal mb-3">{m.title}</h3>
              <p className="text-charcoal/60 text-sm leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '5+', label: 'Years in Business' },
              { num: '500+', label: 'Happy Customers' },
              { num: '100+', label: 'Products Available' },
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

      {/* Our Journey Timeline */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="section-heading">Our Journey</h2>
          <div className="divider-gold" />
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gold/30" />
          <div className="space-y-10">
            {[
              { year: '2015', title: 'The Beginning', desc: 'Srinidhi opened our first small boutique in Banjara Hills with a curated selection of 50 sarees, driven by a passion for authentic Indian textiles.' },
              { year: '2017', title: 'Expanding the Collection', desc: 'We added kurtis, salwar suits, and lehengas — sourcing directly from weavers in Kanchipuram, Varanasi, and Jaipur for the best fabrics at fair prices.' },
              { year: '2019', title: 'Going Online', desc: 'Srinidhi Boutique launched online, reaching customers across India and making premium ethnic fashion accessible beyond Hyderabad.' },
              { year: '2021', title: 'Festival & Bridal Range', desc: 'We launched our exclusive festival and bridal collections — handpicked pieces for weddings, Diwali, Navratri, and every celebration in between.' },
              { year: '2024', title: 'New Store & 5,000 Happy Customers', desc: 'We moved to a larger store, launched WhatsApp ordering, and celebrated 5,000 happy customers across India. The dream keeps growing!' },
            ].map((item) => (
              <div key={item.year} className="flex gap-6 items-start">
                <div className="w-8 h-8 bg-charcoal border-2 border-gold text-gold font-serif text-xs flex items-center justify-center flex-shrink-0 rounded-full z-10">
                  ★
                </div>
                <div>
                  <p className="text-xs text-gold uppercase tracking-[0.2em] font-semibold mb-0.5">{item.year}</p>
                  <h3 className="font-serif text-lg text-charcoal mb-1">{item.title}</h3>
                  <p className="text-charcoal/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-cream py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-heading">The People Behind Srinidhi</h2>
            <div className="divider-gold" />
            <p className="text-charcoal/60 text-sm mt-3">A family that lives and breathes beautiful clothes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { name: 'Srinidhi', role: 'Founder & Head Buyer', img: 'team-srinidhi', desc: 'The heart of the boutique. Srinidhi hand-picks every piece with an eye for quality and an obsession for design.' },
              { name: 'Kavitha', role: 'Customer Relations', img: 'team-kavitha', desc: 'The first voice you hear on WhatsApp. Kavitha ensures every customer finds exactly what they need.' },
              { name: 'Ravi', role: 'Operations & Logistics', img: 'team-ravi', desc: 'Ravi keeps everything running smoothly — from packing orders with care to ensuring on-time delivery.' },
            ].map((member) => (
              <div key={member.name} className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={`https://picsum.photos/seed/${member.img}/200/200`}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <h3 className="font-serif text-lg text-charcoal mb-0.5">{member.name}</h3>
                <p className="text-rose-gold text-xs uppercase tracking-[0.15em] font-semibold mb-2">{member.role}</p>
                <p className="text-charcoal/60 text-sm leading-relaxed">{member.desc}</p>
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
