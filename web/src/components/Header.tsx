'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiSearch, FiShoppingBag, FiMenu, FiX } from 'react-icons/fi';
import { useCartStore } from '@/lib/cart-store';
import { getCart } from '@/lib/api';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { sessionId, itemCount, setItemCount, toggleCart } = useCartStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
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
    { href: '/shop', label: 'Shop' },
    { href: '/category/sarees', label: 'Sarees' },
    { href: '/category/kurtis', label: 'Kurtis' },
    { href: '/category/lehengas', label: 'Lehengas' },
    { href: '/offers', label: 'Offers' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : 'border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
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
              Srinidhi Boutique
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 mx-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-charcoal hover:text-rose-gold transition-colors tracking-wide font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Link href="/search" className="p-2 text-charcoal hover:text-rose-gold transition-colors" aria-label="Search">
              <FiSearch size={20} />
            </Link>
            <button
              onClick={toggleCart}
              className="p-2 text-charcoal hover:text-rose-gold transition-colors relative"
              aria-label="Cart"
            >
              <FiShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-gold text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-3 text-charcoal hover:text-rose-gold font-medium tracking-wide"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
