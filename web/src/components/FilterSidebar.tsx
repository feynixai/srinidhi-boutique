'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const OCCASIONS = ['wedding', 'festival', 'casual', 'party'];
const FABRICS = ['Silk', 'Cotton', 'Georgette', 'Chiffon', 'Linen', 'Rayon', 'Velvet', 'Net'];
const COLOR_MAP: Record<string, string> = {
  Red: '#DC2626',
  Blue: '#2563EB',
  Green: '#16A34A',
  Pink: '#EC4899',
  Yellow: '#EAB308',
  Orange: '#EA580C',
  Purple: '#9333EA',
  White: '#F9FAFB',
  Black: '#111827',
  Gold: '#D97706',
  Maroon: '#991B1B',
  Ivory: '#FFFFF0',
};

function FilterContent({ onClose }: { onClose?: () => void }) {
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

  return (
    <div className="space-y-6">
      {onClose && (
        <div className="flex items-center justify-between pb-2 border-b">
          <h3 className="font-serif text-xl">Filters</h3>
          <button onClick={onClose} className="p-1 hover:text-[#c5a55a]">
            <FiX size={20} />
          </button>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasFilters && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">Active Filters</h3>
            <button
              onClick={() => router.push('/shop')}
              className="text-xs text-[#c5a55a] hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => updateParam(f.key, null)}
                className="flex items-center gap-1 bg-rose-gold/10 text-[#c5a55a] text-xs px-2.5 py-1 rounded-full hover:bg-rose-gold/20 transition-colors"
              >
                {f.label} <FiX size={10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-serif text-base mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value || null)}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-rose-gold"
          />
          <span className="text-gray-600">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value || null)}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-rose-gold"
          />
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="font-serif text-base mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => updateParam('size', activeSize === size ? null : size)}
              className={`px-3 py-1.5 text-xs border rounded-full transition-all ${
                activeSize === size
                  ? 'border-[#c5a55a] bg-[#c5a55a] text-[#1a1a2e] font-semibold'
                  : 'border-white/50 bg-white/60 hover:border-[#c5a55a] text-[#1a1a2e]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="font-serif text-base mb-3">Color</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COLOR_MAP).map(([name, hex]) => (
            <button
              key={name}
              onClick={() => updateParam('color', activeColor === name ? null : name)}
              title={name}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                activeColor === name ? 'border-[#c5a55a] scale-110 shadow-sm' : 'border-white/50 hover:border-[#6b7280]'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        {activeColor && (
          <p className="text-xs text-charcoal/60 mt-1.5 capitalize">{activeColor} selected</p>
        )}
      </div>

      {/* Fabric */}
      <div>
        <h3 className="font-serif text-base mb-3">Fabric</h3>
        <select
          value={activeFabric || ''}
          onChange={(e) => updateParam('fabric', e.target.value || null)}
          className="w-full bg-white/70 border border-white/50 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-[#c5a55a]"
        >
          <option value="">All Fabrics</option>
          {FABRICS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Occasion */}
      <div>
        <h3 className="font-serif text-base mb-3">Occasion</h3>
        <div className="space-y-2">
          {OCCASIONS.map((occ) => (
            <label key={occ} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={activeOccasion === occ}
                onChange={() => updateParam('occasion', activeOccasion === occ ? null : occ)}
                className="accent-[#c5a55a]"
              />
              <span className="text-sm capitalize group-hover:text-[#c5a55a] transition-colors">
                {occ}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FilterSidebar() {
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filterCount = ['size', 'occasion', 'color', 'fabric', 'minPrice', 'maxPrice'].filter(
    (k) => searchParams.get(k)
  ).length;

  return (
    <>
      {/* Mobile/Tablet floating filter pill — visible below lg */}
      <div className="lg:hidden fixed bottom-[76px] left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 bg-[#1a1a2e]/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg transition-all active:scale-95"
        >
          <FiFilter size={14} />
          Filters
          {filterCount > 0 && (
            <span className="bg-[#c5a55a] text-[#1a1a2e] text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile/Tablet Drawer — visible below lg */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 bottom-0 w-80 bg-[#f5f5f0]/95 backdrop-blur-xl border-r border-white/40 shadow-xl p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <FilterContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar — only on lg+ */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <FilterContent />
      </aside>
    </>
  );
}
