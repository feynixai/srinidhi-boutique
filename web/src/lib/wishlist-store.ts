import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
}

interface WishlistStore {
  items: WishlistProduct[];
  toggle: (product: WishlistProduct) => void;
  removeItem: (productId: string) => void;
  has: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) => {
        const items = get().items;
        const exists = items.some((i) => i.id === product.id);
        set({
          items: exists
            ? items.filter((i) => i.id !== product.id)
            : [...items, product],
        });
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },
      has: (productId) => get().items.some((i) => i.id === productId),
      clearWishlist: () => set({ items: [] }),
    }),
    { name: 'sb-wishlist' }
  )
);
