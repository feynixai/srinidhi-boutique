'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { FiFilter, FiX, FiCheck } from 'react-icons/fi';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const OCCASIONS = ['Wedding', 'Festival', 'Casual', 'Party', 'Office', 'Pooja'];
const FABRICS = ['Silk', 'Cotton', 'Georgette', 'Chiffon', 'Linen', 'Rayon', 'Organza'];
const COLOR_MAP: Record<string, string> = {
  Red: '#DC2626', Blue: '#2563EB', Green: '#16A34A', Pink: '#EC4899',
  Yellow: '#EAB308', Orange: '#EA580C', Purple: '#9333EA', White: '#F9FAFB',
  Black: '#111827', Gold: '#D97706', Maroon: '#991B1B',
};

const PRICE_RANGES = [
  { label: 'Under ₹1,000', min: '', max: '1000' },
  { label: '₹1,000 – ₹3,000', min: '1000', max: '3000' },
  { label: '₹3,000 – ₹10,000', min: '3000', max: '10000' },
  { label: 'Above ₹10,000', min: '10000', max: '' },
];

function FilterContent({ onClose, onApply }: { onClose?: () => void; onApply?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      router.push(`/shop?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => {
    router.push('/shop');
    onApply?.();
  };

  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const activeSize = searchParams.get('size');
  const activeOccasion = searchParams.get('occasion');
  const activeColor = searchParams.get('color');
  const activeFabric = searchParams.get('fabric');

  const activeFilters = [
    minPrice && { key: 'minPrice', label: `Min ₹${minPrice}` },
    maxPrice && { key: 'maxPrice', label: `Max ₹${maxPrice}` },
    activeSize && { key: 'size', label: activeSize },
    activeOccasion && { key: 'occasion', label: activeOccasion },
    activeColor && { key: 'color', label: activeColor },
    activeFabric && { key: 'fabric', label: activeFabric },
  ].filter(Boolean) as { key: string; label: string }[];

  const hasFilters = activeFilters.length > 0;
  const activePriceRange = PRICE_RANGES.find(r => r.min === minPrice && r.max === maxPrice);

  return (
    <div className="space-y-5">
      {/* Header — mobile only */}
      {onClose && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <h3 className="font-serif text-xl text-[#1a1a2e]">Filters</h3>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={clearAll} className="text-xs text-red-500 font-medium px-3 py-1.5 bg-red-50 rounded-full">
                Clear All
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FiX size={20} className="text-[#1a1a2e]" />
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasFilters && (
        <div>
          {!onClose && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active</span>
              <button onClick={clearAll} className="text-xs text-red-500 hover:underline font-medium">Clear all</button>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => updateParam(f.key, null)}
                className="flex items-center gap-1.5 bg-[#c5a55a]/10 text-[#c5a55a] text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#c5a55a]/20 transition-colors"
              >
                {f.label} <FiX size={10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range — pill buttons instead of text inputs */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">Price</h3>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range) => {
            const isActive = activePriceRange === range;
            return (
              <button
                key={range.label}
                onClick={() => {
                  if (isActive) {
                    updateParam('minPrice', null);
                    updateParam('maxPrice', null);
                  } else {
                    const params = new URLSearchParams(searchParams.toString());
                    if (range.min) params.set('minPrice', range.min); else params.delete('minPrice');
                    if (range.max) params.set('maxPrice', range.max); else params.delete('maxPrice');
                    params.delete('page');
                    router.push(`/shop?${params.toString()}`);
                  }
                }}
                className={`px-3 py-2 text-xs rounded-full border transition-all ${
                  isActive
                    ? 'border-[#c5a55a] bg-[#c5a55a] text-[#1a1a2e] font-semibold'
                    : 'border-gray-200 bg-white/70 text-[#1a1a2e]/70 hover:border-[#c5a55a]'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => updateParam('size', activeSize === size ? null : size)}
              className={`px-3.5 py-2 text-xs border rounded-full transition-all ${
                activeSize === size
                  ? 'border-[#c5a55a] bg-[#c5a55a] text-[#1a1a2e] font-semibold'
                  : 'border-gray-200 bg-white/70 text-[#1a1a2e]/70 hover:border-[#c5a55a]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Occasion */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">Occasion</h3>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((occ) => {
            const val = occ.toLowerCase();
            return (
              <button
                key={occ}
                onClick={() => updateParam('occasion', activeOccasion === val ? null : val)}
                className={`px-3.5 py-2 text-xs rounded-full border transition-all flex items-center gap-1.5 ${
                  activeOccasion === val
                    ? 'border-[#c5a55a] bg-[#c5a55a] text-[#1a1a2e] font-semibold'
                    : 'border-gray-200 bg-white/70 text-[#1a1a2e]/70 hover:border-[#c5a55a]'
                }`}
              >
                {activeOccasion === val && <FiCheck size={10} />}
                {occ}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">
          Color {activeColor && <span className="text-[#c5a55a] font-normal capitalize">— {activeColor}</span>}
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(COLOR_MAP).map(([name, hex]) => (
            <button
              key={name}
              onClick={() => updateParam('color', activeColor === name ? null : name)}
              title={name}
              className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                activeColor === name ? 'border-[#c5a55a] scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: hex }}
            >
              {activeColor === name && (
                <FiCheck size={12} className={hex === '#F9FAFB' || hex === '#FFFFF0' ? 'text-gray-800' : 'text-white'} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fabric */}
      <div>
        <h3 className="text-sm font-semibold text-[#1a1a2e] mb-3">Fabric</h3>
        <div className="flex flex-wrap gap-2">
          {FABRICS.map((f) => (
            <button
              key={f}
              onClick={() => updateParam('fabric', activeFabric === f ? null : f)}
              className={`px-3.5 py-2 text-xs rounded-full border transition-all ${
                activeFabric === f
                  ? 'border-[#c5a55a] bg-[#c5a55a] text-[#1a1a2e] font-semibold'
                  : 'border-gray-200 bg-white/70 text-[#1a1a2e]/70 hover:border-[#c5a55a]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Apply button — mobile only */}
      {onClose && (
        <div className="pt-3 border-t border-gray-200 sticky bottom-0 bg-[#f5f5f0]/95 backdrop-blur-xl pb-2">
          <button
            onClick={() => { onApply?.(); onClose(); }}
            className="w-full bg-[#1a1a2e] text-white py-3.5 rounded-full text-sm font-semibold tracking-wide hover:bg-[#2d2d4e] transition-colors"
          >
            Show Results
          </button>
        </div>
      )}
    </div>
  );
}

export function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filterCount = ['size', 'occasion', 'color', 'fabric', 'minPrice', 'maxPrice'].filter(
    (k) => searchParams.get(k)
  ).length;

  // Lock body scroll when filter sheet is open
  useState(() => {
    if (typeof window === 'undefined') return;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  const openSheet = () => {
    setMobileOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeSheet = () => {
    setMobileOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <>
      {/* Mobile/Tablet: Sticky top bar with filter + sort */}
      <div className="lg:hidden sticky top-0 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2.5 bg-[#f5f5f0]/95 backdrop-blur-xl border-b border-gray-200/50">
        <div className="flex items-center gap-2">
          <button
            onClick={openSheet}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
              filterCount > 0
                ? 'bg-[#c5a55a] text-[#1a1a2e] shadow-sm'
                : 'bg-white border border-gray-200 text-[#1a1a2e] shadow-sm'
            }`}
          >
            <FiFilter size={14} />
            Filters
            {filterCount > 0 && (
              <span className="bg-[#1a1a2e] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {filterCount}
              </span>
            )}
          </button>

          {filterCount > 0 && (
            <button
              onClick={() => router.push('/shop')}
              className="px-3 py-2.5 rounded-full text-xs font-medium text-red-500 bg-red-50 border border-red-100 active:scale-95 transition-all"
            >
              Clear ({filterCount})
            </button>
          )}
        </div>
      </div>

      {/* Mobile/Tablet: Full-height bottom sheet */}
      {mobileOpen && (
        <div
          className="lg:hidden"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
          onClick={closeSheet}
        >
          {/* Backdrop */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)' }} />
          
          {/* Bottom sheet — anchored to actual screen bottom */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '85vh',
              zIndex: 10000,
              background: '#f5f5f0',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, background: '#ccc', borderRadius: 4 }} />
            </div>

            {/* Scrollable filter content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
              <FilterContent onClose={closeSheet} onApply={closeSheet} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar — only on lg+ */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <div className="sticky top-4">
          <FilterContent />
        </div>
      </aside>
    </>
  );
}
