import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { BackToTop } from '@/components/BackToTop';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CompareBar } from '@/components/CompareBar';
import { PageTransition } from '@/components/PageTransition';
import { CookieConsent } from '@/components/CookieConsent';
import { Toaster } from 'react-hot-toast';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Srinidhi Boutique — Premium Women\'s Ethnic Fashion, Hyderabad',
  description: 'Discover premium sarees, kurtis, lehengas and more. Handpicked Indian ethnic wear from Hyderabad. Free shipping on orders above ₹999.',
  keywords: 'sarees, kurtis, lehengas, women ethnic fashion, Hyderabad boutique, Indian ethnic wear, festival collection',
  manifest: '/manifest.json',
  themeColor: '#1a1a2e',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://srinidhiboutique.com'),
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Srinidhi Boutique — Premium Women\'s Ethnic Fashion, Hyderabad',
    description: 'Discover premium sarees, kurtis, lehengas and more. Handpicked Indian ethnic wear from Hyderabad. Free shipping on orders above ₹999.',
    siteName: 'Srinidhi Boutique',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Srinidhi Boutique — Premium Women\'s Ethnic Fashion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Srinidhi Boutique — Premium Women\'s Ethnic Fashion',
    description: 'Discover premium sarees, kurtis, lehengas and more. Handpicked Indian ethnic wear from Hyderabad.',
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Srinidhi" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f5f5f0] pb-16 md:pb-0">
        <Providers>
          {/* Skip to main content — accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[#1a1a2e] focus:text-[#c5a55a] focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-semibold"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton />
          <BackToTop />
          <MobileBottomNav />
          <CompareBar />
          <CookieConsent />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: { fontFamily: 'var(--font-inter)', fontSize: '14px' },
              success: { iconTheme: { primary: '#c5a55a', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
