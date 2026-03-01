'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, LayoutDashboard, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export default function CTASection() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <div
          className={cn(
            'space-y-8 sm:space-y-12 transition-all duration-700',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Sparkles className="w-3 h-3 text-[#007AFF] shrink-0" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              Accès Immédiat // Plan Starter
            </span>
          </div>

          <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white uppercase leading-[0.9] sm:leading-[0.85]">
            Reprenez le <br className="hidden sm:block" />
            <span className="text-[#007AFF]">Contrôle.</span>
          </h2>
          <p className="text-sm sm:text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Rejoignez l'élite des créateurs. Lancez votre empire avec l'infrastructure OUTFITY.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 sm:pt-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <button type="button" className="w-full sm:w-auto px-10 py-5 bg-[#007AFF] text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 shadow-2xl shadow-[#007AFF]/40 flex items-center justify-center gap-3 group">
                  <LayoutDashboard className="w-5 h-5" />
                  ACCÉDER À MON DASHBOARD
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            ) : (
              <>
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <button type="button" className="w-full sm:w-auto px-8 py-5 bg-[#007AFF] text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 shadow-2xl shadow-[#007AFF]/20">
                    CRÉER MON COMPTE GRATUIT
                  </button>
                </Link>
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <button type="button" className="w-full sm:w-auto px-8 py-5 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest border border-white/10 rounded-2xl hover:bg-white/5 transition-all">
                    SE CONNECTER
                  </button>
                </Link>
              </>
            )}
          </div>

          <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] pt-4 opacity-50">
            Aucune carte requise • Activation instantanée • Sans engagement
          </p>
        </div>
      </div>
    </section>
  );
}
