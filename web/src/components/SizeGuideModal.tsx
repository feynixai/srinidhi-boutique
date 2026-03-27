'use client';
import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { SizeGuideContent } from './SizeGuideContent';

interface SizeGuideModalProps {
  productName?: string;
  productUrl?: string;
}

export function SizeGuideModal({ productName, productUrl }: SizeGuideModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = '';
  }, []);

  const openModal = useCallback(() => {
    setOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  // Build WhatsApp message with product context
  const waNumber = '919849067035';
  const waMsg = productName
    ? `Hi! I need help with sizing for "${productName}".${productUrl ? `\n${productUrl}` : ''}\nCan you help me choose the right size?`
    : 'Hi! I need help with sizing. Can you guide me?';
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openModal(); }}
        className="text-xs text-[#c5a55a] hover:text-[#1a1a2e] underline underline-offset-2 transition-colors font-medium"
      >
        Size Guide
      </button>

      {open && mounted && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
          onClick={close}
        >
          {/* Backdrop */}
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)' }} />

          {/* Full-screen sheet on mobile, centered modal on desktop */}
          <div
            className="md:flex md:items-center md:justify-center"
            style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
          >
            <div
              className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:mx-4 md:rounded-3xl bg-[#f5f5f0] shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0 bg-white/60">
                <h3 className="font-serif text-xl text-[#1a1a2e]">Size Guide</h3>
                <button
                  onClick={close}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#1a1a2e]/60 hover:text-[#1a1a2e]"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Product context banner */}
              {productName && (
                <div className="px-5 py-2.5 bg-[#c5a55a]/10 border-b border-[#c5a55a]/15 flex-shrink-0">
                  <p className="text-xs text-[#c5a55a]">
                    Sizing help for: <span className="font-semibold text-[#1a1a2e]">{productName}</span>
                  </p>
                </div>
              )}

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                <SizeGuideContent whatsappLink={waLink} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
