export default function CheckoutLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="h-9 w-48 bg-gray-100 animate-pulse rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
        <div className="h-72 bg-gray-100 animate-pulse rounded" />
      </div>
    </div>
  );
}
