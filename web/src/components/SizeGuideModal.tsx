'use client';
import { useState } from 'react';
import { FiX } from 'react-icons/fi';

const SIZE_CHART = [
  { size: 'XS', chest: '32"', waist: '26"', hip: '36"' },
  { size: 'S',  chest: '34"', waist: '28"', hip: '38"' },
  { size: 'M',  chest: '36"', waist: '30"', hip: '40"' },
  { size: 'L',  chest: '38"', waist: '32"', hip: '42"' },
  { size: 'XL', chest: '40"', waist: '34"', hip: '44"' },
  { size: 'XXL',chest: '42"', waist: '36"', hip: '46"' },
];

export function SizeGuideModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-rose-gold underline transition-colors"
      >
        Size Guide
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-sm shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl">Size Guide</h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:text-rose-gold transition-colors">
                <FiX size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Measurements are in inches. For best fit, measure at the fullest point.</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-warm-white">
                  <th className="border border-gray-100 px-3 py-2 text-left font-medium">Size</th>
                  <th className="border border-gray-100 px-3 py-2 text-left font-medium">Chest</th>
                  <th className="border border-gray-100 px-3 py-2 text-left font-medium">Waist</th>
                  <th className="border border-gray-100 px-3 py-2 text-left font-medium">Hip</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_CHART.map((row) => (
                  <tr key={row.size} className="hover:bg-warm-white transition-colors">
                    <td className="border border-gray-100 px-3 py-2 font-semibold text-rose-gold">{row.size}</td>
                    <td className="border border-gray-100 px-3 py-2">{row.chest}</td>
                    <td className="border border-gray-100 px-3 py-2">{row.waist}</td>
                    <td className="border border-gray-100 px-3 py-2">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-4">
              Tip: If you are between sizes, choose the larger size for comfort.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
