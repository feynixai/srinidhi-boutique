export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="h-8 w-48 bg-gray-100 animate-pulse rounded mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] bg-gray-100 animate-pulse rounded-sm" />
            <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-gray-100 animate-pulse rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
