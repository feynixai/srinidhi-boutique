export default function CheckoutLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 bg-[#f5f5f0]">
      {/* Progress bar skeleton */}
      <div className="flex justify-center mb-10">
        <div className="skeleton h-12 w-72 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="skeleton h-8 w-48" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-12 rounded-2xl" />
          ))}
          <div className="skeleton h-12 rounded-full mt-2" />
        </div>
        <div className="skeleton h-72 rounded-3xl" />
      </div>
    </div>
  );
}
