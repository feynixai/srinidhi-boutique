import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-serif text-rose-gold/30 font-bold mb-2">404</p>
      <h1 className="font-serif text-3xl md:text-4xl text-charcoal mb-3">Page Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/" className="btn-primary px-8 py-3 tracking-widest text-sm">
          GO HOME
        </Link>
        <Link href="/shop" className="btn-outline px-8 py-3 tracking-widest text-sm">
          BROWSE COLLECTION
        </Link>
      </div>
      <p className="mt-12 text-sm text-gray-400">
        Looking for something?{' '}
        <Link href="/search" className="text-rose-gold hover:underline">
          Try Search
        </Link>
      </p>
    </div>
  );
}
