'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Remonter en haut de la page"
      className={cn(
        'fixed bottom-4 right-20 sm:bottom-6 sm:right-24 lg:bottom-8 lg:right-28 z-50 hidden lg:flex min-h-[44px] min-w-[44px] h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#1D1D1F] text-white shadow-lg transition-all duration-300 hover:bg-[#007AFF] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2',
        visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-4'
      )}
    >
      <ChevronUp className="h-6 w-6" />
    </button>
  );
}
