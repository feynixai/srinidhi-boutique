import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './api';

interface CompareStore {
  items: Product[];
  add: (p: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p) => {
        if (get().items.length >= 3) return;
        if (get().has(p.id)) return;
        set((s) => ({ items: [...s.items, p] }));
      },
      remove: (id) => set((s) => ({ items: s.items.filter((p) => p.id !== id) })),
      clear: () => set({ items: [] }),
      has: (id) => get().items.some((p) => p.id === id),
    }),
    { name: 'sb-compare' }
  )
);
