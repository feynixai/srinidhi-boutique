// Skeleton loader components for all pages

function Pulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="group">
      <Pulse className="aspect-[3/4] w-full rounded-sm mb-3" />
      <Pulse className="h-3 w-2/3 mb-2" />
      <Pulse className="h-4 w-1/2 mb-1" />
      <Pulse className="h-3 w-1/3" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <Pulse className="aspect-[3/4] w-full rounded-sm" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => <Pulse key={i} className="aspect-square rounded-sm" />)}
          </div>
        </div>
        {/* Info */}
        <div className="space-y-4 py-2">
          <Pulse className="h-4 w-24" />
          <Pulse className="h-8 w-3/4" />
          <Pulse className="h-4 w-1/2" />
          <Pulse className="h-6 w-1/3 mt-2" />
          <div className="space-y-2 mt-4">
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-5/6" />
            <Pulse className="h-3 w-4/6" />
          </div>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((i) => <Pulse key={i} className="h-9 w-12 rounded-sm" />)}
          </div>
          <Pulse className="h-12 w-full rounded-sm mt-4" />
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Pulse className="h-8 w-48 mb-6" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-sm">
          <Pulse className="w-20 h-24 flex-shrink-0 rounded-sm" />
          <div className="flex-1 space-y-2">
            <Pulse className="h-4 w-3/4" />
            <Pulse className="h-3 w-1/2" />
            <Pulse className="h-3 w-1/4" />
            <Pulse className="h-8 w-24 mt-2" />
          </div>
          <Pulse className="h-5 w-16 flex-shrink-0" />
        </div>
      ))}
      <div className="bg-warm-white p-5 rounded-sm space-y-3">
        <Pulse className="h-5 w-32 mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-16" />
          </div>
        ))}
        <Pulse className="h-12 w-full rounded-sm mt-4" />
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-5 border border-gray-100 space-y-2">
            <Pulse className="h-3 w-24" />
            <Pulse className="h-8 w-20" />
            <Pulse className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Recent orders */}
      <div className="bg-white rounded-lg border border-gray-100 p-5 space-y-4">
        <Pulse className="h-5 w-36 mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
            <div className="space-y-1">
              <Pulse className="h-4 w-24" />
              <Pulse className="h-3 w-32" />
            </div>
            <Pulse className="h-6 w-16 rounded-full" />
            <Pulse className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-100 rounded-sm p-5 space-y-3">
          <div className="flex justify-between">
            <Pulse className="h-5 w-28" />
            <Pulse className="h-5 w-20 rounded-full" />
          </div>
          <Pulse className="h-3 w-48" />
          <div className="flex gap-3">
            {[1, 2].map((j) => (
              <div key={j} className="flex gap-2 items-center">
                <Pulse className="w-12 h-12 rounded-sm" />
                <Pulse className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-50">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
