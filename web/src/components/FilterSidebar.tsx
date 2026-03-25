'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const OCCASIONS = ['wedding', 'festival', 'casual', 'party'];
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

export function FilterSidebar() {
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

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block">
      <div className="space-y-6">
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
            <span className="text-gray-400">–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => updateParam('maxPrice', e.target.value || null)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-rose-gold"
            />
          </div>
        </div>

        <div>
          <h3 className="font-serif text-base mb-3">Size</h3>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => updateParam('size', activeSize === size ? null : size)}
                className={`px-3 py-1.5 text-xs border rounded-sm transition-colors ${
                  activeSize === size
                    ? 'border-rose-gold bg-rose-gold text-white'
                    : 'border-gray-200 hover:border-rose-gold'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-serif text-base mb-3">Occasion</h3>
          <div className="space-y-2">
            {OCCASIONS.map((occ) => (
              <label key={occ} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={activeOccasion === occ}
                  onChange={() => updateParam('occasion', activeOccasion === occ ? null : occ)}
                  className="accent-rose-gold"
                />
                <span className="text-sm capitalize group-hover:text-rose-gold transition-colors">
                  {occ}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-serif text-base mb-3">Color</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(COLOR_MAP).map(([name, hex]) => (
              <button
                key={name}
                onClick={() => updateParam('color', activeColor === name ? null : name)}
                title={name}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  activeColor === name ? 'border-rose-gold scale-110' : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>

        {(minPrice || maxPrice || activeSize || activeOccasion || activeColor) && (
          <button
            onClick={() => router.push('/shop')}
            className="text-sm text-rose-gold hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </aside>
  );
}
