import { prisma } from '@/lib/prisma';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    UserPlus,
    Activity,
    Crown,
    Search,
    Mail,
    Calendar,
    ArrowUpRight,
    Clock
} from 'lucide-react';
import { PlanSelector } from './PlanSelector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { isPaidPlan } from '@/lib/plan-utils';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Utilisateurs | OUTFITY Command Center',
};

export default async function AdminUsersPage() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [users, newUsers24hCount, newUsers7dCount, totalUsers] = await Promise.all([
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
        prisma.user.count({ where: { createdAt: { gte: last24h } } }),
        prisma.user.count({ where: { createdAt: { gte: last7d } } }),
        prisma.user.count()
    ]);

    const recentArrivals = users.slice(0, 6);

    const stats = [
        { label: 'Total Base', value: totalUsers, sub: 'Inscriptions totales', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Nouveaux (24h)', value: newUsers24hCount, sub: 'DerniÃ¨re rotation', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Croissance (7j)', value: newUsers7dCount, sub: 'Performance hebdo', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Premium', value: users.filter(u => isPaidPlan(u.plan)).length, sub: 'Segments payants', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="p-4 sm:p-8 lg:p-12 space-y-8 sm:space-y-12 bg-[#F5F5F7] min-h-screen max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <Badge className="mb-4 bg-black text-white hover:bg-black rounded-full px-4 py-1 text-[10px] font-black tracking-widest uppercase">Database Live</Badge>
                    <h1 className="text-4xl sm:text-6xl font-black text-[#1D1D1F] tracking-tighter uppercase italic leading-none">User <span className="text-[#007AFF]">Intelligence</span></h1>
                    <p className="text-[#6e6e73] text-lg sm:text-xl font-medium mt-4">Surveillance de l'acquisition et gestion des accÃ¨s utilisateurs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group w-full sm:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b] group-focus-within:text-[#007AFF] transition-colors" />
                        <input
                            placeholder="Rechercher un pilote..."
                            className="h-12 sm:h-14 pl-12 pr-6 rounded-2xl bg-white border border-black/5 font-bold text-sm w-full sm:w-[300px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm bg-white rounded-[32px] overflow-hidden group hover:shadow-xl transition-all duration-500">
                        <CardContent className="p-6 sm:p-8 pb-6 text-center sm:text-left flex flex-col items-center sm:items-start">
                            <div className={`p-3 w-fit ${stat.bg} ${stat.color} rounded-2xl mb-6 transition-transform group-hover:scale-110`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black tracking-tighter text-[#1D1D1F]">{stat.value.toLocaleString()}</div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b] mt-2">{stat.label}</p>
                            <p className="text-xs font-bold text-[#1D1D1F] mt-4 opacity-60">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* NEW ARRIVALS - VISUAL HIGHLIGHT */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#86868b] flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        DerniÃ¨res Inscriptions
                    </h2>
                    <Button variant="ghost" className="text-[10px] h-auto p-0 font-black uppercase tracking-widest text-[#007AFF] hover:bg-transparent">Voir Flux Live</Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                    {recentArrivals.map((user) => (
                        <Card key={user.id} className="border-none shadow-sm bg-white rounded-[32px] p-6 text-center hover:scale-[1.05] transition-all duration-500 bg-gradient-to-tr from-white to-gray-50/50">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <Avatar className="w-20 h-20 border-4 border-white shadow-xl">
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback className="bg-black text-white font-black text-xl">
                                        {(user.name || user.email).charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {isPaidPlan(user.plan) && (
                                    <div className="absolute -top-1 -right-1 bg-[#007AFF] text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                                        <Crown className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-black text-[#1D1D1F] truncate text-sm uppercase italic mb-1">{user.name || 'Anonyme'}</h3>
                            <p className="text-[10px] text-[#86868b] font-bold uppercase truncate mb-4">{user.email}</p>
                            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter bg-gray-100 mb-4 px-2">
                                {new Date(user.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </Badge>
                        </Card>
                    ))}
                </div>
            </section>

            {/* MAIN TABLE */}
            <Card className="border-none shadow-sm rounded-[32px] sm:rounded-[40px] bg-white overflow-hidden">
                <CardHeader className="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black uppercase italic tracking-tight">Registre Global</CardTitle>
                            <CardDescription className="text-xs font-bold text-[#86868b] uppercase tracking-widest mt-1">Listing complet des 100 derniers profils</CardDescription>
                        </div>
                        <Button className="rounded-xl font-black text-[10px] uppercase tracking-widest bg-black h-10 px-4 sm:px-6">Exporter CSV</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto no-scrollbar sm:stylish-scrollbar">
                    <Table className="min-w-[800px] sm:min-w-full">
                        <TableHeader className="bg-white">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="pl-6 sm:pl-8 py-4 sm:py-6 text-[10px] font-black uppercase tracking-widest text-[#86868b]">Profil Pilote</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">Segment Actuel</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">Date d'enrÃ´lement</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">ContrÃ´le Stripe</TableHead>
                                <TableHead className="pr-8 text-right text-[10px] font-black uppercase tracking-widest text-[#86868b]">Autorisations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                                    <TableCell className="pl-6 sm:pl-8 py-4 sm:py-6">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="w-12 h-12 shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                                                <AvatarImage src={user.image || undefined} />
                                                <AvatarFallback className="bg-gray-100 text-black font-black text-xs uppercase italic">
                                                    {(user.name || user.email).slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-black text-[#1D1D1F] uppercase italic text-sm">{user.name || 'N/A'}</span>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3 h-3 text-[#86868b]" />
                                                    <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-tighter">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`capitalize font-black text-[9px] tracking-widest px-3 py-1 rounded-full ${isPaidPlan(user.plan) ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                                                }`}
                                        >
                                            {isPaidPlan(user.plan) ? 'CrÃ©ateur' : 'Starter'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-xs font-black text-[#1D1D1F] uppercase italic">
                                                <Calendar className="w-3 h-3 text-[#007AFF]" />
                                                {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </div>
                                            <span className="text-[10px] font-bold text-[#86868b] uppercase mt-1 pl-5">
                                                Inscrit Ã  {new Date(user.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.stripeCustomerId ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-mono text-[#1D1D1F] font-bold uppercase group-hover:text-[#007AFF] transition-colors">{user.stripeCustomerId}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest opacity-30">â€” Non Client</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="pr-8 text-right">
                                        <PlanSelector userId={user.id} initialPlan={user.plan} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

