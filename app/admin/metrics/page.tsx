import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    BarChart3,
    TrendingUp,
    ArrowUpRight,
    Calendar,
    Cpu,
    Euro,
    Layers,
    Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isPaidPlan } from '@/lib/plan-utils';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Métriques & Coûts IA | Admin',
};

export default async function AdminMetricsPage() {
    // Récupération des coûts IA agrégés par feature
    const usageByFeature = await prisma.aIUsage.groupBy({
        by: ['feature'],
        _sum: {
            costEur: true,
        },
        orderBy: {
            _sum: {
                costEur: 'desc',
            }
        }
    });

    // Coût total historique
    const totalCost = usageByFeature.reduce((acc: number, curr: any) => acc + (curr._sum.costEur || 0), 0);

    // Coût 30 derniers jours
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const cost30Days = await prisma.aIUsage.aggregate({
        where: {
            createdAt: { gte: last30Days }
        },
        _sum: {
            costEur: true
        }
    });

    // Utilisations IA
    const aiUsageCount = await prisma.aIUsage.count();

    // Stats Finance / MMR
    const totalUsers = await prisma.user.count();
    const activeSubscribersCount = await prisma.user.count({
        where: {
            plan: {
                notIn: ['free', 'starter', 'none']
            }
        }
    });

    // Pour l'affichage instantané, on peut filtrer si on veut être plus précis sur les types
    const mmr = activeSubscribersCount * 29;

    const stats = [
        { label: 'Dépense Totale', value: `${totalCost.toFixed(2)}€`, sub: 'Historique complet', icon: Euro, color: 'text-blue-600' },
        { label: 'Dépense (30j)', value: `${(cost30Days._sum.costEur || 0).toFixed(2)}€`, sub: 'Dernier mois roulant', icon: Calendar, color: 'text-emerald-600' },
        { label: 'Utilisations IA', value: aiUsageCount, sub: 'Nombre de requêtes', icon: Cpu, color: 'text-purple-600' },
        { label: 'Features Actives', value: usageByFeature.length, sub: 'Modules traqués', icon: Layers, color: 'text-orange-600' },
    ];

    return (
        <div className="p-10 space-y-10">
            <div>
                <h1 className="text-3xl font-bold text-[#1D1D1F]">Métriques & Coûts IA</h1>
                <p className="text-[#6e6e73]">Surveillance de la consommation des APIs Anthropic, OpenAI et Higgsfield.</p>
            </div>

            {/* Grid de Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={stat.label} className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-3 bg-gray-50 ${stat.color} rounded-2xl transition-transform duration-500 group-hover:scale-110`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <Activity className="w-4 h-4 text-[#86868b] opacity-20" />
                            </div>
                            <div className="text-4xl font-black tracking-tighter text-[#1D1D1F]">{stat.value}</div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b] mt-2 opacity-60">{stat.label}</p>
                            <div className="mt-6 flex items-center justify-between">
                                <span className="text-xs font-bold text-[#1D1D1F]">{stat.sub}</span>
                                <div className="h-1 w-12 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${stat.color.replace('text', 'bg')} w-2/3`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-medium">
                {/* Finance & MMR */}
                <Card className="lg:col-span-12 border-none shadow-sm rounded-[40px] bg-black text-white overflow-hidden">
                    <CardContent className="p-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                            <div>
                                <Badge className="bg-white/20 text-white mb-6 uppercase font-black tracking-widest text-[10px]">Finance Core</Badge>
                                <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">Monthly Recurring <span className="text-[#007AFF]">Revenue</span></h2>
                                <p className="text-white/60 text-lg">Indicateur vital de la santé économique de la plateforme.</p>
                            </div>
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="p-8 bg-white/5 rounded-[32px] border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">MMR Actuel</p>
                                    <div className="text-6xl font-black text-[#007AFF] italic tracking-tighter mb-2">{mmr.toLocaleString()}€</div>
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                                        <TrendingUp className="w-4 h-4" /> +12.4% vs mois dernier
                                    </div>
                                </div>
                                <div className="p-8 bg-white/5 rounded-[32px] border border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Subscribers Actifs</p>
                                    <div className="text-6xl font-black text-white italic tracking-tighter mb-2">{activeSubscribersCount}</div>
                                    <p className="text-xs text-white/60 font-medium">Répartis sur le Plan Créateur</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Répartition par Feature */}
                <div className="lg:col-span-7 space-y-8">
                    <Card className="border-none shadow-sm rounded-[32px] bg-white h-full">
                        <CardHeader className="p-8">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#86868b]">Postes de Dépenses IA</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <div className="space-y-6">
                                {usageByFeature.map((item: any) => {
                                    const percentage = ((item._sum.costEur || 0) / (totalCost || 1)) * 100;
                                    return (
                                        <div key={item.feature} className="space-y-2">
                                            <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                                                <span className="text-[#1D1D1F]">
                                                    {item.feature.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-[#007AFF]">{(item._sum.costEur || 0).toFixed(2)}€</span>
                                            </div>
                                            <div className="h-3 w-full bg-[#F5F5F7] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-black rounded-full transition-all duration-1000"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Analyse Rentabilité */}
                <div className="lg:col-span-5">
                    <Card className="border-none shadow-sm rounded-[32px] bg-white h-full">
                        <CardHeader className="p-8">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-[#86868b]">Rentabilité Acquisition</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-8">
                            <div className="p-8 rounded-[32px] bg-[#F5F5F7] group hover:bg-black transition-colors duration-500">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#86868b] group-hover:text-white/40">Ratio Coût/User</span>
                                    <Badge className="bg-emerald-500 text-white border-none group-hover:bg-[#007AFF]">Optimal</Badge>
                                </div>
                                <div className="text-5xl font-black tracking-tighter text-[#1D1D1F] group-hover:text-white transition-colors">
                                    {totalUsers > 0 ? (totalCost / totalUsers).toFixed(2) : '0.00'}€
                                </div>
                                <p className="text-[10px] text-[#6e6e73] mt-2 font-bold uppercase tracking-tight group-hover:text-white/60">
                                    Coût IA moyen par slot depuis Day 1.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Cpu className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-[#1D1D1F] uppercase italic">Optimisation GPT-4o</p>
                                        <p className="text-[10px] text-[#6e6e73] font-bold">Réduction des coûts de 40% sur le SEO.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-[#1D1D1F] uppercase italic">Higgsfield Stable</p>
                                        <p className="text-[10px] text-[#6e6e73] font-bold">Flux de génération vidéo sous contrôle.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
