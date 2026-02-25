'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, Calculator } from 'lucide-react';

export function MarginCalculator() {
  const [isVisible, setIsVisible] = useState(false);
  const [cost, setCost] = useState(25);
  const [price, setPrice] = useState(79);
  const margin = price - cost;
  const marginPercentage = price > 0 ? Math.round((margin / price) * 100) : 0;

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

    const element = document.getElementById('margin-calculator');
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
    <section id="margin-calculator" className="py-24 bg-[#000000]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'bg-[#1C1C1E] rounded-2xl sm:rounded-[32px] p-6 sm:p-12 border border-white/10 shadow-2xl',
            'transition-all duration-500',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#007AFF]/20 flex items-center justify-center">
              <Calculator className="w-6 h-6 sm:w-7 sm:h-7 text-[#007AFF]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Calculateur de marge
              </h2>
              <p className="text-xs sm:text-sm text-white/60 font-normal mt-1">
                Calculez rapidement votre marge bénéficiaire
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-3">
                Prix de revient
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="flex-1 px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white font-bold text-lg focus:outline-none focus:border-[#007AFF] transition-colors"
                />
                <span className="text-lg font-bold text-white">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-3">
                Prix de vente
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="flex-1 px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white font-bold text-lg focus:outline-none focus:border-[#007AFF] transition-colors"
                />
                <span className="text-lg font-bold text-white">€</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-xs sm:text-sm text-white/60 font-normal mb-1">Marge nette</div>
                <div className="text-2xl sm:text-4xl font-bold text-[#34C759]">
                  {margin.toFixed(2)} €
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm text-white/60 font-normal mb-1">Rentabilité</div>
                <div className="text-2xl sm:text-4xl font-bold text-[#007AFF]">
                  {marginPercentage}%
                </div>
              </div>
            </div>
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#007AFF] text-white rounded-full font-bold text-base sm:text-lg hover:bg-[#0056CC] transition-all duration-200 shadow-lg shadow-[#007AFF]/20 active:scale-95 group"
            >
              Accéder au calculateur complet
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[10px] sm:text-[11px] text-white/40 text-center mt-6 font-medium leading-relaxed">
              Vérifiez les taux d'imposition selon votre statut. <br className="hidden sm:block" />
              Les prix affichés sont des moyennes du marché à titre indicatif.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
