'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiChevronRight } from 'react-icons/fi';

const LABELS: Record<string, string> = {
  admin: 'Dashboard',
  orders: 'Orders',
  products: 'Products',
  customers: 'Customers',
  coupons: 'Coupons',
  collections: 'Collections',
  analytics: 'Analytics',
  reports: 'Reports',
  returns: 'Returns',
  settings: 'Settings',
  qa: 'Q&A',
  new: 'New',
  edit: 'Edit',
};

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs: { label: string; href: string }[] = [];
  let href = '';
  for (const seg of segments) {
    href += `/${seg}`;
    crumbs.push({ label: LABELS[seg] || seg, href });
  }

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-400 mb-6 flex-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <FiChevronRight size={12} className="text-gray-300" />}
            {isLast ? (
              <span className="text-[#1a1a2e] font-semibold">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-[#c5a55a] transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
