'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiChevronUp, FiChevronDown, FiPlus, FiImage, FiX, FiCheck } from 'react-icons/fi';

interface Collection {
  id: number;
  title: string;
  description: string;
  image: string;
  href: string;
  badge: string;
}

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 1, title: 'Bridal Collection', description: 'Exquisite pieces for your special day', image: 'https://picsum.photos/seed/col-bridal/600/800', href: '/shop?occasion=bridal', badge: 'Trending' },
  { id: 2, title: 'Festival Edit', description: 'Celebrate every occasion in style', image: 'https://picsum.photos/seed/col-festival/600/800', href: '/shop?occasion=festival', badge: 'New' },
  { id: 3, title: 'Office Chic', description: 'Elegant workwear for the modern woman', image: 'https://picsum.photos/seed/col-office/600/800', href: '/shop?occasion=office', badge: '' },
  { id: 4, title: 'Casual Luxe', description: 'Comfortable yet stylish everyday wear', image: 'https://picsum.photos/seed/col-casual/600/800', href: '/shop?occasion=casual', badge: '' },
];

const STORAGE_KEY = 'sb-collections';

export default function CollectionsManager() {
  const [items, setItems] = useState<Collection[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Collection | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setItems(stored ? JSON.parse(stored) : DEFAULT_COLLECTIONS);
    } catch {
      setItems(DEFAULT_COLLECTIONS);
    }
    setMounted(true);
  }, []);

  const persist = useCallback((updated: Collection[]) => {
    setItems(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const updated = [...items];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    persist(updated);
  };

  const deleteItem = (id: number) => persist(items.filter(i => i.id !== id));

  const startEdit = (item: Collection) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const saveEdit = () => {
    if (!editForm) return;
    persist(items.map(i => i.id === editForm.id ? editForm : i));
    cancelEdit();
  };

  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    const newItem: Collection = {
      id: newId, title: 'New Collection', description: 'Enter a short description',
      image: 'https://picsum.photos/seed/new-col/600/800',
      href: '/shop', badge: '',
    };
    persist([...items, newItem]);
    startEdit(newItem);
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
          Shop by <span className="text-[#c5a55a]">Collection</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Manage the curated collection cards shown on the homepage</p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <FiImage className="text-[#c5a55a] mt-0.5 flex-shrink-0" size={18} />
        <p className="text-amber-800 text-sm">
          Changes are saved locally and will appear on the homepage immediately.
        </p>
      </div>

      {/* List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
          >
            {editingId === item.id && editForm ? (
              /* Edit Mode */
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[#1a1a2e] font-semibold text-sm">Editing Card #{item.id}</h3>
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
                <div className="h-40 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={editForm.image} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block col-span-1 sm:col-span-2">
                    <span className={labelClass}>Image URL</span>
                    <input type="text" value={editForm.image} onChange={e => setEditForm({ ...editForm, image: e.target.value })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Title</span>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Badge Text (optional)</span>
                    <input type="text" value={editForm.badge} onChange={e => setEditForm({ ...editForm, badge: e.target.value })} placeholder="e.g. New, Trending" className={inputClass} />
                  </label>
                  <label className="block col-span-1 sm:col-span-2">
                    <span className={labelClass}>Description</span>
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} className={inputClass + ' resize-none'} />
                  </label>
                  <label className="block col-span-1 sm:col-span-2">
                    <span className={labelClass}>Link / href</span>
                    <input type="text" value={editForm.href} onChange={e => setEditForm({ ...editForm, href: e.target.value })} className={inputClass} />
                  </label>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-40 flex-shrink-0">
                  <div className="aspect-video sm:aspect-[3/4] sm:h-full bg-gray-100">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[#1a1a2e] font-bold text-base">{item.title}</h3>
                      {item.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-[#c5a55a] text-[#1a1a2e] px-2 py-0.5 rounded-full">{item.badge}</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-1.5 font-mono">{item.href}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                      className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#1a1a2e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <FiChevronUp size={16} />
                    </button>
                    <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}
                      className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#1a1a2e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <FiChevronDown size={16} />
                    </button>
                    <div className="flex-1" />
                    <button onClick={() => startEdit(item)}
                      className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#c5a55a]/10 hover:text-[#c5a55a] transition-colors">
                      <FiEdit2 size={16} />
                    </button>
                    <button onClick={() => deleteItem(item.id)}
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

      {/* Add New */}
      <button onClick={addItem}
        className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#c5a55a] hover:text-[#c5a55a] transition-colors flex items-center justify-center gap-2 text-sm font-medium">
        <FiPlus size={18} />
        Add New Collection
      </button>
    </div>
  );
}
