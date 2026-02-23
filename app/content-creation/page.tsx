import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Phase4Marketing } from '@/components/launch-map/Phase4Marketing';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Zap, Camera, PenTool, LayoutList, Image as ImageIcon } from 'lucide-react';

export const metadata = {
    title: 'Studio de Création | Biangory',
    description: 'Générez vos visuels produits, shootings IA et scripts marketing en quelques clics.',
};

export default async function ContentCreationPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/signin');



    const brand = await prisma.brand.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { launchMap: true },
    });

    if (!brand) redirect('/launch-map');

    const brandData = {
        id: brand.id,
        name: brand.name,
        logo: brand.logo,
        colorPalette: brand.colorPalette as any,
        typography: brand.typography as any,
        styleGuide: brand.styleGuide as any
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-[#F5F5F7]">
                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden bg-[#1D1D1F] pb-0">
                    {/* Gradient orbs */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#007AFF]/20 blur-3xl" />
                        <div className="absolute -top-10 right-0 w-80 h-80 rounded-full bg-[#AF52DE]/15 blur-3xl" />
                    </div>

                    <div className="relative max-w-[1800px] mx-auto px-6 pt-8 pb-8">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/50 hover:text-white/80 transition-colors mb-6 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Retour
                        </Link>
                        <div className="flex items-end justify-between gap-6">
                            <div>
                                <p className="text-[12px] font-bold text-[#007AFF] uppercase tracking-widest mb-1">Studio IA</p>
                                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                                    Création de Contenu
                                </h1>
                                <p className="text-[15px] text-white/50 mt-2 max-w-lg">
                                    Shootings produit, Virtual Try-On, identité visuelle et scripts marketing — tout alimenté par l&apos;IA.
                                </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 shrink-0 pb-1">
                                <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                                    <span className="text-[11px] font-bold text-white/70">IA Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8 pb-24">
                    <Phase4Marketing
                        brandId={brand.id}
                        brandName={brand.name}
                        brand={brandData}
                        isCompleted={brand.launchMap?.phase6 ?? false}
                        userPlan={user.plan}
                    />
                </div>
            </div>
        </DashboardLayout>
    );
}
