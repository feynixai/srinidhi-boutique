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
          <div className="text-6xl mb-6">♡</div>
          <h1 className="font-bold text-3xl mb-3 text-[#1a1a2e] tracking-tight">Your Wishlist is Empty</h1>
          <p className="text-[#6b7280] mb-8">Save your favourite pieces here and come back to them anytime.</p>
          <Link href="/shop" className="btn-primary px-8 py-3 inline-block">
            BROWSE COLLECTION
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
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
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
