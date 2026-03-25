import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedProducts, getBestSellers, getOffers, getCategories } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

async function getData() {
  const [featured, bestSellers, offers, categories] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getBestSellers().catch(() => []),
    getOffers().catch(() => []),
    getCategories().catch(() => []),
  ]);
  return { featured, bestSellers, offers, categories };
}

export default async function HomePage() {
  const { featured, bestSellers, offers, categories } = await getData();

  return (
    <div className="bg-white">
      {/* Announcement Bar */}
      <div className="bg-charcoal text-gold text-center py-2 text-xs tracking-[0.15em] uppercase font-medium">
        Free Shipping Above ₹999 &nbsp;·&nbsp; New Festival Collection Live &nbsp;·&nbsp; Easy 7-Day Returns
      </div>

      {/* Hero Banner */}
      <section className="relative h-[85vh] min-h-[560px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://picsum.photos/seed/ethnic-hero/1600/1000"
            alt="Srinidhi Boutique Festival Collection"
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
        </div>
        <div className="relative h-full flex items-center px-6 md:px-16 lg:px-24">
          <div className="text-white max-w-xl animate-slide-up">
            <p className="text-gold uppercase tracking-[0.25em] text-xs mb-4 font-medium">
              New Collection · Festival 2026
            </p>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-5">
              New Festival<br />
              <span className="text-gold italic">Collection</span>
            </h1>
            <p className="text-white/75 text-base md:text-lg mb-8 leading-relaxed max-w-sm">
              Handpicked sarees, lehengas & kurtis crafted for the modern Indian woman.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/shop"
                className="btn-primary px-8 py-4 text-sm tracking-widest text-center inline-block"
              >
                SHOP COLLECTION
              </Link>
              <Link
                href="/offers"
                className="border border-white/60 text-white px-8 py-4 text-sm tracking-widest hover:bg-white/10 transition-colors text-center inline-block"
              >
                VIEW OFFERS
              </Link>
            </div>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-white/30" />
        </div>
      </section>

      {/* Trust Badges Strip */}
      <div className="bg-cream border-y border-gold/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gold/20">
            {[
              { icon: '🚚', text: 'Free Shipping', sub: 'Above ₹999' },
              { icon: '↩', text: 'Easy Returns', sub: '7-Day Policy' },
              { icon: '🔒', text: 'Secure Payments', sub: 'UPI · Cards · COD' },
              { icon: '💬', text: 'WhatsApp Support', sub: 'Always Available' },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-3 px-4 py-2 first:pl-0 last:pr-0">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-charcoal tracking-wide">{b.text}</p>
                  <p className="text-xs text-charcoal/50">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Grid — 2×3 */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="section-heading">Shop by Category</h2>
            <div className="divider-gold" />
            <p className="text-charcoal/50 text-sm mt-2 tracking-wide">Curated for every occasion</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {categories.slice(0, 6).map((cat, i) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`group relative overflow-hidden bg-gray-100 ${
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
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent group-hover:from-charcoal/80 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-serif text-xl group-hover:text-gold transition-colors">{cat.name}</h3>
                  <p className="text-white/60 text-xs mt-0.5 group-hover:text-gold/80 transition-colors tracking-wide">Explore →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Festival Collection Banner */}
      <section className="relative overflow-hidden bg-charcoal py-16 px-6 text-center">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://picsum.photos/seed/festival-bg/1400/400"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3 font-medium">Exclusive</p>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">
            Festival Ready
          </h2>
          <div className="divider-gold" />
          <p className="text-white/60 mt-4 mb-8 text-base leading-relaxed">
            Navratri · Diwali · Weddings · Sangeet — dress for every celebration.
          </p>
          <Link href="/shop" className="btn-gold px-10 py-4 text-sm tracking-widest inline-block">
            EXPLORE NOW
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-heading">Featured Collection</h2>
                <div className="divider-gold mt-2 mx-0" />
              </div>
              <Link href="/shop?featured=true" className="text-rose-gold text-sm font-medium hover:text-gold transition-colors tracking-wide">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Offers Banner */}
      {offers.length > 0 && (
        <section className="bg-cream py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-6 items-center mb-10">
              <div>
                <p className="text-rose-gold uppercase tracking-[0.2em] text-xs font-semibold mb-2">Limited Time Offer</p>
                <h2 className="section-heading">Sale Now On</h2>
                <div className="divider-gold mt-2 mx-0" />
                <p className="text-charcoal/60 mt-3 text-sm leading-relaxed">
                  Up to 25% off on selected sarees, kurtis & lehengas.
                </p>
              </div>
              <div className="text-center md:text-right">
                <div className="inline-block bg-rose-gold text-white px-6 py-3 font-serif text-3xl italic mb-2">25% OFF</div>
                <p className="text-charcoal/50 text-xs tracking-widest uppercase mt-2">Selected styles only</p>
                <Link href="/offers" className="btn-primary mt-4 inline-block px-8 py-3 text-xs tracking-widest">
                  SHOP OFFERS
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {offers.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="section-heading">Best Sellers</h2>
                <div className="divider-gold mt-2 mx-0" />
                <p className="text-charcoal/50 text-sm mt-1">Most loved by our customers</p>
              </div>
              <Link href="/shop?bestSeller=true" className="text-rose-gold text-sm font-medium hover:text-gold transition-colors tracking-wide">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {bestSellers.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Instagram-style Social Proof */}
      <section className="bg-charcoal py-14 text-center">
        <p className="text-gold uppercase tracking-[0.3em] text-xs mb-2 font-medium">Follow Our Story</p>
        <h2 className="font-serif text-3xl text-white mb-4">@srinidhiboutique</h2>
        <p className="text-white/50 text-sm mb-6">Tag us in your photos to be featured</p>
        <a
          href="https://instagram.com/srinidhiboutique"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block border border-gold text-gold px-8 py-3 text-xs tracking-widest hover:bg-gold hover:text-charcoal transition-colors"
        >
          FOLLOW ON INSTAGRAM
        </a>
      </section>
    </div>
  );
}
