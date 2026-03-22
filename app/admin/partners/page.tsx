'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Users,
    UserPlus,
    Link as LinkIcon,
    Copy,
    CheckCircle,
    TrendingUp,
    Hourglass,
    Mail,
    ChevronRight,
    Search,
    ExternalLink,
    DollarSign,
    MousePointer2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    X,
    Sparkles,
    Trash2,
    RotateCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

export default function AdminPartnersPage() {
    const router = useRouter();
    const [partners, setPartners] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [period, setPeriod] = useState('30d');
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRate, setNewRate] = useState('0.3');
    const [newCustomMessage, setNewCustomMessage] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [pRes, sRes] = await Promise.all([
                fetch('/api/admin/partners'),
                fetch(`/api/admin/partners/stats?period=${period}`)
            ]);

            const pData = await pRes.json();
            const sData = await sRes.json();

            if (pData.error) throw new Error(pData.error);
            if (sData.error) throw new Error(sData.error);

            setPartners(pData);
            setStats(sData);
        } catch (err: any) {
            toast.error("Impossible de charger les données: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            const res = await fetch('/api/admin/partners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    commissionRate: newRate,
                    customMessage: newCustomMessage
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.warning) {
                toast.warning(data.warning);
            } else {
                toast.success("Invitation créée et email envoyé !");
            }

            setPartners([data, ...partners]);
            setNewName('');
            setNewEmail('');
            setNewRate('0.3');
            setNewCustomMessage('');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsInviting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info("Copié dans le presse-papier");
    };

    const filteredPartners = useMemo(() => {
        return partners.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [partners, searchQuery]);

    const globalTotals = useMemo(() => {
        const totalClicks = partners.reduce((acc, curr) => acc + (curr._count?.clicks || 0), 0);
        const totalComm = partners.reduce((acc, curr) => acc + (curr.earningsTotal || 0), 0);
        // CA = Commission / 0.3 (since we take 30%)
        const estimatedCA = partners.reduce((acc, curr) => acc + ((curr.earningsTotal || 0) / (curr.commissionRate || 0.3)), 0);
        return {
            clicks: totalClicks,
            earnings: totalComm,
            estimatedCA: estimatedCA,
            activeCount: partners.filter(p => p.status === 'ACTIVE').length
        };
    }, [partners]);

    const resendInvite = async (partnerId: string) => {
        const promise = fetch(`/api/admin/partners/${partnerId}/resend`, { method: 'POST' })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Erreur d'envoi");
                return data;
            });

        toast.promise(
            promise,
            {
                loading: 'Renvoi de l\'invitation...',
                success: 'Invitation renvoyée avec succès !',
                error: (err) => `${err.message}`
            }
        );
    };

    const deletePartner = async (partnerId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce partenaire ? Cette action est irréversible.")) return;

        const promise = fetch(`/api/admin/partners/${partnerId}`, { method: 'DELETE' })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Erreur de suppression");
                return data;
            });

        toast.promise(
            promise,
            {
                loading: 'Suppression...',
                success: () => {
                    setPartners(partners.filter(p => p.id !== partnerId));
                    return 'Partenaire supprimé définitivement';
                },
                error: (err) => `${err.message}`
            }
        );
    };

    // Calcul de la croissance (%)
    const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return (
        <div className="p-4 sm:p-6 lg:p-10 space-y-8 sm:space-y-10 max-w-[1600px] mx-auto bg-[#F5F5F7] min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex flex-col gap-4">
                    <h1 className="text-3xl sm:text-5xl font-black text-[#1D1D1F] tracking-tight uppercase italic leading-none">Partner <span className="text-[#007AFF]">Intelligence</span></h1>
                    <p className="text-[#6e6e73] text-sm sm:text-lg font-medium">Analyse de performance, attribution et pilotage de croissance.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-white p-2 rounded-[24px] shadow-sm border border-black/5 overflow-x-auto no-scrollbar py-2">
                    {['7d', '30d', '90d', '1y'].map((p) => (
                        <Button
                            key={p}
                            onClick={() => setPeriod(p)}
                            variant={period === p ? "default" : "ghost"}
                            className={`rounded-[18px] px-4 sm:px-6 h-9 sm:h-10 font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all shrink-0 ${period === p ? 'bg-black text-white shadow-xl scale-105' : 'text-[#86868b] hover:bg-[#F5F5F7]'}`}
                        >
                            {p === '1y' ? 'Annuel' : p.replace('d', ' Jours')}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: "CA Influenceurs (Période)",
                        value: `${(stats?.currentMonth?.revenue || 0).toFixed(2)}€`,
                        growth: calculateGrowth(stats?.currentMonth?.revenue || 0, stats?.lastMonth?.revenue || 0),
                        color: "bg-black text-white",
                        icon: TrendingUp
                    },
                    {
                        label: "Clics Uniques (Période)",
                        value: stats?.currentMonth?.clicks || 0,
                        growth: calculateGrowth(stats?.currentMonth?.clicks || 0, stats?.lastMonth?.clicks || 0),
                        color: "bg-white text-black",
                        icon: MousePointer2
                    },
                    {
                        label: "Volume d'Affaires (CA)",
                        value: `${globalTotals.estimatedCA.toFixed(0)}€`,
                        color: "bg-white text-black",
                        icon: DollarSign
                    },
                    {
                        label: "Partenaires Actifs",
                        value: globalTotals.activeCount,
                        color: "bg-white text-black",
                        icon: Users
                    },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                    >
                        <Card className={`border-none shadow-sm rounded-[32px] overflow-hidden ${stat.color}`}>
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-tight">{stat.label}</p>
                                    <stat.icon className="w-5 h-5 opacity-40 shrink-0" />
                                </div>
                                <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
                                    <div className="text-3xl sm:text-4xl font-black tracking-tighter truncate">{stat.value}</div>
                                    {stat.growth !== undefined && (
                                        <div className={`flex items-center text-[10px] font-black mb-1 sm:mb-2 px-2 py-1 rounded-full ${stat.growth >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {stat.growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                            {Math.abs(stat.growth).toFixed(0)}%
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Chart Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="border-none shadow-sm rounded-[32px] sm:rounded-[42px] bg-white overflow-hidden p-6 sm:p-8 lg:p-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 sm:mb-10 gap-4 sm:gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600 shrink-0">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight leading-tight uppercase italic">Courbe de Performance</h2>
                            </div>
                            <p className="text-[#6e6e73] text-sm font-medium sm:pl-10">Évolution croisée du trafic et des conversions.</p>
                        </div>
                    </div>

                    <div className="h-[300px] sm:h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.chartData || []}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#86868b' }}
                                    dy={10}
                                    tickFormatter={(str) => {
                                        const d = new Date(str);
                                        return period === '1y' ? format(d, 'MMM') : format(d, 'dd MMM');
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#86868b' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '20px',
                                        border: 'none',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                        padding: '15px'
                                    }}
                                    labelStyle={{ fontWeight: 900, marginBottom: '5px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue (€)"
                                    stroke="#007AFF"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="clics"
                                    name="Clics"
                                    stroke="#000000"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    fill="transparent"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </motion.div>

            {/* Resource Breakdown Section */}
            {stats?.resourceStats && Object.keys(stats.resourceStats).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(stats.resourceStats).map(([resId, data]: [string, any]) => {
                        const convRate = data.clicks > 0 ? ((data.conversions / data.clicks) * 100).toFixed(1) : 0;
                        return (
                            <Card key={resId} className="border-none shadow-sm rounded-[32px] bg-white p-6 flex items-center justify-between group hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-[#007AFF]">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">{resId === 'direct' ? 'Lien Direct' : resId}</p>
                                        <h4 className="text-xl font-black text-[#1D1D1F] tracking-tight truncate">{resId === 'marketing' ? 'Faire ses premiers 1 000€ avec sa marque de vêtement' : resId}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-[#1D1D1F]">{data.clicks} <span className="text-[10px] font-bold text-[#86868b] uppercase">Clics</span></div>
                                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                        {convRate}% Conv. ({data.conversions})
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Invitation Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-xl rounded-[32px] sm:rounded-[40px] p-2 bg-white sticky top-28">
                        <CardHeader className="p-6 sm:p-8 pb-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#007AFF]/10 rounded-2xl sm:rounded-[20px] flex items-center justify-center mb-6">
                                <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 text-[#007AFF]" />
                            </div>
                            <CardTitle className="text-xl sm:text-2xl font-black tracking-tight text-[#1D1D1F] uppercase italic">Recruter un Partenaire</CardTitle>
                            <CardDescription className="text-sm sm:text-base font-medium">Déploiement immédiat du pack partenaire par email.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 sm:p-8 pt-0">
                            <form onSubmit={handleInvite} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#86868b] pl-1">Nom / Pseudo</label>
                                    <Input
                                        placeholder="Ex: @clara_vlogs"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        required
                                        className="h-14 bg-[#F5F5F7] border-none rounded-2xl px-6 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#86868b] pl-1">Email</label>
                                    <Input
                                        type="email"
                                        placeholder="clara@agency.com"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        required
                                        className="h-14 bg-[#F5F5F7] border-none rounded-2xl px-6 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#86868b] pl-1">Message personnalisé (Optionnel)</label>
                                    <textarea
                                        placeholder="Salut ! On adore ton contenu, on aimerait bosser avec toi..."
                                        value={newCustomMessage}
                                        onChange={(e) => setNewCustomMessage(e.target.value)}
                                        className="w-full h-24 bg-[#F5F5F7] border-none rounded-2xl px-6 py-4 font-bold text-sm resize-none outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[#1D1D1F]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#007AFF] bg-[#007AFF]/5 px-2 py-1 rounded-md inline-block mb-1">Commission Premium (0.3 = 30%)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={newRate}
                                        onChange={(e) => setNewRate(e.target.value)}
                                        className="h-14 bg-[#F5F5F7] border-none rounded-2xl px-6 font-bold text-[#007AFF]"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-black text-white hover:bg-[#1D1D1F] rounded-[22px] h-14 sm:h-16 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-95"
                                    disabled={isInviting}
                                >
                                    {isInviting ? "Déploiement..." : "Générer l'Invitation"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Partners List */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b] opacity-40" />
                            <Input
                                className="pl-14 h-14 sm:h-16 bg-white border-none shadow-sm rounded-[24px] font-bold text-sm sm:text-base"
                                placeholder="Filtrer les partenaires..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-28 bg-white/50 rounded-[32px] animate-pulse" />
                                ))
                            ) : filteredPartners.length === 0 ? (
                                <Card className="border-none shadow-sm p-20 text-center rounded-[40px] bg-white">
                                    <Users className="w-20 h-20 text-[#E5E5E7] mx-auto mb-6 opacity-20" />
                                    <h3 className="text-xl font-black text-[#1D1D1F] uppercase italic">Silence Radio</h3>
                                    <p className="text-[#6e6e73] font-medium mt-2">Aucun résultat pour cette recherche.</p>
                                </Card>
                            ) : (
                                filteredPartners.map((partner, idx) => (
                                    <motion.div
                                        key={partner.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card className="border-none shadow-sm overflow-hidden group hover:shadow-xl transition-all rounded-[32px] bg-white">
                                            <div className="p-6 sm:p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6 sm:gap-8">
                                                <div className="flex gap-4 sm:gap-6">
                                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#F5F5F7] group-hover:bg-black group-hover:text-white transition-colors duration-500 rounded-xl sm:rounded-[22px] flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 italic">
                                                        {partner.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                                            <h3 className="font-black text-[#1D1D1F] text-lg sm:text-xl tracking-tight leading-none truncate uppercase italic">{partner.name}</h3>
                                                            <Badge variant={partner.status === 'ACTIVE' ? 'default' : 'secondary'} className="rounded-full px-2 py-0.5 text-[8px] sm:text-[9px] font-black tracking-widest uppercase">
                                                                {partner.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-[#6E6E73] font-medium flex items-center gap-2 truncate">
                                                            <Mail className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                                            {partner.email}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <div className="text-[8px] sm:text-[10px] font-black uppercase text-[#007AFF] bg-[#007AFF]/5 px-2 py-1 rounded-md tracking-widest">
                                                                CODE: {partner.referralCode}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 xl:gap-14 border-t xl:border-t-0 pt-6 xl:pt-0">
                                                    <div>
                                                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b] mb-1 sm:mb-2 pl-0.5">Trafic</p>
                                                        <p className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tighter">{partner._count?.clicks || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b] mb-1 sm:mb-2 pl-0.5">Conv.</p>
                                                        <p className="text-xl sm:text-2xl font-black text-[#007AFF] tracking-tighter">
                                                            {partner._count?.clicks > 0
                                                                ? ((partner._count?.commissions / partner._count?.clicks) * 100).toFixed(1)
                                                                : '0.0'}
                                                            <span className="text-xs font-medium opacity-40">%</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b] mb-1 sm:mb-2 pl-0.5">Comm.</p>
                                                        <p className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tighter">{(partner.commissionRate * 100).toFixed(0)}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b] mb-1 sm:mb-2 pl-0.5">Rewards</p>
                                                        <p className="text-xl sm:text-2xl font-black text-green-600 tracking-tighter">{partner.earningsTotal.toFixed(1)}€</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 md:justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl hover:bg-black hover:text-white transition-all duration-300"
                                                            onClick={() => copyToClipboard(`https://outfity.fr?v=${partner.referralCode}`)}
                                                            title="Copier le lien"
                                                        >
                                                            <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                                                            onClick={() => deletePartner(partner.id)}
                                                            title="Supprimer le partenaire"
                                                        >
                                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl hover:bg-black hover:text-white transition-all duration-300"
                                                            onClick={() => router.push(`/admin/partners/${partner.id}`)}
                                                        >
                                                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action bar for Pending */}
                                            {partner.status === 'PENDING' && (
                                                <div className="px-6 sm:px-8 py-4 bg-[#F5F5F7] flex flex-col sm:flex-row sm:items-center justify-between border-t border-black/5 gap-4">
                                                    <div className="flex items-center gap-3 text-[10px] font-black text-[#6E6E73] uppercase tracking-widest pl-1">
                                                        <Hourglass className="w-4 h-4 text-[#F59E0B] shrink-0" />
                                                        <span className="truncate">Attente d'accès partenaire</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 px-4 rounded-xl bg-white text-[9px] sm:text-[10px] font-black text-[#007AFF] uppercase tracking-widest shadow-sm hover:bg-[#007AFF] hover:text-white transition-all shrink-0"
                                                            onClick={() => copyToClipboard(`https://outfity.fr/affilie/invite?token=${partner.invitationToken}`)}
                                                        >
                                                            <Mail className="w-3.5 h-3.5 mr-2" /> Lien direct
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 px-4 rounded-xl bg-white text-[9px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest shadow-sm hover:bg-green-600 hover:text-white transition-all shrink-0"
                                                            onClick={() => resendInvite(partner.id)}
                                                        >
                                                            <RotateCw className="w-3.5 h-3.5 mr-2" /> Relancer
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper mapping for lucide-react names to component
const Icons = {
    TrendingUp,
    DollarSign,
    Users,
    MousePointer2,
}
