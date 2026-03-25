import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Srinidhi Boutique — Premium Women\'s Fashion, Hyderabad',
  description: 'Discover premium sarees, kurtis, lehengas and more. Elegant women\'s fashion from Hyderabad. Free shipping on orders above ₹999.',
  keywords: 'sarees, kurtis, lehengas, women fashion, Hyderabad boutique, ethnic wear',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: { fontFamily: 'Inter', fontSize: '14px' },
              success: { iconTheme: { primary: '#B76E79', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
