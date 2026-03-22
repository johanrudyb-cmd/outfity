'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const countries = [
  { name: 'Portugal', flag: '🇵🇹', suppliers: 247 },
  { name: 'Turquie', flag: '🇹🇷', suppliers: 189 },
  { name: 'Chine', flag: '🇨🇳', suppliers: 523 },
  { name: 'France', flag: '🇫🇷', suppliers: 156 },
];

const successModels = [
  'Stratégie Omni-canal',
  'Lancement Viral',
  'Positionnement Premium',
  'Approche Durable',
  'Mode Rapide',
];

export function BusinessUnitGrid() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState(0);
  const [cost, setCost] = useState(25);
  const [price, setPrice] = useState(79);

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

    const element = document.getElementById('business-unit-grid');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const margin = price - cost;
  const marginPercentage = price > 0 ? Math.round((margin / price) * 100) : 0;

  return (
    <section id="business-unit-grid" className="py-24 bg-[#F5F5F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre */}
        <div className="mb-16 text-center">
          <h2 className="text-5xl lg:text-6xl font-bold tracking-tight text-[#000000] mb-4">
            Business Unit
          </h2>
          <p className="text-xl text-[#6e6e73] font-light max-w-2xl mx-auto">
            Outils essentiels pour créer et gérer votre marque
          </p>
        </div>

        {/* Grille Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bloc Sourcing - Pays */}
          <div
            className={cn(
              'bg-white rounded-[32px] p-8 shadow-sm border border-gray-100',
              'transition-all duration-500',
              'hover:scale-[1.02] hover:shadow-md',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <h3 className="text-2xl font-bold tracking-tight text-[#000000] mb-6">
              Sourcing
            </h3>
            <div className="space-y-4">
              {countries.map((country, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <span className="text-base font-semibold text-[#000000]">
                      {country.name}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-[#000000]">
                    {country.suppliers}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/sourcing"
              className="mt-6 inline-flex items-center gap-2 text-sm text-[#007aff] hover:underline group"
            >
              Explorer tous les pays
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Bloc Stratégie - Modèles de réussite */}
          <div
            className={cn(
              'bg-white rounded-[32px] p-8 shadow-sm border border-gray-100',
              'transition-all duration-500',
              'hover:scale-[1.02] hover:shadow-md',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <h3 className="text-2xl font-bold tracking-tight text-[#000000] mb-6">
              Modèles de réussite
            </h3>
            <div className="space-y-2">
              {successModels.map((model, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedModel(index)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl transition-all duration-200',
                    'border-2',
                    selectedModel === index
                      ? 'bg-[#000000] text-white border-[#000000]'
                      : 'bg-[#F5F5F7] text-[#000000] border-transparent hover:border-gray-200'
                  )}
                >
                  <span className="text-base font-semibold">{model}</span>
                </button>
              ))}
            </div>
            <Link
              href="/launch-map/phase/1"
              className="mt-6 inline-flex items-center gap-2 text-sm text-[#007aff] hover:underline group"
            >
              Appliquer ce modèle
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Bloc Calculateur - Marge */}
          <div
            className={cn(
              'bg-white rounded-[32px] p-8 shadow-sm border border-gray-100',
              'transition-all duration-500',
              'hover:scale-[1.02] hover:shadow-md',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            <h3 className="text-2xl font-bold tracking-tight text-[#000000] mb-6">
              Calculateur de marge
            </h3>
            <div className="space-y-6">
              {/* Prix de revient */}
              <div>
                <label className="block text-sm font-semibold text-[#000000] mb-2">
                  Prix de revient
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="flex-1 px-4 py-3 bg-[#F5F5F7] rounded-xl border border-gray-200 text-[#000000] font-bold text-lg focus:outline-none focus:border-[#000000]"
                  />
                  <span className="text-lg font-bold text-[#000000]">€</span>
                </div>
              </div>

              {/* Prix de vente */}
              <div>
                <label className="block text-sm font-semibold text-[#000000] mb-2">
                  Prix de vente
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="flex-1 px-4 py-3 bg-[#F5F5F7] rounded-xl border border-gray-200 text-[#000000] font-bold text-lg focus:outline-none focus:border-[#000000]"
                  />
                  <span className="text-lg font-bold text-[#000000]">€</span>
                </div>
              </div>

              {/* Résultat */}
              <div className="pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6e6e73] font-light">Marge</span>
                    <span className="text-2xl font-bold text-[#000000]">
                      {margin.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6e6e73] font-light">Marge %</span>
                    <span className="text-2xl font-bold text-[#000000]">
                      {marginPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/launch-map/phase/2"
              className="mt-6 inline-flex items-center gap-2 text-sm text-[#007aff] hover:underline group"
            >
              Calculer en détail
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
