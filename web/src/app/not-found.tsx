import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-[#f5f5f0]">
      {/* Glass card container */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl shadow-card px-10 py-12 max-w-md w-full">
        <p className="font-serif text-8xl text-[#c5a55a]/30 font-bold leading-none mb-4">404</p>
        <h1 className="font-serif text-2xl md:text-3xl text-[#1a1a2e] mb-3">Page Not Found</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>

        {/* Search bar */}
        <form action="/search" method="get" className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              name="q"
              placeholder="Search sarees, kurtis..."
              className="flex-1 bg-white/70 border border-white/40 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#c5a55a] focus:ring-1 focus:ring-[#c5a55a]/20 placeholder-gray-400"
            />
            <button
              type="submit"
              className="bg-[#1a1a2e] text-[#c5a55a] px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-[#2d2d4e] transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary px-8 py-3 tracking-widest text-sm">
            GO HOME
          </Link>
          <Link href="/shop" className="btn-outline px-8 py-3 tracking-widest text-sm">
            BROWSE SHOP
          </Link>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-400">
        Popular:{' '}
        {['Sarees', 'Kurtis', 'Lehengas'].map((cat, i) => (
          <span key={cat}>
            {i > 0 && ' · '}
            <Link href={`/category/${cat.toLowerCase()}`} className="text-[#c5a55a] hover:underline">
              {cat}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
