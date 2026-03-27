'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  FiGrid,
  FiShoppingBag,
  FiPackage,
  FiTag,
  FiMenu,
  FiX,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiShoppingCart,
  FiRefreshCw,
  FiLogOut,
  FiUploadCloud,
  FiImage,
  FiStar,
  FiChevronDown,
  FiChevronRight,
  FiZap,
  FiList,
  FiLayers,
  FiNavigation,
} from 'react-icons/fi';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  children?: { href: string; label: string; icon: React.ComponentType<{ size?: number }> }[];
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: FiGrid },
  { href: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { href: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: FiShoppingCart },
  { href: '/admin/products', label: 'Products', icon: FiPackage },
  { href: '/admin/products/bulk-upload', label: 'Bulk Upload', icon: FiUploadCloud },
  {
    href: '/admin/store',
    label: 'Store',
    icon: FiImage,
    children: [
      { href: '/admin/store/hero', label: 'Hero Slides', icon: FiImage },
      { href: '/admin/store/hot-collections', label: 'Hot Collections', icon: FiZap },
      { href: '/admin/store/categories', label: 'Categories', icon: FiList },
      { href: '/admin/store/collections', label: 'Collections', icon: FiLayers },
      { href: '/admin/store/occasions', label: 'Occasions', icon: FiStar },
      { href: '/admin/store/navigation', label: 'Navigation', icon: FiNavigation },
    ],
  },
  { href: '/admin/customers', label: 'Customers', icon: FiUsers },
  { href: '/admin/coupons', label: 'Coupons', icon: FiTag },
  { href: '/admin/returns', label: 'Returns', icon: FiRefreshCw },
  { href: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [jwtUser, setJwtUser] = useState<{ name?: string; email?: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    if (!session) {
      try {
        const stored = localStorage.getItem('admin_user');
        if (stored) setJwtUser(JSON.parse(stored));
      } catch { /* empty */ }
    }
  }, [session]);

  // Auto-expand Store section if on a store page
  useEffect(() => {
    if (pathname.startsWith('/admin/store') && !expandedSections.includes('/admin/store')) {
      setExpandedSections((prev) => [...prev, '/admin/store']);
    }
  }, [pathname, expandedSections]);

  function toggleSection(href: string) {
    setExpandedSections((prev) =>
      prev.includes(href) ? prev.filter((s) => s !== href) : [...prev, href]
    );
  }

  function handleSignOut() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    document.cookie = 'admin_token=; path=/; max-age=0';
    if (session) {
      signOut({ callbackUrl: '/login' });
    } else {
      router.push('/login');
    }
  }

  const currentUser = session?.user || jwtUser;

  const NavContent = () => (
    <nav className="p-4 space-y-1 flex flex-col h-full">
      <div className="px-3 py-4 mb-2">
        <h1 className="text-xl font-bold text-[#1a1a2e]">Srinidhi Boutique</h1>
        <p className="text-sm text-gray-400">Admin Panel</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {NAV.map((item) => {
          const { href, label, icon: Icon, children } = item;

          if (children) {
            const isExpanded = expandedSections.includes(href);
            const isChildActive = children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));

            return (
              <div key={href}>
                <button
                  onClick={() => toggleSection(href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-base font-medium transition-all mb-1 ${
                    isChildActive
                      ? 'bg-[#1a1a2e]/10 text-[#1a1a2e]'
                      : 'text-gray-600 hover:bg-white/60 hover:text-[#1a1a2e]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="flex-1 text-left">{label}</span>
                  {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </button>
                {isExpanded && (
                  <div className="ml-4 space-y-0.5 mb-1">
                    {children.map((child) => {
                      const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                            childActive
                              ? 'bg-[#1a1a2e] text-white shadow-[0_4px_12px_rgba(26,26,46,0.3)]'
                              : 'text-gray-500 hover:bg-white/60 hover:text-[#1a1a2e]'
                          }`}
                        >
                          <child.icon size={16} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-full text-base font-medium transition-all mb-1 ${
                active
                  ? 'bg-[#1a1a2e] text-white shadow-[0_4px_12px_rgba(26,26,46,0.3)]'
                  : 'text-gray-600 hover:bg-white/60 hover:text-[#1a1a2e]'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </div>
      {/* User section */}
      {currentUser && (
        <div className="border-t border-black/5 pt-4 mt-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-white/40 rounded-2xl">
            {(session?.user as { image?: string })?.image ? (
              <img src={(session!.user as { image: string }).image} alt="avatar" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center text-white font-bold text-sm">
                {(currentUser.name || currentUser.email || 'A')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a1a2e] truncate">
                {currentUser.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all min-h-0"
              title="Sign out"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-white/30 px-4 py-3 flex items-center justify-between z-40">
        <h1 className="text-lg font-bold text-[#1a1a2e]">Srinidhi Admin</h1>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 hover:bg-white/60 rounded-full transition-all min-h-0"
        >
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#f5f5f0]/95 backdrop-blur-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-64 bg-white/60 backdrop-blur-xl border-r border-white/30 z-30">
        <NavContent />
      </div>

      {/* Mobile top padding */}
      <div className="md:hidden h-14" />
    </>
  );
}
