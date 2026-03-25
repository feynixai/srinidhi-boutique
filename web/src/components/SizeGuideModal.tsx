'use client';
import { useState, useCallback } from 'react';
import { FiX } from 'react-icons/fi';
import { SizeGuideContent } from './SizeGuideContent';

export function SizeGuideModal() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-[#c5a55a] underline transition-colors"
      >
        Size Guide
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

          {/* Modal - fullscreen on mobile, centered on desktop */}
          <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:mx-4 bg-[#1a1a2e]/95 backdrop-blur-xl md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
              <h3 className="font-serif text-xl text-white">Size Guide</h3>
              <button
                onClick={close}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <SizeGuideContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
