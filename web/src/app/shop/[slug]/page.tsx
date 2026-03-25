'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, use, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { FiShare2, FiHeart, FiChevronDown, FiChevronUp, FiCopy } from 'react-icons/fi';
import { getProduct, addToCart, getProducts } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { ProductReviews } from '@/components/ProductReviews';
import { ProductCard } from '@/components/ProductCard';
import { ProductQA } from '@/components/ProductQA';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-semibold tracking-wider uppercase text-charcoal">{title}</span>
        {open ? <FiChevronUp size={16} className="text-gold" /> : <FiChevronDown size={16} className="text-charcoal/40" />}
      </button>
      {open && <div className="pb-4 text-sm text-charcoal/60 leading-relaxed">{children}</div>}
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
    <div className="bg-cream p-4">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-charcoal/60">Check Delivery</p>
      <div className="flex gap-2">
        <input
          value={pincode}
          onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setResult(null); }}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          placeholder="Enter pincode"
          maxLength={6}
          className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-rose-gold bg-white"
        />
        <button onClick={check} disabled={loading || pincode.length < 6} className="btn-outline px-3 py-2 text-xs disabled:opacity-50">
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
    <div className="bg-blue-50 border border-blue-100 p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-blue-700">EMI Options Available</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { months: 3, emi: emi3, label: 'No Cost' },
          { months: 6, emi: emi6, label: 'Low Cost' },
          { months: 12, emi: emi12, label: 'Flexible' },
        ].map((opt) => (
          <div key={opt.months} className="bg-white rounded p-2 border border-blue-100">
            <p className="font-bold text-blue-800">₹{opt.emi.toLocaleString('en-IN')}</p>
            <p className="text-xs text-blue-600">{opt.months} months</p>
            <p className="text-xs text-green-600 font-medium">{opt.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-blue-500 mt-2">Via credit/debit cards & Razorpay at checkout</p>
    </div>
  );
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
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
            {[1, 2, 3].map((i) => <div key={i} className="w-16 h-20 bg-cream animate-pulse" />)}
          </div>
          <div className="flex-1 aspect-[3/4] bg-cream animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-cream animate-pulse w-1/3" />
          <div className="h-8 bg-cream animate-pulse w-3/4" />
          <div className="h-6 bg-cream animate-pulse w-1/4" />
          <div className="h-32 bg-cream animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20 text-charcoal/40 font-serif text-xl">Product not found</div>
  );

  const discountPct = product.onOffer && product.offerPercent
    ? product.offerPercent
    : product.comparePrice
    ? Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)
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
    <div className="bg-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <p className="text-xs text-charcoal/40 tracking-wide">
          <Link href="/" className="hover:text-rose-gold">Home</Link>
          &nbsp;/&nbsp;
          {product.category && (
            <><Link href={`/category/${product.category.slug}`} className="hover:text-rose-gold">{product.category.name}</Link>&nbsp;/&nbsp;</>
          )}
          <span className="text-charcoal/70">{product.name}</span>
        </p>
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
                    className={`relative w-[72px] h-[88px] border-2 overflow-hidden transition-all ${
                      selectedImage === i ? 'border-rose-gold shadow-md' : 'border-transparent hover:border-gold/50'
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="72px" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 relative">
              <div
                className="relative aspect-[3/4] overflow-hidden bg-cream cursor-zoom-in"
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
                  <span className="absolute top-3 left-3 bg-rose-gold text-white text-xs px-3 py-1 font-semibold tracking-wide z-10">
                    {discountPct}% OFF
                  </span>
                )}
                {product.featured && (
                  <span className="absolute top-3 right-3 bg-gold text-charcoal text-xs px-3 py-1 font-semibold tracking-wide z-10">
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

          {/* Product Info */}
          <div className="space-y-5">
            {product.category && (
              <p className="text-xs text-rose-gold uppercase tracking-[0.2em] font-semibold">{product.category.name}</p>
            )}
            <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl leading-tight text-charcoal">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-charcoal">₹{Number(product.price).toLocaleString('en-IN')}</span>
              {product.comparePrice && (
                <span className="text-lg text-charcoal/40 line-through">
                  ₹{Number(product.comparePrice).toLocaleString('en-IN')}
                </span>
              )}
              {discountPct && (
                <span className="bg-emerald/10 text-emerald font-semibold text-sm px-2 py-0.5">{discountPct}% off</span>
              )}
            </div>

            {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
              <p className="text-green-600 text-sm font-medium">
                You save ₹{(Number(product.comparePrice) - Number(product.price)).toLocaleString('en-IN')}!
              </p>
            )}

            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-orange-500 text-sm font-medium">
                Only {product.stock} left in stock — order soon!
              </p>
            )}

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] font-semibold text-charcoal/60 mb-3">
                  Colour: {selectedColor && <span className="text-charcoal normal-case tracking-normal font-normal">{selectedColor}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-sm border transition-all ${
                        selectedColor === color
                          ? 'border-rose-gold bg-rose-gold text-white'
                          : 'border-gray-200 hover:border-rose-gold text-charcoal'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-[0.15em] font-semibold text-charcoal/60">
                    Size: {selectedSize && <span className="text-charcoal normal-case tracking-normal font-normal">{selectedSize}</span>}
                  </p>
                  <SizeGuideModal />
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-[48px] px-3 border text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'border-rose-gold bg-rose-gold text-white'
                          : 'border-gray-200 hover:border-rose-gold text-charcoal'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
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
                  className={`border p-4 transition-colors ${inWishlist(product.id) ? 'border-rose-gold text-rose-gold bg-rose-gold/5' : 'border-gray-200 text-charcoal/40 hover:border-rose-gold hover:text-rose-gold'}`}
                  aria-label="Add to wishlist"
                >
                  <FiHeart size={18} fill={inWishlist(product.id) ? '#8B1A4A' : 'none'} />
                </button>
              </div>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 bg-green-500 text-white py-4 text-sm font-semibold tracking-wider hover:bg-green-600 transition-colors"
              >
                <FaWhatsapp size={20} />
                Order via WhatsApp
              </a>
            </div>

            {/* Pincode Checker */}
            <PincodeChecker />

            {/* EMI Calculator */}
            <EMICalculator price={Number(product.price)} />

            {/* Trust Badges */}
            <div className="bg-cream p-4 space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-charcoal/70"><span className="text-emerald font-bold">✓</span> Free shipping on orders above ₹999</p>
              <p className="flex items-center gap-2 text-charcoal/70"><span className="text-emerald font-bold">✓</span> Easy 7-day returns & exchanges</p>
              <p className="flex items-center gap-2 text-charcoal/70"><span className="text-emerald font-bold">✓</span> Secure payment — UPI, Cards & COD</p>
              <p className="flex items-center gap-2 text-charcoal/70"><span className="text-emerald font-bold">✓</span> Genuine products, curated in Hyderabad</p>
            </div>

            {/* Accordions */}
            <div>
              <Accordion title="Description">
                <p>{product.description || 'Beautiful handpicked piece from our curated collection.'}</p>
              </Accordion>
              <Accordion title="Fabric & Care">
                <div className="space-y-2">
                  {product.fabric && <p><strong>Fabric:</strong> {product.fabric}</p>}
                  {product.occasion.length > 0 && <p><strong>Occasion:</strong> {product.occasion.map((o) => o.charAt(0).toUpperCase() + o.slice(1)).join(', ')}</p>}
                  <p>Dry clean recommended. Store in a cool, dry place.</p>
                </div>
              </Accordion>
              <Accordion title="Shipping & Returns">
                <div className="space-y-2">
                  <p>Orders are processed within 1–2 business days.</p>
                  <p>Standard delivery: 4–7 business days across India.</p>
                  <p>Free returns within 7 days of delivery.</p>
                  <Link href="/shipping" className="text-rose-gold hover:underline text-xs">Check delivery to your pincode →</Link>
                </div>
              </Accordion>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-charcoal/40 uppercase tracking-wider">Share:</span>
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
                className="flex items-center gap-1.5 text-xs text-charcoal/40 hover:text-rose-gold transition-colors ml-1"
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

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="font-serif text-2xl mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
