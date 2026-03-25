'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/lib/wishlist-store';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'wishlist'>('profile');
  const { items: wishlistItems } = useWishlistStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-3xl mb-8">My Account</h1>

      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {([
          { id: 'profile', label: 'Profile' },
          { id: 'orders', label: 'Orders' },
          { id: 'wishlist', label: `Wishlist (${wishlistItems.length})` },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-rose-gold text-rose-gold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-md">
          <div className="bg-warm-white rounded-sm p-6 mb-6">
            <div className="w-16 h-16 bg-rose-gold/20 rounded-full flex items-center justify-center mb-4">
              <span className="font-serif text-2xl text-rose-gold">S</span>
            </div>
            <h2 className="font-semibold text-lg mb-1">Guest Customer</h2>
            <p className="text-gray-500 text-sm">Shopping as guest · No registration required</p>
          </div>

          <div className="space-y-3">
            <Link href="/orders" className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-sm hover:border-rose-gold/30 transition-colors">
              <span className="text-2xl">📦</span>
              <div>
                <p className="font-medium text-sm">My Orders</p>
                <p className="text-xs text-gray-500">Track and view your orders</p>
              </div>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
            <Link href="/wishlist" className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-sm hover:border-rose-gold/30 transition-colors">
              <span className="text-2xl">♡</span>
              <div>
                <p className="font-medium text-sm">Wishlist</p>
                <p className="text-xs text-gray-500">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved</p>
              </div>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
            <Link href="/returns" className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-sm hover:border-rose-gold/30 transition-colors">
              <span className="text-2xl">↩</span>
              <div>
                <p className="font-medium text-sm">Returns & Refunds</p>
                <p className="text-xs text-gray-500">Easy 7-day return policy</p>
              </div>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
            <Link href="/contact" className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-sm hover:border-rose-gold/30 transition-colors">
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-medium text-sm">Help & Support</p>
                <p className="text-xs text-gray-500">WhatsApp or call us</p>
              </div>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="max-w-lg">
          <p className="text-gray-500 text-sm mb-6">Enter your phone number to view your orders.</p>
          <div className="bg-warm-white rounded-sm p-6 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium mb-2">View Your Orders</p>
            <p className="text-gray-500 text-sm mb-4">We use your phone number to find your orders.</p>
            <Link href="/orders" className="btn-primary px-8 py-3 inline-block text-sm">
              GO TO MY ORDERS
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div>
          {wishlistItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">♡</p>
              <p className="text-lg">Your wishlist is empty</p>
              <Link href="/shop" className="btn-primary mt-6 inline-block px-8 py-3 text-sm">
                BROWSE COLLECTION
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} in your wishlist</p>
              <Link href="/wishlist" className="btn-outline px-6 py-2 text-sm inline-block">
                VIEW FULL WISHLIST
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
