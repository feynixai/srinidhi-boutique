import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offers & Deals - Srinidhi Boutique',
  description: 'Discover exclusive deals, flash sales, and special offers on premium ethnic wear at Srinidhi Boutique.',
  alternates: { canonical: '/offers' },
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
