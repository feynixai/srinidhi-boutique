export default function CartLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 bg-[#f5f5f0]">
      <div className="skeleton h-9 w-64 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-4">
              <div className="skeleton w-24 h-32 rounded-xl" />
              <div className="flex-1 space-y-3 pt-1">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/4" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="skeleton h-64 rounded-3xl" />
      </div>
    </div>
  );
}
