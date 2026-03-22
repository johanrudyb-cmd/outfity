'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Mail,
    Calendar,
    DollarSign,
    MousePointer2,
    TrendingUp,
    Copy,
    Sparkles,
    BarChart3,
    ExternalLink,
    ChevronRight,
    Target,
    Users,
    Zap,
    AlertCircle,
    UserX,
    RotateCw,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function PartnerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPartnerData = useCallback(async () => {
        try {
            const response = await fetch(`/api/admin/partners/${id}`);
            const result = await response.json();

            if (result.error) {
                toast.error(result.error);
                router.push('/admin/partners');
                return;
            }

            setData(result);
        } catch (error) {
            console.error("Error fetching partner:", error);
            toast.error("Erreur lors du chargement des données");
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchPartnerData();
    }, [fetchPartnerData]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copié dans le presse-papier !");
    };

    const resendInvite = async () => {
        const promise = fetch(`/api/admin/partners/${id}/resend`, { method: 'POST' })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Erreur d'envoi");
                return data;
            });

        toast.promise(promise, {
            loading: 'Renvoi de l\'invitation...',
            success: 'Invitation renvoyée avec succès !',
            error: (err) => `${err.message}`
        });
    };

    const handleSuspend = async () => {
        if (!confirm("Voulez-vous vraiment suspendre ce partenaire ?")) return;

        const promise = fetch(`/api/admin/partners/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'SUSPENDED' })
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de la suspension");
            return data;
        });

        toast.promise(promise, {
            loading: 'Suspension en cours...',
            success: () => {
                fetchPartnerData();
                return 'Partenaire suspendu';
            },
            error: (err) => `${err.message}`
        });
    };

    const handleDelete = async () => {
        if (!confirm("Voulez-vous vraiment supprimer ce partenaire ? Cette action est irréversible.")) return;

        const promise = fetch(`/api/admin/partners/${id}`, { method: 'DELETE' })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Erreur de suppression");
                return data;
            });

        toast.promise(promise, {
            loading: 'Suppression...',
            success: () => {
                router.push('/admin/partners');
                return 'Partenaire supprimé définitivement';
            },
            error: (err) => `${err.message}`
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!data) return null;

    const { stats } = data;

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-20">
            {/* Header / Navigation bar */}
            <div className="bg-white border-b border-black/5 sticky top-0 z-30 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/admin/partners')}
                        className="flex items-center gap-2 text-[#86868b] hover:text-black transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Intelligence Partenaires
                    </Button>
                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[#86868b]">
                        ID: {data.id?.slice(-8)}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                >
                    {/* Main Content (Left Column) */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* ID CARD - PREMIUM BLACK */}
                        <div className="bg-black text-white rounded-[48px] p-12 lg:p-16 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#007AFF]/20 to-transparent pointer-events-none" />
                            <div className="flex flex-col md:flex-row md:items-center gap-10 relative z-10">
                                <div className="w-32 h-32 bg-white/10 rounded-[40px] flex items-center justify-center text-6xl font-black italic shadow-2xl border border-white/5 text-[#007AFF]">
                                    {data.name?.charAt(0)}
                                </div>
                                <div className="space-y-4 text-left mr-auto">
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-5xl lg:text-6xl font-black tracking-tight uppercase italic leading-none">{data.name}</h1>
                                        <Badge className={`${data.status === 'ACTIVE' ? 'bg-green-500' : data.status === 'PENDING' ? 'bg-orange-500' : 'bg-red-500'} text-white border-none rounded-full px-5 py-2 text-[10px] uppercase font-black tracking-widest leading-none`}>
                                            {data.status === 'ACTIVE' ? 'ACTIF' : data.status === 'PENDING' ? 'EN ATTENTE' : 'SUSPENDU'}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-white/50">
                                        <p className="font-medium text-xl flex items-center gap-3">
                                            <Mail className="w-5 h-5 opacity-40" />
                                            {data.email}
                                        </p>
                                        <div className="h-4 w-px bg-white/10 hidden sm:block" />
                                        <p className="font-medium text-xl flex items-center gap-3">
                                            <Calendar className="w-5 h-5 opacity-40" />
                                            Depuis {format(new Date(data.createdAt), 'dd MMMM yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-16 relative z-10">
                                {[
                                    { label: "Commission", value: `${(stats.commissionRate * 100).toFixed(0)}%`, icon: TrendingUp, color: "text-orange-400" },
                                    { label: "Commission Due", value: `${stats.totalCommissionToPay.toFixed(2)}€`, icon: DollarSign, color: "text-green-400" },
                                    { label: "Revenu Récurrent (MMR)", value: `${stats.mmr.toFixed(2)}€`, icon: Zap, color: "text-blue-400" },
                                ].map((item, i) => (
                                    <div key={i} className="bg-white/5 rounded-3xl p-8 border border-white/10 group">
                                        <div className="flex items-center gap-3 mb-4">
                                            <item.icon className={`w-5 h-5 ${item.color}`} />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{item.label}</p>
                                        </div>
                                        <p className="text-4xl font-black tracking-tighter">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BUSINESS INTELLIGENCE */}
                        <section className="bg-white rounded-[48px] p-12 lg:p-16 border border-black/5 shadow-xl">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-2 h-10 bg-[#007AFF] rounded-full" />
                                <h3 className="text-3xl font-black text-[#1D1D1F] uppercase italic tracking-tight">Intelligence Commerciale</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="p-10 bg-[#F5F5F7] rounded-[40px] border border-black/5 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                                    <p className="text-[10px] font-black uppercase text-[#86868b] tracking-widest mb-4">Impact Trafic</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <MousePointer2 className="w-6 h-6 text-black" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black text-black tracking-tight">{stats.totalClicks}</p>
                                            <p className="text-xs font-bold text-[#86868b] uppercase tracking-tighter">Clics uniques</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-[#F5F5F7] rounded-[40px] border border-black/5 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                                    <p className="text-[10px] font-black uppercase text-[#86868b] tracking-widest mb-4">Abonnés Actifs</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black text-black tracking-tight">{stats.activeSubscribers}</p>
                                            <p className="text-xs font-bold text-[#86868b] uppercase tracking-tighter">Clients Payants</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-[#F5F5F7] rounded-[40px] border border-black/5 group hover:bg-white hover:shadow-2xl transition-all duration-500">
                                    <p className="text-[10px] font-black uppercase text-[#86868b] tracking-widest mb-4">CA Généré (Total)</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-green-600">
                                            <Target className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-4xl font-black text-black tracking-tight">{stats.totalGeneratedCA.toFixed(0)}€</p>
                                            <p className="text-xs font-bold text-[#86868b] uppercase tracking-tighter">Volume de Vente</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ACTIVITY FEED */}
                        <section className="bg-white rounded-[48px] p-12 lg:p-16 border border-black/5 shadow-xl text-left">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-2 h-10 bg-black rounded-full" />
                                <h3 className="text-3xl font-black text-[#1D1D1F] uppercase italic tracking-tight">Flux de Commissions</h3>
                            </div>
                            <div className="space-y-4">
                                {data.commissions.length === 0 ? (
                                    <div className="p-20 text-center bg-[#F5F5F7] rounded-[32px] border border-dashed border-black/10">
                                        <DollarSign className="w-12 h-12 text-black/10 mx-auto mb-4" />
                                        <p className="font-bold text-[#86868b]">Aucun paiement déclenché pour l'instant.</p>
                                    </div>
                                ) : (
                                    data.commissions.map((comm: any, i: number) => (
                                        <div key={comm.id} className="flex items-center justify-between p-8 bg-[#F5F5F7]/50 border border-black/5 rounded-[32px] hover:bg-white hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-8 text-left">
                                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-[24px] flex items-center justify-center font-black">
                                                    <DollarSign className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#1D1D1F] text-xl leading-tight">Vente Commissionnée</p>
                                                    <p className="text-xs font-semibold text-[#86868b] mt-1 uppercase tracking-tighter">Facture: {comm.orderId?.slice(-12)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-2xl text-green-600">+{comm.amount.toFixed(2)}€</p>
                                                <p className="text-[10px] font-black uppercase text-[#86868b] tracking-wider mt-1 font-mono">{format(new Date(comm.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar (Right Column) */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="bg-white rounded-[48px] p-10 border border-black/5 shadow-xl sticky top-32">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b] mb-10 pl-1 text-left">Console Administrative</h4>

                            <div className="space-y-4">
                                <section className="p-6 bg-[#F5F5F7] rounded-3xl mb-6 text-left">
                                    <p className="text-[10px] font-black uppercase text-[#86868b] mb-4">Lien tracking discret (V=)</p>
                                    <div className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-inner mb-4">
                                        <code className="text-xs font-bold">?v={data.referralCode}</code>
                                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`https://outfity.fr?v=${data.referralCode}`)}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {data.status === 'PENDING' && (
                                        <div className="mt-6 pt-6 border-t border-black/5">
                                            <p className="text-[10px] font-black uppercase text-orange-500 mb-4 flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" /> Invitation en attente
                                            </p>
                                            <Button
                                                onClick={resendInvite}
                                                className="w-full h-14 bg-white border border-orange-100 text-orange-600 hover:bg-orange-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                            >
                                                <RotateCw className="w-3.5 h-3.5" /> Relancer l'invitation
                                            </Button>
                                        </div>
                                    )}
                                </section>

                                <Button
                                    onClick={() => toast.info("Facturation automatique à la fin du mois.")}
                                    className="w-full h-20 bg-black text-white hover:bg-[#1D1D1F] rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                    Bilan des Commissions
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => toast.error("Modification restreinte en mode automatique.")}
                                    className="w-full h-16 border-black/10 text-black hover:bg-black hover:text-white rounded-3xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Éditer Commission
                                </Button>

                                <div className="pt-6 space-y-2">
                                    <Button
                                        variant="ghost"
                                        onClick={handleSuspend}
                                        className="w-full h-14 text-red-500 hover:bg-red-50 rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <UserX className="w-4 h-4" />
                                        {data.status === 'SUSPENDED' ? 'Réactiver Partenaire' : 'Suspendre Partenaire'}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        onClick={handleDelete}
                                        className="w-full h-14 text-red-600/40 hover:text-red-600 hover:bg-red-50 rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Détruire la fiche
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
