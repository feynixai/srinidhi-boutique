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
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="font-serif text-3xl text-charcoal mb-3">Something went wrong</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        We ran into an unexpected error. Please try again, or contact us if the problem persists.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
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
  );
}
