'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

interface CartStore {
  sessionId: string;
  itemCount: number;
  isCartOpen: boolean;
  setItemCount: (count: number) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      sessionId: uuidv4(),
      itemCount: 0,
      isCartOpen: false,
      setItemCount: (count) => set({ itemCount: count }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({ sessionId: state.sessionId }),
    }
  )
);
