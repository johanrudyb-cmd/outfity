import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Users,
    TrendingUp,
    CreditCard,
    Activity,
    ArrowUpRight,
    Zap,
    Clock,
    Globe,
    BarChart3,
    Euro,
    ShieldCheck,
    UserPlus,
    Crown
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrackedHashtagsManager } from '@/components/admin/TrackedHashtagsManager';
import { isPaidPlan } from '@/lib/plan-utils';

export const metadata = {
    title: 'Admin Dashboard | OUTFITY',
};

export default async function AdminDashboardPage() {
    // Stats rÃ©centes (24h)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const newUsers24h = await prisma.user.count({ where: { createdAt: { gte: last24h } } });

    // RÃ©cupÃ©ration des stats rÃ©elles
    const [
        totalUsers,
        totalBrands,
        totalDesigns,
        activeUsers24h,
        affiliateStats,
        activeAffiliates,
        totalPremiumUsers,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.brand.count(),
        prisma.design.count(),
        prisma.user.count({ where: { updatedAt: { gte: last24h } } }),
        prisma.affiliateCommission.aggregate({ _sum: { amount: true } }),
        prisma.affiliate.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({
            where: {
                plan: {
                    notIn: ['free', 'starter', 'none']
                }
            }
        }),
    ]);

    // Pour OUTFITY, le seul plan payant est le CrÃ©ateur Ã  29â‚¬
    const mmr = totalPremiumUsers * 29;

    const totalAffiliateRevenue = affiliateStats._sum.amount || 0;
    const estimatedSales = totalAffiliateRevenue / 0.15; // Estimation basÃ©e sur 15%

    const stats = [
        { label: 'Utilisateurs', value: totalUsers.toLocaleString(), sub: `+${newUsers24h} (24h)`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Subscribers', value: totalPremiumUsers, sub: 'Utilisateurs Payants', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'MMR (Revenus)', value: `${mmr.toLocaleString()}â‚¬`, sub: 'Mensuel RÃ©current', icon: Euro, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Partenaires', value: activeAffiliates, sub: 'RÃ©seau actif', icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    // RÃ©cupÃ©ration des logs et activitÃ©s
    const [rawLogs, latestUsers] = await Promise.all([
        prisma.adminLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
        }).catch(() => []),
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
        })
    ]);

    // Unification du flux (Logs + Users + Potentiellement autres events)
    const unifiedActivity = [
        ...rawLogs.map(log => ({
            id: log.id,
            action: log.action,
            details: log.details,
            status: log.status,
            createdAt: log.createdAt,
            type: 'log',
            userId: log.userId
        })),
        ...latestUsers.map(user => ({
            id: `user-${user.id}`,
            action: 'Inscription Pilote',
            details: `${user.name || 'Nouvel utilisateur'} (${user.email}) a rejoint le cockpit.`,
            status: isPaidPlan(user.plan) ? 'premium' : 'free',
            createdAt: user.createdAt,
            type: 'user',
            userId: user.id
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    return (
        <div className="p-4 sm:p-8 lg:p-12 space-y-8 lg:space-y-12 max-w-[1600px] mx-auto bg-[#F5F5F7] min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-8">
                <div className="flex flex-col gap-4 sm:gap-6">
                    <Badge className="w-fit bg-black text-white hover:bg-black rounded-full px-4 py-1.5 text-[10px] sm:text-[11px] font-black tracking-widest uppercase shadow-md shadow-black/10">System Online</Badge>
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-[#1D1D1F] tracking-tighter uppercase italic leading-none">Command <span className="text-[#007AFF]">Center</span></h1>
                    <p className="text-[#6e6e73] text-base sm:text-xl font-medium">Pilotage stratÃ©gique et surveillance des flux OUTFITY.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar py-2">
                    <Button className="h-10 sm:h-14 px-5 sm:px-8 rounded-2xl bg-white text-black border border-black/5 font-black uppercase text-[9px] sm:text-[10px] tracking-widest shadow-sm hover:bg-gray-50 flex-1 sm:flex-none">
                        Rapport
                    </Button>
                </div>
            </div>

            {/* Grid de Stats - LOOK PREMIUM */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={stat.label} className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-6 text-center sm:text-left flex flex-col items-center sm:items-start">
                            <div className="flex items-center justify-between w-full mb-6">
                                <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl transition-transform duration-500 group-hover:scale-110 shadow-sm shadow-current/5`}>
                                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <Activity className="w-4 h-4 text-[#86868b] opacity-20 hidden sm:block" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black tracking-tighter text-[#1D1D1F] leading-none mb-2">{stat.value}</div>
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#86868b] opacity-80">{stat.label}</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Gestion Rapide - RESTRUCTURED */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link href="/admin/partners" className="group h-full">
                            <Card className="h-full border-none shadow-sm rounded-[32px] sm:rounded-[40px] bg-black text-white overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl">
                                <CardContent className="p-6 sm:p-10 relative overflow-hidden h-full flex flex-col justify-end min-h-[300px] sm:min-h-[400px]">
                                    <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-10 group-hover:opacity-20 transition-all duration-700">
                                        <Users className="w-24 sm:w-32 h-24 sm:h-32 rotate-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <Badge className="bg-white/20 text-white mb-6 border-none text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1">Nouveau SystÃ¨me</Badge>
                                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 italic uppercase tracking-tight leading-tight">Intelligence <span className="text-[#007AFF]">Partenaires</span></h3>
                                        <p className="text-white/60 font-medium text-sm sm:text-lg leading-relaxed max-w-[280px]">GÃ©rez vos influenceurs, suivez les conversions et automatisez les commissions.</p>
                                        <div className="mt-8 sm:mt-10 flex items-center gap-3 font-black text-[9px] sm:text-[10px] uppercase tracking-widest text-[#007AFF] hover:text-white transition-colors">
                                            AccÃ©der au Control Center <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <div className="grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-4 sm:gap-6">
                            <Link href="/admin/blog" className="group">
                                <Card className="border-none shadow-sm rounded-[24px] sm:rounded-[32px] bg-white hover:bg-[#F5F5F7] transition-all duration-300 h-full">
                                    <CardContent className="p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
                                        <div className="p-3 sm:p-4 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform shadow-sm shadow-blue-500/5">
                                            <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm sm:text-lg text-[#1D1D1F] uppercase italic leading-tight">Blog</h4>
                                            <p className="text-[8px] sm:text-xs text-[#86868b] font-bold uppercase tracking-tight mt-1 truncate">SEO Editorial IA</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href="/admin/users" className="group">
                                <Card className="border-none shadow-sm rounded-[24px] sm:rounded-[32px] bg-white hover:bg-[#F5F5F7] transition-all duration-300 h-full">
                                    <CardContent className="p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
                                        <div className="p-3 sm:p-4 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform shadow-sm shadow-emerald-500/5">
                                            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm sm:text-lg text-[#1D1D1F] uppercase italic leading-tight">Pilotes</h4>
                                            <p className="text-[8px] sm:text-xs text-[#86868b] font-bold uppercase tracking-tight mt-1 truncate">AccÃ¨s & Support</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                        <Link href="/usage" className="group">
                            <Card className="border-none shadow-sm rounded-[24px] sm:rounded-[32px] bg-white hover:bg-[#F5F5F7] transition-all duration-300 h-full">
                                <CardContent className="p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
                                    <div className="p-3 sm:p-4 bg-orange-50 text-orange-600 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform shadow-sm shadow-orange-500/5">
                                        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm sm:text-lg text-[#1D1D1F] uppercase italic leading-tight">Quotas</h4>
                                        <p className="text-[8px] sm:text-xs text-[#86868b] font-bold uppercase tracking-tight mt-1 truncate">Consommation IA</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/admin/metrics" className="group">
                            <Card className="border-none shadow-sm rounded-[24px] sm:rounded-[32px] bg-white hover:bg-[#F5F5F7] transition-all duration-300 h-full">
                                <CardContent className="p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
                                    <div className="p-3 sm:p-4 bg-purple-50 text-purple-600 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform shadow-sm shadow-purple-500/5">
                                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm sm:text-lg text-[#1D1D1F] uppercase italic leading-tight">MÃ©triques</h4>
                                        <p className="text-[8px] sm:text-xs text-[#86868b] font-bold uppercase tracking-tight mt-1 truncate">Analytics Perf</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    <div className="mt-8">
                        <TrackedHashtagsManager />
                    </div>
                </div>

                {/* Nerve Center / System Flux */}
                <Card className="lg:col-span-4 border-none shadow-sm h-fit rounded-[32px] bg-white overflow-hidden">
                    <CardHeader className="p-6 sm:p-8 pb-4 bg-gray-50/50 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">Nerve Center / Flux Live</CardTitle>
                            <Badge className="bg-[#007AFF]/10 text-[#007AFF] border-none text-[8px] font-black uppercase tracking-tighter">Real-time sync</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-50">
                            {unifiedActivity.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Activity className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                                    <p className="text-xs text-[#86868b] font-bold uppercase tracking-tight italic">Silence Radio / Aucun flux dÃ©tectÃ©</p>
                                </div>
                            ) : (
                                unifiedActivity.map((log: any) => {
                                    const isError = log.status && (log.status.includes('error') || log.status.includes('failed'));
                                    const isWarning = log.status && log.status.includes('warning');
                                    const isUser = log.type === 'user';
                                    const isPremium = log.status === 'premium';

                                    // Mapping d'icones par action/type
                                    const getActionIcon = () => {
                                        if (isUser) return <UserPlus className="w-3.5 h-3.5" />;
                                        if (log.action.toLowerCase().includes('plan') || log.action.toLowerCase().includes('billing')) return <CreditCard className="w-3.5 h-3.5" />;
                                        if (log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('auth')) return <ShieldCheck className="w-3.5 h-3.5" />;
                                        return <Zap className="w-3.5 h-3.5" />;
                                    };

                                    return (
                                        <div key={log.id} className="p-6 hover:bg-gray-50/80 transition-all duration-300 group">
                                            <div className="flex gap-4">
                                                <div className={`mt-1 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${isError ? 'bg-red-50 text-red-500' :
                                                    isWarning ? 'bg-orange-50 text-orange-500' :
                                                        isUser ? 'bg-emerald-50 text-emerald-600' :
                                                            'bg-blue-50 text-[#007AFF]'
                                                    }`}>
                                                    {getActionIcon()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <p className="text-xs font-black text-[#1D1D1F] uppercase italic truncate tracking-tight">{log.action}</p>
                                                            {isUser && <Badge className="h-4 px-1.5 bg-emerald-500 text-[8px] text-white border-none font-black uppercase tracking-tighter shadow-sm">Live</Badge>}
                                                            {isPremium && <Crown className="w-3 h-3 text-[#007AFF] animate-pulse" />}
                                                        </div>
                                                        <span className="text-[9px] font-black text-[#86868b] uppercase tracking-tighter whitespace-nowrap opacity-60">
                                                            {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-[#6e6e73] font-bold line-clamp-2 leading-relaxed mb-3">
                                                        {typeof log.details === 'string' ? log.details :
                                                            log.details && typeof log.details === 'object' ?
                                                                Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' | ') :
                                                                'DÃ©tails de navigation / SystÃ¨me'}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-red-500 animate-pulse' :
                                                                isWarning ? 'bg-orange-500 animate-pulse' :
                                                                    isUser ? 'bg-emerald-500 animate-pulse' :
                                                                        'bg-[#007AFF]'
                                                                }`} />
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-[#86868b]">
                                                                {isUser ? 'Base de donnÃ©e' : `Type: ${log.status || 'System'}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-6 bg-gray-50/30 border-t border-gray-100">
                            <Button variant="ghost" size="sm" className="w-full text-[10px] font-black text-[#86868b] uppercase tracking-widest hover:text-[#007AFF] transition-colors rounded-xl h-10 border border-dashed border-gray-200 hover:border-[#007AFF]/20">
                                Terminal Historique Complet
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

