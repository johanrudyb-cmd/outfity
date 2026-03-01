'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, FileText } from 'lucide-react';

export default function TechPackShowcase() {
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

    const element = document.getElementById('tech-pack-showcase');
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
    <section id="tech-pack-showcase" className="py-24 bg-white relative overflow-hidden">
      {/* Background Decor - Technical Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '100px 100px' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#000 0.5px, transparent 0.5px), linear-gradient(90deg, #000 0.5px, transparent 0.5px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
          {/* Contenu texte */}
          <div
            className={cn(
              'transition-all duration-700 text-left',
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            )}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6 sm:mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7 text-[#007AFF]" />
              </div>
              <div className="text-left">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-black uppercase leading-[0.9]">
                  Tech Pack <br className="lg:hidden" /> Professionnel
                </h2>
                <p className="text-[10px] sm:text-xs text-[#007AFF] font-black uppercase tracking-widest mt-2 sm:mt-1">
                  Spécifications techniques complètes
                </p>
              </div>
            </div>

            <p className="text-base sm:text-lg text-gray-500 font-medium mb-8 sm:mb-10 leading-relaxed max-w-xl">
              Transformez vos idées en documents de production réels. Notre interface intuitive guide chaque détail : mesures, placements de logos, couleurs et matériaux.
            </p>

            <ul className="space-y-4 mb-8 text-left">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                </div>
                <span className="text-base text-[#6e6e73] font-normal">
                  Formulaire interactif avec aperçu en direct
                </span>
              </li>
              <li className="flex items-start gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                </div>
                <span className="text-base text-[#6e6e73] font-normal">
                  Spécifications complètes : tailles, logos, couleurs, matériaux
                </span>
              </li>
              <li className="flex items-start gap-3 text-left">
                <div className="w-6 h-6 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                </div>
                <span className="text-base text-[#6e6e73] font-normal">
                  Export en PDF pour vos fournisseurs
                </span>
              </li>
            </ul>

            <Link
              href="#pricing-section"
              onClick={(e) => {
                e.preventDefault();
                const element = document.querySelector('#pricing-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-[#007AFF] text-white rounded-full font-medium hover:bg-[#0056CC] transition-all duration-200 group shadow-lg shadow-[#007AFF]/20"
            >
              Créer mon tech pack
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Image du tech pack */}
          <div
            className={cn(
              'relative rounded-2xl sm:rounded-[32px] overflow-hidden border border-[#F2F2F2] shadow-lg',
              'transition-all duration-700',
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            )}
            style={{ transitionDelay: '200ms' }}
          >
            <Image
              src="/tech-pack-preview.png"
              alt="Aperçu du tech pack professionnel"
              width={800}
              height={1000}
              className="w-full h-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-message')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'fallback-message p-12 bg-[#F5F5F7] text-center';
                  fallback.innerHTML = '<p class="text-[#6e6e73]">Image du tech pack à venir</p>';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
