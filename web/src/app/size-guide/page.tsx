import type { Metadata } from 'next';
import { SizeGuidePageClient } from './SizeGuidePageClient';

export const metadata: Metadata = {
  title: 'Size Guide | Srinidhi Boutique',
  description:
    'Complete size guide for Indian ethnic wear — Sarees, Kurtis, Lehengas, and Blouses. Find your perfect fit with our detailed measurement charts.',
  openGraph: {
    title: 'Size Guide | Srinidhi Boutique',
    description:
      'Complete size guide for Indian ethnic wear — Sarees, Kurtis, Lehengas, and Blouses.',
  },
};

export default function SizeGuidePage() {
  return <SizeGuidePageClient />;
}
