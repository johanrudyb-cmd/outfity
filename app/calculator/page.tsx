export const dynamic = 'force-dynamic';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Phase1Calculator } from '@/components/launch-map/Phase1Calculator';
import Link from 'next/link';
import { FeatureTourModal } from '@/components/ui/feature-tour-modal';
import { Calculator } from 'lucide-react';

export default async function CalculatorPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/signin');

    const brand = await prisma.brand.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { launchMap: true },
    });

    if (!brand) {
        redirect('/launch-map');
    }

    const initialData = (brand.launchMap?.phase1Data as any) || {};

    return (
        <DashboardLayout>
            <FeatureTourModal
                featureKey="calculator_intro"
                title="Calculateur de Marge Global"
                icon={<Calculator className="w-6 h-6 text-primary" />}
                description={
                    <div className="space-y-4">
                        <p>
                            <strong>Le secret des marques rentables ?</strong> Les chiffres avant le design. Ce calculateur de marge vous permet de prÃ©voir vos prix de vente et vos gains.
                        </p>
                        <p>
                            Ajustez le coÃ»t de production cible, le budget marketing et les frais de livraison pour construire un business model solide, et non un simple passe-temps.
                        </p>
                    </div>
                }
                bulletPoints={[
                    "Testez plusieurs scÃ©narios de vente pour trouver votre prix de vente optimal (Prix MSRP).",
                    "Visualisez immÃ©diatement votre marge brute et bÃ©nÃ©fice net.",
                    "Sauvegardez vos scÃ©narios pour la Phase 1 du Parcours de Lancement."
                ]}
                ctaText="GÃ©nial, je calcule"
            />
            <div className="min-h-screen relative bg-[#F5F5F7]">
                <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1800px] mx-auto pb-8">

                    {/* â”€â”€ Header â”€â”€ */}
                    <div className="mb-8">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors mb-3 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">â†</span>
                            Retour
                        </Link>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
                                    Calculateur de marge
                                </h1>
                                <p className="text-sm text-[#86868B] mt-1.5 max-w-xl">
                                    Simulez vos scÃ©narios de vente et validez votre rentabilitÃ© en temps rÃ©el.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Phase1Calculator
                        brandId={brand.id}
                        brand={brand as any}
                        initialData={initialData}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}


