import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - Srinidhi Boutique',
  description: 'Answers to common questions about orders, shipping, returns, payments, and sizing at Srinidhi Boutique.',
  alternates: { canonical: '/faq' },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
