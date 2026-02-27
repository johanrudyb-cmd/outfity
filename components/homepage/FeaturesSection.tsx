'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Factory,
  TrendingUp,
  Calendar,
  Store,
  FileText,
  Target,
  Megaphone,
  Camera,
} from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Design Studio IA',
    description: 'Créez vos designs avec l\'IA et préparez vos tech packs techniques.',
    color: '#007AFF',
  },
  {
    icon: Factory,
    title: 'Sourcing Hub',
    description: 'Accédez à notre réseau d\'usines et obtenez des devis pour votre production.',
    color: '#34C759',
  },
  {
    icon: Camera,
    title: 'Scanner Visuel IA',
    description: 'Analysez le potentiel d\'un produit à partir d\'une simple photo.',
    color: '#FF9500',
  },
  {
    icon: Calendar,
    title: 'Contenu Marketing IA',
    description: 'Planifiez vos posts et générez du contenu marketing avec l\'IA.',
    color: '#FF3B30',
  },
  {
    icon: Store,
    title: 'Intégration Shopify',
    description: 'Connectez votre boutique et lancez vos ventes sur Shopify.',
    color: '#5856D6',
  },
  {
    icon: FileText,
    title: 'Tech Packs Techniques',
    description: 'Créez des dossiers techniques précis pour la production de vos modèles.',
    color: '#007AFF',
  },
  {
    icon: Target,
    title: 'Stratégie de marque',
    description: 'Définissez votre identité, votre positionnement et votre stratégie marketing.',
    color: '#34C759',
  },
  {
    icon: Megaphone,
    title: 'UGC Lab',
    description: 'Générez des scripts de contenu et des visuels pour vos réseaux sociaux.',
    color: '#FF9500',
  },
];

export function FeaturesSection() {
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

    const element = document.getElementById('features-section');
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
    <section
      id="features-section"
      className="relative py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Titre */}
        <div
          className={cn(
            'text-center mb-20 transition-all duration-700',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          )}
        >
          <h2 className="text-5xl lg:text-6xl font-semibold tracking-tight text-[#1D1D1F] mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-[#1D1D1F]/70 max-w-2xl mx-auto">
            Une plateforme complète pour créer, produire et lancer votre marque
          </p>
        </div>

        {/* Grille de features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={cn(
                  'group relative bg-white rounded-3xl p-8 shadow-apple',
                  'border border-black/5',
                  'transition-all duration-500',
                  'hover:shadow-apple-lg hover:scale-[1.02]',
                  'animate-stagger',
                  isVisible ? 'opacity-100' : 'opacity-0'
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Icône avec couleur */}
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center mb-6',
                    'transition-all duration-300',
                    'group-hover:scale-110'
                  )}
                  style={{
                    backgroundColor: `${feature.color}15`,
                  }}
                >
                  <Icon
                    className="w-7 h-7"
                    style={{
                      color: feature.color,
                    }}
                  />
                </div>

                {/* Titre et description */}
                <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F] mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#1D1D1F]/60 leading-relaxed">
                  {feature.description}
                </p>

                {/* Ligne décorative au hover */}
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl',
                    'transition-all duration-300',
                    'group-hover:opacity-100 opacity-0'
                  )}
                  style={{
                    background: `linear-gradient(90deg, ${feature.color}, ${feature.color}80)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
