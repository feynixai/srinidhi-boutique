import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — Srinidhi Boutique',
  description: 'Get in touch with Srinidhi Boutique. Reach us via WhatsApp, email, or visit our store in Hyderabad.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
