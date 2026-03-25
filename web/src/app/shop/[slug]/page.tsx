'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, use, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { FiShare2, FiHeart, FiChevronDown, FiChevronUp, FiCopy, FiShoppingBag } from 'react-icons/fi';
import { getProduct, addToCart, getProducts } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { ProductReviews } from '@/components/ProductReviews';
import { ProductCard } from '@/components/ProductCard';
import { ProductQA } from '@/components/ProductQA';
import BackInStockButton from '@/components/BackInStockButton';
import RecentlyViewed from '@/components/RecentlyViewed';

const API_URL_INTERNAL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-white/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-semibold tracking-wider uppercase text-[#1a1a2e]">{title}</span>
        {open ? <FiChevronUp size={16} className="text-[#c5a55a]" /> : <FiChevronDown size={16} className="text-[#1a1a2e]/30" />}
      </button>
      {open && <div className="pb-4 text-sm text-[#1a1a2e]/60 leading-relaxed">{children}</div>}
    </div>
  );
}

function PincodeChecker() {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<{ available: boolean; deliveryDate?: string; deliveryDays?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    if (pincode.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/pincode/${pincode}`);
      setResult(await res.json());
    } catch {
      setResult({ available: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-[#1a1a2e]/60">Check Delivery</p>
      <div className="flex gap-2">
        <input
          value={pincode}
          onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setResult(null); }}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          placeholder="Enter pincode"
          maxLength={6}
          className="flex-1 border border-white/50 bg-white/70 px-4 py-2 rounded-full text-sm focus:outline-none focus:border-[#c5a55a]"
        />
        <button onClick={check} disabled={loading || pincode.length < 6} className="btn-outline px-4 py-2 text-xs disabled:opacity-50">
          {loading ? '...' : 'Check'}
        </button>
      </div>
      {result && (
        <p className={`text-xs mt-2 font-medium ${result.available ? 'text-green-600' : 'text-red-500'}`}>
          {result.available
            ? `Delivers by ${result.deliveryDate} (${result.deliveryDays} days)`
            : 'Delivery not available to this pincode'}
        </p>
      )}
    </div>
  );
}

function EMICalculator({ price }: { price: number }) {
  if (price < 5000) return null;
  const emi3 = Math.ceil(price / 3);
  const emi6 = Math.ceil(price * 1.03 / 6);
  const emi12 = Math.ceil(price * 1.06 / 12);
  return (
    <div className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-[#1a1a2e]/60">EMI Options Available</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { months: 3, emi: emi3, label: 'No Cost' },
          { months: 6, emi: emi6, label: 'Low Cost' },
          { months: 12, emi: emi12, label: 'Flexible' },
        ].map((opt) => (
          <div key={opt.months} className="bg-white/70 rounded-xl p-2 border border-white/50">
            <p className="font-bold text-[#1a1a2e]">₹{opt.emi.toLocaleString('en-IN')}</p>
            <p className="text-xs text-[#6b7280]">{opt.months} months</p>
            <p className="text-xs text-green-600 font-medium">{opt.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#6b7280] mt-2">Via credit/debit cards & Razorpay at checkout</p>
    </div>
  );
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addToCartButtonRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const { sessionId, itemCount, setItemCount, openCart } = useCartStore();
  const { toggle: toggleWishlist, has: inWishlist } = useWishlistStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug),
  });

  const { data: relatedData } = useQuery({
    queryKey: ['related', product?.categoryId],
    queryFn: () => getProducts({ category: product!.category?.slug || '', limit: '5' }),
    enabled: !!product?.category?.slug,
  });

  const { data: alsoBought } = useQuery({
    queryKey: ['also-bought', slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL_INTERNAL}/api/products/${slug}/also-bought`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!product,
  });

  // ESC to close lightbox
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight' && lightboxOpen && product) setSelectedImage((i) => Math.min(i + 1, product.images.length - 1));
      if (e.key === 'ArrowLeft' && lightboxOpen && product) setSelectedImage((i) => Math.max(i - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, product]);

  // Sticky add-to-cart bar: show when main button scrolls off screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (addToCartButtonRef.current) observer.observe(addToCartButtonRef.current);
    return () => observer.disconnect();
  }, [product]);

  // Track recently viewed
  useEffect(() => {
    if (!product) return;
    try {
      const key = 'sb-recently-viewed';
      const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [product.id, ...existing.filter((id) => id !== product.id)].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
  }, [product]);

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex gap-3">
          <div className="w-16 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="w-16 h-20 bg-white/60 animate-pulse rounded-xl" />)}
          </div>
          <div className="flex-1 aspect-[3/4] bg-white/60 animate-pulse rounded-2xl" />
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-white/60 animate-pulse rounded-full w-1/3" />
          <div className="h-8 bg-white/60 animate-pulse rounded-full w-3/4" />
          <div className="h-6 bg-white/60 animate-pulse rounded-full w-1/4" />
          <div className="h-32 bg-white/60 animate-pulse rounded-2xl" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20 text-[#6b7280] text-xl">Product not found</div>
  );

  // Sale price from store-wide sale or product-level offer
  const displayPrice = product.salePrice ?? Number(product.price);
  const originalPrice = Number(product.price);
  const discountPct = product.salePct && product.salePct > 0
    ? product.salePct
    : product.onOffer && product.offerPercent
    ? product.offerPercent
    : product.comparePrice
    ? Math.round(((Number(product.comparePrice) - originalPrice) / Number(product.comparePrice)) * 100)
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} — Premium Indian ethnic wear from Srinidhi Boutique`,
    image: product.images,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'Srinidhi Boutique' },
    offers: {
      '@type': 'Offer',
      price: Number(product.price).toFixed(2),
      priceCurrency: 'INR',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Srinidhi Boutique' },
    },
  };

  const whatsappMsg = encodeURIComponent(
    `Hi! I'm interested in buying "${product.name}" (₹${Number(product.price).toLocaleString('en-IN')})${selectedSize ? `, Size: ${selectedSize}` : ''}${selectedColor ? `, Color: ${selectedColor}` : ''}. Can you help me place an order?`
  );
  const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210').replace('+', '');
  const waLink = `https://wa.me/${waNumber}?text=${whatsappMsg}`;

  async function handleAddToCart() {
    if (product!.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        sessionId,
        productId: product!.id,
        quantity: 1,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
      });
      setItemCount(itemCount + 1);
      openCart();
      toast.success('Added to bag!');
    } catch {
      toast.error('Could not add to bag');
    } finally {
      setAdding(false);
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: product!.name, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copied!'));
    }
  }

  const relatedProducts = (relatedData?.products || []).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="bg-[#f5f5f0]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb — glass pill */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <nav className="inline-flex items-center gap-1.5 bg-white/60 backdrop-blur-xl border border-white/40 px-4 py-2 rounded-full text-xs shadow-sm">
          <Link href="/" className="text-[#1a1a2e]/50 hover:text-[#c5a55a] transition-colors">Home</Link>
          <span className="text-[#1a1a2e]/20">/</span>
          {product.category && (
            <>
              <Link href={`/category/${product.category.slug}`} className="text-[#1a1a2e]/50 hover:text-[#c5a55a] transition-colors">{product.category.name}</Link>
              <span className="text-[#1a1a2e]/20">/</span>
            </>
          )}
          <span className="text-[#1a1a2e]/80 font-medium truncate max-w-[180px]">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">

          {/* Image Gallery */}
          <div className="flex gap-3">
            {product.images.length > 1 && (
              <div className="flex flex-col gap-2 w-[72px] flex-shrink-0">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-[72px] h-[88px] rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-[#c5a55a] shadow-md' : 'border-transparent hover:border-[#c5a55a]/50'
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="72px" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 relative">
              <div
                className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-2xl cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
                onMouseEnter={() => setZoomed(true)}
                onMouseLeave={() => setZoomed(false)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setZoomPos({ x, y });
                }}
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (touchStartX.current === null) return;
                  const diff = touchStartX.current - e.changedTouches[0].clientX;
                  if (Math.abs(diff) > 40) {
                    if (diff > 0) setSelectedImage((i) => Math.min(i + 1, product.images.length - 1));
                    else setSelectedImage((i) => Math.max(i - 1, 0));
                  }
                  touchStartX.current = null;
                }}
              >
                {product.images[selectedImage] && (
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-100"
                    style={zoomed ? {
                      transform: 'scale(2)',
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    } : {}}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                )}
                {discountPct && (
                  <span className="absolute top-3 left-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold tracking-wide z-10">
                    {discountPct}% OFF
                  </span>
                )}
                {product.featured && (
                  <span className="absolute top-3 right-3 bg-[#c5a55a] text-[#1a1a2e] text-xs px-3 py-1 rounded-full font-semibold tracking-wide z-10">
                    FEATURED
                  </span>
                )}
                {/* Mobile swipe indicator */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 md:hidden">
                    {product.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === selectedImage ? 'bg-white w-4' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Info — glass card */}
          <div className="space-y-5 bg-white/50 backdrop-blur-sm border border-white/40 rounded-3xl p-6 shadow-soft">
            {product.category && (
              <p className="text-xs text-[#c5a55a] uppercase tracking-[0.2em] font-semibold">{product.category.name}</p>
            )}
            <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl leading-tight text-[#1a1a2e]">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-blue-500 text-white font-bold text-xl px-4 py-1.5 rounded-full">₹{displayPrice.toLocaleString('en-IN')}</span>
              {(displayPrice < originalPrice || product.comparePrice) && (
                <span className="text-lg text-[#1a1a2e]/40 line-through">
                  ₹{(displayPrice < originalPrice ? originalPrice : Number(product.comparePrice)).toLocaleString('en-IN')}
                </span>
              )}
              {discountPct && (
                <span className="bg-green-100 text-green-700 font-semibold text-sm px-3 py-1 rounded-full">{discountPct}% off</span>
              )}
            </div>

            {displayPrice < originalPrice && (
              <p className="text-green-600 text-sm font-medium">
                You save ₹{(originalPrice - displayPrice).toLocaleString('en-IN')}! {product.salePct ? '(Sale)' : ''}
              </p>
            )}

            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-orange-500 text-sm font-medium bg-orange-50 px-3 py-1.5 rounded-full inline-block">
                Only {product.stock} left — order soon!
              </p>
            )}

            {/* Colors — pill chips */}
            {product.colors.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[#1a1a2e]/60 mb-3">
                  Colour: {selectedColor && <span className="text-[#1a1a2e] normal-case tracking-normal font-normal">{selectedColor}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-sm rounded-full border transition-all ${
                        selectedColor === color
                          ? 'border-[#c5a55a] bg-[#c5a55a] text-[#1a1a2e] font-semibold'
                          : 'border-white/50 bg-white/60 hover:border-[#c5a55a] text-[#1a1a2e]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes — pill chips */}
            {product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[#1a1a2e]/60">
                    Size: {selectedSize && <span className="text-[#1a1a2e] normal-case tracking-normal font-normal">{selectedSize}</span>}
                  </p>
                  <SizeGuideModal />
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-[48px] px-4 rounded-full border text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'border-[#1a1a2e] bg-[#1a1a2e] text-white'
                          : 'border-white/50 bg-white/60 hover:border-[#1a1a2e] text-[#1a1a2e]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2" ref={addToCartButtonRef}>
              {product.stock === 0 && (
                <BackInStockButton productId={product.id} productName={product.name} />
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={adding || product.stock === 0}
                  className="flex-1 btn-primary py-4 text-sm tracking-widest disabled:opacity-50"
                >
                  {product.stock === 0 ? 'OUT OF STOCK' : adding ? 'ADDING...' : 'ADD TO BAG'}
                </button>
                <button
                  onClick={() => {
                    toggleWishlist({ id: product.id, name: product.name, slug: product.slug, price: Number(product.price), comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined, images: product.images });
                    toast(inWishlist(product.id) ? 'Removed from wishlist' : 'Saved to wishlist!');
                  }}
                  className={`p-4 rounded-full border transition-all ${inWishlist(product.id) ? 'border-red-400 text-red-500 bg-red-50' : 'border-white/50 bg-white/60 text-[#1a1a2e]/50 hover:border-red-300 hover:text-red-400'}`}
                  aria-label="Add to wishlist"
                >
                  <FiHeart size={18} fill={inWishlist(product.id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 bg-green-500 text-white py-4 rounded-full text-sm font-semibold tracking-wider hover:bg-green-600 transition-colors"
              >
                <FaWhatsapp size={20} />
                Order via WhatsApp
              </a>
            </div>

            {/* Delivery & Return Mini-cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-3 text-center">
                <p className="text-xl mb-1">🚚</p>
                <p className="text-xs font-semibold text-[#1a1a2e]">Fast Delivery</p>
                <p className="text-[11px] text-[#1a1a2e]/50 mt-0.5">Usually 3–5 business days</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl p-3 text-center">
                <p className="text-xl mb-1">↩️</p>
                <p className="text-xs font-semibold text-[#1a1a2e]">Easy Returns</p>
                <p className="text-[11px] text-[#1a1a2e]/50 mt-0.5">7-day return policy</p>
              </div>
            </div>

            {/* Pincode Checker */}
            <PincodeChecker />

            {/* EMI Calculator */}
            <EMICalculator price={Number(product.price)} />

            {/* Trust Badges — glass list */}
            <div className="bg-white/40 rounded-2xl p-4 space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-[#1a1a2e]/70"><span className="text-green-500 font-bold">✓</span> Free shipping on orders above ₹999</p>
              <p className="flex items-center gap-2 text-[#1a1a2e]/70"><span className="text-green-500 font-bold">✓</span> Easy 7-day returns & exchanges</p>
              <p className="flex items-center gap-2 text-[#1a1a2e]/70"><span className="text-green-500 font-bold">✓</span> Secure payment — UPI, Cards & COD</p>
              <p className="flex items-center gap-2 text-[#1a1a2e]/70"><span className="text-green-500 font-bold">✓</span> Genuine products, curated in Hyderabad</p>
            </div>

            {/* Accordions */}
            <div>
              <Accordion title="Description">
                <p>{product.description || 'Beautiful handpicked piece from our curated collection.'}</p>
              </Accordion>
              <Accordion title="Fabric & Care">
                <div className="space-y-3">
                  {product.fabric && <p><strong>Fabric:</strong> {product.fabric}</p>}
                  {product.occasion.length > 0 && <p><strong>Occasion:</strong> {product.occasion.map((o) => o.charAt(0).toUpperCase() + o.slice(1)).join(', ')}</p>}
                  <div className="flex flex-wrap gap-3 pt-1">
                    {[
                      { icon: '🧺', label: 'Dry Clean' },
                      { icon: '🌡️', label: 'Cool Iron' },
                      { icon: '🚫', label: 'No Bleach' },
                      { icon: '💧', label: 'Hand Wash' },
                    ].map((care) => (
                      <div key={care.label} className="flex items-center gap-1.5 bg-white/60 rounded-full px-3 py-1.5 border border-white/40 text-xs text-[#1a1a2e]/70">
                        <span>{care.icon}</span>
                        <span>{care.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#1a1a2e]/50">Store in a cool, dry place away from direct sunlight.</p>
                </div>
              </Accordion>
              <Accordion title="Shipping & Returns">
                <div className="space-y-2">
                  <p>Orders are processed within 1–2 business days.</p>
                  <p>Standard delivery: 4–7 business days across India.</p>
                  <p>Free returns within 7 days of delivery.</p>
                  <Link href="/shipping" className="text-[#c5a55a] hover:underline text-xs">Check delivery to your pincode →</Link>
                </div>
              </Accordion>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-[#6b7280] uppercase tracking-wider">Share:</span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(product.name + ' — ' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                aria-label="Share on WhatsApp"
              >
                <FaWhatsapp size={14} />
              </a>
              <button
                onClick={handleShare}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Copy link"
              >
                <FiCopy size={12} />
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#c5a55a] transition-colors ml-1"
              >
                <FiShare2 size={12} /> More
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      {/* Q&A Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <ProductQA productId={product.id} />
      </div>

      {/* Customers Also Bought */}
      {alsoBought && alsoBought.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="font-bold text-2xl mb-6 text-[#1a1a2e] tracking-tight">Customers Also Bought</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {alsoBought.map((p: Record<string, unknown>) => <ProductCard key={p.id as string} product={p as unknown as Parameters<typeof ProductCard>[0]['product']} />)}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="font-bold text-2xl mb-6 text-[#1a1a2e] tracking-tight">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      <RecentlyViewed excludeId={product.id} />

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-light leading-none z-10 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"
            aria-label="Close lightbox"
          >
            ×
          </button>
          {product.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.max(i - 1, 0)); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 w-10 h-10 flex items-center justify-center rounded-full text-xl transition-all"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.min(i + 1, product.images.length - 1)); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 w-10 h-10 flex items-center justify-center rounded-full text-xl transition-all"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}
          <div
            className="relative max-h-[90vh] max-w-[90vw] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {product.images[selectedImage] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="object-contain w-full h-full max-h-[90vh]"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === selectedImage ? 'bg-white w-5' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Add-to-Cart Bar — glass effect */}
      {showStickyBar && product.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/85 border-t border-white/40 shadow-[0_-4px_30px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3 md:hidden animate-slide-up">
          {product.images[0] && (
            <div className="relative w-12 h-14 flex-shrink-0 overflow-hidden rounded-xl">
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1a1a2e] truncate">{product.name}</p>
            <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">₹{displayPrice.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-3 rounded-full text-sm font-semibold tracking-wide flex-shrink-0 disabled:opacity-70 hover:bg-[#2d2d4e] transition-colors"
          >
            <FiShoppingBag size={16} />
            {adding ? 'Adding...' : 'Add to Bag'}
          </button>
        </div>
      )}
    </div>
  );
}
