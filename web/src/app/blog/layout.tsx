import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Style Blog - Srinidhi Boutique',
  description: 'Fashion tips, styling guides, and ethnic wear inspiration from the Srinidhi Boutique team.',
  alternates: { canonical: '/blog' },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
