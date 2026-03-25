'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiShoppingBag, FiMenu, FiX, FiHeart, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { getCart } from '@/lib/api';

const megaMenu = [
  {
    label: 'Sarees',
    href: '/category/sarees',
    highlight: false,
    columns: [
      {
        heading: 'By Fabric',
        links: [
          { label: 'Silk Sarees', href: '/shop?category=sarees&fabric=silk' },
          { label: 'Cotton Sarees', href: '/shop?category=sarees&fabric=cotton' },
          { label: 'Georgette Sarees', href: '/shop?category=sarees&fabric=georgette' },
          { label: 'Chiffon Sarees', href: '/shop?category=sarees&fabric=chiffon' },
          { label: 'Linen Sarees', href: '/shop?category=sarees&fabric=linen' },
        ],
      },
      {
        heading: 'By Occasion',
        links: [
          { label: 'Wedding Sarees', href: '/shop?category=sarees&occasion=wedding' },
          { label: 'Festival Sarees', href: '/shop?category=sarees&occasion=festival' },
          { label: 'Party Wear', href: '/shop?category=sarees&occasion=party' },
          { label: 'Casual Sarees', href: '/shop?category=sarees&occasion=casual' },
          { label: 'Office Wear', href: '/shop?category=sarees&occasion=office' },
        ],
      },
    ],
  },
  {
    label: 'Kurtis',
    href: '/category/kurtis',
    highlight: false,
    columns: [
      {
        heading: 'Styles',
        links: [
          { label: 'Anarkali Kurtis', href: '/shop?category=kurtis&style=anarkali' },
          { label: 'Straight Kurtis', href: '/shop?category=kurtis&style=straight' },
          { label: 'A-Line Kurtis', href: '/shop?category=kurtis&style=a-line' },
          { label: 'Palazzo Sets', href: '/shop?category=kurtis&style=palazzo' },
        ],
      },
      {
        heading: 'Occasion',
        links: [
          { label: 'Casual Kurtis', href: '/shop?category=kurtis&occasion=casual' },
          { label: 'Party Kurtis', href: '/shop?category=kurtis&occasion=party' },
          { label: 'Festival Kurtis', href: '/shop?category=kurtis&occasion=festival' },
          { label: 'Office Kurtis', href: '/shop?category=kurtis&occasion=office' },
        ],
      },
    ],
  },
  {
    label: 'Lehengas',
    href: '/category/lehengas',
    highlight: false,
    columns: [
      {
        heading: 'Collections',
        links: [
          { label: 'Bridal Lehengas', href: '/shop?category=lehengas&occasion=bridal' },
          { label: 'Reception Lehengas', href: '/shop?category=lehengas&occasion=reception' },
          { label: 'Festival Lehengas', href: '/shop?category=lehengas&occasion=festival' },
          { label: 'Party Lehengas', href: '/shop?category=lehengas&occasion=party' },
        ],
      },
    ],
  },
  {
    label: 'Blouses',
    href: '/category/blouses',
    highlight: false,
    columns: [
      {
        heading: 'Types',
        links: [
          { label: 'Designer Blouses', href: '/shop?category=blouses' },
          { label: 'Ready-to-wear', href: '/shop?category=blouses&type=readymade' },
          { label: 'Embroidered', href: '/shop?category=blouses&style=embroidered' },
          { label: 'Plain Blouses', href: '/shop?category=blouses&style=plain' },
        ],
      },
    ],
  },
  {
    label: 'Accessories',
    href: '/category/accessories',
    highlight: false,
    columns: [
      {
        heading: 'Shop By',
        links: [
          { label: 'Dupattas', href: '/shop?category=accessories&type=dupatta' },
          { label: 'Jewellery', href: '/shop?category=accessories&type=jewellery' },
          { label: 'Bangles', href: '/shop?category=accessories&type=bangles' },
          { label: 'Clutches', href: '/shop?category=accessories&type=clutch' },
        ],
      },
    ],
  },
  { label: 'Offers', href: '/offers', highlight: true, columns: [] },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { sessionId, itemCount, setItemCount, toggleCart } = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const menuRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function handleMouseEnter(label: string) {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setActiveMenu(label);
  }

  function handleMouseLeave() {
    leaveTimer.current = setTimeout(() => setActiveMenu(null), 150);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.08)]' : 'border-b border-gray-100'
        }`}
      >
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

            {/* Desktop Mega Menu */}
            <nav className="hidden md:flex items-center space-x-6 mx-8" ref={menuRef}>
              {megaMenu.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.columns.length > 0 && handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-0.5 text-sm tracking-wide font-medium transition-colors pb-0.5 ${
                      item.highlight
                        ? 'text-rose-gold border-b border-rose-gold'
                        : 'text-charcoal/80 hover:text-rose-gold border-b border-transparent hover:border-gold'
                    }`}
                  >
                    {item.label}
                    {item.columns.length > 0 && (
                      <FiChevronDown
                        size={12}
                        className={`ml-0.5 transition-transform duration-200 ${activeMenu === item.label ? 'rotate-180' : ''}`}
                      />
                    )}
                  </Link>

                  {/* Mega dropdown */}
                  {item.columns.length > 0 && activeMenu === item.label && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-100 shadow-2xl rounded-sm z-50 min-w-[400px] animate-fade-in"
                      onMouseEnter={() => handleMouseEnter(item.label)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="p-6 grid gap-8" style={{ gridTemplateColumns: `repeat(${item.columns.length}, 1fr)` }}>
                        {item.columns.map((col) => (
                          <div key={col.heading}>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rose-gold mb-3">{col.heading}</p>
                            <ul className="space-y-2">
                              {col.links.map((link) => (
                                <li key={link.label}>
                                  <Link
                                    href={link.href}
                                    className="text-sm text-charcoal/70 hover:text-rose-gold transition-colors flex items-center gap-1 group"
                                    onClick={() => setActiveMenu(null)}
                                  >
                                    <FiChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gold" />
                                    {link.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-50 px-6 py-3 bg-cream/50">
                        <Link
                          href={item.href}
                          className="text-xs text-rose-gold font-medium tracking-wide hover:underline"
                          onClick={() => setActiveMenu(null)}
                        >
                          View All {item.label} →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              <Link href="/search" className="p-2 text-charcoal/70 hover:text-rose-gold transition-colors" aria-label="Search">
                <FiSearch size={20} />
              </Link>
              <Link href="/wishlist" className="relative p-2 text-charcoal/70 hover:text-rose-gold transition-colors" aria-label="Wishlist">
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
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-2">
              {megaMenu.map((item) => (
                <div key={item.label}>
                  {item.columns.length > 0 ? (
                    <>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                        className={`w-full flex items-center justify-between py-3.5 text-base font-medium tracking-wide border-b border-gray-50 ${
                          item.highlight ? 'text-rose-gold' : 'text-charcoal'
                        }`}
                      >
                        {item.label}
                        <FiChevronDown
                          size={16}
                          className={`transition-transform duration-200 text-gold ${mobileExpanded === item.label ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {mobileExpanded === item.label && (
                        <div className="pl-4 pb-2 animate-fade-in">
                          {item.columns.map((col) => (
                            <div key={col.heading} className="mb-3">
                              <p className="text-xs text-rose-gold font-semibold uppercase tracking-wider mb-1.5">{col.heading}</p>
                              {col.links.map((link) => (
                                <Link
                                  key={link.label}
                                  href={link.href}
                                  className="block py-1.5 text-sm text-charcoal/70 hover:text-rose-gold"
                                  onClick={() => setMobileOpen(false)}
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          ))}
                          <Link
                            href={item.href}
                            className="block py-2 text-sm font-medium text-rose-gold"
                            onClick={() => setMobileOpen(false)}
                          >
                            View All {item.label} →
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={`block py-3.5 text-base font-medium tracking-wide border-b border-gray-50 ${
                        item.highlight ? 'text-rose-gold' : 'text-charcoal hover:text-rose-gold'
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <Link href="/orders" className="block py-3.5 text-base font-medium text-charcoal hover:text-rose-gold border-b border-gray-50" onClick={() => setMobileOpen(false)}>My Orders</Link>
              <Link href="/wishlist" className="block py-3.5 text-base font-medium text-charcoal hover:text-rose-gold border-b border-gray-50" onClick={() => setMobileOpen(false)}>Wishlist</Link>
              <Link href="/blog" className="block py-3.5 text-base font-medium text-charcoal hover:text-rose-gold" onClick={() => setMobileOpen(false)}>Blog</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
