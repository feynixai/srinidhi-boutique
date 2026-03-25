'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiGrid, FiShoppingBag, FiHeart, FiUser } from 'react-icons/fi';
import { useCartStore } from '@/lib/cart-store';
import { useWishlistStore } from '@/lib/wishlist-store';

const navItems = [
  { href: '/', label: 'Home', Icon: FiHome },
  { href: '/shop', label: 'Shop', Icon: FiGrid },
  { href: '/cart', label: 'Cart', Icon: FiShoppingBag },
  { href: '/wishlist', label: 'Wishlist', Icon: FiHeart },
  { href: '/account', label: 'Account', Icon: FiUser },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount, openCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  return (
    <nav
      className="fixed bottom-2 left-3 right-3 z-40 md:hidden bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-glass"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map(({ href, label, Icon }) => {
          const isCart = href === '/cart';
          const isWishlist = href === '/wishlist';
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          const badge = isCart ? itemCount : isWishlist ? wishlistItems.length : 0;

          if (isCart) {
            return (
              <button
                key={href}
                onClick={openCart}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1 px-2 rounded-xl transition-all ${
                  isActive ? 'bg-[#1a1a2e]' : ''
                }`}
                aria-label="Open cart"
              >
                <span className="relative">
                  <Icon
                    size={20}
                    className={isActive ? 'text-white' : 'text-[#1a1a2e]/60'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#c5a55a] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-[#1a1a2e]/50'}`}
                >
                  {label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1 px-2 rounded-xl transition-all ${
                isActive ? 'bg-[#1a1a2e]' : ''
              }`}
              aria-label={label}
            >
              <span className="relative">
                <Icon
                  size={20}
                  className={isActive ? 'text-white' : 'text-[#1a1a2e]/60'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#c5a55a] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-[#1a1a2e]/50'}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
