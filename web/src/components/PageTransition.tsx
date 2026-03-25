'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (ref.current) {
      ref.current.classList.remove('animate-page-enter');
      // force reflow
      void ref.current.offsetHeight;
      ref.current.classList.add('animate-page-enter');
    }
  }, [pathname]);

  return (
    <div ref={ref} className="animate-page-enter">
      {children}
    </div>
  );
}
