import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Phase1Calculator } from '@/components/launch-map/Phase1Calculator';
import Link from 'next/link';

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
            <div className="min-h-screen bg-[#F5F5F7]">
                <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1800px] mx-auto pb-24 sm:pb-12">

                    {/* ── Header ── */}
                    <div className="mb-8">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors mb-3 group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Retour
                        </Link>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
                                    Calculateur de marge
                                </h1>
                                <p className="text-sm text-[#86868B] mt-1.5 max-w-xl">
                                    Simulez vos scénarios de vente et validez votre rentabilité en temps réel.
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

