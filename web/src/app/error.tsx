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
        <div className="text-5xl mb-4">⚠️</div>
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
      <p className="mt-6 text-xs text-gray-400">
        Need help?{' '}
        <a href="https://wa.me/919999999999" className="text-[#c5a55a] hover:underline">
          WhatsApp us
        </a>
      </p>
    </div>
  );
}
