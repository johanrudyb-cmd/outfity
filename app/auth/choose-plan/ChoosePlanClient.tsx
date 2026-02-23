'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionWarning } from '@/components/subscription/SubscriptionWarning';

const FREE_FEATURES = [
  'Assistant IA générique (3 msgs/jour)',
  'Scripts Marketing (3/mois)',
  'Accès interface Outils Créatifs',
  'Calcul financier illimité',
  'Calendrier Éditorial (Lecture)',
];

const CREATOR_FEATURES = [
  'Accès à l\'intégralité des fonctionnalités',
  'Scanner visuel IA illimité*',
  '10 analyses de tendances par mois',
  '10 stratégies de marque par mois',
  'Générateur de logo',
  'Packs de mockup & tech pack',
  'Scripts marketing IA',
  'Shootings photo & produit',
  'Sourcing Hub complet',
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1D1D1F]">Créateur</h2>
              <p className="text-3xl font-bold text-[#1D1D1F] mt-2">34€ <span className="text-lg font-normal text-[#6e6e73]">/ mois</span></p>
              <p className="text-sm text-[#6e6e73] mt-1">Annulable à tout moment</p>
            </div>
            <ul className="space-y-3 mb-8">
              {CREATOR_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-[#6e6e73] text-sm">
                  <Check className="w-5 h-5 text-[#34C759] shrink-0" />
                  {f}
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
