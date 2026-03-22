'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#F5F5F7]">
      {/* Background gradient animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5F5F7] via-white to-[#F5F5F7]" />
      
      {/* Cercles décoratifs animés */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={cn(
            'absolute top-1/4 -left-1/4 w-96 h-96 rounded-full',
            'bg-[#007AFF]/5 blur-3xl',
            'transition-all duration-2000',
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          )}
        />
        <div
          className={cn(
            'absolute bottom-1/4 -right-1/4 w-96 h-96 rounded-full',
            'bg-[#FF3B30]/5 blur-3xl',
            'transition-all duration-2000 delay-500',
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          )}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Titre principal avec animation */}
          <div
            className={cn(
              'space-y-6 transition-all duration-1000',
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-12'
            )}
          >
            <h1 className="text-7xl lg:text-8xl font-semibold tracking-tight text-[#1D1D1F] leading-[1.1]">
              OUTFITY
            </h1>
            <p className="text-2xl lg:text-3xl text-[#1D1D1F]/70 font-light max-w-3xl mx-auto">
              Créez votre marque de vêtements
              <br />
              <span className="text-[#007AFF]">de A à Z avec l'IA</span>
            </p>
            <p className="text-lg text-[#1D1D1F]/60 max-w-2xl mx-auto">
              Design, sourcing, marketing — Tout automatisé pour vous permettre de vous concentrer sur votre vision créative.
            </p>
          </div>

          {/* CTA Buttons avec animation */}
          <div
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-4 pt-8',
              'transition-all duration-1000 delay-300',
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            )}
          >
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-[#007AFF] hover:bg-[#0056CC] text-white h-14 px-8 text-lg font-semibold shadow-apple-lg transition-all duration-300 hover:scale-105"
              >
                Créer un compte gratuit
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg font-semibold border-2 border-[#1D1D1F]/20 hover:border-[#007AFF] hover:text-[#007AFF] transition-all duration-300"
              >
                Se connecter
              </Button>
            </Link>
          </div>

          {/* Badge de confiance */}
          <div
            className={cn(
              'flex items-center justify-center gap-2 pt-8',
              'transition-all duration-1000 delay-500',
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            )}
          >
            <Sparkles className="w-5 h-5 text-[#007AFF]" />
            <span className="text-sm text-[#1D1D1F]/60">
              Déjà utilisé par des centaines de créateurs
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={cn(
          'absolute bottom-12 left-1/2 -translate-x-1/2',
          'flex flex-col items-center gap-2',
          'transition-all duration-1000 delay-700',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="w-6 h-10 rounded-full border-2 border-[#1D1D1F]/20 flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-apple-pulse" />
        </div>
        <span className="text-xs text-[#1D1D1F]/40">Découvrir</span>
      </div>
    </section>
  );
}
