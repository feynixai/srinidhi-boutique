'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FiGrid, FiShoppingBag, FiPackage, FiTag, FiMenu, FiX, FiUsers, FiBarChart2, FiSettings } from 'react-icons/fi';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: FiGrid },
  { href: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { href: '/admin/products', label: 'Products', icon: FiPackage },
  { href: '/admin/customers', label: 'Customers', icon: FiUsers },
  { href: '/admin/coupons', label: 'Coupons', icon: FiTag },
  { href: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <nav className="p-4 space-y-2">
      <div className="px-3 py-4 mb-2">
        <h1 className="text-xl font-bold text-charcoal">Srinidhi Boutique</h1>
        <p className="text-sm text-gray-500">Admin Panel</p>
      </div>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium transition-all ${
              active
                ? 'bg-rose-gold text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-40">
        <h1 className="text-lg font-bold">Srinidhi Boutique Admin</h1>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30">
        <NavContent />
      </div>

      {/* Mobile top padding */}
      <div className="md:hidden h-14" />
    </>
  );
}
