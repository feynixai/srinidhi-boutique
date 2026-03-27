'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiChevronUp, FiChevronDown, FiPlus, FiImage, FiX, FiCheck, FiChevronRight } from 'react-icons/fi';

interface NavLink {
  label: string;
  href: string;
}

interface NavColumn {
  heading: string;
  links: NavLink[];
}

interface NavItem {
  id: number;
  label: string;
  href: string;
  highlight: boolean;
  columns: NavColumn[];
}

const DEFAULT_NAV: NavItem[] = [
  {
    id: 1, label: 'Sarees', href: '/category/sarees', highlight: false,
    columns: [
      { heading: 'By Fabric', links: [
        { label: 'Silk Sarees', href: '/shop?category=sarees&fabric=silk' },
        { label: 'Cotton Sarees', href: '/shop?category=sarees&fabric=cotton' },
        { label: 'Georgette Sarees', href: '/shop?category=sarees&fabric=georgette' },
        { label: 'Chiffon Sarees', href: '/shop?category=sarees&fabric=chiffon' },
        { label: 'Linen Sarees', href: '/shop?category=sarees&fabric=linen' },
      ]},
      { heading: 'By Occasion', links: [
        { label: 'Wedding Sarees', href: '/shop?category=sarees&occasion=wedding' },
        { label: 'Festival Sarees', href: '/shop?category=sarees&occasion=festival' },
        { label: 'Party Wear', href: '/shop?category=sarees&occasion=party' },
        { label: 'Casual Sarees', href: '/shop?category=sarees&occasion=casual' },
        { label: 'Office Wear', href: '/shop?category=sarees&occasion=office' },
      ]},
    ],
  },
  {
    id: 2, label: 'Kurtis', href: '/category/kurtis', highlight: false,
    columns: [
      { heading: 'Styles', links: [
        { label: 'Anarkali Kurtis', href: '/shop?category=kurtis&style=anarkali' },
        { label: 'Straight Kurtis', href: '/shop?category=kurtis&style=straight' },
        { label: 'A-Line Kurtis', href: '/shop?category=kurtis&style=a-line' },
        { label: 'Palazzo Sets', href: '/shop?category=kurtis&style=palazzo' },
      ]},
      { heading: 'Occasion', links: [
        { label: 'Casual Kurtis', href: '/shop?category=kurtis&occasion=casual' },
        { label: 'Party Kurtis', href: '/shop?category=kurtis&occasion=party' },
        { label: 'Festival Kurtis', href: '/shop?category=kurtis&occasion=festival' },
        { label: 'Office Kurtis', href: '/shop?category=kurtis&occasion=office' },
      ]},
    ],
  },
  {
    id: 3, label: 'Lehengas', href: '/category/lehengas', highlight: false,
    columns: [
      { heading: 'Collections', links: [
        { label: 'Bridal Lehengas', href: '/shop?category=lehengas&occasion=bridal' },
        { label: 'Reception Lehengas', href: '/shop?category=lehengas&occasion=reception' },
        { label: 'Festival Lehengas', href: '/shop?category=lehengas&occasion=festival' },
        { label: 'Party Lehengas', href: '/shop?category=lehengas&occasion=party' },
      ]},
    ],
  },
  {
    id: 4, label: 'Blouses', href: '/category/blouses', highlight: false,
    columns: [
      { heading: 'Types', links: [
        { label: 'Designer Blouses', href: '/shop?category=blouses' },
        { label: 'Ready-to-wear', href: '/shop?category=blouses&type=readymade' },
        { label: 'Embroidered', href: '/shop?category=blouses&style=embroidered' },
        { label: 'Plain Blouses', href: '/shop?category=blouses&style=plain' },
      ]},
    ],
  },
  {
    id: 5, label: 'Accessories', href: '/category/accessories', highlight: false,
    columns: [
      { heading: 'Shop By', links: [
        { label: 'Dupattas', href: '/shop?category=accessories&type=dupatta' },
        { label: 'Jewellery', href: '/shop?category=accessories&type=jewellery' },
        { label: 'Bangles', href: '/shop?category=accessories&type=bangles' },
        { label: 'Clutches', href: '/shop?category=accessories&type=clutch' },
      ]},
    ],
  },
  { id: 6, label: 'Offers', href: '/offers', highlight: true, columns: [] },
];

