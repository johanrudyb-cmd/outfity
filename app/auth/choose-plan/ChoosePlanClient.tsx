'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionWarning } from '@/components/subscription/SubscriptionWarning';

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
    name: 'Starter',
    price: 0,
    period: '/ mois',
    description: 'Ton équipe d\'experts IA (Virgil, Pharrell, Ada) t\'accompagne.',
    features: [
      'Accès à 3 Agents IA (Virgil, Pharrell, Ada)',
      'Radar de Tendances (Limité)',
      'Calculateur de Rentabilité',
      'Studio Design (5 designs / mois)',
      'Sourcing Hub (Aperçu)',
    ],
    cta: 'Continuer gratuitement',
    ctaStyle: 'border',
    popular: false,
    isFree: true,
  },
  {
    name: 'Créateur',
    price: 29,
    oldPrice: 39,
    period: '/mois*',
    description: 'Offre limitée : 29€/mois à vie (au lieu de 39€).',
    features: [
      '3 JOURS D\'ESSAI GRATUIT',
      'Équipe Complète (4 Agents IA dont Johan)',
      'Stratégie Marketing & ADN de Marque',
      'Designs & Mockups en Illimité',
      'Tech Packs Professionnels IA',
      'Radar de Tendances Premium',
      'Sourcing Premium & Accès Usines',
      'Support Prioritaire 24/7',
    ],
    cta: 'S\'abonner au plan Créateur',
    ctaStyle: 'solid',
    popular: true,
    isFree: false,
  },
];

export function ChoosePlanClient({ userPlan }: { userPlan?: string }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canceled = searchParams.get('canceled') === 'true';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (canceled) {
      setError('Paiement annulé. Vous pouvez réessayer ou continuer en gratuit.');
    }
  }, [canceled]);

  const handleSubscribe = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-subscription-session', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible de créer la session de paiement');
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError('Réponse serveur invalide');
    } catch (e) {
      setError('Erreur réseau. Réessayez.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-20 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-[#000000] mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-[#6e6e73] font-normal max-w-2xl mx-auto">
            Commencez gratuitement, puis évoluez selon votre croissance
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm text-center max-w-4xl mx-auto font-medium shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                'relative bg-white rounded-[32px] p-10 border flex flex-col',
                plan.popular
                  ? 'border-[#007AFF] shadow-xl shadow-[#007AFF]/10'
                  : 'border-[#F2F2F2]',
                'transition-all duration-500 hover:scale-[1.01]',
                isVisible ? 'opacity-100' : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 cursor-default">
                  <div className="bg-[#007AFF] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Plus Populaire
                  </div>
                </div>
              )}

              {plan.popular && <CountdownTimer />}

              <div className="mb-8 flex-1">
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
                    Sur mesure
                  </div>
                )}
                <p className="text-sm text-[#6e6e73] font-normal mt-3 mb-4">
                  {plan.description}
                </p>

                <div className="flex items-center gap-1.5 mb-8">
                  {[
                    { name: 'Virgil', img: '/images/agents/virgil_final.png' },
                    { name: 'Pharrell', img: '/images/agents/pharrell_final.png' },
                    { name: 'Ada', img: '/images/agents/ada_final.png' },
                    { name: 'Johan', img: '/images/agents/johan_final.png', locked: plan.name === 'Starter' }
                  ].map((agent) => (
                    <div key={agent.name} className="relative group/agent">
                      <img
                        src={agent.img}
                        alt={agent.name}
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-sm object-cover bg-slate-100",
                          agent.locked && "opacity-40 grayscale"
                        )}
                      />
                      {agent.locked && (
                        <div className="absolute inset-0 flex items-center justify-center -translate-y-0.5">
                          <span className="text-[10px]">🔒</span>
                        </div>
                      )}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/agent:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {agent.name} {agent.locked && "(Plan Créateur)"}
                      </div>
                    </div>
                  ))}
                  <span className="text-[10px] font-bold text-[#007AFF] ml-1 uppercase tracking-wider">L'équipe IA</span>
                </div>

                <ul className="space-y-4">
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
              </div>

              {/* Warnings and CTA buttons at the bottom */}
              <div className="mt-auto">
                {plan.isFree ? (
                  <>
                    <div className="mb-4">
                      <SubscriptionWarning context="upgrade" />
                    </div>
                    <Link
                      href="/dashboard"
                      className={cn(
                        'flex items-center justify-center gap-2 w-full text-center py-4 rounded-xl text-base font-semibold transition-all duration-200',
                        'bg-white text-[#1D1D1F] border-2 border-[#F2F2F2] hover:border-[#007AFF] hover:text-[#007AFF]'
                      )}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={loading}
                    className={cn(
                      'flex items-center justify-center gap-2 w-full py-4 rounded-xl text-base font-semibold transition-all duration-200',
                      'bg-[#007AFF] text-white hover:bg-[#0056CC] shadow-lg shadow-[#007AFF]/25',
                      'disabled:opacity-70 disabled:cursor-not-allowed'
                    )}
                  >
                    {loading ? 'Redirection...' : plan.cta}
                    {loading ? (
                      <svg className="ml-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <ArrowRight className="w-4 h-4 ml-1" />
                    )}
                  </button>
                )}
                {plan.isFree && (
                  <p className="text-xs text-[#6e6e73] font-normal text-center mt-3">
                    Sans carte bancaire
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-[#6e6e73] font-normal max-w-lg mx-auto leading-relaxed">
            *Offre de lancement : 29€/mois à vie (au lieu de 39€) si vous souscrivez pendant la promo. 3 jours d'essai gratuit. Annulable à tout moment. Paiement sécurisé par Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
