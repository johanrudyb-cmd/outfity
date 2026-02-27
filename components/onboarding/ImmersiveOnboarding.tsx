'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Zap, Moon, ShieldCheck, Leaf, ArrowRight,
    Check, Loader2, CheckCircle2, Crown, Star, TrendingUp, Clock, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { isFreePlan, isPaidPlan } from '@/lib/plan-utils';

// ─────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────

type Step = 'welcome' | 'profiling' | 'universe' | 'strategy' | 'product' | 'identity' | 'pitch' | 'agents' | 'launch';

interface OnboardingData {
    howDidYouHear: string;
    reasonForComing: string;
    existingTools: string;
    universe: string;
    universeId: string;
    strategy?: string;
    productType: string;
    brandName: string;
    pitch: string;
    logoUrl?: string;
    instagram?: string;
    plan?: string;
}

const UNIVERSES = [
    {
        id: 'streetwear',
        name: 'Streetwear',
        emoji: '🔥',
        description: 'Urban, graphique, oversize',
        icon: Zap,
        accent: '#FF6B35',
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        pill: 'bg-orange-100 text-orange-700',
        keywords: ['Hoodie', 'T-Shirt Boxy', 'Cargo'],
    },
    {
        id: 'minimalist',
        name: 'Modern Minimal',
        emoji: '🤍',
        description: 'Épuré, intemporel, premium',
        icon: Moon,
        accent: '#1D1D1F',
        bg: 'bg-slate-50',
        border: 'border-slate-300',
        pill: 'bg-slate-100 text-slate-700',
        keywords: ['Blazer', 'Tee Basique', 'Lin'],
    },
    {
        id: 'premium',
        name: 'Luxe Accessible',
        emoji: '✨',
        description: 'Détails soignés, finitions haut de gamme',
        icon: Sparkles,
        accent: '#007AFF',
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        pill: 'bg-blue-100 text-blue-700',
        keywords: ['Veste cuir', 'Blazer', 'Robe'],
    },
    {
        id: 'outdoor',
        name: 'Techwear',
        emoji: '⚡',
        description: 'Fonctionnel, technique, futuriste',
        icon: ShieldCheck,
        accent: '#34C759',
        bg: 'bg-green-50',
        border: 'border-green-300',
        pill: 'bg-green-100 text-green-700',
        keywords: ['Veste technique', 'Cargo', 'Layer'],
    },
    {
        id: 'eco',
        name: 'Éco-Premium',
        emoji: '🌿',
        description: 'Naturel, éthique, durable',
        icon: Leaf,
        accent: '#30D158',
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        pill: 'bg-emerald-100 text-emerald-700',
        keywords: ['Lin', 'Coton bio', 'Recyclé'],
    },
];

const PRODUCTS = [
    { id: 'tshirt', label: 'T-Shirt', emoji: '👕', trend: 78, desc: 'Le classique indétrônable' },
    { id: 'hoodie', label: 'Hoodie', emoji: '🧥', trend: 92, desc: 'Top tendance SS 2026' },
    { id: 'veste', label: 'Veste', emoji: '🧣', trend: 85, desc: 'Marges élevées' },
    { id: 'pantalon', label: 'Pantalon', emoji: '👖', trend: 71, desc: 'Forte demande cargo' },
    { id: 'robe', label: 'Robe', emoji: '👗', trend: 88, desc: 'Viral printemps 2026' },
    { id: 'ensemble', label: 'Ensemble', emoji: '🎽', trend: 94, desc: 'Niche premium rentable' },
];

const STEP_ORDER_STARTER: Step[] = ['welcome', 'profiling', 'universe', 'product', 'identity', 'pitch', 'agents', 'launch'];
const STEP_ORDER_CREATOR: Step[] = ['welcome', 'profiling', 'universe', 'strategy', 'product', 'identity', 'pitch', 'agents', 'launch'];

