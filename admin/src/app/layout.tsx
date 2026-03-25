import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Srinidhi Boutique — Admin',
  description: 'Admin dashboard for Srinidhi Boutique',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f5f5f0]">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-4 md:p-8">
              {children}
            </main>
          </div>
          <Toaster position="top-right" toastOptions={{ style: { fontSize: '16px' } }} />
        </Providers>
      </body>
    </html>
  );
}
