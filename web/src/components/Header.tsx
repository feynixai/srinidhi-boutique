'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiSearch, FiShoppingBag, FiMenu, FiX, FiHeart } from 'react-icons/fi';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { getCart } from '@/lib/api';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { sessionId, itemCount, setItemCount, toggleCart } = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (sessionId) {
      getCart(sessionId)
        .then((cart) => setItemCount(cart.items.reduce((s, i) => s + i.quantity, 0)))
        .catch(() => {});
    }
  }, [sessionId, setItemCount]);

  const navLinks = [
    { href: '/shop', label: 'All' },
    { href: '/category/sarees', label: 'Sarees' },
    { href: '/category/kurtis', label: 'Kurtis' },
    { href: '/category/lehengas', label: 'Lehengas' },
    { href: '/category/blouses', label: 'Blouses' },
    { href: '/offers', label: 'Offers', highlight: true },
  ];

  return (
    <>
      {/* Top header — brand name + actions */}
      <header
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.08)]' : 'border-b border-gray-100'
        }`}
      >
        {/* Main header row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-charcoal"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex-1 md:flex-none text-center md:text-left">
              <span className="font-serif text-xl md:text-2xl text-charcoal tracking-wide">
                Srinidhi <span className="text-rose-gold">Boutique</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-7 mx-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm tracking-wide font-medium transition-colors pb-0.5 ${
                    link.highlight
                      ? 'text-rose-gold border-b border-rose-gold'
                      : 'text-charcoal/80 hover:text-rose-gold border-b border-transparent hover:border-gold'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              <Link
                href="/search"
                className="p-2 text-charcoal/70 hover:text-rose-gold transition-colors"
                aria-label="Search"
              >
                <FiSearch size={20} />
              </Link>
              <Link
                href="/wishlist"
                className="relative p-2 text-charcoal/70 hover:text-rose-gold transition-colors"
                aria-label="Wishlist"
              >
                <FiHeart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-gold text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>
              <button
                onClick={toggleCart}
                className="p-2 text-charcoal/70 hover:text-rose-gold transition-colors relative"
                aria-label="Cart"
              >
                <FiShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-gold text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">
            <div className="max-w-7xl mx-auto px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block py-3 text-base font-medium tracking-wide border-b border-gray-50 ${
                    link.highlight ? 'text-rose-gold' : 'text-charcoal hover:text-rose-gold'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/orders" className="block py-3 text-base font-medium text-charcoal hover:text-rose-gold border-b border-gray-50" onClick={() => setMobileOpen(false)}>My Orders</Link>
              <Link href="/wishlist" className="block py-3 text-base font-medium text-charcoal hover:text-rose-gold border-b border-gray-50" onClick={() => setMobileOpen(false)}>Wishlist</Link>
              <Link href="/blog" className="block py-3 text-base font-medium text-charcoal hover:text-rose-gold" onClick={() => setMobileOpen(false)}>Blog</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
