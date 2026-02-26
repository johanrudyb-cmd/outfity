'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const brands = [
  { name: 'NIKE', logo: '/images/brand-logos/nike.png', scaleDesktop: 1.4, scaleMobile: 1.1 },
  { name: 'ADIDAS', logo: '/images/brand-logos/Adidas.png', scaleDesktop: 2.2, scaleMobile: 1.5 },
  { name: 'ZARA', logo: '/images/brand-logos/zara.PNG', scaleDesktop: 2.2, scaleMobile: 1.5 },
  { name: 'H&M', logo: '/images/brand-logos/H&M.png', scaleDesktop: 1.8, scaleMobile: 1.2 },
  { name: 'UNIQLO', logo: '/images/brand-logos/uniqlo.png', scaleDesktop: 2.8, scaleMobile: 1.8 },
  { name: 'MANGO', logo: '/images/brand-logos/mango.png', scaleDesktop: 1.1, scaleMobile: 0.9 },
  { name: 'TRAPSTAR', logo: '/images/brand-logos/trapstar.png', scaleDesktop: 3.8, scaleMobile: 2.2 },
  { name: 'STONE ISLAND', logo: '/images/brand-logos/Stone Island.png', scaleDesktop: 2.8, scaleMobile: 1.8 },
  { name: 'CARHARTT', logo: '/images/brand-logos/Carhartt.png', scaleDesktop: 1.4, scaleMobile: 1.0 },
  { name: 'JACQUEMUS', logo: '/images/brand-logos/jacquemus.png', scaleDesktop: 1.3, scaleMobile: 1.0 },
  { name: 'MASSIMO DUTTI', logo: '/images/brand-logos/Massimo Dutti.png', scaleDesktop: 0.9, scaleMobile: 0.7 },
];

export function TrendsHero() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'text-center space-y-6 sm:space-y-8 transition-all duration-1000',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          )}
        >
          {/* Titre principal */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-black mb-4 sm:mb-6 px-2">
              Créez votre marque de vêtement avec les données des géants
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 font-light max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              Créez vos designs avec les tendances virales de <span className="font-semibold text-black">TikTok</span> et <span className="font-semibold text-black">Instagram</span>.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-[#007AFF] text-white rounded-full text-base sm:text-lg font-semibold hover:bg-[#0056CC] transition-all duration-200 group shadow-lg shadow-[#007AFF]/20"
              >
                Découvrir les tendances
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Bandeau défilant avec logos de marques — Style Premium Apple */}
          <div className="relative mt-16 sm:mt-24 lg:mt-32">
            <div className="w-full py-2 bg-white overflow-hidden">
              {/* Le masque dégradé responsive */}
              <div className="relative w-full flex overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_15%,_black_85%,transparent_100%)]">

                {/* La bande qui défile */}
                <div className="flex animate-infinite-scroll hover:[animation-play-state:paused] py-4">
                  {[...brands, ...brands, ...brands].map((brand, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center flex-shrink-0 px-8 sm:px-12 md:px-20 transition-all duration-500 hover:scale-110 opacity-40 hover:opacity-100"
                    >
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="h-6 sm:h-9 md:h-11 w-auto object-contain grayscale mix-blend-multiply contrast-[1.8] brightness-[1.2]"
                        style={{
                          transform: `scale(${isMobile ? brand.scaleMobile : brand.scaleDesktop})`
                        }}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Texte décoratif ou indicateur sous le slider — Traduit en français */}
            <div className="flex justify-center mt-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6e6e73]/40 text-center px-4">
                Outfity Intelligence • Détection Virale • Prédiction de Style • Trend Radar 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
