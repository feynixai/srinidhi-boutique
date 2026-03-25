import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-white">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: { fontFamily: 'var(--font-inter)', fontSize: '14px' },
              success: { iconTheme: { primary: '#8B1A4A', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
