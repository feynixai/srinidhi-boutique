'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiChevronUp, FiChevronDown, FiPlus, FiImage, FiX, FiCheck } from 'react-icons/fi';

interface HeroSlide {
  id: number;
  tag: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  cta: { label: string; href: string };
  ctaSecondary: { label: string; href: string };
  image: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  { id: 1, tag: 'New Collection · Festival 2026', title: 'New Festival', titleHighlight: 'Collection', subtitle: 'Handpicked sarees, lehengas & kurtis crafted for the modern Indian woman.', cta: { label: 'SHOP COLLECTION', href: '/shop' }, ctaSecondary: { label: 'VIEW OFFERS', href: '/offers' }, image: 'https://picsum.photos/seed/ethnic-hero/1600/1000' },
  { id: 2, tag: 'Exclusive · New Arrivals', title: 'Fresh', titleHighlight: 'Arrivals', subtitle: 'Discover the latest additions - pure silk sarees, printed kurtis, and bridal lehengas.', cta: { label: 'SHOP NEW IN', href: '/shop?sort=newest' }, ctaSecondary: { label: 'SAREES', href: '/category/sarees' }, image: 'https://picsum.photos/seed/new-arrivals/1600/1000' },
  { id: 3, tag: 'Limited Time · Mega Sale', title: 'Flat 30%', titleHighlight: 'OFF', subtitle: 'Selected sarees, kurtis & lehengas. Use code FESTIVAL30 at checkout.', cta: { label: 'SHOP OFFERS', href: '/offers' }, ctaSecondary: { label: 'KURTIS', href: '/category/kurtis' }, image: 'https://picsum.photos/seed/sale-banner/1600/1000' },
  { id: 4, tag: 'Pan India · Fast Delivery', title: 'Free Shipping', titleHighlight: 'Above ₹999', subtitle: 'Order now and get your outfit delivered in 3-5 business days. Easy returns.', cta: { label: 'SHOP NOW', href: '/shop' }, ctaSecondary: { label: 'LEHENGAS', href: '/category/lehengas' }, image: 'https://picsum.photos/seed/shipping-banner/1600/1000' },
];

const STORAGE_KEY = 'srinidhi_hero_slides';

