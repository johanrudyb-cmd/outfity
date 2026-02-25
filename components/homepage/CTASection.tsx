'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CTASection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('cta-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return (
    <section
      id="cta-section"
      className="relative py-16 sm:py-20 lg:py-32 bg-[#000000] overflow-hidden border-t border-white/10"
    >
      {/* Background décoratif */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDMuMzE0LTIuNjg2IDYtNiA2cy02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNnoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
        <div
          className={cn(
            'space-y-6 sm:space-y-8 transition-all duration-700',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-white shrink-0" />
            <span className="text-sm font-medium text-white">
              Commencez avec le plan Starter
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-4 sm:mb-6">
            Prêt à créer votre marque de vêtement ?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[#86868b] max-w-2xl mx-auto px-2">
            Rejoignez des centaines de créateurs qui utilisent OUTFITY pour lancer leur marque de vêtements.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-6 sm:pt-8">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <button type="button" className="w-full sm:w-auto min-h-[44px] px-6 sm:px-8 py-3.5 sm:py-4 bg-[#007AFF] text-white rounded-full text-base font-semibold hover:bg-[#0056CC] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] touch-manipulation shadow-lg shadow-[#007AFF]/20">
                Créer mon compte Starter
              </button>
            </Link>
            <Link href="/auth/signin" className="w-full sm:w-auto">
              <button type="button" className="w-full sm:w-auto min-h-[44px] px-6 sm:px-8 py-3.5 sm:py-4 text-white text-base font-medium hover:opacity-80 transition-opacity duration-200 border border-white/30 rounded-full touch-manipulation">
                Se connecter
              </button>
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-[#86868b] pt-2 sm:pt-4">
            Aucune carte bancaire requise • Essai gratuit • Annulation à tout moment
          </p>
        </div>
      </div>
    </section>
  );
}
