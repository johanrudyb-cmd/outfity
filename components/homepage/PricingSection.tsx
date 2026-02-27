'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 29, hours: 23, minutes: 54, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 text-[#FF3B30] font-bold text-[10px] sm:text-xs mb-4 bg-red-50 py-1.5 px-3 rounded-full border border-red-100">
      <Clock className="w-4 h-4" />
      <span>PROMO FINIT DANS : {timeLeft.days}j {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m</span>
    </div>
  );
}

const plans = [
  {
    name: 'Starter',
    price: '0€',
    period: '/ Starter',
    description: 'Ton équipe d\'experts IA (Virgil, Pharrell, Ada) t\'accompagne.',
    features: [
      'Accès à 3 Agents IA (Limité)',
      'Analyses de style détaillées (Limité)',
      'Radar de Tendances (Limité)',
      'Calculateur de Rentabilité',
    ],
    cta: 'Commencer gratuitement',
    popular: false,
  },
  {
    name: 'Créateur',
    price: '29€',
    oldPrice: '39€',
    period: '/mois*',
    description: 'Offre limitée : 29€/mois à vie (au lieu de 39€).',
    features: [
      '3 JOURS D\'ESSAI GRATUIT',
      'Les 5 agents IA inclus',
      'Stratégie marketing complète',
      'Analyses de style détaillées',
      'Shooting Virtuel & Mannequin IA',
      'Mockups & Tech Packs',
      'Création de Boutique Shopify',
      'Accès complet au Radar de tendances',
      'Fournisseurs de confiance',
    ],
    cta: 'Démarrer l\'essai gratuit',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Sur mesure',
    period: '',
    description: 'Pour les marques établies',
    features: [
      'Tout du plan Pro',
      'API personnalisée',
      'Gestion multi-marques',
      'Conseiller dédié',
      'Formation personnalisée',
      'Support 24/7',
      'SLAs garantis',
    ],
    cta: 'Nous contacter',
    popular: false,
  },
];

export function PricingSection() {
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

    const element = document.getElementById('pricing-section');
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
      id="pricing-section"
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
            Des offres adaptées à vos besoins
          </h2>
          <p className="text-xl text-[#1D1D1F]/70 max-w-2xl mx-auto">
            Commencez avec le plan Starter, puis évoluez selon votre croissance
          </p>
        </div>

        {/* Grille de plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                'relative bg-white rounded-3xl p-8 shadow-apple',
                'border-2 transition-all duration-500',
                plan.popular
                  ? 'border-[#007AFF] shadow-apple-lg scale-105'
                  : 'border-black/5 hover:shadow-apple-lg hover:scale-[1.02]',
                'animate-stagger',
                isVisible ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >

              {/* Header */}
              {plan.popular && <CountdownTimer />}
              <div className="mb-6">
                <h3 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#1D1D1F]">
                    {plan.price}
                  </span>
                  {plan.oldPrice && (
                    <span className="text-xl text-[#86868B] line-through decoration-red-500/50">
                      {plan.oldPrice}
                    </span>
                  )}
                  {plan.period && (
                    <span className="text-lg text-[#1D1D1F]/60">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#1D1D1F]/60 mt-2 mb-4">
                  {plan.description}
                </p>

                {/* Agents Avatars */}
                <div className="flex items-center gap-1.5 mb-6">
                  {[
                    { name: 'Virgil', img: '/images/agents/virgil_final.png' },
                    { name: 'Pharrell', img: '/images/agents/pharrell_final.png' },
                    { name: 'Ada', img: '/images/agents/ada_final.png' },
                    { name: 'Johan', img: '/images/agents/johan_final.png' },
                    { name: 'Joy', img: '/images/agents/joy_final.png' }
                  ].map((agent) => (
                    <div key={agent.name} className="relative group/agent">
                      <img
                        src={agent.img}
                        alt={agent.name}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover bg-slate-100"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/agent:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {agent.name}
                      </div>
                    </div>
                  ))}
                  <span className="text-[10px] font-bold text-[#007AFF] ml-1 uppercase tracking-wider">L'équipe IA</span>
                </div>
              </div>

              {/* Liste de fonctionnalités */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-start gap-3"
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        plan.popular ? 'bg-[#007AFF]' : 'bg-[#34C759]'
                      )}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      feature === "3 JOURS D'ESSAI GRATUIT" ? "text-[#007AFF] font-bold" : "text-[#1D1D1F]/70"
                    )}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={plan.name === 'Enterprise' ? '/contact' : '/auth/signup'}>
                <Button
                  className={cn(
                    'w-full h-12 font-semibold transition-all duration-300',
                    'bg-[#007AFF] hover:bg-[#0056CC] text-white shadow-lg shadow-[#007AFF]/10'
                  )}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Note de bas de page */}
        <div className="text-center mt-12">
          <p className="text-sm text-[#1D1D1F]/60">
            *Offre de lancement : 29€/mois à vie (au lieu de 39€) si vous souscrivez pendant la promo. 3 jours d'essai gratuit. Annulation à tout moment.
          </p>
        </div>
      </div>
    </section>
  );
}
