import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedProducts, getBestSellers, getOffers, getCategories } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { HeroCarousel } from '@/components/HeroCarousel';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { FadeInSection } from '@/components/FadeInSection';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ShopByOccasion } from '@/components/ShopByOccasion';

async function getData() {
  const [featured, bestSellers, offers, categories] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getBestSellers().catch(() => []),
    getOffers().catch(() => []),
    getCategories().catch(() => []),
  ]);
  return { featured, bestSellers, offers, categories };
}

// Flash sale ends at midnight today
function getFlashSaleEnd(): Date {
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  return end;
}

export default async function HomePage() {
  const { featured, bestSellers, offers, categories } = await getData();
  const flashSaleEnd = getFlashSaleEnd();

  return (
    <div className="bg-[#f5f5f0]">
      {/* Announcement Bar */}
      <div className="bg-[#1a1a2e] text-[#c5a55a] text-center py-2.5 text-xs tracking-[0.15em] uppercase font-medium">
        Free Shipping Above &#x20B9;999 &nbsp;&middot;&nbsp; New Festival Collection Live
        &nbsp;&middot;&nbsp; Easy 7-Day Returns
      </div>

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Coupon Offers Strip */}
      <div className="bg-white/50 backdrop-blur-sm border-y border-white/40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold bg-[#1a1a2e] text-[#c5a55a] px-3 py-1 rounded-full text-xs tracking-wider">
                WELCOME10
              </span>
              <span className="text-[#1a1a2e]/70">
                10% off on orders above &#x20B9;500
              </span>
            </div>
            <span className="text-black/20 hidden sm:block">|</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold bg-[#c5a55a] text-[#1a1a2e] px-3 py-1 rounded-full text-xs tracking-wider">
                SRINIDHI20
              </span>
              <span className="text-[#1a1a2e]/70">
                20% off on orders above &#x20B9;2000
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges — Glass Pills */}
      <div className="bg-white/30 backdrop-blur-sm border-b border-white/20 py-5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: '🚚', text: 'Free Shipping', sub: 'Above ₹999' },
              { icon: '↩️', text: 'Easy Returns', sub: '7-Day Policy' },
              { icon: '🔒', text: 'Secure Payments', sub: 'UPI · Cards · COD' },
              { icon: '💰', text: 'Cash on Delivery', sub: 'Pan India' },
              { icon: '💬', text: 'WhatsApp Support', sub: 'Always Available' },
            ].map((b) => (
              <div
                key={b.text}
                className="flex items-center gap-2.5 bg-white/60 backdrop-blur-xl border border-white/40 px-4 py-2.5 rounded-full shadow-sm hover:bg-white/80 transition-all"
              >
                <span className="text-lg leading-none">{b.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-[#1a1a2e] leading-tight">{b.text}</p>
                  <p className="text-[10px] text-[#1a1a2e]/50 leading-tight">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Grid */}
      {categories.length > 0 && (
        <FadeInSection>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="section-heading">Shop by Category</h2>
              <div className="divider-gold mx-auto" />
              <p className="text-[#1a1a2e]/50 text-sm mt-2 tracking-wide">
                Curated for every occasion
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {categories.slice(0, 6).map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className={`group relative overflow-hidden rounded-3xl bg-gray-100 shadow-card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 ${
                    i === 0 ? 'row-span-2 aspect-[4/5]' : 'aspect-square'
                  }`}
                >
                  {cat.image && (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/70 via-[#1a1a2e]/10 to-transparent group-hover:from-[#1a1a2e]/80 transition-all duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-serif text-xl group-hover:text-[#c5a55a] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-white/70 text-xs mt-0.5 tracking-wide">Explore →</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </FadeInSection>
      )}

      {/* Shop by Occasion */}
      <FadeInSection delay={100}>
        <ShopByOccasion />
      </FadeInSection>

      {/* Festival Collection Banner */}
      <FadeInSection>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-[#1a1a2e] py-16 px-6 text-center shadow-card">
          <div className="absolute inset-0 opacity-10">
            <Image
              src="https://picsum.photos/seed/festival-bg/1400/400"
              alt=""
              fill
              className="object-cover"
            />
          </div>
          <div className="relative max-w-2xl mx-auto">
            <p className="text-[#c5a55a] uppercase tracking-[0.3em] text-xs mb-3 font-medium">
              Exclusive
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-3 font-bold">
              Festival Ready
            </h2>
            <div className="divider-gold mx-auto" />
            <p className="text-white/60 mt-4 mb-8 text-base leading-relaxed">
              Navratri · Diwali · Weddings · Sangeet — dress for every celebration.
            </p>
            <Link
              href="/shop"
              className="btn-gold px-10 py-4 text-sm tracking-widest inline-block"
            >
              EXPLORE NOW
            </Link>
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* Featured Products */}
      {featured.length > 0 && (
        <FadeInSection>
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-heading">Featured Collection</h2>
                <div className="divider-gold mt-2" />
              </div>
              <Link
                href="/shop?featured=true"
                className="text-[#c5a55a] text-sm font-medium hover:text-[#1a1a2e] transition-colors tracking-wide"
              >
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {featured.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
        </FadeInSection>
      )}

      {/* Offers Banner */}
      {offers.length > 0 && (
        <FadeInSection>
        <section className="bg-[#e8f0e8]/60 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-6 items-center mb-10">
              <div>
                <p className="text-[#c5a55a] uppercase tracking-[0.2em] text-xs font-semibold mb-2">
                  Limited Time Offer
                </p>
                <h2 className="section-heading">Sale Now On</h2>
                <div className="divider-gold mt-2" />
                <p className="text-[#1a1a2e]/60 mt-3 text-sm leading-relaxed">
                  Up to 25% off on selected sarees, kurtis &amp; lehengas.
                </p>
                <div className="mt-4">
                  <CountdownTimer endsAt={flashSaleEnd} label="Ends in" />
                </div>
              </div>
              <div className="text-center md:text-right">
                <div className="inline-block bg-blue-600 text-white px-8 py-4 rounded-3xl font-serif text-3xl italic mb-2 shadow-card">
                  25% OFF
                </div>
                <p className="text-[#1a1a2e]/50 text-xs tracking-widest uppercase mt-2">
                  Selected styles only
                </p>
                <Link
                  href="/offers"
                  className="btn-primary mt-4 inline-block px-8 py-3 text-xs tracking-widest"
                >
                  SHOP OFFERS
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {offers.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
        </FadeInSection>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <FadeInSection>
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-heading">Best Sellers</h2>
                <div className="divider-gold mt-2" />
                <p className="text-[#1a1a2e]/50 text-sm mt-1">Most loved by our customers</p>
              </div>
              <Link
                href="/shop?bestSeller=true"
                className="text-[#c5a55a] text-sm font-medium hover:text-[#1a1a2e] transition-colors tracking-wide"
              >
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {bestSellers.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
        </FadeInSection>
      )}

      {/* Why Shop With Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[#c5a55a] uppercase tracking-[0.2em] text-xs font-semibold mb-3">Our Promise</p>
            <h2 className="section-heading">Why Shop With Us</h2>
            <div className="divider-gold mx-auto" />
            <p className="text-[#1a1a2e]/50 text-sm mt-3 max-w-md mx-auto">
              Everything we do is designed to make your ethnic fashion experience effortless and joyful.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: '🚚',
                title: 'Free Shipping',
                subtitle: 'Above ₹999',
                desc: 'Free delivery anywhere in India on all orders above ₹999. Express delivery available in Hyderabad and major cities.',
              },
              {
                icon: '🔄',
                title: 'Easy 7-Day Returns',
                subtitle: 'Hassle-Free',
                desc: 'Changed your mind? No problem. Return any unworn item within 7 days for a full refund or exchange — no questions asked.',
              },
              {
                icon: '💳',
                title: 'Secure Payments',
                subtitle: 'UPI · Cards · COD',
                desc: 'Pay via UPI, credit/debit cards, net banking, or Cash on Delivery. All transactions secured by Razorpay — PCI-DSS certified.',
              },
              {
                icon: '📞',
                title: '24/7 WhatsApp Support',
                subtitle: 'Always Available',
                desc: 'Our team is always a WhatsApp message away — whether you need sizing help, want a live product video, or have a question about your order.',
              },
            ].map((b) => (
              <div
                key={b.title}
                className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 text-center shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                style={{ boxShadow: '0 4px 24px rgba(197,165,90,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <div className="text-4xl mb-3">{b.icon}</div>
                <h3 className="font-semibold text-[#1a1a2e] text-base mb-0.5">{b.title}</h3>
                <p className="text-[#c5a55a] text-xs font-medium uppercase tracking-wider mb-3">{b.subtitle}</p>
                <p className="text-[#1a1a2e]/60 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Promise / Quality Statement */}
      <section className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#c5a55a] uppercase tracking-[0.2em] text-xs font-semibold mb-3">Authenticity Guaranteed</p>
              <h2 className="font-serif text-3xl md:text-4xl text-white mb-5 leading-snug">
                Our Promise of Quality &amp; Authenticity
              </h2>
              <div className="w-12 h-px bg-[#c5a55a] mb-6" />
              <p className="text-white/60 text-sm leading-relaxed mb-5">
                Every product at Srinidhi Boutique is personally inspected by our founder before it reaches you. We source directly from weavers in Kanchipuram, artisans in Lucknow, craftsmen in Jaipur, and textile hubs across India.
              </p>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                We never sell mass-produced replicas or compromise on fabric quality. What you see is exactly what you get — and if it's not perfect, our 7-day return policy means you're always protected.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { num: '500+', label: 'Happy Customers' },
                  { num: '100+', label: 'Products' },
                  { num: '5+', label: 'Years' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/10 rounded-2xl p-4">
                    <p className="font-serif text-2xl text-[#c5a55a] mb-1">{s.num}</p>
                    <p className="text-white/50 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: '🌸', title: 'Handpicked by Srinidhi', desc: 'Every product is personally chosen by our founder — nothing reaches the shelf unless she truly loves it.' },
                { icon: '🇮🇳', title: 'Sourced from the Best Artisans', desc: 'Direct relationships with weavers and craftspeople across India means better quality and fair prices for you.' },
                { icon: '📦', title: 'Packaged with Care', desc: 'Your order is wrapped in tissue, sealed, and packed to arrive in perfect condition — every single time.' },
                { icon: '💬', title: 'Backed by Real Support', desc: 'A real person answers your WhatsApp — not a chatbot. We\'re here for personalised advice, live product videos, and more.' },
              ].map((p) => (
                <div key={p.title} className="flex gap-4 items-start bg-white/5 rounded-2xl p-4">
                  <span className="text-2xl flex-shrink-0">{p.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{p.title}</h3>
                    <p className="text-white/50 text-xs leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-[#f5f5f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="section-heading">What Our Customers Say</h2>
            <div className="divider-gold mx-auto" />
            <p className="text-[#1a1a2e]/50 text-sm mt-2">Real reviews from real customers across India</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                name: 'Priya Reddy',
                location: 'Hyderabad',
                product: 'Kanjivaram Silk Saree',
                text: 'The Kanjivaram saree I ordered was absolutely stunning. The zari work is exquisite and the silk quality is exactly as described. Delivery was within 4 days. Will definitely order again!',
                rating: 5,
              },
              {
                name: 'Anjali Sharma',
                location: 'Bangalore',
                product: 'Bridal Lehenga — Scarlet Red',
                text: 'Ordered the bridal lehenga for my sister\'s wedding — the quality far exceeded our expectations. The embroidery is gorgeous, the blouse fitting was perfect, and the packaging was beautiful. Highly recommend!',
                rating: 5,
              },
              {
                name: 'Meera Nair',
                location: 'Chennai',
                product: 'Organza Saree — Dusty Rose',
                text: 'Best place to shop for ethnic wear online. The saree colours in person are even better than the photos. The organza quality is premium. Easy returns policy is a big bonus.',
                rating: 5,
              },
              {
                name: 'Deepika Venkat',
                location: 'Hyderabad',
                product: 'Lucknowi Chikankari Kurti',
                text: 'The Chikankari kurti is absolutely divine. The embroidery is so delicate and intricate — I kept getting compliments at the office all day. The cotton is super soft and breathable. Love it!',
                rating: 5,
              },
              {
                name: 'Sunita Agarwal',
                location: 'Pune',
                product: 'Kurta Set with Dupatta',
                text: 'Ordered the mustard yellow kurta set for Diwali and it arrived in 5 days — perfectly in time! The three pieces fit together so beautifully. Got so many compliments. Will be back for sure.',
                rating: 5,
              },
              {
                name: 'Ramya Krishnaswamy',
                location: 'Coimbatore',
                product: 'Cotton Handloom Saree',
                text: 'I love supporting handloom weavers and this saree is a perfect example of why. The quality is exceptional, the colour is exactly as shown, and delivery was fast. Srinidhi Boutique has earned a loyal customer!',
                rating: 5,
              },
              {
                name: 'Nandini Kulkarni',
                location: 'Mumbai',
                product: 'Temple Jewellery Set',
                text: 'The temple jewellery set is absolutely gorgeous! The finish is high quality and it pairs beautifully with my Kanjivaram saree. WhatsApp support team was very helpful in helping me choose the right set.',
                rating: 5,
              },
              {
                name: 'Lakshmi Prasad',
                location: 'Vijayawada',
                product: 'Patola Silk Saree',
                text: 'The Patola saree is a masterpiece. I was nervous ordering something this expensive online but the team sent me a video before shipping and it was exactly what I hoped for. Worth every rupee!',
                rating: 5,
              },
              {
                name: 'Kavitha Mohan',
                location: 'Mysore',
                product: 'Indo-Western Lehenga',
                text: 'Wore the sage green indo-western lehenga to my cousin\'s sangeet and felt like a star! The asymmetric hem is so unique and the embroidery is beautiful. Multiple people asked where I bought it!',
                rating: 5,
              },
              {
                name: 'Pooja Iyer',
                location: 'Hyderabad',
                product: 'Mirror Work Kurti — Teal',
                text: 'The mirror work kurti is everything! Wore it to Navratri Garba and it literally sparkled on the dance floor. The cotton fabric kept me cool all evening. Fast delivery and lovely packaging too!',
                rating: 5,
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-card"
              >
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="text-[#c5a55a] text-sm">★</span>
                  ))}
                </div>
                <p className="text-[#c5a55a] text-xs font-medium mb-2 uppercase tracking-wide">{t.product}</p>
                <p className="text-[#1a1a2e]/80 text-sm leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a2e]">{t.name}</p>
                  <p className="text-xs text-[#1a1a2e]/50">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSignup />

      {/* Instagram Social Proof */}
      <section className="bg-[#1a1a2e] py-14 text-center">
        <p className="text-[#c5a55a] uppercase tracking-[0.3em] text-xs mb-2 font-medium">
          Follow Our Story
        </p>
        <h2 className="font-serif text-3xl text-white mb-4 font-bold">@srinidhiboutique</h2>
        <p className="text-white/50 text-sm mb-6">Tag us in your photos to be featured</p>
        <a
          href="https://instagram.com/srinidhiboutique"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 text-[#c5a55a] px-8 py-3 rounded-full text-xs tracking-widest hover:bg-white/20 transition-all"
        >
          FOLLOW ON INSTAGRAM
        </a>
      </section>
    </div>
  );
}
