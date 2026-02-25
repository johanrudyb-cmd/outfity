'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

import { Users, Activity, Rocket, Star } from 'lucide-react';

const stats = [
  { value: '150+', label: 'Créateurs actifs', icon: Users, color: '#007AFF' },
  { value: '10k+', label: 'Produits analysés/mois', icon: Activity, color: '#007AFF' },
  { value: '200+', label: 'Marques créées', icon: Rocket, color: '#007AFF' },
  { value: '4.9/5', label: 'Note moyenne', icon: Star, color: '#007AFF' },
];

export function StatsSection() {
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

    const element = document.getElementById('stats-section');
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
    <section id="stats-section" className="py-20 sm:py-24 bg-[#000000] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                'bg-[#1C1C1E] p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/5 shadow-2xl transition-all duration-700',
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              )}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-white/50 font-medium mt-1">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
