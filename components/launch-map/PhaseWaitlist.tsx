import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Copy,
    Users,
    Rocket,
    CheckCircle2,
    Globe,
    ArrowRight,
    Link as LinkIcon,
    ArrowLeft,
    Settings2,
    Palette,
    Type,
    Image as LucideImage,
    Upload,
    Download,
    Mail,
    Eye,
    LayoutDashboard,
    TrendingUp,
} from 'lucide-react';
import { PhaseCompletionCelebration } from './PhaseCompletionCelebration';
import { cn } from '@/lib/utils';
import type { BrandIdentity } from './LaunchMapStepper';
import Link from 'next/link';
import { toast } from 'sonner';

interface PhaseWaitlistProps {
    brandId: string;
    brand?: BrandIdentity | null;
    onComplete: () => void;
    userPlan?: string;
}

type TabType = 'dashboard' | 'customize' | 'leads';

export function PhaseWaitlist({ brandId, brand, onComplete, userPlan }: PhaseWaitlistProps) {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [isDeploying, setIsDeploying] = useState(false);
    const [isDeployed, setIsDeployed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [designs, setDesigns] = useState<any[]>([]);

    const [settings, setSettings] = useState({
        title: 'Prêt pour le changement ?',
        description: 'Rejoins la waitlist pour être informé du drop.',
        mockupUrl: '',
        designId: '',
        accentColor: '#007AFF',
        logoUrl: '',
        goal: 100
    });

    const [showCelebration, setShowCelebration] = useState(false);
    const [hasCelebrated, setHasCelebrated] = useState(false);

    const goal = settings.goal || 100;
    const emailsCollected = leads.length;

    // Trigger celebration
    useEffect(() => {
        if (emailsCollected >= goal && !hasCelebrated && !loading) {
            setShowCelebration(true);
            setHasCelebrated(true);
        }
    }, [emailsCollected, hasCelebrated, loading]);

    // Fetch real stats, settings, and designs
    const fetchData = async () => {
        if (!brandId) return;
        try {
            const [leadsRes, settingsRes, designsRes] = await Promise.all([
                fetch(`/api/launch-map/waitlist/leads?brandId=${brandId}${settings.designId ? `&designId=${settings.designId}` : ''}`),
                fetch(`/api/launch-map/waitlist/settings?brandId=${brandId}`),
                fetch(`/api/designs?brandId=${brandId}`)
            ]);

            if (leadsRes.ok) {
                const data = await leadsRes.json();
                setLeads(data.leads || []);
            }

            if (settingsRes.ok) {
                const data = await settingsRes.json();
                if (data.settings && Object.keys(data.settings).length > 0) {
                    setSettings(prev => ({ ...prev, ...data.settings }));
                    setIsDeployed(true);
                }
            }

            if (designsRes.ok) {
                const data = await designsRes.json();
                // We allow ANY design that has an image, not just 'completed'
                const selectableDesigns = (data.designs || []).filter((d: any) => d.productImageUrl);
                setDesigns(selectableDesigns);

                // If no design selected, take the first one available
                if (!settings.designId && selectableDesigns.length > 0) {
                    const first = selectableDesigns[0];
                    setSettings(prev => ({
                        ...prev,
                        designId: first.id,
                        mockupUrl: first.productImageUrl
                    }));
                }
            }
        } catch (err) {
            console.warn('Failed to fetch waitlist data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Pool every 15s for new leads
        return () => clearInterval(interval);
    }, [brandId, settings.designId]);

    const waitlistLink = typeof window !== 'undefined'
        ? `${window.location.origin}/waitlist/${brandId}${settings.designId ? `?design=${settings.designId}` : ''}`
        : '';

    const saveAndDeploy = async () => {
        setIsDeploying(true);
        try {
            const res = await fetch('/api/launch-map/waitlist/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandId, settings })
            });
            if (res.ok) {
                setIsDeployed(true);
                toast.success("Page mise à jour avec succès !");
                // On ne change pas d'onglet automatiquement, on laisse l'utilisateur voir son travail
            }
        } catch (e) {
            toast.error("Erreur lors du déploiement");
        } finally {
            setIsDeploying(false);
        }
    };

    const copyLink = () => {
        if (!waitlistLink) return;
        navigator.clipboard.writeText(waitlistLink);
        setCopied(true);
        toast.info("Lien copié dans le presse-papier");
        setTimeout(() => setCopied(false), 2000);
    };

    const viewLive = () => {
        if (waitlistLink) window.open(waitlistLink, '_blank');
    };

    const downloadLeads = () => {
        const csv = [
            ['Email', 'Date d\'inscription', 'Source'].join(','),
            ...leads.map(l => [l.email, new Date(l.createdAt).toLocaleDateString(), l.source || 'waitlist'].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `waitlist_${brand?.name || 'brand'}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const simulateLead = async () => {
        try {
            await fetch('/api/waitlist/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    designId: settings.designId,
                    email: `test-${Math.random().toString(36).slice(2, 7)}@example.com`,
                    source: 'simulation'
                })
            });
            fetchData();
            toast.success("Lead simulé avec succès");
        } catch (e) {
            toast.error("Échec de la simulation");
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-[#86868B] uppercase tracking-widest">Initialisation du Hub...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] relative overflow-hidden">
            {/* Navigation Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-black/5 bg-white z-20">
                <div className="flex items-center gap-6">
                    <Link href="/launch-map" className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-[#86868B]" />
                    </Link>
                    <div className="h-4 w-[1px] bg-black/10" />
                    <div>
                        <h2 className="text-sm font-black text-[#1D1D1F] uppercase tracking-wider">Waitlist Studio</h2>
                        <p className="text-[10px] text-[#86868B] font-bold uppercase tracking-tight">Phase 5 • Validation Marché</p>
                    </div>
                </div>

                <div className="flex bg-[#F5F5F7] p-1 rounded-full border border-black/5">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                            activeTab === 'dashboard' ? "bg-white text-[#007AFF] shadow-apple-sm" : "text-[#86868B] hover:text-[#1D1D1F]"
                        )}
                    >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Tableau
                    </button>
                    <button
                        onClick={() => setActiveTab('customize')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                            activeTab === 'customize' ? "bg-white text-[#007AFF] shadow-apple-sm" : "text-[#86868B] hover:text-[#1D1D1F]"
                        )}
                    >
                        <Palette className="w-3.5 h-3.5" />
                        Studio
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                            activeTab === 'leads' ? "bg-white text-[#007AFF] shadow-apple-sm" : "text-[#86868B] hover:text-[#1D1D1F]"
                        )}
                    >
                        <Users className="w-3.5 h-3.5" />
                        Leads ({emailsCollected})
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {activeTab === 'customize' ? (
                        <Button
                            onClick={saveAndDeploy}
                            disabled={isDeploying}
                            className="bg-[#007AFF] hover:bg-[#0056CC] text-white font-black uppercase text-[11px] tracking-widest h-9 rounded-full px-6 shadow-apple"
                        >
                            {isDeploying ? 'Déploiement...' : 'Déployer les modifs'}
                        </Button>
                    ) : (
                        <Button
                            onClick={onComplete}
                            disabled={emailsCollected < goal}
                            className={cn(
                                "h-9 rounded-full px-6 font-black uppercase text-[11px] tracking-widest gap-2 shadow-apple transition-all",
                                emailsCollected >= goal ? "bg-[#1D1D1F] text-white hover:bg-black" : "bg-black/5 text-black/30 border border-black/5 cursor-not-allowed"
                            )}
                        >
                            Tech Pack
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {!isDeployed && activeTab !== 'customize' ? (
                <div className="flex-1 flex items-center justify-center p-6">
                    <Card className="max-w-xl w-full border-none shadow-apple-2xl rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-12 text-center space-y-8">
                            <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-500/20 rotate-6 group hover:rotate-0 transition-transform duration-500">
                                <Rocket className="w-12 h-12 text-white" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-[#1D1D1F] tracking-tight">Active ton Radar Marché</h3>
                                <p className="text-[#86868B] text-lg font-medium leading-relaxed">
                                    Avant de dépenser en production, prouve que tes clients sont prêts. On déploie ta Landing Page optimisée TikTok en un éclair.
                                </p>
                            </div>
                            <Button
                                size="lg"
                                onClick={() => setActiveTab('customize')}
                                className="w-full h-16 text-base font-black shadow-apple-lg bg-[#007AFF] hover:bg-[#0056CC] rounded-2xl group transition-all"
                            >
                                Commencer le Studio
                                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto stylish-scrollbar bg-[#F5F5F7]">
                        <div className="p-8 sm:p-12 max-w-5xl mx-auto">
                            {activeTab === 'dashboard' && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <Card className="md:col-span-5 bg-white border-none shadow-apple-sm rounded-3xl p-8 flex flex-col items-center text-center justify-center space-y-6 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative">
                                                {/* Progress Ring (SVG) */}
                                                <svg className="w-32 h-32 transform -rotate-90">
                                                    <circle
                                                        cx="64"
                                                        cy="64"
                                                        r="58"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="transparent"
                                                        className="text-black/[0.03]"
                                                    />
                                                    <circle
                                                        cx="64"
                                                        cy="64"
                                                        r="58"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="transparent"
                                                        strokeDasharray={364.4}
                                                        strokeDashoffset={364.4 - (Math.min(emailsCollected / goal, 1) * 364.4)}
                                                        strokeLinecap="round"
                                                        className="text-blue-500 transition-all duration-1000 ease-out"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <p className="text-3xl font-black text-[#1D1D1F]">{Math.round(Math.min((emailsCollected / goal) * 100, 100))}%</p>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#86868B]">Validé</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-2xl font-black text-[#1D1D1F]">{emailsCollected} / {goal}</p>
                                                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest leading-loose">Fans sur liste d&apos;attente</p>
                                            </div>
                                        </Card>

                                        <div className="md:col-span-7 space-y-6">
                                            <Card className="bg-white border-none shadow-apple-sm rounded-3xl p-8 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B]">Lien Public</p>
                                                    <Globe className="w-4 h-4 text-[#86868B]" />
                                                </div>
                                                <div className="flex items-center gap-3 bg-[#F5F5F7] p-2 rounded-2xl border border-black/5">
                                                    <div className="flex-1 px-4 text-sm font-bold text-[#1D1D1F] truncate lowercase opacity-60">
                                                        {waitlistLink.replace(/https?:\/\//, '')}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button size="sm" onClick={viewLive} className="bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest px-4 shadow-sm border border-blue-500/20 gap-2">
                                                            <Eye className="w-3 h-3" />
                                                            Voir
                                                        </Button>
                                                        <Button size="sm" onClick={copyLink} className="bg-white text-black hover:bg-black hover:text-white rounded-xl font-black uppercase text-[10px] tracking-widest px-6 shadow-sm border border-black/5">
                                                            {copied ? 'Copié' : 'Copier'}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-medium text-[#86868B]">Colle ce lien dans ta bio TikTok et tes scripts générés par Joy.</p>
                                            </Card>

                                            <div className="bg-[#1D1D1F] rounded-3xl p-8 text-white flex items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                                                <div className="absolute right-[-10%] top-[-20%] w-32 h-32 bg-white/5 blur-3xl rounded-full" />
                                                <div className="space-y-1 relative z-10">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Prochaine Étape</p>
                                                    <p className="text-base font-bold">
                                                        {emailsCollected < goal
                                                            ? `Encore ${goal - emailsCollected} leads pour débloquer le Tech Pack.`
                                                            : "Objectif atteint ! Prêt pour le Tech Pack."}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" onClick={simulateLead} className="relative z-10 text-white/40 hover:text-white hover:bg-white/10 text-[10px] uppercase font-black tracking-widest">
                                                    Simuler 1 fan
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Banner */}
                                    <div className="bg-white rounded-[40px] p-10 border border-black/5 shadow-apple-sm relative overflow-hidden">
                                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
                                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                                            <div className="shrink-0">
                                                <div className="relative">
                                                    <div className="w-48 h-48 bg-[#F5F5F7] rounded-3xl overflow-hidden border border-black/5 shadow-inner flex items-center justify-center p-6">
                                                        <img src={settings.mockupUrl || '/placeholder.png'} className="w-full h-full object-contain mix-blend-multiply" />
                                                    </div>
                                                    <div className="absolute -bottom-4 -right-4 bg-white shadow-xl rounded-2xl p-3 border border-black/5 animate-bounce">
                                                        <TrendingUp className="w-6 h-6 text-green-500" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-6 text-center md:text-left">
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-black text-[#1D1D1F] tracking-tight">{settings.title}</h3>
                                                    <p className="text-[#86868B] font-medium leading-relaxed">{settings.description}</p>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Landing en ligne
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-black/5 text-[#86868B] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                                        <Mail className="w-4 h-4" />
                                                        E-mails sécurisés
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'customize' && (
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* Editor Controls (Left) */}
                                    <div className="xl:col-span-7 space-y-8">
                                        <div className="bg-white rounded-[40px] p-8 border border-black/5 shadow-apple-sm space-y-10">
                                            {/* Step 1: Design Choice (Crucial for user) */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                                        <LucideImage className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-[#1D1D1F]">1. Choisis ton vêtement</h4>
                                                        <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">L'image principale du drop</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                                    {designs.map((d) => (
                                                        <button
                                                            key={d.id}
                                                            onClick={() => setSettings(s => ({ ...s, designId: d.id, mockupUrl: d.productImageUrl }))}
                                                            className={cn(
                                                                "group relative aspect-square rounded-[24px] overflow-hidden border-2 transition-all p-3 bg-[#F5F5F7]",
                                                                settings.designId === d.id
                                                                    ? "border-blue-500 bg-white ring-4 ring-blue-500/10 scale-105"
                                                                    : "border-transparent opacity-60 hover:opacity-100 hover:scale-102"
                                                            )}
                                                        >
                                                            <img
                                                                src={d.productImageUrl}
                                                                className={cn(
                                                                    "w-full h-full object-contain mix-blend-multiply transition-transform duration-500",
                                                                    settings.designId === d.id ? "scale-110" : "group-hover:scale-105"
                                                                )}
                                                            />
                                                            {settings.designId === d.id && (
                                                                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-lg animate-in zoom-in">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                    {designs.length === 0 && (
                                                        <div className="col-span-full py-12 text-center bg-black/5 rounded-[32px] border-2 border-dashed border-black/10">
                                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                                <Rocket className="w-6 h-6 text-black/20" />
                                                            </div>
                                                            <p className="text-xs font-black uppercase tracking-widest text-[#86868B]">Aucun design trouvé</p>
                                                            <Link href="/launch-map/phase/4" className="text-[10px] font-black uppercase text-blue-500 hover:underline mt-2 inline-block">Aller au Studio Pharrell</Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Step 2: Content */}
                                            <div className="space-y-6 pt-10 border-t border-black/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                                        <Type className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-[#1D1D1F]">2. Texte & Accroche</h4>
                                                        <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Capture l'attention</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-5">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B]">Texte du Logo (Haut)</label>
                                                        <input
                                                            type="text"
                                                            value={settings.logoUrl}
                                                            placeholder={brand?.name || 'OUTIFTY'}
                                                            className="w-full h-14 bg-[#F5F5F7] rounded-2xl px-5 text-sm font-bold border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none"
                                                            onChange={(e) => setSettings(s => ({ ...s, logoUrl: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B]">Titre Principal</label>
                                                        <input
                                                            type="text"
                                                            value={settings.title}
                                                            className="w-full h-14 bg-[#F5F5F7] rounded-2xl px-5 text-sm font-bold border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none"
                                                            onChange={(e) => setSettings(s => ({ ...s, title: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868B]">Description (Pitch)</label>
                                                        <textarea
                                                            value={settings.description}
                                                            className="w-full h-32 bg-[#F5F5F7] rounded-2xl p-5 text-sm font-medium border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none resize-none"
                                                            onChange={(e) => setSettings(s => ({ ...s, description: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Step 3: Color */}
                                            <div className="space-y-6 pt-10 border-t border-black/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                                        <Palette className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-[#1D1D1F]">3. Identité Visuelle</h4>
                                                        <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Couleur du bouton</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-5">
                                                    {['#007AFF', '#000000', '#FF3B30', '#34C759', '#5856D6', '#FF9500'].map(color => (
                                                        <button
                                                            key={color}
                                                            onClick={() => setSettings(s => ({ ...s, accentColor: color }))}
                                                            className={cn(
                                                                "w-12 h-12 rounded-full border-4 transition-all relative group",
                                                                settings.accentColor === color
                                                                    ? "border-blue-500 ring-4 ring-blue-500/10 scale-110"
                                                                    : "border-white shadow-sm hover:scale-105"
                                                            )}
                                                            style={{ backgroundColor: color }}
                                                        >
                                                            {settings.accentColor === color && (
                                                                <CheckCircle2 className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Step 4: Objectif */}
                                            <div className="space-y-6 pt-10 border-t border-black/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                                                        <TrendingUp className="w-5 h-5 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-[#1D1D1F]">4. Objectif de Capture</h4>
                                                        <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">Combien de leads avant le drop ?</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        value={settings.goal}
                                                        onChange={(e) => setSettings(s => ({ ...s, goal: parseInt(e.target.value) || 10 }))}
                                                        className="w-32 h-14 bg-[#F5F5F7] rounded-2xl px-5 text-sm font-bold border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none"
                                                    />
                                                    <p className="text-xs text-[#86868B] font-medium italic">Nous recommandons au moins 100 leads pour un lancement réussi.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline Preview Section (Right - Fixed on Desktop) */}
                                    <div className="xl:col-span-5 flex flex-col items-center">
                                        <div className="sticky top-24 space-y-6 flex flex-col items-center">
                                            <div className="flex items-center gap-3 px-6 py-2.5 bg-white shadow-apple-sm rounded-full border border-black/5">
                                                <Eye className="w-4 h-4 text-[#86868B]" />
                                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#86868B]">Live Preview (Mobile)</p>
                                            </div>

                                            <div className="w-[300px] h-[600px] border-[12px] border-[#1D1D1F] rounded-[55px] bg-white shadow-apple-2xl overflow-hidden flex flex-col relative scale-[1] transition-all duration-700 ring-2 ring-black/5">
                                                {/* iPhone Notch/Dynamic Island */}
                                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1D1D1F] rounded-full z-50 flex items-center justify-end px-4">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                                </div>

                                                {/* Status Bar SIM */}
                                                <div className="h-10 w-full flex items-center px-10 justify-between opacity-30 select-none pt-2">
                                                    <span className="text-[10px] font-black">9:41</span>
                                                    <div className="flex gap-1.5">
                                                        <div className="w-4 h-2 bg-black rounded-[2px]" />
                                                        <div className="w-3 h-2 bg-black rounded-full" />
                                                    </div>
                                                </div>

                                                {/* App Header */}
                                                <div className="px-6 py-5 flex items-center justify-center border-b border-black/5 select-none text-[13px] font-black tracking-[0.2em] uppercase text-[#1D1D1F]">
                                                    {settings.logoUrl || brand?.name || 'OUTIFTY'}
                                                </div>

                                                {/* Body */}
                                                <div className="flex-1 p-8 flex flex-col items-center justify-between text-center gap-10 overflow-y-auto hide-scrollbar scroll-smooth">
                                                    <div className="w-full aspect-square bg-[#F5F5F7] rounded-[40px] p-6 shadow-inner flex items-center justify-center animate-in zoom-in-50 duration-700">
                                                        {settings.mockupUrl ? (
                                                            <img
                                                                src={settings.mockupUrl}
                                                                key={settings.mockupUrl}
                                                                className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl animate-in fade-in zoom-in duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-black/5 rounded-full animate-pulse" />
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <h3 className="text-xl font-black text-[#1D1D1F] leading-tight px-2">{settings.title}</h3>
                                                        <p className="text-[12px] text-[#86868B] font-medium leading-relaxed px-4 opacity-80">{settings.description}</p>
                                                    </div>

                                                    {/* Form UI */}
                                                    <div className="w-full space-y-4 pt-4">
                                                        <div className="h-14 w-full bg-[#F5F5F7] rounded-[20px] border border-black/5 px-6 flex items-center text-[12px] font-bold text-black/20 select-none shadow-apple-sm">
                                                            ton@email.com
                                                        </div>
                                                        <button
                                                            disabled
                                                            className="w-full h-14 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
                                                            style={{ backgroundColor: settings.accentColor }}
                                                        >
                                                            Rejoindre le Drop
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'leads' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="flex items-center justify-between bg-white rounded-[32px] p-6 border border-black/5 shadow-apple-sm">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                                                <Mail className="w-8 h-8 text-blue-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-[#1D1D1F]">Tes Emails Collectés</h3>
                                                <p className="text-[#86868B] text-sm font-medium">Tes futurs clients les plus fidèles sont ici.</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={downloadLeads} className="rounded-full gap-2 border-black/10 hover:bg-black/5 px-6 font-bold shadow-sm">
                                            <Download className="w-4 h-4" />
                                            Exporter en CSV
                                        </Button>
                                    </div>

                                    {leads.length > 0 ? (
                                        <div className="bg-white rounded-[40px] border border-black/10 shadow-apple-xl overflow-hidden divide-y divide-black/5">
                                            <div className="bg-[#F5F5F7]/30 px-8 py-4 grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-[#86868B]">
                                                <div className="col-span-1 flex items-center">#</div>
                                                <div className="col-span-6 flex items-center">Client</div>
                                                <div className="col-span-3 flex items-center">Date</div>
                                                <div className="col-span-2 flex items-center">Source</div>
                                            </div>
                                            <div className="max-h-[500px] overflow-y-auto stylish-scrollbar">
                                                {leads.map((lead, i) => (
                                                    <div key={lead.id} className="px-8 py-5 grid grid-cols-12 items-center text-[13px] hover:bg-black/[0.01] transition-colors">
                                                        <div className="col-span-1 text-[#86868B] font-mono">{leads.length - i}</div>
                                                        <div className="col-span-6 font-bold text-[#1D1D1F] flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] text-blue-500 font-black">
                                                                {lead.email[0].toUpperCase()}
                                                            </div>
                                                            {lead.email}
                                                        </div>
                                                        <div className="col-span-3 text-[#86868B]">{new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div className="col-span-2">
                                                            <span className="bg-black/5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-[#86868B]">
                                                                {lead.source || 'waitlist'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white border-2 border-dashed border-black/5 rounded-[40px] p-24 text-center space-y-4">
                                            <div className="w-20 h-20 bg-black/[0.02] rounded-full mx-auto flex items-center justify-center">
                                                <Users className="w-10 h-10 text-black/10" />
                                            </div>
                                            <p className="text-sm font-bold text-[#86868B] uppercase tracking-widest">Aucune capture pour le moment</p>
                                            <p className="text-xs text-[#86868B] max-w-xs mx-auto opacity-60">Partage ton lien pour commencer à collecter tes premiers emails.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCelebration && (
                <PhaseCompletionCelebration
                    phaseName="Objectif Atteint ! 🎯"
                    phaseId={5}
                    nextPhaseName="Tech Pack"
                    nextPhaseHref="/launch-map/phase/6"
                    onContinue={() => setShowCelebration(false)}
                />
            )}
        </div>
    );
}
