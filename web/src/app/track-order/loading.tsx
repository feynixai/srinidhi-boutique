export default function TrackOrderLoading() {
  return (
    <div className="bg-white">
      <section className="bg-cream py-16 text-center px-4 border-b border-gold/20">
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mx-auto mb-3" />
        <div className="h-10 w-64 bg-gray-200 animate-pulse rounded mx-auto mb-3" />
      </section>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}
        <div className="h-12 bg-gray-200 animate-pulse rounded" />
      </div>
    </div>
  );
}
