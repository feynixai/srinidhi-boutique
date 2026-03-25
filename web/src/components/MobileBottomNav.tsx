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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14">
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
                className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] relative"
                aria-label="Open cart"
              >
                <span className="relative">
                  <Icon size={22} className="text-charcoal/60" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-gold text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-charcoal/50">{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] relative"
              aria-label={label}
            >
              <span className="relative">
                <Icon
                  size={22}
                  className={isActive ? 'text-rose-gold' : 'text-charcoal/60'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-gold text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] ${isActive ? 'text-rose-gold font-semibold' : 'text-charcoal/50'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