const STEP_LABELS: Record<Step, string> = {
    welcome: 'Bienvenue',
    profiling: 'Profil',
    universe: 'Univers',
    strategy: 'Stratégie',
    product: 'Produit',
    identity: 'Identité',
    pitch: 'Mission',
    agents: 'Équipe IA',
    launch: 'Lancement'
};

const PROFILING_OPTIONS = {
    howDidYouHear: [
        { id: 'instagram', label: 'Instagram', icon: '📸' },
        { id: 'tiktok', label: 'TikTok', icon: '📱' },
        { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
        { id: 'referral', label: 'Bouche à oreille', icon: '👥' },
        { id: 'google', label: 'Recherche Google', icon: '🔍' },
        { id: 'other', label: 'Autre', icon: '✨' },
    ],
    reasonForComing: [
        { id: 'launch', label: 'Lancer ma marque', icon: '🚀' },
        { id: 'optimize', label: 'Optimiser ma marque existante', icon: '📈' },
        { id: 'creative', label: 'Besoin d\'outils créatifs IA', icon: '🎨' },
        { id: 'sourcing', label: 'Trouver des usines', icon: '🏭' },
        { id: 'trends', label: 'Suivre les tendances', icon: '🔥' },
    ],
    existingTools: [
        { id: 'none', label: 'Aucun outil particulier', icon: '⭕' },
    ]
};

import { AgentRevealCard, AGENTS_TEAM } from './AgentRevealCard';

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

interface ImmersiveOnboardingProps {
    initialPlan: string;
}

export function ImmersiveOnboarding({ initialPlan }: ImmersiveOnboardingProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { update } = useSession();
    const [step, setStep] = useState<Step>('welcome');
    const [plan, setPlan] = useState(initialPlan || 'starter');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        howDidYouHear: '',
        reasonForComing: '',
        existingTools: '',
        universe: '',
        universeId: '',
        productType: '',
        brandName: '',
        pitch: '',
    });

    const isCreator = isPaidPlan(plan);
    const STEP_ORDER = isCreator ? STEP_ORDER_CREATOR : STEP_ORDER_STARTER;
    const stepIndex = STEP_ORDER.indexOf(step);

    const BRAND_SUGGESTIONS: Record<string, string[]> = {
        streetwear: ['RARE VIBE', 'URBAN ARCADE', 'GRIT & GLORY', 'STREET LAB'],
        minimalist: ['PURE STUDIO', 'ESSENTIAL LINE', 'SILENT LUX', 'MONO FORM'],
        premium: ['MAISON ELITE', 'VESTIGE PARIS', 'AURA CLUB', 'OPUS MODERNE'],
        outdoor: ['TECH TERRAIN', 'SHIFT LAYER', 'VORTEX EQUIP', 'AXIS OUTDOOR'],
        eco: ['ROOTS LABEL', 'VERDANT WEAR', 'PURE EARTH', 'EDEN FABRIC']
    };

    useEffect(() => {
        const timer = setTimeout(() => setInitialTransition(false), 500);
        return () => clearTimeout(timer);
    }, []);



    useEffect(() => {
        const isUpgraded = searchParams.get('upgraded') === 'true' || searchParams.get('subscribed') === 'true';
        if (isUpgraded) {
            setPlan('creator');
        } else if (searchParams.get('plan')) {
            const p = searchParams.get('plan');
            setPlan(isPaidPlan(p) ? 'creator' : 'starter');
        } else {
            setPlan(isPaidPlan(initialPlan) ? 'creator' : 'starter');
        }
    }, [searchParams, initialPlan]);

    const [initialTransition, setInitialTransition] = useState(true);
    const [isThinking, setIsThinking] = useState(false);

    const goNext = useCallback(() => {
        const nextIdx = stepIndex + 1;
        if (nextIdx < STEP_ORDER.length) {
            if (step === 'pitch') {
                setIsThinking(true);
                setTimeout(() => {
                    setIsThinking(false);
                    setStep(STEP_ORDER[nextIdx]);
                }, 1500);
            } else {
                setStep(STEP_ORDER[nextIdx]);
            }
        }
    }, [stepIndex, step]);

    const goBack = useCallback(() => {
        const prevIdx = stepIndex - 1;
        if (prevIdx >= 0) {
            setStep(STEP_ORDER[prevIdx]);
        }
    }, [stepIndex]);

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/user/complete-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, plan: plan }),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Erreur lors de la sauvegarde');
            }
            // On utilise le plan renvoyé par le serveur (qui a la protection anti-downgrade)
            await update({ plan: json.plan });
            setStep('launch');
        } catch (err) {
            console.error(err);
            alert('Impossible de finaliser l\'onboarding. Réessayez.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-[#007AFF]/20 selection:text-[#007AFF]">
            {/* PROGRESS BAR */}
            {step !== 'launch' && (
                <div className="fixed top-0 left-0 w-full h-1.5 bg-white/50 z-50">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#007AFF] to-[#5AC8FA]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(stepIndex / (STEP_ORDER.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            )}

            {/* BACK BUTTON & STEP LABEL */}
            {step !== 'welcome' && step !== 'launch' && (
                <div className="fixed top-8 left-8 flex items-center gap-4 z-40">
                    <button
                        onClick={goBack}
                        className="p-3 rounded-full bg-white/50 backdrop-blur-md border border-black/5 hover:bg-white transition-all group"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180 text-[#86868B] group-hover:text-black" />
                    </button>
                    <div className="px-4 py-2 rounded-2xl bg-white/50 backdrop-blur-md border border-black/5 text-xs font-bold uppercase tracking-widest text-[#86868B]">
                        {STEP_LABELS[step]}
                    </div>
                </div>
            )}

            <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 relative overflow-hidden pt-20 sm:pt-6">
                {/* DYNAMIC BACKGROUND */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className={cn(
                            "absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]",
                            data.universeId ? UNIVERSES.find(u => u.id === data.universeId)?.bg.replace('bg-', 'bg-').replace('-50', '-200') : "bg-blue-100"
                        )}
                    />
                    <motion.div
                        animate={{
                            scale: [1.1, 1, 1.1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        className={cn(
                            "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px]",
                            data.universeId ? UNIVERSES.find(u => u.id === data.universeId)?.bg.replace('bg-', 'bg-').replace('-50', '-200') : "bg-purple-100"
                        )}
                    />
                </div>

                <AnimatePresence mode="wait">
                    {isThinking && (
                        <motion.div
                            key="thinking"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6"
                        >
                            <div className="relative">
                                <motion.div
                                    className="w-24 h-24 rounded-[32px] bg-white shadow-apple-lg border border-black/5 flex items-center justify-center"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                >
                                    <Sparkles className="w-10 h-10 text-[#007AFF]" />
                                </motion.div>
                                <motion.div
                                    className="absolute inset-0 rounded-[32px] border-4 border-[#007AFF]"
                                    animate={{ scale: [1, 1.1, 1], opacity: [1, 0, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-bold tracking-tight">Virgil analyse ton pitch...</h3>
                                <p className="text-[#86868B] font-medium mt-2">Préparation de ton équipe d'agents IA</p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── WELCOME ── */}
                    {step === 'welcome' && (
                        <motion.div key="welcome"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-2xl w-full text-center space-y-12"
                        >
                            <div className="relative inline-block">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="relative z-10"
                                >
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] overflow-hidden shadow-2xl border-4 border-white mx-auto mb-6 bg-slate-100">
                                        <img src="/images/agents/virgil_final.png" alt="Virgil" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-2 right-1/2 translate-x-12 w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5, type: 'spring' }}
                                    className="absolute -top-6 -right-16 hidden lg:block z-20 pointer-events-none"
                                >
                                    <div className="bg-white px-5 py-2.5 rounded-2xl rounded-bl-none shadow-apple-lg border border-black/5 text-sm font-bold text-[#007AFF] whitespace-nowrap">
                                        "Bienvenue à bord !"
                                    </div>
                                </motion.div>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-4xl sm:text-5xl font-black text-[#1D1D1F] tracking-tight leading-[1.1]">
                                    {isCreator ? 'Ton Studio Créateur\nest prêt.' : 'Bienvenue dans\nton Studio Starter.'}
                                </h1>
                                <p className="text-[#86868B] text-lg sm:text-xl font-medium max-w-lg mx-auto leading-relaxed">
                                    {isCreator
                                        ? 'Toute ton équipe IA est en ligne. Prêt à lancer ta prochaine collection ?'
                                        : 'Je suis Virgil, ton stratège. Définissons ensemble les bases de ta future marque.'}
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={goNext}
                                    className="group w-full max-w-xs h-16 rounded-2xl bg-[#007AFF] text-white font-bold text-xl flex items-center justify-center gap-3 hover:bg-[#0056CC] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/30"
                                >
                                    C'est parti <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <div className="flex items-center gap-2 text-[#86868B] text-sm font-semibold">
                                    <Clock className="w-4 h-4" />
                                    <span>Moins de 2 minutes</span>
                                </div>
                            </div>
                        </motion.div>
                    )}


                    {/* ── PROFILING ── */}
                    {step === 'profiling' && (
                        <motion.div key="profiling"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35 }}
                            className="max-w-2xl w-full space-y-10"
                        >
                            <div className="space-y-2 text-center sm:text-left">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Faisons connaissance.</h2>
                                <p className="text-[#86868B]">Aide-moi à personnaliser ton expérience dans le studio.</p>
                            </div>

                            <div className="space-y-6 overflow-y-auto flex-1 pr-1 no-scrollbar pb-20 sm:pb-0">
                                {/* Comment nous as-tu connu ? */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] px-1">Comment nous as-tu connu ?</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {PROFILING_OPTIONS.howDidYouHear.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setData(d => ({ ...d, howDidYouHear: opt.id }))}
                                                className={cn(
                                                    "p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center",
                                                    data.howDidYouHear === opt.id
                                                        ? "border-[#007AFF] bg-blue-50/50 shadow-sm"
                                                        : "border-[#E5E5EA] bg-white hover:border-[#C7C7CC]"
                                                )}
                                            >
                                                <span className="text-xl">{opt.icon}</span>
                                                <span className="text-xs font-bold leading-tight">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pourquoi es-tu là ? */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] px-1">Quel est ton objectif principal ?</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {PROFILING_OPTIONS.reasonForComing.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setData(d => ({ ...d, reasonForComing: opt.id }))}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 transition-all flex items-center gap-3",
                                                    data.reasonForComing === opt.id
                                                        ? "border-[#007AFF] bg-blue-50/50 shadow-sm"
                                                        : "border-[#E5E5EA] bg-white hover:border-[#C7C7CC]"
                                                )}
                                            >
                                                <span className="text-xl">{opt.icon}</span>
                                                <span className="text-sm font-bold">{opt.label}</span>
                                                {data.reasonForComing === opt.id && <Check className="w-4 h-4 text-[#007AFF] ml-auto" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Outils existants */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] px-1">Utilises-tu déjà des outils ?</p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setData(d => ({ ...d, existingTools: 'none' }))}
                                            className={cn(
                                                "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3",
                                                data.existingTools === 'none'
                                                    ? "border-[#007AFF] bg-blue-50/50 shadow-sm"
                                                    : "border-[#E5E5EA] bg-white hover:border-[#C7C7CC]"
                                            )}
                                        >
                                            <span className="text-xl">⭕</span>
                                            <span className="text-sm font-bold">Aucun outil particulier</span>
                                            {data.existingTools === 'none' && <Check className="w-4 h-4 text-[#007AFF] ml-auto" />}
                                        </button>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Ou cite tes outils (ex: Photoshop, Canva...)"
                                                value={data.existingTools === 'none' ? '' : data.existingTools}
                                                onChange={(e) => setData(d => ({ ...d, existingTools: e.target.value }))}
                                                className={cn(
                                                    "w-full h-14 px-5 rounded-2xl border-2 bg-white transition-all outline-none text-sm font-medium",
                                                    data.existingTools !== '' && data.existingTools !== 'none'
                                                        ? "border-[#007AFF] ring-4 ring-blue-500/10"
                                                        : "border-[#E5E5EA] focus:border-[#007AFF]/50"
                                                )}
                                            />
                                            {data.existingTools !== '' && data.existingTools !== 'none' && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <Check className="w-4 h-4 text-[#007AFF]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 sm:pt-4 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7] to-transparent sticky bottom-0 z-10 w-full mt-auto">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-lg hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={!data.howDidYouHear || !data.reasonForComing || !data.existingTools}
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                    {step === 'universe' && (
                        <motion.div key="universe"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-2xl w-full space-y-6"
                        >
                            <div className="space-y-1">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Quel est ton univers ?</h2>
                                <p className="text-[#86868B]">Choisir un univers donne une direction claire à ta marque dès le départ.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {UNIVERSES.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => setData(d => ({ ...d, universe: u.name, universeId: u.id }))}
                                        className={cn(
                                            'group text-left p-4 rounded-2xl border-2 bg-white transition-all duration-200',
                                            data.universeId === u.id
                                                ? `${u.border} ${u.bg} shadow-md`
                                                : 'border-[#E5E5EA] hover:border-[#C7C7CC] hover:shadow-sm'
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{u.emoji}</span>
                                                <div>
                                                    <p className="font-semibold text-[#1D1D1F] text-sm">{u.name}</p>
                                                    <p className="text-[#86868B] text-xs mt-0.5">{u.description}</p>
                                                </div>
                                            </div>
                                            {data.universeId === u.id && (
                                                <div className="w-5 h-5 rounded-full bg-[#007AFF] flex items-center justify-center shrink-0">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {u.keywords.map(k => (
                                                <span key={k} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', u.pill)}>{k}</span>
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={!data.universeId}
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-blue-500/20"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STRATEGY (Creator Only) ── */}
                    {step === 'strategy' && (
                        <motion.div key="strategy"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35 }}
                            className="max-w-2xl w-full space-y-8"
                        >
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#007AFF] text-[10px] font-black uppercase tracking-widest border border-blue-100 mb-2">
                                    <Crown className="w-3 h-3" /> Plan Créateur
                                </div>
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Définissons ton positionnement.</h2>
                                <p className="text-[#86868B]">C'est ce qui rendra ta marque unique sur le marché.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {['Streetwear Luxury', 'Quiet Luxury', 'Gorpcore / Techwear', 'Parisian Minimalist', 'Néo-Vintage Sport', 'Eco-Basics'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => setData(d => ({ ...d, strategy: opt }))}
                                        className={cn(
                                            "p-6 rounded-[24px] border-2 bg-white transition-all text-left group",
                                            data.strategy === opt
                                                ? "border-[#007AFF] bg-blue-50/20"
                                                : "border-[#E5E5EA] hover:border-[#007AFF]/20"
                                        )}
                                    >
                                        <p className="font-bold text-[#1D1D1F]">{opt}</p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Style validé</span>
                                            {data.strategy === opt && (
                                                <div className="w-6 h-6 rounded-full bg-[#007AFF] flex items-center justify-center text-white">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-lg hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={!data.strategy}
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── PRODUCT ── */}
                    {step === 'product' && (
                        <motion.div key="product"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35 }}
                            className="max-w-3xl w-full space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">C'est le moment de choisir ton premier produit.</h2>
                                <p className="text-[#86868B]">On commencera par générer tout le contenu pour ce produit spécifique.</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {PRODUCTS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setData(d => ({ ...d, productType: p.label }))}
                                        className={cn(
                                            'relative p-6 rounded-[28px] border-2 bg-white transition-all duration-300 text-left flex flex-col group overflow-hidden',
                                            data.productType === p.label
                                                ? 'border-[#007AFF] bg-blue-50/20 shadow-xl shadow-blue-500/10'
                                                : 'border-[#E5E5EA] hover:border-[#C7C7CC] hover:bg-slate-50'
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-4xl group-hover:scale-110 transition-transform">{p.emoji}</span>
                                            {p.trend > 90 && (
                                                <div className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-tighter">
                                                    Hot 🔥
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-bold text-lg text-[#1D1D1F]">{p.label}</p>
                                        <p className="text-[#86868B] text-xs mt-1 leading-snug">{p.desc}</p>

                                        <div className="mt-4 flex items-center gap-1.5 pt-4 border-t border-black/5">
                                            <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${p.trend}%` }}
                                                    className="h-full bg-[#34C759]"
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-[#34C759] uppercase tracking-wider">{p.trend}%</span>
                                        </div>

                                        {data.productType === p.label && (
                                            <motion.div
                                                layoutId="active-product"
                                                className="absolute inset-0 border-2 border-[#007AFF] rounded-[28px] pointer-events-none"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-16 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-lg hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={!data.productType}
                                    onClick={goNext}
                                    className="flex-[2] h-16 rounded-2xl bg-[#007AFF] text-white font-bold text-xl flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20"
                                >
                                    Valider le produit <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── IDENTITY ── */}
                    {step === 'identity' && (
                        <motion.div key="identity"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35 }}
                            className="max-w-xl w-full space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Le nom de ta marque</h2>
                                <p className="text-[#86868B]">C'est l'identité qui te suivra partout. Pas d'inquiétude, tu pourras le modifier.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Ex: OUTFIT STUDIO"
                                        value={data.brandName}
                                        onChange={(e) => setData(d => ({ ...d, brandName: e.target.value }))}
                                        className="w-full h-14 px-6 rounded-2xl bg-white border-2 border-[#E5E5EA] focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all text-lg font-semibold"
                                    />
                                </div>

                                {isCreator && data.universeId && (
                                    <div className="p-6 rounded-[24px] bg-white shadow-apple border border-black/5 space-y-4">
                                        <div className="flex items-center gap-2 text-[#007AFF] font-bold text-xs uppercase tracking-widest">
                                            <Sparkles className="w-4 h-4" /> Suggestions de Virgil ({data.universe})
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(BRAND_SUGGESTIONS[data.universeId] || BRAND_SUGGESTIONS.streetwear).map(name => (
                                                <button
                                                    key={name}
                                                    onClick={() => setData(d => ({ ...d, brandName: name }))}
                                                    className={cn(
                                                        "px-4 py-2 bg-[#F5F5F7] rounded-xl border-2 transition-all text-sm font-bold",
                                                        data.brandName === name
                                                            ? "border-[#007AFF] text-[#007AFF] bg-blue-50"
                                                            : "border-transparent text-[#86868B] hover:bg-white hover:border-[#007AFF]/20"
                                                    )}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={!data.brandName}
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-blue-500/20"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── PITCH ── */}
                    {step === 'pitch' && (
                        <motion.div key="pitch"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35 }}
                            className="max-w-xl w-full space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Ta mission en une phrase</h2>
                                <p className="text-[#86868B]">Quel message veux-tu porter avec {data.brandName} ?</p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-3xl p-6 shadow-apple border border-[#E5E5EA] space-y-4"
                            >
                                <textarea
                                    autoFocus
                                    placeholder="Ex: Créer des basiques premium éco-responsables pour les urbains exigeants."
                                    value={data.pitch}
                                    onChange={(e) => setData(d => ({ ...d, pitch: e.target.value }))}
                                    className="w-full min-h-[160px] p-4 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-[#007AFF] transition-all resize-none text-base font-medium"
                                />

                                <div className="flex items-center gap-2 text-[10px] text-[#86868B] font-medium px-1">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Ton pitch sert de base à ton équipe IA pour tes futurs contenus.
                                </div>
                            </motion.div>

                            <div className="flex gap-3">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={!data.pitch || isSubmitting}
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => { setData(d => ({ ...d, pitch: 'À compléter' })); goNext(); }}
                                className="w-full text-[#86868B] text-sm hover:text-[#1D1D1F] transition-colors py-2"
                            >
                                Passer cette étape →
                            </button>
                        </motion.div>
                    )}

                    {/* ── AGENTS REVEAL (FUT PACK) ── */}
                    {step === 'agents' && (
                        <motion.div key="agents"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="w-full max-w-5xl flex flex-col items-center space-y-12"
                        >
                            <div className="text-center space-y-3">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-sm font-semibold uppercase tracking-wider mb-2"
                                >
                                    <Sparkles className="w-4 h-4" /> Agent Unlocked
                                </motion.div>
                                <h2 className="text-4xl sm:text-5xl font-black text-[#1D1D1F] tracking-tight uppercase">
                                    Ton Équipe Experte
                                </h2>
                                <p className="text-lg text-[#86868B] max-w-lg mx-auto">
                                    Découvre les intelligences artificielles dédiées au succès de {data.brandName || "ta marque"}.
                                </p>
                            </div>

                            <div className="w-full max-w-5xl px-4 sm:px-6">
                                <div className={cn(
                                    "grid gap-6 sm:gap-8 justify-items-center",
                                    "grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                                )}>
                                    {AGENTS_TEAM.filter(a => isPaidPlan(plan) || (a.id !== 'johan' && a.id !== 'joy')).map((agent, idx) => (
                                        <div key={agent.id} className="w-full flex justify-center">
                                            <AgentRevealCard agent={agent} delay={idx * 0.1 + 0.2} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 w-full max-w-sm">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-base flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={isSubmitting}
                                    onClick={handleComplete}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Lancer ! <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── LAUNCH ── */}
                    {step === 'launch' && (
                        <LaunchStep plan={plan} brandName={data.brandName || 'ta marque'} />
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Launch step component
// ─────────────────────────────────────────────────────────────

function LaunchStep({ plan, brandName }: { plan: string; brandName: string }) {
    const router = useRouter();
    const isCreator = plan === 'creator';
    const [progress, setProgress] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);

    const STEPS = [
        { label: 'Initialisation du studio...', duration: 1000 },
        { label: 'Connexion aux agents IA...', duration: 1200 },
        { label: 'Analyse des tendances 2026...', duration: 1000 },
        { label: 'Génération de ta stratégie...', duration: 1500 },
        { label: 'Finalisation du dashboard...', duration: 800 },
        { label: 'Bienvenue dans OUTFITY !', duration: 1000 },
    ];

    useEffect(() => {
        setProgress(0);
        if (stepIndex >= STEPS.length) {
            // Signaler au dashboard d'afficher le tutorial
            try { localStorage.setItem('show_tutorial_next', '1'); } catch (_) { }
            router.push('/dashboard?tutorial=1');
            return;
        }
        const step = STEPS[stepIndex];
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const p = Math.min(100, (elapsed / step.duration) * 100);
            setProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setTimeout(() => setStepIndex(s => s + 1), 200);
            }
        }, 30);
        return () => clearInterval(interval);
    }, [stepIndex, router]);

    return (
        <div className="flex flex-col items-center justify-center space-y-12 max-w-md w-full">
            <div className="relative">
                <motion.div
                    className="w-32 h-32 rounded-[38px] bg-white shadow-apple-lg flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                >
                    <Rocket className="w-14 h-14 text-[#007AFF]" />
                </motion.div>
                <motion.div
                    className="absolute -top-4 -right-4 w-12 h-12 bg-[#34C759] rounded-2xl flex items-center justify-center text-white shadow-lg"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }}
                >
                    <Check className="w-6 h-6" />
                </motion.div>
            </div>

            <div className="w-full space-y-6 text-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">C'est parti !</h2>
                    <p className="text-[#86868B] font-medium">On prépare {brandName}...</p>
                </div>

                <div className="space-y-4">
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-inner">
                        <motion.div
                            className="h-full bg-[#007AFF] rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={stepIndex}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="text-sm font-bold text-[#007AFF] uppercase tracking-widest"
                        >
                            {STEPS[stepIndex]?.label || 'Initialisation...'}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
