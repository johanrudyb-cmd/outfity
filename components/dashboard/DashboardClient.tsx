'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardNotifications } from '@/components/dashboard/DashboardNotifications';
import { StrategyUpdateBanner } from '@/components/dashboard/StrategyUpdateBanner';
import { UpgradeSessionRefresh } from '@/components/dashboard/UpgradeSessionRefresh';
import { Suspense } from 'react';
import {
    TrendingUp, ArrowRight, Crown, Calendar as CalendarIcon,
    Shirt, FileText, Scan, Calculator, PenLine, CheckCircle2,
    ChevronRight, Sparkles, LayoutDashboard, Rocket, Factory,
    Store, Clock, Camera, PenTool,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── types ────────────────────────────────────────────────────────
interface DashboardData {
    user: {
        displayName: string;
        firstName: string;
        plan: string;
        isFree: boolean;
        isAdmin: boolean;
        isPartner: boolean;
    };
    brand: { id: string; name: string; logo: string | null } | null;
    phaseDone: Record<string, boolean>;
    weekEvents: { id: string; type: string; title: string; start: string }[];
    recentActivity: { id: string; feature: string; createdAt: string }[];
    shopifyAffiliateUrl: string;
}

// ── Static data (no fetch needed) ────────────────────────────────
const PHASE_META = [
    { id: 0, label: 'Identité', icon: LayoutDashboard, key: 'phase0', desc: "Choisis l'ADN de ta marque.", time: '5 min', href: '/launch-map' },
    { id: 1, label: 'Stratégie', icon: Rocket, key: 'phase1', desc: 'Ton positionnement créateur.', time: '10 min', href: '/launch-map' },
    { id: 2, label: 'Mockup', icon: Shirt, key: 'phase2', desc: 'Crée tes designs avec Pharrell.', time: '15 min', href: '/launch-map' },
    { id: 3, label: 'Le Scanner', icon: Camera, key: 'phase3', desc: 'Valide le potentiel viral.', time: '5 min', href: '/launch-map' },
    { id: 4, label: 'Scripts', icon: PenLine, iconBg: 'bg-orange-50', iconColor: 'text-orange-500', key: 'phase4', desc: 'Joy te donne tes scripts TikTok.', time: '10 min', href: '/launch-map' },
    { id: 5, label: 'Waitlist', icon: Rocket, key: 'phase5', desc: 'Récolte 100 emails avant de produire.', time: '20 min', href: '/launch-map' },
    { id: 6, label: 'Tech Pack', icon: FileText, key: 'phase6', desc: 'Génère tes fiches techniques usines.', time: '10 min', href: '/launch-map' },
    { id: 7, label: 'Sourcing', icon: Factory, key: 'phase7', desc: 'Ada te trouve les meilleures usines.', time: '15 min', href: '/launch-map' },
    { id: 8, label: 'Boutique', icon: Store, key: 'phase8', desc: 'Lance ta boutique sur Shopify.', time: '30 min', href: '/launch-map' },
];

const AGENT_BY_PHASE: Record<number, { name: string; image: string; colorHex: string; msg: (n: string) => string }> = {
    0: { name: 'Virgil', image: '/images/agents/virgil_final.webp', colorHex: '#007AFF', msg: (n) => `Salut ${n}. C'est le moment de créer l'ADN de ta marque.` },
    1: { name: 'Virgil', image: '/images/agents/virgil_final.webp', colorHex: '#007AFF', msg: (n) => `Salut ${n}. Définissons ta stratégie créateur.` },
    2: { name: 'Pharrell', image: '/images/agents/pharrell_final.webp', colorHex: '#F59E0B', msg: (n) => `Yo ${n}. On va donner vie à ton concept.` },
    3: { name: 'Pharrell', image: '/images/agents/pharrell_final.webp', colorHex: '#F59E0B', msg: (n) => `On scanne ton design, ${n} ?` },
    4: { name: 'Joy', image: '/images/agents/joy_final.webp', colorHex: '#ff327e', msg: (n) => `Coucou ${n} ! On fait tes scripts TikTok ?` },
    5: { name: 'Johan', image: '/images/agents/johan_final.webp', colorHex: '#007AFF', msg: (n) => `Hello ${n}. Prêt pour ta Waitlist ?` },
    6: { name: 'Pharrell', image: '/images/agents/pharrell_final.webp', colorHex: '#F59E0B', msg: (n) => `Prêt pour ton Tech Pack, ${n} ?` },
    7: { name: 'Ada', image: '/images/agents/ada_final.webp', colorHex: '#F43F5E', msg: (n) => `Bonjour ${n}. On contacte les usines ?` },
    8: { name: 'Johan', image: '/images/agents/johan_final.webp', colorHex: '#95BF47', msg: (n) => `Hello ${n}. On lance ta boutique Shopify ?` },
};

const QUICK_TOOLS = [
    { title: 'Tendances Virales', subtitle: 'Top TikTok & Instagram', href: '/trends', icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-500', accent: 'group-hover:border-blue-200' },
    { title: 'Détecter une tendance', subtitle: 'Analyse IA par photo', href: '/trends/visual', icon: Scan, iconBg: 'bg-violet-50', iconColor: 'text-violet-500', accent: 'group-hover:border-violet-200' },
    { title: 'Création de contenu', subtitle: 'Posts & planification', href: '/content-creation', icon: PenLine, iconBg: 'bg-orange-50', iconColor: 'text-orange-500', accent: 'group-hover:border-orange-200' },
    { title: 'Calculateur de marge', subtitle: 'Rentabilité par article', href: '/calculator', icon: Calculator, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', accent: 'group-hover:border-emerald-200' },
];

// ── Main component ────────────────────────────────────────────────
export function DashboardClient() {
    const { data, isLoading } = useSWR<DashboardData>('/api/dashboard/summary', fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 30_000, // don't re-fetch if data is less than 30s old
    });

    // Derive phases immediately — works even while data loads
    const phaseMeta = PHASE_META.map((p) => ({
        ...p,
        done: data ? !!data.phaseDone[p.key] : false,
    }));
    const completedCount = phaseMeta.filter((p) => p.done).length;
    const progress = Math.round((completedCount / phaseMeta.length) * 100);
    const nextPhase = phaseMeta.find((p) => !p.done) ?? phaseMeta[phaseMeta.length - 1];

    const firstName = data?.user.firstName ?? '';
    const agent = AGENT_BY_PHASE[nextPhase.id] ?? AGENT_BY_PHASE[0];

    const today = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long',
    });

    const isFree = data?.user.isFree ?? false;
    const weekEvents = data?.weekEvents ?? [];
    const shopifyUrl = (() => {
        const raw = data?.shopifyAffiliateUrl ?? 'https://www.shopify.com/fr/essai-gratuit';
        return raw.startsWith('http') ? raw : `https://${raw}`;
    })();

    return (
        <div className="min-h-screen relative bg-[#FAFAFA] pb-12 overflow-x-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(#c7c7cc_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] pointer-events-none opacity-40 mix-blend-multiply" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/[0.06] rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 -translate-y-1/4" />
            <div className="absolute top-[20%] left-0 w-[500px] h-[500px] bg-violet-500/[0.05] rounded-full blur-[120px] pointer-events-none transform -translate-x-1/2" />
            <div className="absolute bottom-[-10%] left-[20%] w-[800px] h-[800px] bg-orange-500/[0.04] rounded-full blur-[150px] pointer-events-none" />

            <div className="relative z-10 px-4 sm:px-6 lg:px-12 py-8 sm:py-10 max-w-7xl mx-auto space-y-8 sm:space-y-10">
                {/* Refresh JWT si retour Stripe */}
                <Suspense fallback={null}>
                    <UpgradeSessionRefresh />
                </Suspense>

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold text-[#86868B] uppercase tracking-widest mb-1">
                            {today.charAt(0).toUpperCase() + today.slice(1)}
                        </p>
                        <h1 className="text-4xl sm:text-5xl font-bold text-[#1D1D1F] tracking-tight leading-none">
                            Hello{data ? `, ${data.user.displayName}` : ''} 👋
                        </h1>
                        <p className="text-[#86868B] mt-2 text-base">
                            {data?.brand
                                ? <>Voici l&apos;état de <span className="text-[#1D1D1F] font-semibold">{data.brand.name}</span> aujourd&apos;hui.</>
                                : <span className="inline-block w-36 h-4 rounded bg-[#F0F0F0] animate-pulse" />
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {data && (
                            <div className={cn(
                                'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-widest',
                                isFree
                                    ? 'bg-[#007AFF]/5 text-[#007AFF] border-[#007AFF]/20'
                                    : 'bg-black text-white border-black shadow-lg shadow-black/10'
                            )}>
                                {!isFree && <Crown className="w-3 h-3 text-[#FFD700]" />}
                                {isFree ? 'Plan Starter' : 'Plan Créateur'}
                            </div>
                        )}
                        <DashboardNotifications />
                    </div>
                </div>

                {/* Strategy banner (paid only) */}
                {data && !isFree && <StrategyUpdateBanner />}

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* ── LEFT (2/3) ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Agent Brief card */}
                        <div
                            data-tour="tour-journey"
                            className="relative overflow-hidden rounded-[32px] bg-white border border-black/[0.06] shadow-apple p-8 flex flex-col md:flex-row gap-8 items-center md:items-start group"
                        >
                            {/* Ambient glow — always shown, agent-colored when data ready */}
                            <div
                                className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-all duration-700 group-hover:scale-110 opacity-20"
                                style={{ backgroundColor: agent.colorHex }}
                            />

                            {/* Avatar */}
                            <div className="shrink-0 flex flex-col items-center gap-3 z-10">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[28px] overflow-hidden shadow-xl ring-4 ring-white relative bg-slate-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
                                    <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1D1D1F] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                                    {agent.name} <Sparkles className="w-3 h-3 text-[#FFD700]" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 space-y-5 z-10 w-full text-center md:text-left">
                                <div className="space-y-2">
                                    <h2 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] tracking-tight leading-tight">
                                        &quot;{firstName ? agent.msg(firstName) : agent.msg('...')}&quot;
                                    </h2>
                                    <p className="text-base text-[#86868B] leading-relaxed max-w-lg mx-auto md:mx-0">
                                        <strong>Brief du jour :</strong> {nextPhase.desc}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 justify-center md:justify-start">
                                    <Link href={nextPhase.href} className="flex-1 sm:flex-none">
                                        <Button
                                            className="w-full text-white rounded-2xl px-8 h-12 font-bold text-[15px] shadow-lg active:scale-[0.97] transition-all border-0 flex items-center justify-center gap-2 hover:opacity-90"
                                            style={{ backgroundColor: agent.colorHex }}
                                        >
                                            Objectif : {nextPhase.label}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <div className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 bg-[#F5F5F7] rounded-2xl border border-black/5">
                                        <Clock className="w-4 h-4 text-[#86868B]" />
                                        <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider">
                                            Temps estimé : {nextPhase.time}
                                        </span>
                                    </div>
                                </div>

                                {/* Phases timeline */}
                                <div className="pt-6 mt-6 border-t border-black/5">
                                    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                                        {phaseMeta.map((phase) => {
                                            const Icon = phase.icon;
                                            const isNext = phase.id === nextPhase.id;
                                            return (
                                                <div key={phase.id} className="flex flex-col items-center gap-2 flex-1 min-w-[50px] relative justify-center">
                                                    <div
                                                        className={cn(
                                                            'w-8 h-8 rounded-full flex items-center justify-center border transition-all z-10 relative bg-white',
                                                            phase.done
                                                                ? 'border-[#1D1D1F] text-[#1D1D1F] bg-slate-50'
                                                                : isNext
                                                                    ? 'text-white shadow-md ring-4'
                                                                    : 'border-[#E5E5EA] text-[#86868B] bg-slate-50'
                                                        )}
                                                        style={isNext ? { backgroundColor: agent.colorHex, borderColor: agent.colorHex } : undefined}
                                                    >
                                                        {phase.done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center mt-3 p-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#86868B]">Ton Lancement</p>
                                        <span className="text-[10px] font-bold text-[#86868B]">
                                            {isLoading ? '...' : `${progress}% complété`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick tools grid */}
                        <div>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h2 className="text-lg font-bold text-[#1D1D1F]">Vos outils</h2>
                                <span className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest">Accès rapide</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                {QUICK_TOOLS.map((tool) => {
                                    const Icon = tool.icon;
                                    return (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className={cn(
                                                'group bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 border border-black/[0.05] shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all duration-200 hover:shadow-apple active:scale-[0.97]',
                                                tool.accent
                                            )}
                                        >
                                            <div className="flex items-center justify-between w-full sm:w-auto">
                                                <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform', tool.iconBg)}>
                                                    <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', tool.iconColor)} />
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-[#C7C7CC] shrink-0 group-hover:text-[#86868B] transition-colors sm:hidden" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-1">
                                                <p className="font-bold text-[13px] sm:text-sm text-[#1D1D1F] leading-snug line-clamp-2">{tool.title}</p>
                                                <p className="text-[11px] text-[#86868B] mt-0.5 line-clamp-1">{tool.subtitle}</p>
                                            </div>
                                            <ChevronRight className="hidden sm:block w-4 h-4 text-[#C7C7CC] shrink-0 group-hover:text-[#86868B] transition-colors" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* ── RIGHT (1/3) ── */}
                    <div className="space-y-6">

                        {/* Weekly Calendar */}
                        <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#007AFF]/10 rounded-lg">
                                        <CalendarIcon className="w-4 h-4 text-[#007AFF]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#1D1D1F] text-sm">Cette semaine</h3>
                                        <p className="text-[10px] text-[#86868B] font-bold uppercase tracking-widest">
                                            {weekEvents.length} post{weekEvents.length !== 1 ? 's' : ''} prévu{weekEvents.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#86868B] opacity-50 cursor-not-allowed">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>

                            {weekEvents.length === 0 ? (
                                <div className="flex flex-col items-start p-4 rounded-2xl bg-[#F5F5F7] gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">📲</span>
                                        <p className="text-sm font-bold text-[#1D1D1F]">Demande un script à Joy.</p>
                                    </div>
                                    <p className="text-[11px] text-[#86868B] leading-relaxed">
                                        Ton agente Joy peut t&apos;écrire ton premier script TikTok viral en 2 minutes.
                                    </p>
                                    <Link href="/content-creation" className="w-full">
                                        <button className="w-full h-9 rounded-xl bg-[#007AFF] text-white text-[11px] font-black uppercase tracking-wider hover:bg-[#0056CC] transition-all active:scale-[0.97]">
                                            ✨ Lancer Joy
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {weekEvents.slice(0, 4).map((ev) => (
                                        <div key={ev.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F7] hover:bg-[#007AFF]/5 transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-[#007AFF] shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-[#1D1D1F] truncate">{ev.title}</p>
                                                <p className="text-[10px] text-[#86868B] uppercase font-bold tracking-wide">{ev.type}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent activity */}
                        {data && data.recentActivity.length > 0 ? (
                            <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="p-1.5 bg-[#007AFF]/10 rounded-lg">
                                        <Clock className="w-4 h-4 text-[#007AFF]" />
                                    </div>
                                    <h3 className="font-bold text-[#1D1D1F] text-sm">Activité Récente</h3>
                                </div>
                                <div className="space-y-4">
                                    {data.recentActivity.map((act) => {
                                        let title = "Action IA";
                                        let Icon = Sparkles;
                                        let color = "text-blue-500";
                                        let bg = "bg-blue-50";

                                        if (act.feature.includes('scan') || act.feature.includes('hybrid')) {
                                            title = "Scanner IVS";
                                            Icon = Camera;
                                            color = "text-violet-500";
                                            bg = "bg-violet-50";
                                        } else if (act.feature.includes('logo')) {
                                            title = "Génération de Logo";
                                            Icon = PenTool;
                                            color = "text-pink-500";
                                            bg = "bg-pink-50";
                                        } else if (act.feature.includes('strategy')) {
                                            title = "Stratégie Créateur";
                                            Icon = FileText;
                                            color = "text-[#007AFF]";
                                            bg = "bg-[#007AFF]/10";
                                        } else if (act.feature.includes('design') || act.feature.includes('image')) {
                                            title = "Génération Visuel";
                                            Icon = Shirt;
                                            color = "text-orange-500";
                                            bg = "bg-orange-50";
                                        }

                                        return (
                                            <div key={act.id} className="flex gap-3 items-center group">
                                                <div className={`p-2.5 rounded-xl transition-all ${bg}`}>
                                                    <Icon className={`w-4 h-4 ${color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-semibold text-[#1D1D1F] truncate group-hover:text-[#007AFF] transition-colors">{title}</p>
                                                    <p className="text-[11px] text-[#86868B] mt-0.5">
                                                        il y a {formatDistanceToNow(new Date(act.createdAt), { locale: fr })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : data && data.recentActivity.length === 0 ? (
                            <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6 flex flex-col items-center justify-center text-center">
                                <Clock className="w-8 h-8 text-[#C7C7CC] mb-2" />
                                <h3 className="font-bold text-[#1D1D1F] text-sm mb-1">Activité Récente</h3>
                                <p className="text-[11px] text-[#86868B] font-medium max-w-[200px]">Lancez l'IA pour voir apparaître votre historique d'activité.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[28px] border border-black/[0.06] shadow-apple p-6 flex flex-col items-center justify-center min-h-[150px]">
                                <span className="inline-block w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                            </div>
                        )}

                        {/* Shopify promo */}
                        <div className="relative overflow-hidden rounded-[28px] bg-[#000000] p-6 text-white shadow-apple">
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#95BF47]/20 rounded-full blur-[50px] pointer-events-none" />
                            <div className="relative z-10 space-y-4">
                                <div className="h-8 mb-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/shopify-logo.webp" alt="Shopify" className="h-full object-contain" />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="font-bold text-lg text-white leading-tight">Lancez votre boutique</h3>
                                    <p className="text-[#86868B] text-[13px] font-medium leading-relaxed">
                                        Essayez gratuitement pendant 3 jours, puis payez <strong className="text-white font-bold">1 €/mois</strong> pendant 3 mois.
                                    </p>
                                </div>
                                <Link href={shopifyUrl} target="_blank" rel="noopener noreferrer" className="block pt-1">
                                    <Button className="w-full bg-[#95BF47] hover:bg-[#7A9D3A] text-white font-bold rounded-full h-10 text-[13px] border-0 transition-all active:scale-[0.98]">
                                        Profiter de l&apos;offre
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Paywall upsell */}
                        {data && isFree && (
                            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1D1D1F] to-[#3a3a3c] p-6 text-white">
                                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#007AFF]/20 rounded-full blur-[50px]" />
                                <div className="relative z-10 space-y-3">
                                    <div className="w-10 h-10 rounded-2xl bg-[#007AFF] flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-base text-white">Passez au Plan Créateur</h3>
                                    <p className="text-white/70 text-xs leading-relaxed">
                                        Déverrouillez tous les outils IA, mockups illimités et support prioritaire.
                                    </p>
                                    <Link href="/auth/choose-plan">
                                        <Button className="w-full bg-[#007AFF] hover:bg-[#0056CC] text-white font-bold rounded-full h-10 text-sm border-0 shadow-lg shadow-blue-900/30 mt-1">
                                            Débloquer maintenant
                                            <ArrowRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
