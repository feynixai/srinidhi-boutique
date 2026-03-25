'use client';
import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-[#f5f5f0]">
      <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-card px-10 py-12 max-w-md w-full">
        <div className="text-amber-500 flex justify-center mb-4"><svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg></div>
        <h1 className="font-serif text-2xl md:text-3xl text-[#1a1a2e] mb-3">Something Went Wrong</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          We ran into an unexpected error. Please try again, or contact us if the problem persists.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary px-8 py-3 tracking-widest text-sm"
          >
            TRY AGAIN
          </button>
          <Link href="/" className="btn-outline px-8 py-3 tracking-widest text-sm">
            GO HOME
          </Link>
        </div>
      </div>
      <p className="mt-6 text-xs text-gray-600">
        Need help?{' '}
        <a href="https://wa.me/919999999999" className="text-[#c5a55a] hover:underline">
          WhatsApp us
        </a>
      </p>
    </div>
  );
}
