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
            'bg-[#1C1C1E] rounded-[32px] sm:rounded-[48px] p-8 sm:p-16 border border-white/10 shadow-2xl',
            'transition-all duration-500',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-10 sm:mb-12 text-center sm:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#007AFF]/20 flex items-center justify-center">
              <Calculator className="w-7 h-7 sm:w-8 sm:h-8 text-[#007AFF]" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase leading-none mb-2">
                Simulateur <span className="text-[#007AFF]">ROI.</span>
              </h2>
              <p className="text-[10px] sm:text-xs text-white/40 font-black uppercase tracking-widest">
                Analysez votre potentiel de profit instantanément
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <label className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/50 mb-3 text-center sm:text-left">
                Coût de fabrication
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full pl-6 pr-12 py-4 bg-white/5 rounded-2xl border border-white/10 text-white font-black text-xl sm:text-2xl focus:outline-none focus:border-[#007AFF] transition-colors tabular-nums"
                />
                <span className="absolute right-6 text-xl font-black text-[#007AFF]">€</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/50 mb-3 text-center sm:text-left">
                Prix de vente ciblé
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full pl-6 pr-12 py-4 bg-white/5 rounded-2xl border border-white/10 text-white font-black text-xl sm:text-2xl focus:outline-none focus:border-[#007AFF] transition-colors tabular-nums"
                />
                <span className="absolute right-6 text-xl font-black text-[#007AFF]">€</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="text-center sm:text-left">
                <div className="text-[10px] sm:text-xs text-white/40 font-black uppercase tracking-widest mb-2">Profit Net</div>
                <div className="text-3xl sm:text-5xl font-black text-white tracking-tighter tabular-nums">
                  {margin.toFixed(2)}<span className="text-[#007AFF]">€</span>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-[10px] sm:text-xs text-white/40 font-black uppercase tracking-widest mb-2">Marge</div>
                <div className="text-3xl sm:text-5xl font-black text-white tracking-tighter tabular-nums">
                  {marginPercentage}<span className="text-[#007AFF]">%</span>
                </div>
              </div>
            </div>
            <Link
              href="/auth/signup"
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-5 bg-[#007AFF] text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 shadow-xl shadow-[#007AFF]/20 group"
            >
              Accéder au simulateur complet
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[9px] sm:text-[10px] text-white/40 text-center mt-6 font-bold uppercase tracking-widest leading-relaxed">
              Vérifiez les taux d'imposition selon votre statut. <br className="hidden sm:block" />
              Les prix affichés sont des moyennes indicatives.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
