import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { StrategyPresentationView } from '@/components/launch-map/StrategyPresentationView';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export const metadata = {
    title: 'Stratégie de Marque',
    description: 'Présentation de la stratégie de marque',
};

export default async function SharedStrategyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: brandId } = await params;

    const [brand, launchMap] = await Promise.all([
        prisma.brand.findUnique({ where: { id: brandId } }),
        prisma.launchMap.findUnique({ where: { brandId } })
    ]);

    if (!brand || !launchMap || !launchMap.phase1) {
        notFound();
    }

    const { strategyText, positioning, targetAudience } = launchMap.phase1 as any;
    const { colorPalette, typography } = brand;

    const vi = {
        colorPalette: typeof colorPalette === 'object' ? colorPalette as any : undefined,
        typography: typeof typography === 'object' ? typography as any : undefined,
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            {/* Barre de navigation simple pour la vue partagée */}
            <header className="h-16 shrink-0 bg-white/80 backdrop-blur-xl border-b border-black/5 flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#0056CC] flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-bold text-[#1D1D1F] text-sm tracking-tight hidden sm:block">
                        Vision & Stratégie — {brand.name}
                    </p>
                </div>
                <Link href="/">
                    <Button variant="outline" size="sm" className="gap-2 rounded-full font-semibold px-4">
                        Créer ma stratégie
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </header>

            {/* Rendu principal */}
            <div className="flex-1">
                <StrategyPresentationView
                    strategyText={strategyText}
                    brandName={brand.name}
                    positioning={positioning}
                    targetAudience={targetAudience}
                    titleMode="strategy"
                    visualIdentity={vi}
                    visualIdentityLocked={true}
                    logoUrl={brand.logo}
                    embedded={true}
                />
            </div>
        </div>
    );
}
