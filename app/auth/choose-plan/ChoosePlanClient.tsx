'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles, Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // On définit une fin de promo fixe : 1er Avril 2026 à Minuit
    const PROMO_END_DATE = new Date('2026-04-01T00:00:00').getTime();

    const calculateTimeLeft = () => {
      const difference = PROMO_END_DATE - Date.now();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    // Initial set
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (PROMO_END_DATE - Date.now() <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 text-[#FF3B30] font-bold text-[10px] sm:text-xs mb-4 bg-red-50 py-1.5 px-3 rounded-full border border-red-100">
      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
      <span>SÉANCE PROMO : {timeLeft.days}j {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s</span>
    </div>
  );
}

const plans = [
  {
    name: 'Starter',
    price: 0,
    period: '/ mois',
    description: 'Virgil t\'aide à poser les bases de ta stratégie.',
    agents: [
      { name: 'Virgil', img: '/images/agents/virgil_final.webp', role: "Je définis ta stratégie", isUnlocked: true },
      { name: 'Pharrell', img: '/images/agents/pharrell_final.webp', role: "Je conçois ton produit", isUnlocked: false },
      { name: 'Ada', img: '/images/agents/ada_final.webp', role: "Je trouve ton usine", isUnlocked: false },
      { name: 'Joy', img: '/images/agents/joy_final.webp', role: "J'écris tes scripts", isUnlocked: false },
      { name: 'Johan', img: '/images/agents/johan_final.webp', role: "Je crée ta boutique", isUnlocked: false },
    ],
    cta: 'Démarrer avec Virgil',
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
    agents: [
      { name: 'Virgil', img: '/images/agents/virgil_final.webp', role: "Je définis ta stratégie", isUnlocked: true },
      { name: 'Pharrell', img: '/images/agents/pharrell_final.webp', role: "Je conçois ton produit", isUnlocked: true },
      { name: 'Ada', img: '/images/agents/ada_final.webp', role: "Je trouve ton usine", isUnlocked: true },
      { name: 'Joy', img: '/images/agents/joy_final.webp', role: "J'écris tes scripts", isUnlocked: true },
      { name: 'Johan', img: '/images/agents/johan_final.webp', role: "Je crée ta boutique", isUnlocked: true },
    ],
    cta: 'Démarrer l\'essai gratuit',
    ctaStyle: 'solid',
    popular: true,
    isFree: false,
  },
];

export function ChoosePlanClient({ userPlan, onboardingCompleted }: { userPlan?: string, onboardingCompleted?: boolean }) {
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
    <div className="min-h-screen flex flex-col items-center py-10 sm:py-20 bg-white overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Bouton retour */}
        <div className="mb-8">
          <Link
            href={onboardingCompleted ? '/dashboard' : '/onboarding'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Retour
          </Link>
        </div>

        <div className="mb-10 sm:mb-16 text-center">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#000000] mb-3 sm:mb-4 leading-tight">
            Choisissez votre plan
          </h1>
          <p className="text-base sm:text-xl text-[#6e6e73] font-normal max-w-2xl mx-auto">
            Commencez gratuitement, puis évoluez selon votre croissance
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm text-center max-w-4xl mx-auto font-medium shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={cn(
                'relative bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 border flex flex-col',
                plan.popular
                  ? 'border-[#007AFF] shadow-xl shadow-[#007AFF]/10'
                  : 'border-[#F2F2F2]',
                'transition-all duration-500 hover:scale-[1.01]',
                isVisible ? 'opacity-100' : 'opacity-0 translate-y-4'
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {plan.popular && <CountdownTimer />}

              <div className="mb-8 flex-1">
                <h3 className="text-xl font-bold tracking-tight text-[#000000] mb-4">
                  {plan.name}
                </h3>
                {
                  plan.price !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[#000000]">
                        {plan.price}€/mois
                      </span>
                      {plan.oldPrice && (
                        <span className="text-xl text-[#86868B] line-through decoration-red-500/50">
                          {plan.oldPrice}€
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-[#000000]">
                      Sur mesure
                    </div>
                  )
                }
                < p className="text-sm text-[#6e6e73] font-normal mt-3 mb-4" >
                  {plan.description}
                </p>

                <div className="space-y-4 mb-8">
                  {plan.agents.map((agent) => (
                    <div key={agent.name} className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={agent.img}
                          alt={agent.name}
                          className={cn(
                            "w-10 h-10 rounded-full border border-black/10 object-cover",
                            !agent.isUnlocked && "grayscale opacity-40"
                          )}
                        />
                        {!agent.isUnlocked && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-black/10">
                            <Lock className="w-3 h-3 text-amber-500" />
                          </div>
                        )}
                        {agent.isUnlocked && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-black/10">
                            <Check className="w-3 h-3 text-[#007AFF]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-bold",
                          agent.isUnlocked ? "text-[#1D1D1F]" : "text-[#86868B]"
                        )}>
                          {agent.name}
                        </p>
                        <p className={cn(
                          "text-xs mt-0.5",
                          agent.isUnlocked ? "text-[#6e6e73]" : "text-[#86868B] italic"
                        )}>
                          &quot;{agent.role}&quot;
                        </p>
                      </div>
                    </div>
                  ))}

                  {!plan.isFree && (
                    <div className="pt-4 mt-4 border-t border-black/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#007AFF]" />
                        <span className="text-sm font-bold text-[#1D1D1F]">Plus tous les avantages Pros :</span>
                      </div>
                      <ul className="space-y-2 mt-2">
                        {['3 JOURS D\'ESSAI GRATUIT', 'Analyses de tendances illimitées', 'Création de Tech Packs PDF', 'Mails pro pour fournisseurs'].map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-[#6e6e73]">
                            <Check className="w-3.5 h-3.5 text-[#007AFF] mt-0.5 shrink-0" />
                            <span className={idx === 0 ? "text-[#007AFF] font-bold" : ""}>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Warnings and CTA buttons at the bottom */}
              <div className="mt-auto">
                {plan.isFree ? (
                  <>
                    <Link
                      href={onboardingCompleted ? "/dashboard" : "/onboarding"}
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
          ))
          }
        </div >

        <div className="text-center mt-12">
          <p className="text-sm text-[#6e6e73] font-normal max-w-lg mx-auto leading-relaxed">
            *Offre de lancement : 29€/mois à vie (au lieu de 39€) si vous souscrivez pendant la promo. 3 jours d'essai gratuit. Annulable à tout moment. Paiement sécurisé par Stripe.
          </p>
        </div>
      </div >
    </div >
  );
}
