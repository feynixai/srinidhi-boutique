import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wishlist - Srinidhi Boutique',
  description: 'Your saved items at Srinidhi Boutique.',
  robots: { index: false },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
