'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Factory,
  Calendar,
  Target,
  FileText,
  TrendingUp,
  Megaphone,
  ArrowRight,
} from 'lucide-react';

export function BentoGrid() {
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
      { threshold: 0.1 }
    );

    const element = document.getElementById('bento-grid');
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
    <section id="bento-grid" className="py-24 bg-[#F5F5F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre de section */}
        <div className="mb-16 text-center">
          <h2 className="text-5xl lg:text-6xl font-semibold tracking-tight text-[#000000] mb-4">
            Vos outils de création
          </h2>
          <p className="text-xl text-[#86868b] max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour créer et lancer votre marque
          </p>
        </div>

        {/* Grille Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Grand Bloc - Stratégie IA (Haut Gauche) */}
          <Link
            href="/launch-map/phase/1"
            className={cn(
              'md:col-span-2 bg-white rounded-[32px] p-12 shadow-sm',
              'border border-gray-100',
              'transition-all duration-500',
              'hover:scale-[1.02] hover:shadow-md',
              'group',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center">
                <Target className="w-7 h-7 text-[#007AFF]" />
              </div>
              <ArrowRight className="w-5 h-5 text-[#86868b] group-hover:text-[#007AFF] group-hover:translate-x-1 transition-all duration-200" />
            </div>
            <h3 className="text-3xl font-semibold tracking-tight text-[#000000] mb-3">
              Stratégie de marque IA
            </h3>
            <p className="text-lg text-[#6e6e73] leading-relaxed mb-6">
              Définissez votre identité et votre stratégie marketing avec nos outils IA.
              Analysez vos concurrents et identifiez les opportunités de marché.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-[#000000]">
                NOUVEAU
              </span>
              <span className="text-sm text-[#86868b]">Génération automatique</span>
            </div>
          </Link>

          {/* Bloc Vertical - Sourcing (Droite) */}
          <Link
            href="/sourcing"
            className={cn(
              'bg-white rounded-[32px] p-8 shadow-sm',
              'border border-gray-100',
              'transition-all duration-500',
              'hover:scale-[1.02] hover:shadow-md',
              'group',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#34C759]/10 flex items-center justify-center mb-6">
              <Factory className="w-6 h-6 text-[#34C759]" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#000000] mb-3">
              Sourcing Hub
            </h3>
            <p className="text-base text-[#6e6e73] mb-6">
              Trouvez les meilleures usines qualifiées dans le monde entier.
            </p>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-[#000000]">{i}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#007AFF] rounded-full transition-all duration-500"
                        style={{ width: `${75 - i * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <span className="text-sm text-[#007aff] group-hover:underline">
                Explorer les usines →
              </span>
            </div>
          </Link>

          {/* Bloc - Design Studio */}
          <Link
            href="/design-studio"
            className={cn(
              'bg-white rounded-[32px] p-8 shadow-sm',
              'border border-gray-100',
              'transition-all duration-500',
              'hover:scale-[1.02] hover:shadow-md',
              'group',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-[#007AFF]" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#000000] mb-3">
              Design Studio IA
            </h3>
            <p className="text-base text-[#6e6e73] mb-4">
              Créez vos designs avec l'IA et générez des tech packs techniques pour vos fournisseurs.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#007aff] group-hover:underline">
              Découvrir <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Bloc - Calendrier UGC */}
          <Link
            href="/ugc"
            className={cn(
              'bg-white rounded-[32px] p-8 shadow-sm',
              'border border-gray-100',
              'transition-all duration-500',
              'hover:scale-[1.02] hover:shadow-md',
              'group',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FF9500]/10 flex items-center justify-center mb-6">
              <Megaphone className="w-6 h-6 text-[#FF9500]" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#000000] mb-3">
              UGC Lab
            </h3>
            <p className="text-base text-[#6e6e73] mb-4">
              Générez des scripts et du contenu pour vos réseaux sociaux.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#007aff] group-hover:underline">
              Explorer <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Bloc - Analyse de tendances */}
          <Link
            href="/trends"
            className={cn(
              'bg-white rounded-[32px] p-8 shadow-sm',
              'border border-gray-100',
              'transition-all duration-500',
              'hover:scale-[1.02] hover:shadow-md',
              'group',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FF3B30]/10 flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-[#FF3B30]" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#000000] mb-3">
              Radar Intelligence
            </h3>
            <p className="text-base text-[#6e6e73] mb-4">
              Détectez les produits viraux avant vos concurrents.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#007aff] group-hover:underline">
              Analyser <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Bloc - Quotas */}
          <div
            className={cn(
              'bg-white rounded-[32px] p-8 shadow-sm',
              'border border-gray-100',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
              <FileText className="w-6 h-6 text-[#000000]" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#000000] mb-6">
              Vos crédits
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Designs', value: 12, max: 20 },
                { label: 'Analyses', value: 8, max: 15 },
                { label: 'Tech Packs', value: 5, max: 10 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#000000]">{item.label}</span>
                    <span className="text-xs text-[#86868b]">{item.value}/{item.max}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#007AFF] rounded-full transition-all duration-500"
                      style={{ width: `${(item.value / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/usage"
              className="mt-6 inline-block text-sm text-[#007aff] hover:underline"
            >
              Voir les détails →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
