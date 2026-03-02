export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrendsPageLayout } from '@/components/trends/TrendsPageLayout';
import MarketTicker from '@/components/trends/MarketTicker';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { getHybridRadarTrends } from '@/lib/trends-data';

import { FeatureTourModal } from '@/components/ui/feature-tour-modal';
import { Rocket } from 'lucide-react';

export const metadata = {
  title: 'Elite Radar â€” Analyse de Styles IA',
  description: 'Analyse prÃ©dictive des tendances mode en temps rÃ©el via Outfity Intelligence.',
};

export default async function TrendsPage() {
  const user = await getCurrentUser();
  // if (!user) {
  //   redirect('/auth/signin');
  // }

  // PrÃ©-charger les tendances par dÃ©faut (18-24 Homme par exemple) pour affichage instantanÃ©
  const initialData = await getHybridRadarTrends({
    segment: 'homme',
    ageRange: '18-24',
    sortBy: 'best',
    limit: 60
  });

  return (
    <DashboardLayout>
      <div className="w-full relative">
        <FeatureTourModal
          featureKey="viral_tiktok_intro"
          title="Viral sur TikTok & Analyse PrÃ©dictive"
          icon={<Rocket className="w-6 h-6 text-primary" />}
          description={
            <div className="space-y-4">
              <p>
                Bienvenue sur <strong>Viral sur TikTok</strong>. L'erreur numÃ©ro 1 des marques est de lancer des collections "Ã  l'aveugle" ou de copier ce qui est <em>dÃ©jÃ </em> viral aujourd'hui (c'est souvent trop tard).
              </p>
              <p>
                Cet outil est votre atout secret : il analyse les signaux faibles du marchÃ© pour <strong>prÃ©dire ce qui va devenir viral demain</strong>, avant mÃªme que la mode n'Ã©clate.
              </p>
            </div>
          }
          bulletPoints={[
            "Anticipez le marchÃ© : dÃ©couvrez les coupes en phase d'Ã©mergence avant vos concurrents.",
            "Ã‰vitez les flops : sÃ©curisez vos investissements avec des donnÃ©es prÃ©dictives, pas sur l'intuition.",
            "Passez Ã  l'action : gÃ©nÃ©rez un design 3D prÃªt Ã  produire depuis une future tendance."
          ]}
          ctaText="J'ai compris, scanner l'avenir"
        />

        {/* Ticker Live en haut */}
        <MarketTicker />

        {/* Nouvelle Vue Catalogue Intelligent */}
        <TrendsPageLayout initialData={initialData} />
      </div>
    </DashboardLayout>
  );
}

