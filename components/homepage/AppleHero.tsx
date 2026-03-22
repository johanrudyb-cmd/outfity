'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AppleHero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="relative py-32 bg-[#F5F5F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          className={cn(
            'space-y-8 transition-all duration-1000',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          )}
        >
          <h1 className="text-6xl lg:text-7xl font-semibold tracking-tight text-[#000000] leading-[1.1]">
            Créez votre marque
            <br />
            de vêtements avec l'IA
          </h1>
          <p className="text-xl lg:text-2xl text-[#86868b] max-w-3xl mx-auto font-light">
            Design, sourcing, marketing — Tout automatisé pour vous permettre de vous concentrer sur votre vision créative.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-[#000000] text-white rounded-full text-base font-medium hover:bg-[#1D1D1F] transition-all duration-200 hover:scale-[1.02]"
            >
              Créer un compte gratuit
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 text-[#007aff] text-base font-medium hover:opacity-80 transition-opacity duration-200"
            >
              En savoir plus →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
