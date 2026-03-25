'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  {
    id: 1,
    tag: 'New Collection · Festival 2026',
    title: 'New Festival',
    titleHighlight: 'Collection',
    subtitle: 'Handpicked sarees, lehengas & kurtis crafted for the modern Indian woman.',
    cta: { label: 'SHOP COLLECTION', href: '/shop' },
    ctaSecondary: { label: 'VIEW OFFERS', href: '/offers' },
    image: 'https://picsum.photos/seed/ethnic-hero/1600/1000',
    imageAlt: 'Festival Collection',
  },
  {
    id: 2,
    tag: 'Exclusive · New Arrivals',
    title: 'Fresh',
    titleHighlight: 'Arrivals',
    subtitle: 'Discover the latest additions — pure silk sarees, printed kurtis, and bridal lehengas.',
    cta: { label: 'SHOP NEW IN', href: '/shop?sort=newest' },
    ctaSecondary: { label: 'SAREES', href: '/category/sarees' },
    image: 'https://picsum.photos/seed/new-arrivals/1600/1000',
    imageAlt: 'New Arrivals',
  },
  {
    id: 3,
    tag: 'Limited Time · Mega Sale',
    title: 'Flat 30%',
    titleHighlight: 'OFF',
    subtitle: 'Selected sarees, kurtis & lehengas. Use code FESTIVAL30 at checkout.',
    cta: { label: 'SHOP OFFERS', href: '/offers' },
    ctaSecondary: { label: 'KURTIS', href: '/category/kurtis' },
    image: 'https://picsum.photos/seed/sale-banner/1600/1000',
    imageAlt: 'Sale Offers',
  },
  {
    id: 4,
    tag: 'Pan India · Fast Delivery',
    title: 'Free Shipping',
    titleHighlight: 'Above ₹999',
    subtitle: 'Order now and get your outfit delivered in 3–5 business days. Easy returns.',
    cta: { label: 'SHOP NOW', href: '/shop' },
    ctaSecondary: { label: 'LEHENGAS', href: '/category/lehengas' },
    image: 'https://picsum.photos/seed/shipping-banner/1600/1000',
    imageAlt: 'Free Shipping',
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setTransitioning(false);
    }, 300);
  }, [transitioning]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length);
  }, [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative h-[85vh] min-h-[560px] overflow-hidden bg-[#1a1a2e] md:rounded-3xl md:mx-4 md:mt-4">
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <Image
            src={s.image}
            alt={s.imageAlt}
            fill
            className="object-cover object-top"
            priority={i === 0}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-6 md:px-16 lg:px-24">
        <div
          className="text-white max-w-xl"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'translateY(12px)' : 'translateY(0)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          <p className="text-gold uppercase tracking-[0.25em] text-xs mb-4 font-medium">
            {slide.tag}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-5">
            {slide.title}<br />
            <span className="text-gold italic">{slide.titleHighlight}</span>
          </h1>
          <p className="text-white/75 text-base md:text-lg mb-8 leading-relaxed max-w-sm">
            {slide.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={slide.cta.href}
              className="btn-primary px-8 py-4 text-sm tracking-widest text-center inline-block"
            >
              {slide.cta.label}
            </Link>
            <Link
              href={slide.ctaSecondary.href}
              className="border border-white/60 text-white px-8 py-4 text-sm tracking-widest hover:bg-white/10 transition-colors text-center inline-block rounded-full"
            >
              {slide.ctaSecondary.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
        aria-label="Previous slide"
      >
        &#8592;
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
        aria-label="Next slide"
      >
        &#8594;
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current ? 'w-6 h-2 bg-gold' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-6 right-6 z-20 text-white/50 text-xs tracking-widest">
        {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>
    </section>
  );
}
