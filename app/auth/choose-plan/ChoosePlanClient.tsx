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
    <div className="flex items-center justify-center gap-2 text-[#FF3B30] font-bold text-xs mb-4 bg-red-50 py-2 px-4 rounded-full border border-red-100 animate-pulse">
      <Clock className="w-4 h-4" />
      <span>L'OFFRE EXPIRE DANS : {timeLeft.days}j {String(timeLeft.hours).padStart(2, '0')}h</span>
    </div>
  );
}

const FREE_FEATURES = [
  'Accès limité aux 4 experts IA',
  'Scripts Marketing & Branding',
  'Accès interface Outils Créatifs',
  'Calcul financier illimité',
  'Calendrier Éditorial (Lecture)',
];

const CREATOR_FEATURES = [
  '3 JOURS D\'ESSAI GRATUIT',
  'Les 4 agents IA inclus (Virgil, Pharrell, Ada, Johan)',
  'Stratégie marketing complète',
  'Accès à l\'intégralité des fonctionnalités',
  '10 analyses de tendances par mois',
  '10 stratégies de marque par mois',
  'Packs de mockup & tech pack',
  'Sourcing Hub & Catalogues Premium',
  'Formation & support prioritaire',
];

export function ChoosePlanClient() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7] px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-[#1D1D1F] mb-3">
            Choisir mon plan
          </h1>
          <p className="text-lg text-[#6e6e73] max-w-xl mx-auto">
            Restez en gratuit pour découvrir la plateforme, ou passez au plan Créateur pour débloquer tous les outils.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Gratuit */}
          <div
            className={cn(
              'bg-white rounded-[32px] p-8 border-2 border-[#F2F2F2]',
              'transition-all duration-300 hover:border-[#E5E5E7] hover:shadow-lg'
            )}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1D1D1F]">Gratuit</h2>
              <p className="text-3xl font-bold text-[#1D1D1F] mt-2">0€</p>
              <p className="text-sm text-[#6e6e73] mt-1">Sans carte bancaire</p>
            </div>
            <ul className="space-y-3 mb-6">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-[#6e6e73] text-sm">
                  <Check className="w-5 h-5 text-[#34C759] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mb-6">
              <SubscriptionWarning context="upgrade" />
            </div>
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold',
                'bg-[#F5F5F7] text-[#1D1D1F] border-2 border-[#E5E5E7]',
                'hover:bg-[#E5E5E7] hover:border-[#D5D5D7] transition-colors'
              )}
            >
              Rester en gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Plan Créateur */}
          <div
            className={cn(
              'bg-white rounded-[32px] p-8 border-2 border-[#000000] relative',
              'transition-all duration-300 hover:shadow-xl'
            )}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#000000] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recommandé
              </span>
            </div>
            <CountdownTimer />
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1D1D1F]">Créateur</h2>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-4xl font-bold text-[#000000]">29€</p>
                <p className="text-xl text-[#86868B] line-through decoration-red-500/50">39€</p>
                <span className="text-lg font-normal text-[#6e6e73]">/ mois*</span>
              </div>
              <p className="text-sm text-[#007AFF] font-bold mt-2 bg-blue-50 py-1 px-3 rounded-lg inline-block">3 jours d'essai gratuit</p>
              <p className="text-[11px] text-[#6e6e73] mt-2 leading-tight">*Offre de lancement : 29€ à vie (au lieu de 39€) si vous souscrivez maintenant.</p>
            </div>
            <ul className="space-y-3 mb-8">
              {CREATOR_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-[#34C759] shrink-0" />
                  <span className={cn(
                    "font-medium",
                    f === "3 JOURS D'ESSAI GRATUIT" ? "text-[#007AFF] font-bold" : "text-[#6e6e73]"
                  )}>
                    {f}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className={cn(
                'flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold',
                'bg-[#000000] text-white hover:bg-[#1D1D1F] transition-colors',
                'disabled:opacity-70 disabled:cursor-not-allowed'
              )}
            >
              {loading ? 'Redirection vers le paiement…' : "S'abonner au plan Créateur"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-[#6e6e73] mt-8">
          En continuant, vous acceptez nos conditions. Paiement sécurisé par Stripe.
        </p>
      </div>
    </div>
  );
}
