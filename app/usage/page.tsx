'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsageTracker } from '@/components/usage/UsageTracker';
import { useSurplusModal } from '@/components/usage/SurplusModalContext';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isFreePlan } from '@/lib/plan-utils';

function UsagePageContent() {
  const { data: session } = useSession();
  const isFree = isFreePlan((session?.user as any)?.plan);

  const router = useRouter();
  const openSurplusModal = useSurplusModal();
  const searchParams = useSearchParams();
  const isSuccessFromUrl = searchParams.get('success') === 'true';
  const [showSuccess, setShowSuccess] = useState(isSuccessFromUrl);

  useEffect(() => {
    if (isSuccessFromUrl) {
      // Rafraîchir immédiatement + retries fréquents (webhook Stripe peut être en retard)
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
      const intervals: NodeJS.Timeout[] = [];
      // Rafraîchir toutes les 2 secondes pendant 30 secondes pour capturer le webhook
      for (let i = 1; i <= 15; i++) {
        intervals.push(
          setTimeout(() => window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT)), i * 2000)
        );
      }
      const t3 = setTimeout(() => setShowSuccess(false), 10000);
      return () => {
        intervals.forEach(clearTimeout);
        clearTimeout(t3);
      };
    }
  }, [isSuccessFromUrl]);

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16 max-w-4xl mx-auto space-y-8 sm:space-y-12 lg:space-y-16">
      {showSuccess && (
        <div className="flex items-center gap-4 bg-green-50 border border-green-100 p-4 rounded-2xl mb-8">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-semibold text-sm text-green-800">Paiement validé</p>
            <p className="text-xs text-green-700 opacity-80">Vos crédits ont bien été ajoutés. Merci pour votre achat.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Mes quotas"
        description={isFree
          ? 'Suivez votre utilisation du plan Starter et découvrez nos offres'
          : 'Pack Fashion Launch — suivez vos utilisations et rechargez si besoin'}
        icon={Zap}
      >
        <Button
          onClick={isFree ? () => router.push('/auth/choose-plan') : openSurplusModal}
          className={cn(
            "rounded-full px-6 font-semibold shadow-md active:scale-[0.98] transition-all",
            isFree ? "bg-[#007AFF] hover:bg-[#0056CC]" : "bg-[#1D1D1F] hover:bg-black"
          )}
        >
          {isFree ? 'Passer au Plan Créateur' : 'Acheter des crédits'}
        </Button>
      </PageHeader>

      {/* Usage Tracker par catégories */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisation des modules</CardTitle>
          <CardDescription>
            Intelligence, Identité, Marketing — barres de progression et alertes de recharge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageTracker onRechargeClick={openSurplusModal} isFree={isFree} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsagePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16 max-w-4xl mx-auto">Chargement…</div>}>
        <UsagePageContent />
      </Suspense>
    </DashboardLayout>
  );
}
