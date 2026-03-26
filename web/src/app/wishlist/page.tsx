'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useCartStore } from '@/lib/cart-store';
import { addToCart } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { sessionId, itemCount, setItemCount } = useCartStore();

  async function handleAddToCart(productId: string) {
    try {
      await addToCart({ sessionId, productId, quantity: 1 });
      setItemCount(itemCount + 1);
      toast.success('Added to cart!');
    } catch {
      toast.error('Could not add to cart');
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="glass-card p-12">
          <svg className="mx-auto mb-6 w-28 h-28 opacity-80" viewBox="0 0 112 112" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="56" cy="56" r="50" fill="#1a1a2e" fillOpacity="0.04"/>
            <path d="M56 78 C56 78 30 62 30 44 C30 36 36 30 44 30 C49 30 53 33 56 37 C59 33 63 30 68 30 C76 30 82 36 82 44 C82 62 56 78 56 78Z" stroke="#c5a55a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.6"/>
            <path d="M56 70 C56 70 36 57 36 44 C36 39 40 35 44 35 C49 35 52 38 56 42 C60 38 63 35 68 35 C72 35 76 39 76 44 C76 57 56 70 56 70Z" fill="#c5a55a" fillOpacity="0.12"/>
          </svg>
          <h1 className="font-bold text-3xl mb-3 text-[#1a1a2e] tracking-tight">Your Wishlist is Empty</h1>
          <p className="text-[#6b7280] mb-8">Save your favourite pieces here and come back to them anytime.</p>
          <Link href="/shop" className="btn-primary px-8 py-3 inline-block">
            EXPLORE PRODUCTS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-bold text-3xl text-[#1a1a2e] tracking-tight">My Wishlist</h1>
          <p className="text-[#6b7280] text-sm mt-1">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
        </div>
        <button onClick={clearWishlist} className="text-sm text-[#6b7280] hover:text-red-500 transition-colors">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="group relative glass-card-sm overflow-hidden hover:-translate-y-1 transition-all duration-300">
            <button
              onClick={() => removeItem(item.id)}
              className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#6b7280] hover:text-red-500 transition-colors shadow-sm"
            >
              ×
            </button>
            <Link href={`/shop/${item.slug}`}>
              <div className="aspect-[3/4] relative overflow-hidden bg-gray-50 rounded-xl m-2">
                <Image
                  src={item.images?.[0] || `https://picsum.photos/seed/${item.id}/400/533`}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </Link>
            <div className="px-3 pb-3 pt-1">
              <Link href={`/shop/${item.slug}`}>
                <p className="text-sm font-medium line-clamp-2 mb-2 hover:text-[#c5a55a] transition-colors text-[#1a1a2e]">{item.name}</p>
              </Link>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#1a1a2e] text-sm font-bold">
                  ₹{Number(item.price).toLocaleString('en-IN')}
                </span>
                {item.comparePrice && Number(item.comparePrice) > Number(item.price) && (
                  <span className="text-[#6b7280] line-through text-xs">₹{Number(item.comparePrice).toLocaleString('en-IN')}</span>
                )}
              </div>
              <button
                onClick={() => handleAddToCart(item.id)}
                className="w-full btn-primary py-2 text-xs tracking-wider"
              >
                ADD TO CART
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/shop" className="btn-outline px-8 py-3 inline-block text-sm">
          CONTINUE SHOPPING
        </Link>
      </div>
    </div>
  );
}
