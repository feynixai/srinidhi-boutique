export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 bg-[#f5f5f0]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-8 w-32" />
      </div>

      {/* Filter chips skeleton */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        {[80, 96, 72, 88, 64].map((w, i) => (
          <div key={i} className="skeleton h-9 rounded-full flex-shrink-0" style={{ width: w }} />
        ))}
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-3xl overflow-hidden">
            <div className="skeleton aspect-[3/4]" style={{ borderRadius: 0 }} />
            <div className="p-3 space-y-2">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-7 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
