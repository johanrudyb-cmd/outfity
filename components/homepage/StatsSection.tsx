'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

import { Users, Activity, Rocket, Star } from 'lucide-react';

const stats = [
  { value: '150+', label: 'Créateurs actifs', icon: Users, color: '#007AFF' },
  { value: '10k+', label: 'Produits analysés/mois', icon: Activity, color: '#007AFF' },
  { value: '200+', label: 'Marques créées', icon: Rocket, color: '#007AFF' },
  { value: '4.6/5', label: 'Note moyenne', icon: Star, color: '#007AFF' },
];

export function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.1 }
    );
    const element = document.getElementById('stats-section');
    if (element) observer.observe(element);
    return () => { if (element) observer.unobserve(element); };
  }, []);

  return (
    <section id="stats-section" className="py-24 bg-[#F5F5F7] border-y border-black/[0.03] relative overflow-hidden">
      {/* Background Decor - Shapes for Light Theme */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="absolute top-[30%] -left-[10%] w-[50%] h-[50%] border-[1px] border-black rounded-full" />
        <div className="absolute -bottom-[20%] -right-[5%] w-[40%] h-[40%] border-[2px] border-[#007AFF] rotate-12" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF]/5 to-transparent" />
      </div>

      {/* Moving Text Layer */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none select-none overflow-hidden">
        <div className="text-[120px] sm:text-[240px] font-black leading-none -rotate-6 translate-x-12 sm:translate-x-24 text-black whitespace-nowrap">
          OUTFITY // DONNÉES // LIVE
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex items-center gap-4 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#007AFF]/10 rounded-full border border-[#007AFF]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
            <span className="text-[8px] sm:text-[10px] font-black text-[#007AFF] uppercase tracking-widest">Données de la plateforme</span>
          </div>
          <div className="h-[1px] flex-1 bg-black/5" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 lg:gap-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                'flex flex-col gap-4 sm:gap-6 transition-all duration-1000',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#007AFF]" />
                  <span className="text-[8px] sm:text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">{stat.label}</span>
                </div>
                <div className="text-4xl sm:text-5xl lg:text-7xl font-black text-black tracking-tighter tabular-nums">
                  {stat.value}
                </div>
                <div className="h-1 w-8 sm:w-12 bg-[#007AFF]/30" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
