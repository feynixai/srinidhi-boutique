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
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      {/* Glass pill container with proper spacing from edge */}
      <div className="mx-3 mb-1 bg-white/80 backdrop-blur-xl border border-white/40 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map(({ href, label, Icon }) => {
            const isCart = href === '/cart';
            const isWishlist = href === '/wishlist';
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            const badge = isCart ? itemCount : isWishlist ? wishlistItems.length : 0;

            const content = (
              <>
                <span className="relative">
                  <Icon
                    size={18}
                    className={isActive ? 'text-[#1a1a2e]' : 'text-[#1a1a2e]/40'}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#c5a55a] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                <span className={`text-[9px] font-semibold tracking-wide ${isActive ? 'text-[#1a1a2e]' : 'text-[#1a1a2e]/40'}`}>
                  {label}
                </span>
              </>
            );

            const className = `flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1.5 px-2 rounded-full transition-all ${
              isActive ? 'bg-[#1a1a2e]/5' : ''
            }`;

            // Bottom nav cart goes to full cart page, header cart icon opens sidebar
            if (isCart) {
              return (
                <Link key={href} href="/cart" className={className} aria-label="Cart">
                  {content}
                </Link>
              );
            }

            return (
              <Link key={href} href={href} className={className} aria-label={label}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
