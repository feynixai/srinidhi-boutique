'use client';
import Image from 'next/image';
import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { FiShare2, FiHeart, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getProduct, addToCart } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { ProductReviews } from '@/components/ProductReviews';

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

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const { sessionId, itemCount, setItemCount, openCart } = useCartStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug),
  });

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

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <p className="text-xs text-charcoal/40 tracking-wide">
          Home &nbsp;/&nbsp; {product.category?.name || 'Shop'} &nbsp;/&nbsp;
          <span className="text-charcoal/70">{product.name}</span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">

          {/* Image Gallery — thumbnails left, main image right */}
          <div className="flex gap-3">
            {/* Thumbnail column */}
            {product.images.length > 1 && (
              <div className="flex flex-col gap-2 w-[72px] flex-shrink-0">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-[72px] h-[88px] border-2 overflow-hidden transition-all ${
                      selectedImage === i
                        ? 'border-rose-gold shadow-md'
                        : 'border-transparent hover:border-gold/50'
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="72px" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 relative">
              <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                {product.images[selectedImage] && (
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                )}
                {discountPct && (
                  <span className="absolute top-3 left-3 bg-rose-gold text-white text-xs px-3 py-1 font-semibold tracking-wide">
                    {discountPct}% OFF
                  </span>
                )}
                {product.featured && (
                  <span className="absolute top-3 right-3 bg-gold text-charcoal text-xs px-3 py-1 font-semibold tracking-wide">
                    FEATURED
                  </span>
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
                  onClick={() => { setWishlisted(!wishlisted); toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist!'); }}
                  className={`border p-4 transition-colors ${wishlisted ? 'border-rose-gold text-rose-gold bg-rose-gold/5' : 'border-gray-200 text-charcoal/40 hover:border-rose-gold hover:text-rose-gold'}`}
                  aria-label="Add to wishlist"
                >
                  <FiHeart size={18} fill={wishlisted ? '#8B1A4A' : 'none'} />
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

            {/* Delivery Info */}
            <div className="bg-cream p-4 space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-charcoal/70"><span className="text-emerald font-bold">✓</span> Free shipping on orders above ₹999</p>
              <p className="flex items-center gap-2 text-charcoal/70"><span className="text-emerald font-bold">✓</span> Easy 7-day returns & exchanges</p>
              <p className="flex items-center gap-2 text-charcoal/70"><span className="text-emerald font-bold">✓</span> Secure payment — UPI, Cards & COD</p>
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
                </div>
              </Accordion>
            </div>

            {/* Share */}
            <button
              onClick={() => {
                navigator.share?.({ title: product.name, url: window.location.href })
                  || navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copied!'));
              }}
              className="flex items-center gap-1.5 text-sm text-charcoal/40 hover:text-rose-gold transition-colors"
            >
              <FiShare2 size={14} /> Share this product
            </button>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </div>
  );
}
