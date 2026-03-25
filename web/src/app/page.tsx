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
    <div>
      {/* Hero Banner */}
      <section className="relative h-[70vh] min-h-[500px] bg-warm-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://picsum.photos/seed/hero/1400/900"
            alt="Srinidhi Boutique Collection"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        </div>
        <div className="relative h-full flex items-center px-6 md:px-16">
          <div className="text-white max-w-lg">
            <p className="text-soft-pink uppercase tracking-[0.2em] text-sm mb-3 font-medium">
              New Arrivals 2026
            </p>
            <h1 className="font-serif text-4xl md:text-6xl leading-tight mb-4">
              Elegance,<br />Redefined
            </h1>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Discover handpicked sarees, lehengas & more — crafted for the modern Indian woman.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/shop" className="btn-primary text-center">
                Shop Collection
              </Link>
              <Link href="/offers" className="btn-outline border-white text-white hover:bg-white hover:text-charcoal text-center">
                View Offers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Free shipping banner */}
      <div className="bg-rose-gold text-white text-center py-2.5 text-sm tracking-wide">
        🎁 Free shipping on orders above ₹999 · 7-day easy returns · Secure payments
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="font-serif text-3xl text-center mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.slice(0, 5).map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`}
                className="group relative aspect-square overflow-hidden rounded-sm bg-gray-100">
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                <div className="absolute inset-0 flex items-end p-4">
                  <h3 className="text-white font-serif text-lg">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="bg-warm-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-serif text-3xl">Featured Collection</h2>
              <Link href="/shop?featured=true" className="text-rose-gold text-sm hover:underline">
                View all →
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="bg-charcoal rounded-sm p-8 md:p-12 text-center text-white mb-10">
            <p className="text-soft-pink uppercase tracking-widest text-sm mb-2">Limited Time</p>
            <h2 className="font-serif text-3xl md:text-4xl mb-3">Sale Now On</h2>
            <p className="text-white/70 mb-6">Up to 25% off on selected styles</p>
            <Link href="/offers" className="inline-block bg-rose-gold text-white px-8 py-3 text-sm tracking-wider hover:bg-opacity-90 transition-colors">
              SHOP OFFERS
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {offers.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="bg-warm-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-serif text-3xl">Best Sellers</h2>
                <p className="text-gray-500 text-sm mt-1">Most loved by our customers</p>
              </div>
              <Link href="/shop?bestSeller=true" className="text-rose-gold text-sm hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {bestSellers.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* USP Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹999' },
            { icon: '↩️', title: 'Easy Returns', desc: '7-day hassle-free returns' },
            { icon: '🔒', title: 'Secure Payments', desc: 'UPI, Cards & COD accepted' },
            { icon: '💬', title: 'WhatsApp Support', desc: 'Chat with us anytime' },
          ].map((item) => (
            <div key={item.title} className="p-4">
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