export default function HeroSlidesManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<HeroSlide | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setSlides(stored ? JSON.parse(stored) : DEFAULT_SLIDES);
    } catch {
      setSlides(DEFAULT_SLIDES);
    }
    setMounted(true);
  }, []);

  const persist = useCallback((updated: HeroSlide[]) => {
    setSlides(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const updated = [...slides];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    persist(updated);
  };

  const deleteSlide = (id: number) => persist(slides.filter(s => s.id !== id));

  const startEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setEditForm({ ...slide, cta: { ...slide.cta }, ctaSecondary: { ...slide.ctaSecondary } });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const saveEdit = () => {
    if (!editForm) return;
    persist(slides.map(s => s.id === editForm.id ? editForm : s));
    cancelEdit();
  };

  const addSlide = () => {
    const newId = slides.length > 0 ? Math.max(...slides.map(s => s.id)) + 1 : 1;
    const newSlide: HeroSlide = {
      id: newId, tag: 'New Tag', title: 'New', titleHighlight: 'Slide',
      subtitle: 'Enter a description for this slide.',
      cta: { label: 'SHOP NOW', href: '/shop' }, ctaSecondary: { label: 'LEARN MORE', href: '/' },
      image: 'https://picsum.photos/seed/new-slide/1600/1000',
    };
    persist([...slides, newSlide]);
    startEdit(newSlide);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c5a55a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[#1a1a2e] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a55a]/30 focus:border-[#c5a55a] transition-all";
  const labelClass = "text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e]">
          Hero <span className="text-[#c5a55a]">Slides</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Manage your homepage carousel slides</p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <FiImage className="text-[#c5a55a] mt-0.5 flex-shrink-0" size={18} />
        <p className="text-amber-800 text-sm">
          Changes are saved locally. Deploy the backend to sync with the live store.
        </p>
      </div>

      {/* Slides List */}
      <div className="space-y-4">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
          >
            {editingId === slide.id && editForm ? (
              /* Edit Mode */
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[#1a1a2e] font-semibold text-sm">Editing Slide #{slide.id}</h3>
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                      <FiX size={16} />
                    </button>
                    <button onClick={saveEdit} className="p-2 rounded-xl bg-[#c5a55a]/10 text-[#c5a55a] hover:bg-[#c5a55a]/20 transition-colors">
                      <FiCheck size={16} />
                    </button>
                  </div>
                </div>

                {/* Image Preview */}
                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={editForm.image} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block col-span-1 sm:col-span-2">
                    <span className={labelClass}>Image URL</span>
                    <input type="text" value={editForm.image} onChange={e => setEditForm({ ...editForm, image: e.target.value })} className={inputClass} />
                  </label>
                  <label className="block col-span-1 sm:col-span-2">
                    <span className={labelClass}>Tag</span>
                    <input type="text" value={editForm.tag} onChange={e => setEditForm({ ...editForm, tag: e.target.value })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Title</span>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Title Highlight</span>
                    <input type="text" value={editForm.titleHighlight} onChange={e => setEditForm({ ...editForm, titleHighlight: e.target.value })} className={inputClass} />
                  </label>
                  <label className="block col-span-1 sm:col-span-2">
                    <span className={labelClass}>Subtitle</span>
                    <textarea value={editForm.subtitle} onChange={e => setEditForm({ ...editForm, subtitle: e.target.value })} rows={2} className={inputClass + ' resize-none'} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>CTA Label</span>
                    <input type="text" value={editForm.cta.label} onChange={e => setEditForm({ ...editForm, cta: { ...editForm.cta, label: e.target.value } })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>CTA Link</span>
                    <input type="text" value={editForm.cta.href} onChange={e => setEditForm({ ...editForm, cta: { ...editForm.cta, href: e.target.value } })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Secondary CTA Label</span>
                    <input type="text" value={editForm.ctaSecondary.label} onChange={e => setEditForm({ ...editForm, ctaSecondary: { ...editForm.ctaSecondary, label: e.target.value } })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Secondary CTA Link</span>
                    <input type="text" value={editForm.ctaSecondary.href} onChange={e => setEditForm({ ...editForm, ctaSecondary: { ...editForm.ctaSecondary, href: e.target.value } })} className={inputClass} />
                  </label>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="flex flex-col sm:flex-row">
                {/* Image Preview */}
                <div className="sm:w-72 flex-shrink-0">
                  <div className="aspect-video sm:aspect-auto sm:h-full bg-gray-100">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <span className="text-[#c5a55a] text-xs uppercase tracking-wider font-medium">{slide.tag}</span>
                    <h3 className="text-[#1a1a2e] font-bold text-lg mt-1 truncate">
                      {slide.title} <span className="text-[#c5a55a]">{slide.titleHighlight}</span>
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{slide.subtitle}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-[#c5a55a]/10 text-[#c5a55a] px-2.5 py-1 rounded-full font-medium">{slide.cta.label}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{slide.ctaSecondary.label}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => moveSlide(index, -1)} disabled={index === 0}
                      className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#1a1a2e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <FiChevronUp size={16} />
                    </button>
                    <button onClick={() => moveSlide(index, 1)} disabled={index === slides.length - 1}
                      className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#1a1a2e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <FiChevronDown size={16} />
                    </button>
                    <div className="flex-1" />
                    <button onClick={() => startEdit(slide)}
                      className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#c5a55a]/10 hover:text-[#c5a55a] transition-colors">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => deleteSlide(slide.id)}
                      className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Slide */}
      <button onClick={addSlide}
        className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#c5a55a] hover:text-[#c5a55a] transition-colors flex items-center justify-center gap-2 text-sm font-medium">
        <FiPlus size={18} />
        Add New Slide
      </button>
    </div>
  );
}
