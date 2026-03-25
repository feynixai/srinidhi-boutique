'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRestorer() {
  const pathname = usePathname();

  useEffect(() => {
    const key = `sb_scroll_${pathname}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10));
        sessionStorage.removeItem(key);
      });
    }
    return () => {
      sessionStorage.setItem(key, window.scrollY.toString());
    };
  }, [pathname]);

  return null;
}
