import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Cart - Srinidhi Boutique',
  description: 'Review items in your cart and proceed to checkout.',
  robots: { index: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
