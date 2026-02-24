'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight, Globe, TrendingUp, Star, ExternalLink, FileText } from 'lucide-react';
import { getBrandLogoUrl, brandNameToSlug, CURATED_TOP_BRANDS } from '@/lib/curated-brands';
import { REFERENCE_BRAND_WEBSITES } from '@/lib/constants/audience-reference-brands';
import { BrandLogo } from '@/components/brands/BrandLogo';
import { HOMEPAGE_FEATURED_FACTORIES } from '@/lib/homepage-featured-factories';


// Marques populaires à afficher (top 6)
// Marques populaires à afficher (top 4 exemples - 2x2)
const featuredBrands = [
  { name: 'ZARA', slug: 'zara' },
  { name: 'NIKE', slug: 'nike' },
  { name: 'ADIDAS', slug: 'adidas' },
  { name: 'H&M', slug: 'hm' },
].map(b => {
  const k = b.name.toLowerCase().trim();
  const siteUrl = Object.entries(REFERENCE_BRAND_WEBSITES).find(([name]) => name.toLowerCase().trim() === k)?.[1] || null;
  return {
    ...b,
    logoUrl: getBrandLogoUrl(b.name, siteUrl),
    siteUrl: siteUrl
  };
});

export function FoundationGrid() {
  const router = useRouter();
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

    const element = document.getElementById('features');
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
    <section id="features" className="py-24 bg-[#F5F5F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête de section */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#000000] mb-3 sm:mb-4">
            Fondations de votre marque
          </h2>
          <p className="text-base sm:text-xl text-[#6e6e73] font-light max-w-2xl mx-auto px-2">
            Les outils essentiels pour construire et lancer votre marque de vêtements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bloc Sourcing avec carte du monde */}
          <div
            className={cn(
              'bg-white rounded-2xl sm:rounded-[32px] p-6 sm:p-12 border border-[#F2F2F2] shadow-sm',
              'transition-all duration-500',
              'hover:shadow-lg hover:scale-[1.01]',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#007AFF]/10 flex items-center justify-center">
                <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-[#007AFF]" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000]">
                  Sourcing Hub
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] font-normal mt-1">
                  Trouvez les meilleurs fournisseurs
                </p>
              </div>
            </div>

            <p className="text-base text-[#6e6e73] font-normal mb-8 leading-relaxed">
              Base de données d'<strong className="text-[#000000]">usines vérifiées</strong> dans le monde entier. Filtrez par pays, MOQ, spécialités et envoyez vos tech packs directement pour obtenir des devis.
            </p>

            {/* Cartes de fournisseurs (liste fixe, indépendante de l'app) */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              {HOMEPAGE_FEATURED_FACTORIES.map((factory) => (
                <div
                  key={factory.id}
                  className="p-6 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7] transition-all duration-300 hover:bg-[#E5E5E7] hover:border-[#D5D5D7]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className="text-lg font-bold text-[#000000]"
                          style={{ filter: 'blur(8px)', userSelect: 'none', pointerEvents: 'none' }}
                        >
                          {factory.name}
                        </h4>
                        {factory.rating && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#007AFF]/10 border border-[#007AFF]/20">
                            <Star className="w-3 h-3 fill-[#007AFF] text-[#007AFF]" />
                            <span className="text-xs font-semibold text-[#007AFF]">
                              {factory.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-[#6e6e73] font-normal">
                        {factory.country} • MOQ: {factory.moq} • <span style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>Délai: {factory.leadTime} jours</span>
                      </p>
                    </div>
                  </div>

                  {/* Spécialités */}
                  {factory.specialties.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#E5E5E7]">
                      <div className="flex flex-wrap gap-2">
                        {factory.specialties.slice(0, 3).map((specialty, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-white text-[#007AFF] rounded font-medium border border-[#007AFF]/20"
                          >
                            {specialty}
                          </span>
                        ))}
                        {factory.specialties.length > 3 && (
                          <span className="px-2 py-1 text-xs text-[#6e6e73] bg-white rounded border border-[#E5E5E7]">
                            +{factory.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {factory.certifications.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {factory.certifications.map((cert, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-white text-[#34C759] rounded font-medium border border-[#34C759]/20"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

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
              Explorer tous les pays
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Bloc Stratégie */}
          <div
            className={cn(
              'bg-white rounded-2xl sm:rounded-[32px] p-6 sm:p-12 border border-[#F2F2F2] shadow-sm',
              'transition-all duration-500',
              'hover:shadow-lg hover:scale-[1.01]',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
            style={{ transitionDelay: '100ms' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#007AFF]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-[#007AFF]" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#000000]">
                  Stratégie de marque
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] font-normal mt-1">
                  Analysez et répliquez les meilleures stratégies
                </p>
              </div>
            </div>

            <p className="text-base text-[#6e6e73] font-normal mb-8 leading-relaxed">
              Analysez les stratégies des grandes marques. Identifiez leur positionnement, leur cible, leurs canaux de distribution et leurs prix. <strong className="text-[#000000]">Répliquez ce qui fonctionne</strong> pour votre marque.
            </p>

            {/* Grille de marques de référence */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {featuredBrands.map((brand) => {
                const logoUrl = brand.logoUrl;
                return (
                  <button
                    key={brand.slug}
                    onClick={() => {
                      const element = document.querySelector('#pricing-section');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="group flex flex-col rounded-xl border-2 border-[#E5E5E7] overflow-hidden transition-all hover:border-[#007AFF]/40 hover:bg-muted/5 text-left"
                  >
                    <div className="aspect-square w-full bg-[#F5F5F7] flex items-center justify-center p-4">
                      {logoUrl ? (
                        <BrandLogo logoUrl={logoUrl} brandName={brand.name} className="w-12 h-12" />
                      ) : (
                        <span className="text-xl font-bold text-[#6e6e73]">
                          {brand.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-white w-full border-t border-[#E5E5E7]">
                      <p className="font-bold text-[#000000] text-xs truncate mb-1">
                        {brand.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#007AFF] font-semibold">
                        <FileText className="w-3.5 h-3.5" />
                        Voir la stratégie
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

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
              Analyser une marque
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
