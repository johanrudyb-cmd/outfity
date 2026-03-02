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
    description: 'Analysez nâ€™importe quel vÃªtement par image grÃ¢ce Ã  lâ€™IA Vision et dÃ©couvrez son potentiel commercial.',
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
                    title="DÃ©tecter une Tendance"
                    icon={<Camera className="w-6 h-6 text-primary" />}
                    description={
                        <div className="space-y-4">
                            <p>
                                <strong>Vous avez vu une piÃ¨ce stylÃ©e dans la rue ou sur un influenceur ?</strong> Ne la lancez pas sans savoir si le marchÃ© est prÃªt.
                            </p>
                            <p>
                                Prenez une photo, envoyez-la ici, et notre IA vous dira s'il s'agit d'une tendance montante, d'un best-seller, ou si c'est dÃ©jÃ  passÃ© de mode.
                            </p>
                        </div>
                    }
                    bulletPoints={[
                        "Analysez n'importe quel vÃªtement Ã  partir d'une simple capture d'Ã©cran.",
                        "Obtenez des prÃ©dictions chiffrÃ©es sur le potentiel commercial.",
                        "Transformez l'inspiration en un design final et prÃªt Ã  produire en 1 clic."
                    ]}
                    ctaText="C'est parti, je scanne le marchÃ©"
                />

                <MarketTicker />
                <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16 max-w-7xl mx-auto space-y-8">
                    <TrendsSubNav active="analyseur" />
                    <VisualTrendScanner />
                </div>
            </div>
        </DashboardLayout>
    );
}

