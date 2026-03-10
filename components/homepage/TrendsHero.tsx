'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard, CheckCircle2, TrendingUp, Sparkles, Package, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const brands = [
  { name: 'NIKE', logo: '/images/brand-logos/nike.webp', scaleDesktop: 1.4, scaleMobile: 1.1 },
  { name: 'ADIDAS', logo: '/images/brand-logos/Adidas.webp', scaleDesktop: 2.2, scaleMobile: 1.5 },
  { name: 'ZARA', logo: '/images/brand-logos/zara.PNG', scaleDesktop: 2.2, scaleMobile: 1.5 },
  { name: 'H&M', logo: '/images/brand-logos/H&M.webp', scaleDesktop: 1.8, scaleMobile: 1.2 },
  { name: 'UNIQLO', logo: '/images/brand-logos/uniqlo.webp', scaleDesktop: 2.8, scaleMobile: 1.8 },
  { name: 'MANGO', logo: '/images/brand-logos/mango.webp', scaleDesktop: 1.1, scaleMobile: 0.9 },
  { name: 'TRAPSTAR', logo: '/images/brand-logos/trapstar.webp', scaleDesktop: 3.8, scaleMobile: 2.2 },
  { name: 'STONE ISLAND', logo: '/images/brand-logos/Stone Island.webp', scaleDesktop: 2.8, scaleMobile: 1.8 },
  { name: 'CARHARTT', logo: '/images/brand-logos/Carhartt.webp', scaleDesktop: 1.4, scaleMobile: 1.0 },
  { name: 'JACQUEMUS', logo: '/images/brand-logos/jacquemus.webp', scaleDesktop: 1.3, scaleMobile: 1.0 },
  { name: 'MASSIMO DUTTI', logo: '/images/brand-logos/Massimo Dutti.webp', scaleDesktop: 0.9, scaleMobile: 0.7 },
];

const proofPoints = [
  'Aucune carte requise',
  'Accès immédiat',
  'Sans engagement',
];

const mobileFeatures = [
  { icon: TrendingUp, label: 'Radar TikTok', desc: 'Tendances en temps réel' },
  { icon: Sparkles, label: 'Agents IA', desc: '5 experts spécialisés' },
  { icon: Package, label: 'Tech Pack', desc: 'Fiches techniques pro' },
  { icon: ShoppingBag, label: 'Sourcing', desc: 'Fournisseurs vérifiés' },
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
    <section className="bg-white overflow-hidden relative">

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg, #00000008 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── HEADLINE + CTA ── */}
      <div className="w-full max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-24 pb-10 sm:pb-14 relative z-10">
        <div
          className={cn(
            'text-center transition-all duration-1000',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          )}
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#007AFF]/20 bg-[#007AFF]/5 mb-5 sm:mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.18em] text-[#007AFF]">Accès immédiat · Plan Starter gratuit</span>
          </div>

          {/* Headline - taille adaptée mobile */}
          <h1 className="text-[2.6rem] leading-[1] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[88px] font-black tracking-tight text-[#1D1D1F] uppercase sm:leading-[0.88] px-1 mb-5 sm:mb-7">
            Lance ta marque{' '}
            <span className="sm:block">de vêtement en{' '}</span>
            <span className="text-[#007AFF]">30&nbsp;jours.</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#86868B] font-medium max-w-sm sm:max-w-xl mx-auto leading-relaxed mb-7 sm:mb-8 px-2">
            Tu n&apos;es plus seul. Virgil t&apos;aide à lire le marché, Pharrell t&apos;accompagne sur tes designs, Ada te guide sur le sourcing, Johan te conseille pour ta boutique, Joy t&apos;aide à créer ton contenu.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5 sm:mb-6">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 bg-[#1D1D1F] text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#007AFF] transition-all duration-300 group shadow-lg shadow-black/10"
              >
                <LayoutDashboard className="w-4 h-4" />
                Accéder au Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 bg-[#007AFF] text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#1D1D1F] transition-all duration-300 group shadow-lg shadow-[#007AFF]/25"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>

          {/* Proof points */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {proofPoints.map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#007AFF] shrink-0" />
                <span className="text-xs text-[#86868B] font-medium">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MOBILE: Feature pills au lieu du screenshot ── */}
      <div className="sm:hidden relative z-10 px-5 pb-10">
        <div className="grid grid-cols-2 gap-3">
          {mobileFeatures.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 p-4 bg-[#F5F5F7] rounded-2xl border border-black/5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-black/5 shrink-0">
                <Icon className="w-4 h-4 text-[#007AFF]" />
              </div>
              <div>
                <p className="text-xs font-black text-[#1D1D1F] uppercase tracking-wide">{label}</p>
                <p className="text-[11px] text-[#86868B] mt-0.5 leading-tight">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DESKTOP: Screenshot du dashboard ── */}
      <div
        className={cn(
          'hidden sm:block relative w-full pb-10 sm:pb-16 mt-2 transition-all duration-1000 delay-200',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        )}
      >
        {/* Glow */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
          <div className="w-[80%] max-w-4xl h-[300px] bg-gradient-to-tr from-[#007AFF]/15 to-purple-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div
            className="rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]"
            style={{ transform: 'perspective(2000px) rotateX(2deg)', transformOrigin: 'top center' }}
          >
            {/* Browser chrome */}
            <div className="bg-[#F5F5F7] h-10 flex items-center px-4 gap-3 border-b border-black/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-black/10" />
              </div>
              <div className="flex-1 max-w-xs mx-auto">
                <div className="bg-white rounded-md h-[22px] flex items-center justify-center px-3 shadow-sm border border-black/5">
                  <span className="text-[10px] text-gray-400 font-mono">app.outfity.fr/launch-map</span>
                </div>
              </div>
            </div>

            <Image
              src="/images/dashboard-mockup-real.png"
              alt="Interface OUTFITY - Dashboard Launch Map"
              width={1920}
              height={1080}
              className="w-full h-auto block"
              priority
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* ── BRAND LOGOS STRIP (visible sur tous les écrans) ── */}
      <div className="relative z-10 w-full pt-6 sm:pt-10 pb-14 sm:pb-20 overflow-hidden bg-white">
        <p className="text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[#C7C7CC] mb-7 sm:mb-8 px-4">
          Inspiré par les stratégies de
        </p>

        <div className="relative w-full flex overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_15%,_black_85%,transparent_100%)]">
          <div className="flex animate-infinite-scroll hover:[animation-play-state:paused] py-3">
            {[...brands, ...brands, ...brands].map((brand, index) => (
              <div
                key={index}
                className="flex items-center justify-center flex-shrink-0 px-6 sm:px-10 md:px-16 transition-all duration-500 hover:scale-110 opacity-40 hover:opacity-90"
              >
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={100}
                  height={40}
                  className="h-5 sm:h-8 md:h-10 w-auto object-contain grayscale mix-blend-multiply contrast-[1.8] brightness-[1.2]"
                  style={{ transform: `scale(${isMobile ? brand.scaleMobile : brand.scaleDesktop})` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
