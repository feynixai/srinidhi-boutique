import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistStore {
  items: string[]; // product IDs
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (productId) => {
        const items = get().items;
        set({
          items: items.includes(productId)
            ? items.filter((id) => id !== productId)
            : [...items, productId],
        });
      },
      has: (productId) => get().items.includes(productId),
    }),
    { name: 'sb-wishlist' }
  )
);
