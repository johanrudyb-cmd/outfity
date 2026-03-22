import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrendsPageLayout } from '@/components/trends/TrendsPageLayout';
import MarketTicker from '@/components/trends/MarketTicker';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { getHybridRadarTrends } from '@/lib/trends-data';

import { FeatureTourModal } from '@/components/ui/feature-tour-modal';
import { Rocket } from 'lucide-react';
import { Suspense } from 'react';

export const metadata = {
  title: 'Elite Radar — Analyse de Styles IA',
  description: 'Analyse prédictive des tendances mode en temps réel via Outfity Intelligence.',
};

async function TrendsContent() {
  const user = await getCurrentUser();
  // if (!user) {
  //   redirect('/auth/signin');
  // }

  // Pré-charger les tendances par défaut (18-24 Homme par exemple) pour affichage instantané
  const initialData = await getHybridRadarTrends({
    segment: 'homme',
    ageRange: '18-24',
    sortBy: 'best',
    limit: 60
  });

  return <TrendsPageLayout initialData={initialData} />;
}

export default function TrendsPage() {
  return (
    <DashboardLayout>
      <div className="w-full relative">
        <FeatureTourModal
          featureKey="viral_tiktok_intro"
          title="Viral sur TikTok & Analyse Prédictive"
          icon={<Rocket className="w-6 h-6 text-primary" />}
          description={
            <div className="space-y-4">
              <p>
                Bienvenue sur <strong>Viral sur TikTok</strong>. L&apos;erreur numéro 1 des marques est de lancer des collections &quot;à l&apos;aveugle&quot; ou de copier ce qui est <em>déjà</em> viral aujourd&apos;hui (c&apos;est souvent trop tard).
              </p>
              <p>
                Cet outil est votre atout secret : il analyse les signaux faibles du marché pour <strong>prédire ce qui va devenir viral demain</strong>, avant même que la mode n&apos;éclate.
              </p>
            </div>
          }
          bulletPoints={[
            "Anticipez le marché : découvrez les coupes en phase d'émergence avant vos concurrents.",
            "Évitez les flops : sécurisez vos investissements avec des données prédictives, pas sur l'intuition.",
            "Passez à l'action : générez un design 3D prêt à produire depuis une future tendance."
          ]}
          ctaText="J'ai compris, scanner l'avenir"
        />

        {/* Ticker Live en haut */}
        <MarketTicker />

        {/* Nouvelle Vue Catalogue Intelligent */}
        <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
          <TrendsContent />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

