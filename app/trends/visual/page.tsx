export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TrendsSubNav } from '@/components/trends/TrendsSubNav';
import { VisualTrendScanner } from '@/components/trends/VisualTrendScanner';
import MarketTicker from '@/components/trends/MarketTicker';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { FeatureTourModal } from '@/components/ui/feature-tour-modal';
import { Camera } from 'lucide-react';

export const metadata = {
    title: 'Analyseur de tendances visuel',
    description: "Analysez n'importe quel vêtement par image grâce à l'IA Vision et découvrez son potentiel commercial.",
};

export default async function VisualTrendPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/auth/signin');
    }

    return (
        <DashboardLayout>
            <div className="relative">
                <FeatureTourModal
                    featureKey="detect_trend_visual_intro"
                    title="Détecter une Tendance"
                    icon={<Camera className="w-6 h-6 text-primary" />}
                    description={
                        <div className="space-y-4">
                            <p>
                                <strong>Vous avez vu une pièce stylée dans la rue ou sur un influenceur ?</strong> Ne la lancez pas sans savoir si le marché est prêt.
                            </p>
                            <p>
                                Prenez une photo, envoyez-la ici, et notre IA vous dira s'il s'agit d'une tendance montante, d'un best-seller, ou si c'est déjà passé de mode.
                            </p>
                        </div>
                    }
                    bulletPoints={[
                        "Analysez n'importe quel vêtement à partir d'une simple capture d'écran.",
                        "Obtenez des prédictions chiffrées sur le potentiel commercial.",
                        "Transformez l'inspiration en un design final et prêt à produire en 1 clic."
                    ]}
                    ctaText="C'est parti, je scanne le marché"
                />

                <MarketTicker />
                <div className="w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16 mx-auto space-y-8 pb-12">
                    <TrendsSubNav active="analyseur" />
                    <VisualTrendScanner />
                </div>
            </div>
        </DashboardLayout>
    );
}

