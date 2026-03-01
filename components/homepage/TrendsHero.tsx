'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
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
    <section className="bg-white min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)] flex flex-col justify-center py-12 sm:py-16 lg:py-20 overflow-hidden relative">
      {/* Background Decor - Fashion Inspired */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] border-[40px] border-black rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] border-[2px] border-black rotate-45" />
        <div className="absolute bottom-[-10%] left-[20%] w-[25%] h-[25%] bg-black rounded-full blur-[120px]" />

        {/* Abstract Fashion Grid */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-4 p-8">
          {[
            '2 / 3', '4 / 5', '1 / 6', '5 / 2', '6 / 4', '3 / 1',
            '2 / 6', '5 / 4', '1 / 2', '4 / 1', '6 / 5', '3 / 3'
          ].map((area, i) => (
            <div
              key={i}
              className={cn(
                "border border-black flex items-center justify-center text-[10px] font-black uppercase tracking-widest",
                i % 3 === 0 ? "opacity-100" : "opacity-0"
              )}
              style={{ gridArea: area }}
            >
              Mode // Tech
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className={cn(
            'text-center space-y-6 sm:space-y-8 transition-all duration-1000',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12'
          )}
        >
          {/* Titre principal */}
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-black mb-6 sm:mb-8 px-2 uppercase leading-[0.95] sm:leading-[0.9]">
              Créez votre marque de vêtements <br className="hidden sm:block" />
              avec les données <span className="text-[#007AFF]">des géants.</span>
            </h1>
            <p className="text-sm sm:text-lg lg:text-lg text-gray-500 font-medium max-w-2xl mx-auto mb-8 sm:mb-12 px-4 leading-relaxed">
              Propulsez votre univers créatif grâce aux tendances virales de <span className="text-black font-bold">TikTok</span>. Plus besoin de deviner ce qui marchera.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-black text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#007AFF] transition-all duration-300 group shadow-2xl shadow-black/20"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Accéder au Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#007AFF] text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-black transition-all duration-300 group shadow-lg shadow-[#007AFF]/20"
                >
                  Commencer maintenant
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
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
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={100}
                        height={40}
                        className="h-6 sm:h-9 md:h-11 w-auto object-contain grayscale mix-blend-multiply contrast-[1.8] brightness-[1.2]"
                        style={{
                          transform: `scale(${isMobile ? brand.scaleMobile : brand.scaleDesktop})`
                        }}
                        unoptimized
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
