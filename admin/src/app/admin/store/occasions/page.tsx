'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiChevronUp, FiChevronDown, FiPlus, FiImage, FiX, FiCheck } from 'react-icons/fi';

interface Occasion {
  slug: string;
  label: string;
  desc: string;
  image: string;
  looks: number;
}

const DEFAULT_OCCASIONS: Occasion[] = [
  { slug: 'wedding', label: 'Wedding', desc: 'Bridal & Festive Looks', image: 'https://picsum.photos/seed/wedding-saree/400/711', looks: 24 },
  { slug: 'festival', label: 'Festival', desc: 'Navratri, Diwali & More', image: 'https://picsum.photos/seed/festival-saree/400/711', looks: 18 },
  { slug: 'office', label: 'Office', desc: 'Elegant Daily Wear', image: 'https://picsum.photos/seed/office-wear/400/711', looks: 15 },
  { slug: 'casual', label: 'Casual', desc: 'Everyday Comfort', image: 'https://picsum.photos/seed/casual-saree/400/711', looks: 12 },
  { slug: 'party', label: 'Party', desc: 'Glamour & Sparkle', image: 'https://picsum.photos/seed/party-saree/400/711', looks: 14 },
  { slug: 'pooja', label: 'Pooja', desc: 'Traditional & Auspicious', image: 'https://picsum.photos/seed/pooja-saree/400/711', looks: 10 },
];

const STORAGE_KEY = 'srinidhi_occasions';

export default function OccasionsManager() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Occasion | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setOccasions(JSON.parse(stored));
      } else {
        setOccasions(DEFAULT_OCCASIONS);
      }
    } catch {
      setOccasions(DEFAULT_OCCASIONS);
    }
    setMounted(true);
  }, []);

  const persist = useCallback((updated: Occasion[]) => {
    setOccasions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const moveOccasion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= occasions.length) return;
    const updated = [...occasions];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    persist(updated);
  };

  const deleteOccasion = (slug: string) => {
    persist(occasions.filter(o => o.slug !== slug));
  };

  const startEdit = (occasion: Occasion) => {
    setEditingSlug(occasion.slug);
    setEditForm({ ...occasion });
  };

  const cancelEdit = () => {
    setEditingSlug(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm || !editingSlug) return;
    persist(occasions.map(o => o.slug === editingSlug ? editForm : o));
    setEditingSlug(null);
    setEditForm(null);
  };

  const addOccasion = () => {
    const newOccasion: Occasion = {
      slug: `occasion-${Date.now()}`,
      label: 'New Occasion',
      desc: 'Description here',
      image: 'https://picsum.photos/seed/new-occasion/400/711',
      looks: 0,
    };
    const updated = [...occasions, newOccasion];
    persist(updated);
    startEdit(newOccasion);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c5a55a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Shop by <span className="text-[#c5a55a]">Occasion</span>
        </h1>
        <p className="text-white/50 mt-1 text-sm">Manage occasion categories shown on the homepage</p>
      </div>

      {/* Info Banner */}
      <div className="bg-[#c5a55a]/10 border border-[#c5a55a]/30 rounded-2xl p-4 flex items-start gap-3">
        <FiImage className="text-[#c5a55a] mt-0.5 flex-shrink-0" size={18} />
        <p className="text-[#c5a55a]/90 text-sm">
          Changes are saved locally. Deploy the backend to sync with the live store.
        </p>
      </div>

      {/* Occasions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {occasions.map((occasion, index) => (
          <div
            key={occasion.slug}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden transition-all duration-200 hover:border-white/[0.12]"
          >
            {editingSlug === occasion.slug && editForm ? (
              /* Edit Mode */
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">Editing</h3>
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                      <FiX size={14} />
                    </button>
                    <button onClick={saveEdit} className="p-1.5 rounded-lg bg-[#c5a55a]/20 text-[#c5a55a] hover:bg-[#c5a55a]/30 transition-colors">
                      <FiCheck size={14} />
                    </button>
                  </div>
                </div>

                {/* Image Preview */}
                <div className="w-20 h-36 rounded-xl overflow-hidden bg-white/5 border border-white/10 mx-auto">
                  <img src={editForm.image} alt="" className="w-full h-full object-cover" />
                </div>

                <label className="block">
                  <span className="text-white/40 text-xs uppercase tracking-wider mb-1 block">Image URL</span>
                  <input
                    type="text"
                    value={editForm.image}
                    onChange={e => setEditForm({ ...editForm, image: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c5a55a]/50 transition-colors"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-white/40 text-xs uppercase tracking-wider mb-1 block">Label</span>
                    <input
                      type="text"
                      value={editForm.label}
                      onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c5a55a]/50 transition-colors"
                    />
                  </label>
                  <label className="block">
                    <span className="text-white/40 text-xs uppercase tracking-wider mb-1 block">Slug</span>
                    <input
                      type="text"
                      value={editForm.slug}
                      onChange={e => setEditForm({ ...editForm, slug: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c5a55a]/50 transition-colors"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-white/40 text-xs uppercase tracking-wider mb-1 block">Description</span>
                  <input
                    type="text"
                    value={editForm.desc}
                    onChange={e => setEditForm({ ...editForm, desc: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c5a55a]/50 transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-white/40 text-xs uppercase tracking-wider mb-1 block">Looks Count</span>
                  <input
                    type="number"
                    value={editForm.looks}
                    onChange={e => setEditForm({ ...editForm, looks: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#c5a55a]/50 transition-colors"
                  />
                </label>
              </div>
            ) : (
              /* View Mode */
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Thumbnail (9:16) */}
                  <div className="w-16 h-28 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                    <img src={occasion.image} alt={occasion.label} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-base">{occasion.label}</h3>
                    <p className="text-white/50 text-sm mt-0.5">{occasion.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-[#c5a55a]/10 text-[#c5a55a] px-2 py-0.5 rounded-lg">{occasion.looks} looks</span>
                      <span className="text-xs bg-white/5 text-white/30 px-2 py-0.5 rounded-lg font-mono">/{occasion.slug}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => moveOccasion(index, -1)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveOccasion(index, 1)}
                    disabled={index === occasions.length - 1}
                    className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronDown size={14} />
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => startEdit(occasion)}
                    className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-[#c5a55a]/20 hover:text-[#c5a55a] transition-colors"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteOccasion(occasion.slug)}
                    className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Occasion */}
      <button
        onClick={addOccasion}
        className="w-full py-4 rounded-3xl border-2 border-dashed border-white/10 text-white/40 hover:border-[#c5a55a]/30 hover:text-[#c5a55a] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
      >
        <FiPlus size={18} />
        Add New Occasion
      </button>
    </div>
  );
}
