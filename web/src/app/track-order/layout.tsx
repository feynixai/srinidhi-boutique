import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order — Srinidhi Boutique',
  description: 'Track the status of your Srinidhi Boutique order using your order number and phone number.',
  alternates: { canonical: '/track-order' },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
