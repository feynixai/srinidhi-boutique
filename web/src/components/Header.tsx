'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiSearch, FiShoppingBag, FiMenu, FiX, FiHeart, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';
import { getCart } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';

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
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
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
      <div className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'px-2 sm:px-4 md:px-6 pt-1' : 'px-2 sm:px-3 md:px-4 pt-1.5 sm:pt-2'}`}>
      <header
        className={`transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/50 rounded-full'
            : 'bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl'
        }`}
      >
        <div className={`max-w-7xl mx-auto transition-all duration-300 ${scrolled ? 'px-2 sm:px-3 md:px-5' : 'px-2 sm:px-4 md:px-6'}`}>
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-12 md:h-14' : 'h-14 sm:h-16 md:h-[72px]'}`}>
            {/* Mobile menu button */}
            <button
              className="md:hidden p-1.5 text-[#1a1a2e] rounded-full hover:bg-white/60 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex-1 md:flex-none text-center md:text-left min-w-0">
              <span className={`font-serif font-bold text-[#1a1a1a] tracking-wide transition-all duration-300 whitespace-nowrap ${scrolled ? 'text-base sm:text-lg md:text-xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
                Srinidhi <span className="text-[#9a7b4f] font-bold">Boutique</span>
              </span>
            </Link>

            {/* Desktop Mega Menu */}
            <nav className={`hidden md:flex items-center mx-8 transition-all duration-300 ${scrolled ? 'space-x-4' : 'space-x-6'}`} ref={menuRef}>
              {megaMenu.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.columns.length > 0 && handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-0.5 text-sm tracking-wide font-medium transition-colors ${
                      item.highlight
                        ? 'text-[#c5a55a] font-semibold'
                        : 'text-[#1a1a2e]/80 hover:text-[#1a1a2e]'
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

                  {/* Glass mega dropdown */}
                  {item.columns.length > 0 && activeMenu === item.label && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white/90 backdrop-blur-xl border border-white/40 shadow-card rounded-2xl z-50 min-w-[400px] animate-fade-in overflow-hidden"
                      onMouseEnter={() => handleMouseEnter(item.label)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="p-6 grid gap-8" style={{ gridTemplateColumns: `repeat(${item.columns.length}, 1fr)` }}>
                        {item.columns.map((col) => (
                          <div key={col.heading}>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c5a55a] mb-3">{col.heading}</p>
                            <ul className="space-y-2">
                              {col.links.map((link) => (
                                <li key={link.label}>
                                  <Link
                                    href={link.href}
                                    className="text-sm text-[#1a1a2e]/70 hover:text-[#1a1a2e] transition-colors flex items-center gap-1 group"
                                    onClick={() => setActiveMenu(null)}
                                  >
                                    <FiChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c5a55a]" />
                                    {link.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-black/5 px-6 py-3 bg-[#f5f5f0]/60">
                        <Link
                          href={item.href}
                          className="text-xs text-[#c5a55a] font-medium tracking-wide hover:underline"
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

            {/* Action icons */}
            <div className={`flex items-center transition-all duration-300 ${scrolled ? 'space-x-0' : 'space-x-0 sm:space-x-1'}`}>
              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                className="hidden md:flex items-center gap-0.5 text-xs font-medium px-2.5 py-1 rounded-full border border-[#c5a55a]/40 text-[#c5a55a] hover:bg-[#c5a55a]/10 transition-all"
                aria-label="Toggle language"
              >
                <span className={lang === 'en' ? 'font-bold' : 'opacity-50'}>EN</span>
                <span className="opacity-30 mx-0.5">|</span>
                <span className={lang === 'hi' ? 'font-bold' : 'opacity-50'}>हिंदी</span>
              </button>
              <Link
                href="/search"
                className="p-1.5 sm:p-2 text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-white/60 rounded-full transition-all"
                aria-label={t.search}
              >
                <FiSearch size={18} className="sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="/wishlist"
                className="relative p-1.5 sm:p-2 text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-white/60 rounded-full transition-all"
                aria-label="Wishlist"
              >
                <FiHeart size={18} className="sm:w-5 sm:h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#c5a55a] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>
              <button
                onClick={toggleCart}
                className="p-1.5 sm:p-2 text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-white/60 rounded-full transition-all relative"
                aria-label="Cart"
              >
                <FiShoppingBag size={18} className="sm:w-5 sm:h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#1a1a2e] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

      </header>
      </div>

      {/* Mobile Nav — Full-screen slide-in drawer (portaled to body) */}
      {mobileOpen && typeof document !== 'undefined' && createPortal(
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer — slides in from left */}
          <div
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: '85vw', maxWidth: 360,
              background: '#f5f5f0', zIndex: 10000,
              boxShadow: '8px 0 32px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50">
              <span className="font-serif text-xl font-bold text-[#1a1a2e]">
                Srinidhi <span className="text-[#c5a55a]">Boutique</span>
              </span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <FiX size={22} className="text-[#1a1a2e]" />
              </button>
            </div>

            {/* Scrollable menu */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {megaMenu.map((item) => (
                <div key={item.label}>
                  {item.columns.length > 0 ? (
                    <>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                        className={`w-full flex items-center justify-between py-3.5 text-base font-medium tracking-wide border-b border-gray-100 ${
                          item.highlight ? 'text-[#c5a55a]' : 'text-[#1a1a2e]'
                        }`}
                      >
                        {item.label}
                        <FiChevronDown
                          size={16}
                          className={`transition-transform duration-200 text-[#c5a55a] ${mobileExpanded === item.label ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {mobileExpanded === item.label && (
                        <div className="pl-4 pb-2">
                          {item.columns.map((col) => (
                            <div key={col.heading} className="mb-3">
                              <p className="text-xs text-[#c5a55a] font-semibold uppercase tracking-wider mb-1.5">{col.heading}</p>
                              {col.links.map((link) => (
                                <Link
                                  key={link.label}
                                  href={link.href}
                                  className="block py-2 text-sm text-[#1a1a2e]/70 hover:text-[#1a1a2e] active:text-[#c5a55a]"
                                  onClick={() => setMobileOpen(false)}
                                >
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          ))}
                          <Link
                            href={item.href}
                            className="block py-2 text-sm font-medium text-[#c5a55a]"
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
                      className={`block py-3.5 text-base font-medium tracking-wide border-b border-gray-100 ${
                        item.highlight ? 'text-[#c5a55a]' : 'text-[#1a1a2e]'
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                <Link href="/orders" className="block py-3 text-base font-medium text-[#1a1a2e]/70" onClick={() => setMobileOpen(false)}>{t.myOrders}</Link>
                <Link href="/wishlist" className="block py-3 text-base font-medium text-[#1a1a2e]/70" onClick={() => setMobileOpen(false)}>{t.wishlist}</Link>
                <Link href="/blog" className="block py-3 text-base font-medium text-[#1a1a2e]/70" onClick={() => setMobileOpen(false)}>{t.blog}</Link>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-200/50">
              <button
                onClick={() => { setLang(lang === 'en' ? 'hi' : 'en'); setMobileOpen(false); }}
                className="flex items-center gap-2 text-sm font-medium text-[#c5a55a]"
              >
                <span className={lang === 'en' ? 'font-bold' : 'opacity-50'}>EN</span>
                <span className="opacity-30">|</span>
                <span className={lang === 'hi' ? 'font-bold' : 'opacity-50'}>हिंदी</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
