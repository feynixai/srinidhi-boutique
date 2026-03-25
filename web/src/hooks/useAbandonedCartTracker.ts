'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { api } from '@/lib/api';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 2000; // 2 seconds

interface CartItemForTracking {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

export function useAbandonedCartTracker(items: CartItemForTracking[]) {
  const { sessionId } = useCartStore();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedRef = useRef(false);

  const trackCart = useCallback(async () => {
    if (!sessionId || items.length === 0) return;
    try {
      await api.post('/api/abandoned-carts/track', {
        sessionId,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          image: i.image,
        })),
      });
      trackedRef.current = true;
    } catch {
      // Backend not available — silently fail
    }
  }, [sessionId, items]);

  const debouncedTrack = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(trackCart, DEBOUNCE_DELAY);
  }, [trackCart]);

  // Track on beforeunload
  useEffect(() => {
    if (items.length === 0) return;

    const handleBeforeUnload = () => {
      if (!sessionId || items.length === 0) return;
      // Use sendBeacon for reliable tracking on page leave
      const data = JSON.stringify({
        sessionId,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          image: i.image,
        })),
      });
      const blob = new Blob([data], { type: 'application/json' });
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      navigator.sendBeacon(`${apiUrl}/api/abandoned-carts/track`, blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, items]);

  // Track after inactivity
  useEffect(() => {
    if (items.length === 0) return;

    const resetInactivity = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(debouncedTrack, INACTIVITY_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, resetInactivity, { passive: true }));
    resetInactivity(); // Start the timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [items, debouncedTrack]);
}

export async function markCartRecovered(token: string) {
  try {
    await api.post(`/api/abandoned-carts/recover/${token}`);
  } catch {
    // Backend not available
  }
}
