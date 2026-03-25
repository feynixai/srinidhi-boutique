import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search — Srinidhi Boutique',
  description: 'Search sarees, kurtis, lehengas and more at Srinidhi Boutique. Find the perfect ethnic wear for any occasion.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
