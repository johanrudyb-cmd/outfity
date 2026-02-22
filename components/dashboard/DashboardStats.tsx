import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

interface StatsData {
    designCount: number;
    quoteCount: number;
    ugcCount: number;
    completedSteps: number;
    totalSteps: number;
}

async function getStats(brandId: string): Promise<StatsData> {
    const [designCount, quoteCount, ugcCount, launchMap] = await Promise.all([
        prisma.design.count({ where: { brandId, status: 'completed' } }),
        prisma.quote.count({ where: { brandId } }),
        prisma.uGCContent.count({ where: { brandId } }),
        prisma.launchMap.findUnique({ where: { brandId } })
    ]);

    // Calcul simplifié de la progression pour l'exemple
    // (Vous pouvez réintégrer la logique complète ici si besoin)
    const steps = [
        launchMap?.phase1, launchMap?.phase2, launchMap?.phase3,
        launchMap?.phase4, launchMap?.phase5, launchMap?.phase6, launchMap?.phase7
    ];
    const completedSteps = steps.filter(Boolean).length;

    return {
        designCount,
        quoteCount,
        ugcCount,
        completedSteps,
        totalSteps: steps.length,
    };
}

export async function DashboardStats({ brandId }: { brandId: string }) {
    const stats = await getStats(brandId);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-stagger">
            {/* Designs Stats */}
            <div className="bg-white rounded-[28px] shadow-apple border border-black/5 p-6 hover:shadow-md transition-shadow group">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-3">Portfolio</p>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-[#1D1D1F]">{stats.designCount}</span>
                    <span className="text-sm font-medium text-[#86868B] mb-1.5 truncate">Designs</span>
                </div>
                <div className="mt-4 h-1 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: stats.designCount > 0 ? '60%' : '5%' }} />
                </div>
            </div>

            {/* AI Market Score (Motivational Stat) */}
            <div className="bg-white rounded-[28px] shadow-apple border border-black/5 p-6 hover:shadow-md transition-shadow">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-3">Trend Score IA</p>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-[#1D1D1F]">84</span>
                    <span className="text-sm font-medium text-emerald-600 mb-1.5 font-bold">/100</span>
                </div>
                <p className="mt-4 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md inline-block">POTENTIEL ÉLEVÉ</p>
            </div>

            {/* Sourcing Stats */}
            <div className="bg-white rounded-[28px] shadow-apple border border-black/5 p-6 hover:shadow-md transition-shadow">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-3">Sourcing</p>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-[#1D1D1F]">{stats.quoteCount}</span>
                    <span className="text-sm font-medium text-[#86868B] mb-1.5">Devis</span>
                </div>
                <p className="mt-4 text-[10px] text-[#86868B] font-bold">12 USINES DISPONIBLES</ p>
            </div>

            {/* Network Rank (Motivational Stat) */}
            <div className="bg-white rounded-[28px] shadow-apple border border-black/5 p-6 hover:shadow-md transition-shadow">
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest mb-3">Réseau Outfity</p>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-[#1D1D1F]">TOP</span>
                    <span className="text-sm font-medium text-primary mb-1.5 font-bold">15%</span>
                </div>
                <p className="mt-4 text-[10px] text-[#86868B] font-bold">CRÉATEUR ÉMERGENT</p>
            </div>
        </div>
    );
}

export function DashboardStatsSkeleton() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl sm:rounded-3xl shadow-apple p-4 sm:p-6 lg:p-8 animate-pulse">
                    <div className="h-4 w-20 bg-gray-100 rounded mb-4"></div>
                    <div className="h-10 w-12 bg-gray-200 rounded"></div>
                </div>
            ))}
        </div>
    );
}
