'use client';
import Image from 'next/image';
import { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { FiShare2 } from 'react-icons/fi';
import { getProduct, addToCart } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const { sessionId, itemCount, setItemCount, openCart } = useCartStore();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug),
  });

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-[3/4] bg-gray-100 animate-pulse rounded" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 animate-pulse rounded w-3/4" />
          <div className="h-6 bg-gray-100 animate-pulse rounded w-1/4" />
          <div className="h-32 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20 text-gray-400">Product not found</div>
  );

  const discountPct = product.onOffer && product.offerPercent
    ? product.offerPercent
    : product.comparePrice
    ? Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)
    : null;

  const whatsappMsg = encodeURIComponent(
    `Hi! I'm interested in buying "${product.name}" (₹${Number(product.price).toLocaleString('en-IN')}). Can you help me place an order?`
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 rounded-sm">
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
              <span className="absolute top-3 left-3 bg-rose-gold text-white text-xs px-2 py-1">
                {discountPct}% OFF
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative flex-shrink-0 w-20 h-24 border-2 rounded overflow-hidden transition-colors ${
                    selectedImage === i ? 'border-rose-gold' : 'border-transparent'
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          <div>
            {product.category && (
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">{product.category.name}</p>
            )}
            <h1 className="font-serif text-2xl md:text-3xl leading-tight">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">₹{Number(product.price).toLocaleString('en-IN')}</span>
            {product.comparePrice && (
              <span className="text-gray-400 line-through text-lg">
                ₹{Number(product.comparePrice).toLocaleString('en-IN')}
              </span>
            )}
            {discountPct && (
              <span className="text-green-600 font-medium text-sm">{discountPct}% off</span>
            )}
          </div>

          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-orange-500 text-sm">Only {product.stock} left in stock!</p>
          )}

          {product.sizes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Size: {selectedSize && <span className="text-rose-gold">{selectedSize}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border text-sm transition-colors ${
                      selectedSize === size
                        ? 'border-rose-gold bg-rose-gold text-white'
                        : 'border-gray-300 hover:border-rose-gold'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Color: {selectedColor && <span className="text-rose-gold">{selectedColor}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 border text-sm transition-colors ${
                      selectedColor === color
                        ? 'border-rose-gold text-rose-gold'
                        : 'border-gray-300 hover:border-rose-gold'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
              className="w-full btn-primary py-4 text-sm tracking-widest disabled:opacity-50"
            >
              {product.stock === 0 ? 'OUT OF STOCK' : adding ? 'ADDING...' : 'ADD TO BAG'}
            </button>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border border-green-500 text-green-600 py-4 text-sm hover:bg-green-50 transition-colors"
            >
              <FaWhatsapp size={18} />
              Order via WhatsApp
            </a>
          </div>

          {product.description && (
            <div className="border-t pt-5">
              <h3 className="font-medium mb-2 text-sm uppercase tracking-wider">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          <div className="border-t pt-5 grid grid-cols-2 gap-3 text-sm">
            {product.fabric && (
              <div>
                <span className="text-gray-500">Fabric:</span>{' '}
                <span className="font-medium">{product.fabric}</span>
              </div>
            )}
            {product.occasion.length > 0 && (
              <div>
                <span className="text-gray-500">Occasion:</span>{' '}
                <span className="font-medium capitalize">{product.occasion.join(', ')}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-5 space-y-2 text-sm text-gray-500">
            <p>✓ Free shipping on orders above ₹999</p>
            <p>✓ Easy 7-day returns</p>
            <p>✓ Secure payment — UPI, Cards & COD</p>
          </div>

          <button
            onClick={() => {
              navigator.share?.({ title: product.name, url: window.location.href })
                || navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copied!'));
            }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-gold transition-colors"
          >
            <FiShare2 size={14} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
