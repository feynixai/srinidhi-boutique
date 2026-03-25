export default function CartLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="h-9 w-64 bg-gray-100 animate-pulse rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-sm">
              <div className="w-24 h-32 bg-gray-100 animate-pulse rounded" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-100 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-gray-100 animate-pulse rounded w-1/4" />
                <div className="h-4 bg-gray-100 animate-pulse rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-64 bg-gray-100 animate-pulse rounded" />
      </div>
    </div>
  );
}
