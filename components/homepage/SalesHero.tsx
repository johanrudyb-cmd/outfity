'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function SalesHero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="bg-[#F5F5F7] py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          className={cn(
            'space-y-8 transition-all duration-1000',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          )}
        >
          <h1 className="text-6xl lg:text-7xl font-bold tracking-tight text-[#000000] leading-[1.1]">
            Créez votre marque de vêtement avec les données des géants
          </h1>
          <p className="text-xl lg:text-2xl text-[#6e6e73] font-normal max-w-3xl mx-auto">
            Donnez à votre marque indépendante la puissance des leaders mondiaux. Mêmes données. Mêmes usines. Mêmes stratégies.
          </p>
          <div className="pt-8">
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-4 bg-[#000000] text-white rounded-full text-base font-semibold hover:bg-[#1D1D1F] transition-all duration-200 hover:scale-[1.02]"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
