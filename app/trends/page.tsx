import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrendsPageLayout } from '@/components/trends/TrendsPageLayout';
import MarketTicker from '@/components/trends/MarketTicker';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { getHybridRadarTrends } from '@/lib/trends-data';

import { FeatureTourModal } from '@/components/ui/feature-tour-modal';
import { Rocket } from 'lucide-react';

export const metadata = {
  title: 'Elite Radar — Analyse de Styles IA',
  description: 'Analyse prédictive des tendances mode en temps réel via Outfity Intelligence.',
};

export default async function TrendsPage() {
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

  return (
    <DashboardLayout>
      <div className="w-full relative">
        <FeatureTourModal
          featureKey="viral_tiktok_intro"
          title="Viral sur TikTok & Analyse Tendances"
          icon={<Rocket className="w-6 h-6 text-primary" />}
          description={
            <div className="space-y-4">
              <p>
                Bienvenue sur <strong>Viral sur TikTok</strong>, l'outil le plus puissant d'OUTFITY pour sécuriser vos investissements.
              </p>
              <p>
                <strong>Pourquoi c'est indispensable ?</strong> Lancer une collection "à l'aveugle" est la plus grande erreur des marques. Cet outil scanne en temps réel ce qui devient viral et ce qui se vend le plus.
              </p>
            </div>
          }
          bulletPoints={[
            "Identifiez exactement les coupes et matières qui cartonnent en ce moment.",
            "Évitez les flops : ne produisez que ce que votre audience recherche déjà.",
            "Générez directement un design prêt à produire depuis une tendance virale."
          ]}
          ctaText="J'ai compris, scanner le marché"
        />

        {/* Ticker Live en haut */}
        <MarketTicker />

        {/* Nouvelle Vue Catalogue Intelligent */}
        <TrendsPageLayout initialData={initialData} />
      </div>
    </DashboardLayout>
  );
}
