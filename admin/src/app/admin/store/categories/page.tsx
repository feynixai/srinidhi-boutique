'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiChevronUp, FiChevronDown, FiPlus, FiImage, FiX, FiCheck } from 'react-icons/fi';

interface Category {
  id: number;
  label: string;
  image: string;
  href: string;
  rowSpan: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, label: 'Sarees', image: 'https://picsum.photos/seed/cat-sarees/600/750', href: '/category/sarees', rowSpan: 2 },
  { id: 2, label: 'Kurtis', image: 'https://picsum.photos/seed/cat-kurtis/600/600', href: '/category/kurtis', rowSpan: 1 },
  { id: 3, label: 'Lehengas', image: 'https://picsum.photos/seed/cat-lehengas/600/600', href: '/category/lehengas', rowSpan: 1 },
  { id: 4, label: 'Blouses', image: 'https://picsum.photos/seed/cat-blouses/600/600', href: '/category/blouses', rowSpan: 1 },
  { id: 5, label: 'Accessories', image: 'https://picsum.photos/seed/cat-accessories/600/600', href: '/category/accessories', rowSpan: 1 },
  { id: 6, label: 'Offers', image: 'https://picsum.photos/seed/cat-offers/600/600', href: '/offers', rowSpan: 1 },
];

const STORAGE_KEY = 'sb-categories';

export default function CategoriesManager() {
  const [items, setItems] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Category | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setItems(stored ? JSON.parse(stored) : DEFAULT_CATEGORIES);
    } catch {
      setItems(DEFAULT_CATEGORIES);
    }
    setMounted(true);
  }, []);

  const persist = useCallback((updated: Category[]) => {
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

  const startEdit = (item: Category) => {
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
    const newItem: Category = {
      id: newId, label: 'New Category',
      image: 'https://picsum.photos/seed/new-category/600/600',
      href: '/shop', rowSpan: 1,
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
          Shop by <span className="text-[#c5a55a]">Category</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Manage the category cards shown on the homepage</p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <FiImage className="text-[#c5a55a] mt-0.5 flex-shrink-0" size={18} />
        <p className="text-amber-800 text-sm">
          Set <strong>Row Span = 2</strong> on the first card to make it taller (accent card). Changes appear on homepage immediately.
        </p>
      </div>

      {/* Grid Preview note */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
          >
            {editingId === item.id && editForm ? (
              /* Edit Mode */
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[#1a1a2e] font-semibold text-sm">Editing</h3>
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                      <FiX size={14} />
                    </button>
                    <button onClick={saveEdit} className="p-1.5 rounded-lg bg-[#c5a55a]/10 text-[#c5a55a] hover:bg-[#c5a55a]/20 transition-colors">
                      <FiCheck size={14} />
                    </button>
                  </div>
                </div>

                {/* Image Preview */}
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={editForm.image} alt="" className="w-full h-full object-cover" />
                </div>

                <label className="block">
                  <span className={labelClass}>Image URL</span>
                  <input type="text" value={editForm.image} onChange={e => setEditForm({ ...editForm, image: e.target.value })} className={inputClass} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelClass}>Label</span>
                    <input type="text" value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Row Span</span>
                    <select value={editForm.rowSpan} onChange={e => setEditForm({ ...editForm, rowSpan: parseInt(e.target.value) })} className={inputClass}>
                      <option value={1}>1 (normal)</option>
                      <option value={2}>2 (tall)</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className={labelClass}>Link / href</span>
                  <input type="text" value={editForm.href} onChange={e => setEditForm({ ...editForm, href: e.target.value })} className={inputClass} />
                </label>
              </div>
            ) : (
              /* View Mode */
              <div className="p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    <img src={item.image} alt={item.label} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[#1a1a2e] font-bold text-base">{item.label}</h3>
                    <p className="text-gray-400 text-xs font-mono mt-0.5 truncate">{item.href}</p>
                    <div className="mt-1.5">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                        Row span: {item.rowSpan}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                    className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#1a1a2e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                    <FiChevronUp size={14} />
                  </button>
                  <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}
                    className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#1a1a2e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                    <FiChevronDown size={14} />
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => startEdit(item)}
                    className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#c5a55a]/10 hover:text-[#c5a55a] transition-colors">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <FiTrash2 size={14} />
                  </button>
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
        Add New Category
      </button>
    </div>
  );
}
