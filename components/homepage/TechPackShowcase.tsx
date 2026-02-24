'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, FileText } from 'lucide-react';

export function TechPackShowcase() {
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
    <section id="tech-pack-showcase" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Contenu texte */}
          <div
            className={cn(
              'transition-all duration-700',
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            )}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#007AFF]" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#000000]">
                  Tech Pack Professionnel
                </h2>
                <p className="text-xs sm:text-sm text-[#6e6e73] font-normal mt-1">
                  Créez vos spécifications techniques complètes
                </p>
              </div>
            </div>

            <p className="text-lg text-[#6e6e73] font-normal mb-8 leading-relaxed">
              Remplissez votre tech pack avec un formulaire intuitif. Visualisez en temps réel votre document professionnel avec toutes les spécifications techniques : tailles, placements de logos, couleurs, matériaux et détails de construction.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                </div>
                <span className="text-base text-[#6e6e73] font-normal">
                  Formulaire interactif avec aperçu en direct
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                </div>
                <span className="text-base text-[#6e6e73] font-normal">
                  Spécifications complètes : tailles, logos, couleurs, matériaux
                </span>
              </li>
              <li className="flex items-start gap-3">
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
              unoptimized
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
