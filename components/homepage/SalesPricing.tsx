'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Check, Clock } from 'lucide-react';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 29, hours: 23, minutes: 54, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev: any) => {
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
    <div className="flex items-center justify-center gap-2 text-[#FF3B30] font-bold text-[10px] sm:text-xs mb-4 bg-red-50 py-1.5 px-3 rounded-full border border-red-100 animate-pulse">
      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
      <span>SÉANCE PROMO : {timeLeft.days}j {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m</span>
    </div>
  );
}

const plans = [
  {
    name: 'Gratuit',
    price: 0,
    period: 'Gratuit',
    description: 'Ton équipe d\'experts IA (Virgil, Pharrell, Ada, Johan) t\'accompagne.',
    features: [
      'Accès limité aux 4 agents IA',
      'Accès limité au radar de tendances',
      'Calculateur de marge',
      'Aperçu des outils de création',
    ],
    cta: 'Commencer gratuitement',
    ctaStyle: 'border',
    popular: false,
  },
  {
    name: 'Créateur',
    price: 29,
    oldPrice: 39,
    period: '/mois*',
    description: 'Offre limitée : 29€/mois à vie (au lieu de 39€).',
    features: [
      '3 JOURS D\'ESSAI GRATUIT',
      'Les 4 agents IA inclus',
      'Stratégie marketing complète',
      'Accès complet au Radar de tendances',
      'Analyses de style détaillées',
      'Shooting Virtuel & Mannequin IA',
      'Mockups & Tech Packs',
      'Support prioritaire',
    ],
    cta: 'Profiter de l\'offre',
    ctaStyle: 'solid',
    popular: true,
  },
];

export function SalesPricing() {
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
    <section id="pricing-section" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre */}
        <div className="mb-16 text-center">
          <h2 className="text-5xl lg:text-6xl font-bold tracking-tight text-[#000000] mb-4">
            Choisissez votre plan
          </h2>
          <p className="text-xl text-[#6e6e73] font-normal max-w-2xl mx-auto">
            Commencez gratuitement, puis évoluez selon votre croissance
          </p>
        </div>

        {/* Grille de plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                'relative bg-white rounded-[32px] p-10 border',
                plan.popular
                  ? 'border-[#007AFF] shadow-xl shadow-[#007AFF]/10'
                  : 'border-[#F2F2F2]',
                'transition-all duration-500',
                'hover:scale-[1.01]',
                'animate-stagger',
                isVisible ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Badge populaire discret */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-[#007AFF] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Plus Populaire
                  </div>
                </div>
              )}

              {/* Header */}
              {plan.popular && <CountdownTimer />}
              <div className="mb-8">
                <h3 className="text-2xl font-bold tracking-tight text-[#000000] mb-4">
                  {plan.name}
                </h3>
                {plan.price !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-[#000000]">
                      {plan.price}€
                    </span>
                    {plan.oldPrice && (
                      <span className="text-2xl text-[#86868B] line-through decoration-red-500/50">
                        {plan.oldPrice}€
                      </span>
                    )}
                    <span className="text-lg text-[#6e6e73] font-normal">
                      {plan.period}
                    </span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-[#000000]">
                    {plan.period}
                  </div>
                )}
                <p className="text-sm text-[#6e6e73] font-normal mt-3 mb-4">
                  {plan.description}
                </p>

                {/* Agents Avatars */}
                <div className="flex items-center gap-1.5 mb-8">
                  {[
                    { name: 'Virgil', img: '/images/agents/virgil_final.png' },
                    { name: 'Pharrell', img: '/images/agents/pharrell_final.png' },
                    { name: 'Ada', img: '/images/agents/ada_final.png' },
                    { name: 'Johan', img: '/images/agents/johan_final.png' }
                  ].map((agent) => (
                    <div key={agent.name} className="relative group/agent">
                      <img
                        src={agent.img}
                        alt={agent.name}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-sm object-cover bg-slate-100"
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
                    <div className="w-5 h-5 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#007AFF]" />
                    </div>
                    <span className={cn(
                      "text-sm font-normal",
                      feature === "3 JOURS D'ESSAI GRATUIT" ? "text-blue-600 font-bold" : "text-[#6e6e73]"
                    )}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/auth/signup"
                className={cn(
                  'block w-full text-center py-4 rounded-xl text-base font-semibold transition-all duration-200',
                  plan.ctaStyle === 'solid'
                    ? 'bg-[#007AFF] text-white hover:bg-[#0056CC] shadow-lg shadow-[#007AFF]/25'
                    : 'bg-white text-[#1D1D1F] border-2 border-[#F2F2F2] hover:border-[#007AFF] hover:text-[#007AFF]'
                )}
              >
                {plan.cta}
              </Link>

              {/* Note pour plan gratuit */}
              {plan.price === 0 && (
                <p className="text-xs text-[#6e6e73] font-normal text-center mt-3">
                  Sans carte bancaire
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Note de bas de page */}
        <div className="text-center mt-12">
          <p className="text-sm text-[#6e6e73] font-normal">
            *Offre de lancement : 29€/mois à vie (au lieu de 39€) si vous souscrivez pendant la promo. 3 jours d'essai gratuit. Annulable à tout moment.
          </p>
        </div>
      </div>
    </section>
  );
}
