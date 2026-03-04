"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, DollarSign, ArrowUpRight, History, BarChart3, Link as LinkIcon, Users, UserPlus, TrendingUp, MousePointer2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAccountNav } from '@/components/layout/UserAccountNav';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

interface PartnerDashboardClientProps {
    user: {
        name: string | null;
        email: string;
    };
    affiliate: {
        id: string;
        referralCode: string;
        status: string;
        earningsTotal: number;
        _count: {
            clicks: number;
            commissions: number;
        };
        commissions: {
            id: string;
            amount: number;
            status: string;
            createdAt: string;
            currency: string;
            orderId: string | null;
        }[];
    };
}

export function PartnerDashboardClient({ user, affiliate }: PartnerDashboardClientProps) {
    const { toast } = useToast();
    const [period, setPeriod] = useState('30d');
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [baseUrl, setBaseUrl] = useState('https://outfity.fr');
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    const referralLink = `${baseUrl}/join/creator-initiative-2026?utm_source=partner_network&utm_medium=affiliate_tracking&utm_campaign=exclusive_partner_referral&ref=${affiliate.referralCode}`;

    useEffect(() => {
        const fetchPersonalStats = async () => {
            setIsLoading(true);
            try {
                const url = new URL('/api/auth/partners/stats', window.location.origin);
                url.searchParams.set('period', period);
                if (selectedResourceId) url.searchParams.set('resourceId', selectedResourceId);

                const res = await fetch(url.toString());
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setStats(data);
            } catch (err: any) {
                console.error("Stats error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPersonalStats();
    }, [period, selectedResourceId]);

    // Calcul des commissions en attente (seulement celles qui sont PENDING)
    const pendingAmount = affiliate.commissions
        .filter(c => c.status === 'PENDING')
        .reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="min-h-screen bg-[#F5F5F7]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-black/5 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <span className="font-extrabold text-lg sm:text-xl tracking-tighter text-black uppercase italic shrink-0">
                        <span className="text-[#007AFF]">OUTFITY</span> <span className="hidden sm:inline">PARTNERS</span>
                    </span>

                    <div className="h-4 w-px bg-black/10 hidden md:block" />

                    <Link href="/dashboard?mode=app">
                        <Button variant="ghost" className="flex text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#86868B] hover:text-black transition-colors px-0 gap-1.5">
                            <span className="hidden sm:inline">Accéder à la plateforme</span>
                            <span className="sm:hidden">Dashboard</span>
                            <ArrowUpRight className="w-3 h-3" />
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <NotificationsDropdown />
                    <UserAccountNav />
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-10">
                {/* Welcome Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-[#1D1D1F] tracking-tight uppercase italic leading-none">Partner Intelligence</h1>
                        <p className="text-[#6e6e73] text-sm sm:text-base font-medium mt-3">Visualisez votre impact et pilotez votre croissance en temps réel.</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 bg-white p-1.5 rounded-[22px] shadow-sm border border-black/5 overflow-x-auto sm:overflow-visible no-scrollbar">
                        {['7d', '30d', '90d'].map((p) => (
                            <Button
                                key={p}
                                onClick={() => setPeriod(p)}
                                variant={period === p ? "default" : "ghost"}
                                className={`rounded-[18px] px-4 sm:px-5 h-8 sm:h-9 font-bold uppercase text-[8px] sm:text-[9px] tracking-widest transition-all ${period === p ? 'bg-black text-white shadow-lg' : 'text-[#86868b] hover:bg-[#F5F5F7]'}`}
                            >
                                {p.replace('d', ' Jours')}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm rounded-[32px] p-6 sm:p-8 bg-white overflow-hidden relative">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b]">Performance MMR</p>
                            <TrendingUp className="w-4 h-4 text-[#007AFF]" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-[#1D1D1F] tracking-tighter">
                            {isLoading ? "..." : `${stats?.mmr?.toFixed(2)}€`}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="text-[10px] font-black uppercase text-[#007AFF] bg-blue-50 px-2.5 py-1 rounded-full">{stats?.activeSubsCount || 0} Actifs</div>
                            <p className="text-[9px] font-bold text-[#86868B] uppercase tracking-tight">Revenu Récurrent</p>
                        </div>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[32px] p-6 sm:p-8 bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b]">Impact Audience</p>
                            <MousePointer2 className="w-4 h-4 text-[#007AFF] opacity-40" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-black text-[#1D1D1F] tracking-tighter">{affiliate._count.clicks}</div>
                        <div className="mt-2 text-[10px] font-black uppercase text-[#007AFF] bg-blue-50 px-2.5 py-1 rounded-full inline-block">Clics uniques</div>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[32px] p-6 sm:p-8 bg-[#007AFF] text-white">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Gains Débloqués</p>
                            <DollarSign className="w-4 h-4 opacity-40" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-black tracking-tighter">{affiliate.earningsTotal.toFixed(2)}€</div>
                        <p className="text-[10px] font-bold opacity-60 mt-2 uppercase tracking-wide">Solde disponible</p>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[32px] p-6 sm:p-8 bg-black text-white relative overflow-hidden">
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Solde Latent</p>
                            <History className="w-4 h-4 opacity-40" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-black tracking-tighter relative z-10">{pendingAmount.toFixed(2)}€</div>
                        <p className="text-[10px] font-bold opacity-60 mt-2 uppercase tracking-wide relative z-10">En validation (30j)</p>
                    </Card>
                </div>

                {/* GRAPH SECTION - JUST LIKE ADMIN */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="border-none shadow-sm rounded-[42px] bg-white overflow-hidden p-6 sm:p-8 lg:p-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-100 rounded-xl text-[#007AFF]">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight leading-none uppercase italic">Performance Visuelle</h2>
                                    <p className="text-[#6e6e73] font-medium mt-1 text-sm">Évolution croisée de l'audience et des commissions.</p>
                                </div>
                            </div>

                            {/* Resource Filter */}
                            <div className="flex items-center gap-2 bg-[#F5F5F7] p-1.5 rounded-2xl border border-black/5 overflow-x-auto no-scrollbar max-w-[400px]">
                                <button
                                    onClick={() => setSelectedResourceId(null)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!selectedResourceId ? 'bg-white text-[#007AFF] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                                >
                                    Global
                                </button>
                                <button
                                    onClick={() => setSelectedResourceId('marketing')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedResourceId === 'marketing' ? 'bg-white text-[#007AFF] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                                >
                                    Guide 1000€
                                </button>
                                <button
                                    onClick={() => setSelectedResourceId('direct')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedResourceId === 'direct' ? 'bg-white text-[#007AFF] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                                >
                                    Direct
                                </button>
                            </div>
                        </div>

                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.chartData || []}>
                                    <defs>
                                        <linearGradient id="colorRevAff" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#007AFF" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#86868b' }}
                                        dy={12}
                                        tickFormatter={(str) => format(new Date(str), 'dd MMM')}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#86868b' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '24px',
                                            border: 'none',
                                            boxShadow: '0 15px 50px rgba(0,0,0,0.1)',
                                            padding: '20px'
                                        }}
                                        labelStyle={{ fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', color: '#86868b' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Gains (€)"
                                        stroke="#007AFF"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRevAff)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="clics"
                                        name="Clics"
                                        stroke="#000000"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        fill="transparent"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* PERFORMANCE & LINK - Left Column */}
                    <div className="lg:col-span-12">
                        <Tabs defaultValue="links" className="w-full">
                            <TabsList className="bg-white/50 backdrop-blur-sm border border-black/5 mb-8 p-1.5 h-auto rounded-[24px] flex flex-wrap sm:flex-nowrap">
                                <TabsTrigger value="links" className="flex-1 sm:flex-none px-6 sm:px-10 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white transition-all">Lien & Conversions</TabsTrigger>
                                <TabsTrigger value="history" className="flex-1 sm:flex-none px-6 sm:px-10 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-black data-[state=active]:text-white transition-all">Tous les Mouvements</TabsTrigger>
                            </TabsList>

                            <TabsContent value="links" className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                <Card className="lg:col-span-7 border-none shadow-sm rounded-[40px] p-6 sm:p-10 bg-white">
                                    <CardHeader className="p-0 mb-8 font-black uppercase italic">
                                        <CardTitle className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight uppercase italic">Activation Marketing</CardTitle>
                                        <CardDescription className="text-base sm:text-lg font-medium text-[#6e6e73]">Utilisez ce lien unique pour tracker vos ventes.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0 space-y-8">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Input value={referralLink} readOnly className="h-14 sm:h-16 bg-[#F5F5F7] border-none rounded-2xl font-mono text-base sm:text-xl px-4 sm:px-8 shadow-inner" />
                                            <Button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(referralLink);
                                                    toast({
                                                        type: 'success',
                                                        title: 'Copié !',
                                                        message: "Prêt à être partagé !"
                                                    });
                                                }}
                                                className="h-14 sm:h-16 px-8 sm:px-12 rounded-2xl bg-[#007AFF] text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/20 hover:bg-blue-600 shrink-0"
                                            >
                                                <Copy className="w-4 h-4 mr-2" /> Copier le lien
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                            <div className="p-6 bg-black text-white rounded-[32px] border border-white/5">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 opacity-40">Timing</p>
                                                <p className="text-sm font-bold leading-relaxed">Les commissions sont débloquées après 30 jours pour garantir la stabilité financière.</p>
                                            </div>
                                            <div className="p-6 bg-[#007AFF]/5 text-[#007AFF] rounded-[32px] border border-[#007AFF]/10">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 opacity-40">Conseil Pro</p>
                                                <p className="text-sm font-bold leading-relaxed">Testez votre propre lien de temps en temps pour vérifier le tracking.</p>
                                            </div>
                                        </div>

                                        {/* Free Resources Links Section */}
                                        <div className="mt-12 pt-10 border-t border-black/5">
                                            <h3 className="text-lg font-black uppercase italic tracking-tight text-[#1D1D1F] mb-2">Lead Magnets Gratuits (Tracking Inclus)</h3>
                                            <p className="text-sm font-medium text-[#86868B] mb-6">Proposez ces ressources gratuites exclusives à votre audience. S'ils décident de s'inscrire ensuite, vous toucherez la commission.</p>

                                            <div className="space-y-4">
                                                {[
                                                    { id: 'marketing', name: 'Faire ses premiers 1 000€ avec sa marque de vêtement' },
                                                ].map((res) => {
                                                    const resLink = `${baseUrl}/communaute/unlock?resource=${res.id}&ref=${affiliate.referralCode}`;
                                                    const resClicks = stats?.clicksByResource?.[res.id] || 0;
                                                    const resConv = stats?.convByResource?.[res.id] || 0;
                                                    const convRate = resClicks > 0 ? ((resConv / resClicks) * 100).toFixed(1) : 0;

                                                    return (
                                                        <div key={res.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#F5F5F7] rounded-2xl border border-black/5 hover:border-black/10 transition-colors">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <p className="font-bold text-sm text-[#1D1D1F]">{res.name}</p>
                                                                    <div className="flex gap-2">
                                                                        <Badge className={`border-none text-[8px] font-black ${resClicks > 0 ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-black/5 text-black/20'}`}>
                                                                            {resClicks} Clics
                                                                        </Badge>
                                                                        {resConv > 0 && (
                                                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] font-black">
                                                                                {convRate}% Conv.
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className="text-[10px] font-mono text-[#86868B] mt-1 break-all bg-white px-2 py-1 rounded inline-block border border-black/5">{resLink}</p>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(resLink);
                                                                    toast({
                                                                        type: 'success',
                                                                        title: 'Copié !',
                                                                        message: "Lien de la ressource copié !"
                                                                    });
                                                                }}
                                                                className="shrink-0 h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Copy className="w-3.5 h-3.5 mr-2" /> Copier
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* RECENT SIGNUPS - Right Column within tab */}
                                <Card className="lg:col-span-5 border-none shadow-sm rounded-[40px] p-2 bg-white flex flex-col">
                                    <CardHeader className="p-8 pb-4">
                                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                                            <UserPlus className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <CardTitle className="text-xl font-black tracking-tight text-[#1D1D1F] uppercase italic leading-none">Inscriptions Récentes</CardTitle>
                                        <CardDescription className="text-xs font-bold uppercase tracking-widest text-[#86868B] mt-2">Nouveaux leads identifiés</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 sm:p-8 pt-4 flex-1">
                                        <div className="space-y-4">
                                            {stats?.recentSignups?.length === 0 ? (
                                                <div className="py-12 text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#C7C7CC]">En attente de data...</p>
                                                </div>
                                            ) : (
                                                stats?.recentSignups?.map((signup: any) => (
                                                    <div key={signup.id} className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-2xl group hover:bg-black transition-all duration-300">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-xs group-hover:text-black">
                                                                {signup.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-[#1D1D1F] group-hover:text-white transition-colors flex items-center gap-2">
                                                                    {signup.name || "Utilisateur"}
                                                                    {signup.plan === 'creator' && (
                                                                        <span className="bg-emerald-100 text-emerald-600 text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Client Premium</span>
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-[#86868B] group-hover:text-white/40">{signup.email}</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] font-black text-[#86868B] uppercase tracking-tighter group-hover:text-white/40">
                                                            {format(new Date(signup.createdAt), 'dd/MM')}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="history">
                                <Card className="border-none shadow-sm rounded-[40px] overflow-hidden bg-white">
                                    <div className="p-6 sm:p-10 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight uppercase italic leading-none">Ledger de Compte</h3>
                                            <p className="text-[#86868B] font-medium mt-2 uppercase text-[9px] sm:text-[10px] tracking-[0.2em] font-black">Historique des 20 derniers mouvements</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
                                            <thead>
                                                <tr className="bg-[#F5F5F7]">
                                                    <th className="px-4 sm:px-10 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#86868B]">Mouvement Date</th>
                                                    <th className="px-4 sm:px-10 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#86868B]">Référence Unique</th>
                                                    <th className="px-4 sm:px-10 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#86868B]">Commission Net</th>
                                                    <th className="px-4 sm:px-10 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#86868B]">Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/5">
                                                {affiliate.commissions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-10 py-32 text-center">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <History className="w-12 h-12 text-[#C7C7CC] opacity-20" />
                                                                <p className="text-[10px] font-black text-[#C7C7CC] uppercase tracking-widest">En attente de conversion</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    affiliate.commissions.map((comm) => (
                                                        <tr key={comm.id} className="hover:bg-black/[0.01] transition-colors group">
                                                            <td className="px-4 sm:px-10 py-5 sm:py-7 font-bold text-xs sm:text-sm text-[#86868B]">
                                                                {format(new Date(comm.createdAt), 'dd MMMM yyyy HH:mm', { locale: fr })}
                                                            </td>
                                                            <td className="px-4 sm:px-10 py-5 sm:py-7 text-xs sm:text-sm font-black text-[#1D1D1F]">
                                                                {comm.orderId ? `O-REF-${comm.orderId.substring(0, 8).toUpperCase()}` : 'INTERNAL-TX'}
                                                            </td>
                                                            <td className="px-4 sm:px-10 py-5 sm:py-7 text-xs sm:text-sm font-black text-[#1D1D1F]">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                    +{comm.amount.toFixed(2)}€
                                                                </div>
                                                            </td>
                                                            <td className="px-4 sm:px-10 py-5 sm:py-7">
                                                                <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border ${comm.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                    comm.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                                        'bg-red-50 text-red-600 border-red-100'
                                                                    }`}>
                                                                    {comm.status === 'PAID' ? 'Débloqué' :
                                                                        comm.status === 'PENDING' ? 'Validation' : 'Annulé'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

            </main>
        </div>
    );
}