const STORAGE_KEY = 'sb-navigation';

export default function NavigationManager() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<NavItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setItems(stored ? JSON.parse(stored) : DEFAULT_NAV);
    } catch {
      setItems(DEFAULT_NAV);
    }
    setMounted(true);
  }, []);

  const persist = useCallback((updated: NavItem[]) => {
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

  const deleteItem = (id: number) => {
    persist(items.filter(i => i.id !== id));
    if (expandedId === id) setExpandedId(null);
    if (editingId === id) { setEditingId(null); setEditForm(null); }
  };

  const startEdit = (item: NavItem) => {
    setEditingId(item.id);
    setExpandedId(item.id);
    setEditForm(JSON.parse(JSON.stringify(item))); // deep clone
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const saveEdit = () => {
    if (!editForm) return;
    persist(items.map(i => i.id === editForm.id ? editForm : i));
    cancelEdit();
  };

  const addNavItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    const newItem: NavItem = {
      id: newId, label: 'New Menu Item', href: '/shop', highlight: false,
      columns: [{ heading: 'Links', links: [{ label: 'Example Link', href: '/shop' }] }],
    };
    persist([...items, newItem]);
    startEdit(newItem);
  };

  // Column editing helpers (operate on editForm)
  const addColumn = () => {
    if (!editForm) return;
    setEditForm({ ...editForm, columns: [...editForm.columns, { heading: 'New Column', links: [{ label: 'New Link', href: '/shop' }] }] });
  };

  const deleteColumn = (colIdx: number) => {
    if (!editForm) return;
    setEditForm({ ...editForm, columns: editForm.columns.filter((_, i) => i !== colIdx) });
  };

  const updateColumn = (colIdx: number, heading: string) => {
    if (!editForm) return;
    const columns = editForm.columns.map((c, i) => i === colIdx ? { ...c, heading } : c);
    setEditForm({ ...editForm, columns });
  };

  const addLink = (colIdx: number) => {
    if (!editForm) return;
    const columns = editForm.columns.map((c, i) =>
      i === colIdx ? { ...c, links: [...c.links, { label: 'New Link', href: '/shop' }] } : c
    );
    setEditForm({ ...editForm, columns });
  };

  const deleteLink = (colIdx: number, linkIdx: number) => {
    if (!editForm) return;
    const columns = editForm.columns.map((c, i) =>
      i === colIdx ? { ...c, links: c.links.filter((_, j) => j !== linkIdx) } : c
    );
    setEditForm({ ...editForm, columns });
  };

  const updateLink = (colIdx: number, linkIdx: number, field: 'label' | 'href', value: string) => {
    if (!editForm) return;
    const columns = editForm.columns.map((c, i) =>
      i === colIdx
        ? { ...c, links: c.links.map((l, j) => j === linkIdx ? { ...l, [field]: value } : l) }
        : c
    );
    setEditForm({ ...editForm, columns });
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
          Header <span className="text-[#c5a55a]">Navigation</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Manage the mega menu structure shown in the site header</p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <FiImage className="text-[#c5a55a] mt-0.5 flex-shrink-0" size={18} />
        <p className="text-amber-800 text-sm">
          Changes are saved locally and update the live header immediately. Use <strong>Highlight</strong> to mark items like &ldquo;Offers&rdquo; in gold.
        </p>
      </div>

      {/* Nav Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm"
          >
            {editingId === item.id && editForm ? (
              /* ── Edit Mode ── */
              <div className="p-4 sm:p-6 space-y-5">
                {/* Edit header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-[#1a1a2e] font-semibold text-sm">Editing: {item.label}</h3>
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                      <FiX size={16} />
                    </button>
                    <button onClick={saveEdit} className="p-2 rounded-xl bg-[#c5a55a]/10 text-[#c5a55a] hover:bg-[#c5a55a]/20 transition-colors">
                      <FiCheck size={16} />
                    </button>
                  </div>
                </div>

                {/* Basic fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block">
                    <span className={labelClass}>Menu Label</span>
                    <input type="text" value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Link / href</span>
                    <input type="text" value={editForm.href} onChange={e => setEditForm({ ...editForm, href: e.target.value })} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Highlight (gold)</span>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, highlight: !editForm.highlight })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.highlight ? 'bg-[#c5a55a]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.highlight ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-sm text-gray-600">{editForm.highlight ? 'Yes' : 'No'}</span>
                    </div>
                  </label>
                </div>

                {/* Columns */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[#1a1a2e] font-semibold text-sm">Dropdown Columns</p>
                    <button onClick={addColumn}
                      className="flex items-center gap-1.5 text-xs text-[#c5a55a] hover:text-[#1a1a2e] font-medium transition-colors px-3 py-1.5 rounded-xl bg-[#c5a55a]/10 hover:bg-[#c5a55a]/20">
                      <FiPlus size={13} /> Add Column
                    </button>
                  </div>
                  {editForm.columns.length === 0 && (
                    <p className="text-gray-400 text-sm italic">No columns — this item links directly (no dropdown).</p>
                  )}
                  {editForm.columns.map((col, colIdx) => (
                    <div key={colIdx} className="border border-gray-200 rounded-2xl p-4 space-y-3 bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <label className="flex-1">
                          <span className={labelClass}>Column Heading</span>
                          <input type="text" value={col.heading} onChange={e => updateColumn(colIdx, e.target.value)} className={inputClass} />
                        </label>
                        <button onClick={() => deleteColumn(colIdx)}
                          className="p-2 mt-5 rounded-xl bg-white text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-200">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {col.links.map((link, linkIdx) => (
                          <div key={linkIdx} className="flex items-center gap-2">
                            <input
                              type="text" value={link.label}
                              onChange={e => updateLink(colIdx, linkIdx, 'label', e.target.value)}
                              placeholder="Link label"
                              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#1a1a2e] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a55a]/30 focus:border-[#c5a55a] transition-all"
                            />
                            <input
                              type="text" value={link.href}
                              onChange={e => updateLink(colIdx, linkIdx, 'href', e.target.value)}
                              placeholder="/path"
                              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#1a1a2e] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#c5a55a]/30 focus:border-[#c5a55a] transition-all"
                            />
                            <button onClick={() => deleteLink(colIdx, linkIdx)}
                              className="p-2 rounded-xl bg-white text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors border border-gray-200 flex-shrink-0">
                              <FiX size={13} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addLink(colIdx)}
                          className="w-full py-2 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-[#c5a55a] hover:text-[#c5a55a] transition-colors flex items-center justify-center gap-1 text-xs font-medium">
                          <FiPlus size={13} /> Add Link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ── View Mode ── */
              <div>
                {/* Top row - clickable to expand */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <FiChevronRight
                    size={16}
                    className={`text-gray-400 transition-transform flex-shrink-0 ${expandedId === item.id ? 'rotate-90' : ''}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-base ${item.highlight ? 'text-[#c5a55a]' : 'text-[#1a1a2e]'}`}>
                        {item.label}
                      </span>
                      {item.highlight && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-[#c5a55a]/10 text-[#c5a55a] px-2 py-0.5 rounded-full">Highlighted</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs font-mono mt-0.5">{item.href} · {item.columns.length} column{item.columns.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => moveItem(index, -1)} disabled={index === 0}
                      className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#1a1a2e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <FiChevronUp size={14} />
                    </button>
                    <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1}
                      className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-[#1a1a2e] disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                      <FiChevronDown size={14} />
                    </button>
                    <button onClick={() => startEdit(item)}
                      className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-[#c5a55a]/10 hover:text-[#c5a55a] transition-colors">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded: column preview */}
                {expandedId === item.id && item.columns.length > 0 && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-6 pt-4">
                      {item.columns.map((col, colIdx) => (
                        <div key={colIdx} className="min-w-[120px]">
                          <p className="text-xs font-bold text-[#1a1a2e] uppercase tracking-wider mb-2">{col.heading}</p>
                          <ul className="space-y-1">
                            {col.links.map((link, linkIdx) => (
                              <li key={linkIdx} className="text-xs text-gray-500 hover:text-[#c5a55a] transition-colors truncate max-w-[160px]">
                                {link.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Nav Item */}
      <button onClick={addNavItem}
        className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#c5a55a] hover:text-[#c5a55a] transition-colors flex items-center justify-center gap-2 text-sm font-medium">
        <FiPlus size={18} />
        Add New Menu Item
      </button>
    </div>
  );
}
