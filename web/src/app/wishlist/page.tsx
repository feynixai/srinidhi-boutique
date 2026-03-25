'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlistStore } from '@/lib/wishlist-store';
import { useCartStore } from '@/lib/cart-store';
import { addToCart } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { sessionId, setItemCount } = useCartStore();

  async function handleAddToCart(productId: string) {
    try {
      await addToCart({ sessionId, productId, quantity: 1 });
      setItemCount((prev) => prev + 1);
      toast.success('Added to cart!');
    } catch {
      toast.error('Could not add to cart');
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">♡</div>
        <h1 className="font-serif text-3xl mb-3">Your Wishlist is Empty</h1>
        <p className="text-gray-500 mb-8">Save your favourite pieces here and come back to them anytime.</p>
        <Link href="/shop" className="btn-primary px-8 py-3 inline-block">
          BROWSE COLLECTION
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl">My Wishlist</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
        </div>
        <button onClick={clearWishlist} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="group relative bg-white border border-gray-100 rounded-sm overflow-hidden">
            <button
              onClick={() => removeItem(item.id)}
              className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow"
            >
              ×
            </button>
            <Link href={`/shop/${item.slug}`}>
              <div className="aspect-[3/4] relative overflow-hidden bg-gray-50">
                <Image
                  src={item.images?.[0] || `https://picsum.photos/seed/${item.id}/400/533`}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </Link>
            <div className="p-3">
              <Link href={`/shop/${item.slug}`}>
                <p className="text-sm font-medium line-clamp-2 mb-1 hover:text-rose-gold transition-colors">{item.name}</p>
              </Link>
              <p className="text-rose-gold font-semibold text-sm mb-2">
                ₹{Number(item.price).toLocaleString('en-IN')}
                {item.comparePrice && Number(item.comparePrice) > Number(item.price) && (
                  <span className="text-gray-400 line-through text-xs ml-1">₹{Number(item.comparePrice).toLocaleString('en-IN')}</span>
                )}
              </p>
              <button
                onClick={() => handleAddToCart(item.id)}
                className="w-full bg-charcoal text-white text-xs py-2 hover:bg-rose-gold transition-colors"
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
