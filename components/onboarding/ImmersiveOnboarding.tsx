'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Zap, Moon, ShieldCheck, Leaf, ArrowRight,
    Check, Loader2, CheckCircle2, Crown, Star, TrendingUp, Clock, Rocket, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { isFreePlan, isPaidPlan } from '@/lib/plan-utils';

// ─────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────

type Step = 'welcome' | 'profiling' | 'universe_product' | 'identity_pitch' | 'agents' | 'plan' | 'launch';

interface OnboardingData {
    howDidYouHear: string;
    reasonForComing: string;
    universe: string;
    universeId: string;
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

// L'étape 'plan' est retirée de l'onboarding — le choix se fait sur /auth/choose-plan après l'onboarding
const STEP_ORDER: Step[] = ['welcome', 'profiling', 'universe_product', 'identity_pitch', 'agents', 'launch'];

const STEP_LABELS: Record<Step, string> = {
    welcome: 'Bienvenue',
    profiling: 'Profil',
    universe_product: 'Concept',
    identity_pitch: 'Identité',
    agents: 'Équipe IA',
    plan: 'Abonnement',
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
        universe: '',
        universeId: '',
        productType: '',
        brandName: '',
        pitch: '',
    });

    const isCreator = isPaidPlan(plan);
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
            if (step === 'identity_pitch') {
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

    const handleComplete = async (selectedPlan: string = plan) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/user/complete-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, plan: selectedPlan }),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Erreur lors de la sauvegarde');
            }
            // On met à jour la session localement
            await update({ plan: json.plan });

            if (selectedPlan === 'creator' && !isPaidPlan(initialPlan)) {
                // REDIRECT STRIPE
                const stripeRes = await fetch('/api/stripe/create-subscription-session', { method: 'POST' });
                const stripeData = await stripeRes.json();
                if (stripeData.url) {
                    window.location.href = stripeData.url;
                    return;
                }
            }

            // Pour le plan starter : on affiche d'abord le step launch (animation), puis /auth/choose-plan
            setStep('launch');
        } catch (err) {
            console.error(err);
            alert('Impossible de finaliser l\'onboarding. Réessayez.');
        } finally {
            setIsSubmitting(false); // On enlève le loading si une erreur s'est produite ou s'il lance le vrai dashboard
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
                <div className="fixed top-4 sm:top-8 left-4 sm:left-8 flex items-center gap-2 sm:gap-4 z-40">
                    <button
                        onClick={goBack}
                        className="p-2.5 sm:p-3 rounded-full bg-white/50 backdrop-blur-md border border-black/5 hover:bg-white transition-all group"
                    >
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180 text-[#86868B] group-hover:text-black" />
                    </button>
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-white/50 backdrop-blur-md border border-black/5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#86868B]">
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
                                        <img src="/images/agents/virgil_final.webp" alt="Virgil" className="w-full h-full object-cover" />
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
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tight leading-[1.15] px-2">
                                    Bienvenue dans<br />ton Studio.
                                </h1>
                                <p className="text-[#86868B] text-base sm:text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed px-4">
                                    Je suis Virgil, ton stratège IA. En 2 minutes, on va poser les bases de ta future marque.
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
                            </div>

                            <div className="flex gap-3 pt-6 sm:pt-4 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7] to-transparent sticky bottom-0 z-10 w-full mt-auto">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-lg hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={!data.howDidYouHear || !data.reasonForComing}
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                    {/* ── UNIVERSE & PRODUCT ── */}
                    {step === 'universe_product' && (
                        <motion.div key="universe_product"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-4xl w-full space-y-8"
                        >
                            <div className="space-y-1 text-center sm:text-left">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Le concept de ta marque</h2>
                                <p className="text-[#86868B]">Choisis l'univers et le premier produit que tu vas lancer.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Colonne Univers */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-widest">1. L'univers</h3>
                                    <div className="grid grid-cols-1 gap-3">
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
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Colonne Produit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-widest">2. Produit Star</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {PRODUCTS.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setData(d => ({ ...d, productType: p.label }))}
                                                className={cn(
                                                    'relative p-4 rounded-2xl border-2 bg-white transition-all duration-200 text-left flex flex-col group',
                                                    data.productType === p.label
                                                        ? 'border-[#007AFF] bg-blue-50/20 shadow-md'
                                                        : 'border-[#E5E5EA] hover:border-[#C7C7CC] hover:bg-slate-50'
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-2xl group-hover:scale-110 transition-transform">{p.emoji}</span>
                                                </div>
                                                <p className="font-bold text-sm text-[#1D1D1F]">{p.label}</p>
                                                <p className="text-[#86868B] text-[10px] mt-1 leading-snug">{p.desc}</p>
                                                {data.productType === p.label && (
                                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#007AFF] flex items-center justify-center shrink-0">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={!data.universeId || !data.productType}
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-blue-500/20"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── IDENTITY & PITCH ── */}
                    {step === 'identity_pitch' && (
                        <motion.div key="identity_pitch"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35 }}
                            className="max-w-2xl w-full space-y-8"
                        >
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Donne vie à ton idée</h2>
                                <p className="text-[#86868B]">Définit le nom et la mission de ta marque pour guider tes agents IA.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Nom de marque */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-widest">1. Nom de marque</h3>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Ex: OUTFIT STUDIO"
                                        value={data.brandName}
                                        onChange={(e) => setData(d => ({ ...d, brandName: e.target.value }))}
                                        className="w-full h-14 px-6 rounded-2xl bg-white border-2 border-[#E5E5EA] focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all text-lg font-semibold"
                                    />
                                    {isCreator && data.universeId && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <span className="text-xs text-[#007AFF] font-bold self-center mr-2"><Sparkles className="inline w-3 h-3 mr-1" /> Suggestions:</span>
                                            {(BRAND_SUGGESTIONS[data.universeId] || BRAND_SUGGESTIONS.streetwear).slice(0, 3).map(name => (
                                                <button
                                                    key={name}
                                                    onClick={() => setData(d => ({ ...d, brandName: name }))}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold",
                                                        data.brandName === name
                                                            ? "border-[#007AFF] text-[#007AFF] bg-blue-50"
                                                            : "border-[#E5E5EA] text-[#86868B] hover:bg-white hover:border-[#007AFF]/30"
                                                    )}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Mission (Pitch) avec Mad Libs */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-widest">2. Ta Mission (Pitch)</h3>
                                    <div className="flex flex-col gap-2 mb-3">
                                        <p className="text-xs text-[#86868B] font-medium">Panne d'inspi ? Choisis un modèle :</p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                "Créer des basiques premium éco-responsables pour les urbains exigeants.",
                                                "Une marque streetwear audacieuse qui mixe culture skate et luxe accessible.",
                                                "Des vêtements techniques et fonctionnels conçus pour l'aventure quotidienne."
                                            ].map((pitchEx, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setData(d => ({ ...d, pitch: pitchEx }))}
                                                    className="px-3 py-1.5 bg-white border border-[#E5E5EA] hover:border-[#007AFF]/50 hover:bg-blue-50/30 rounded-xl text-[11px] text-[#1D1D1F] font-medium text-left transition-colors whitespace-nowrap"
                                                >
                                                    "{pitchEx.substring(0, 25)}..."
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <motion.div className="bg-white rounded-2xl shadow-sm border border-[#E5E5EA] p-2 relative">
                                        <textarea
                                            placeholder="Rédige ta mission ici..."
                                            value={data.pitch}
                                            onChange={(e) => setData(d => ({ ...d, pitch: e.target.value }))}
                                            className="w-full min-h-[120px] p-4 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-[#007AFF] transition-all resize-none text-sm font-medium outline-none"
                                        />
                                        <div className="absolute bottom-4 right-4 text-[10px] text-[#86868B] flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Base pour tes IA
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={goBack}
                                    className="flex-1 h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#86868B] font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white active:scale-[0.98] transition-all"
                                >
                                    Retour
                                </button>
                                <button
                                    disabled={!data.brandName || !data.pitch || isSubmitting}
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
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
                                <p className="text-base sm:text-lg text-[#86868B] max-w-lg mx-auto px-4">
                                    Virgil est prêt à guider ta marque {data.brandName ? <strong>{data.brandName}</strong> : 'vers le succès'}.
                                </p>
                            </div>

                            {/* On affiche uniquement Virgil dans l'onboarding — les autres agents sont débloqués avec le plan Créateur */}
                            <div className="w-full max-w-xs px-4">
                                <div className="flex justify-center">
                                    {AGENTS_TEAM.filter(a => a.id === 'virgil').map((agent, idx) => (
                                        <div key={agent.id} className="w-[220px] sm:w-[240px] shrink-0">
                                            <AgentRevealCard agent={agent} delay={0.2} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Teaser des agents verrouillés */}
                            <div className="flex items-center justify-center gap-3 flex-wrap px-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-[#86868B]">Agents verrouillés :</p>
                                {AGENTS_TEAM.filter(a => a.id !== 'virgil').map(agent => (
                                    <div key={agent.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5 shadow-sm">
                                        <img src={agent.image} alt={agent.name} className="w-5 h-5 rounded-full object-cover grayscale opacity-50" />
                                        <span className="text-xs font-semibold text-[#86868B]">{agent.name}</span>
                                        <Lock className="w-3 h-3 text-[#C7C7CC]" />
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 w-full max-w-sm px-4">
                                <button
                                    disabled={isSubmitting}
                                    onClick={() => handleComplete('starter')}
                                    className="w-full h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Activer Virgil <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                                <button
                                    onClick={goBack}
                                    className="w-full h-10 text-[#86868B] font-semibold text-sm hover:text-[#1D1D1F] transition-colors"
                                >
                                    Retour
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── PLAN SELECTION ── */}
                    {step === 'plan' && (
                        <motion.div key="plan"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-4xl flex flex-col items-center space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Choisis ton accès</h2>
                                <p className="text-[#86868B]">Débloque toute la puissance de tes agents IA.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                {/* Starter */}
                                <div className="bg-white rounded-[24px] p-6 sm:p-8 border-2 border-[#E5E5EA] flex flex-col hover:border-[#C7C7CC] transition-all relative overflow-hidden group">
                                    <div className="mb-6 flex-1 relative z-10">
                                        <h3 className="text-xl font-bold text-[#1D1D1F] mb-1">Starter</h3>
                                        <div className="text-3xl font-black text-[#1D1D1F] mb-4">Gratuit</div>
                                        <p className="text-sm text-[#86868B] mb-6 min-h-[40px]">Virgil t'aide à poser les bases de ta stratégie.</p>
                                        <ul className="space-y-3">
                                            {['Virgil (Stratège) débloqué', 'Analyses basiques', '1 design IA par jour'].map((feat, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-[#1D1D1F]">
                                                    <Check className="w-4 h-4 text-[#007AFF] shrink-0" /> {feat}
                                                </li>
                                            ))}
                                            <li className="flex items-center gap-2 text-sm text-[#86868B] pt-2">
                                                <Lock className="w-4 h-4 shrink-0" /> 4 Agents experts verrouillés
                                            </li>
                                        </ul>
                                    </div>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => {
                                            setPlan('starter');
                                            handleComplete('starter');
                                        }}
                                        className="relative z-10 w-full h-14 rounded-2xl border-2 border-[#E5E5EA] text-[#1D1D1F] font-bold text-base hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        Continuer en Gratuit <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Creator */}
                                <div className="bg-white rounded-[24px] p-6 sm:p-8 border-2 border-[#007AFF] shadow-xl shadow-blue-500/10 flex flex-col scale-100 md:scale-105 relative z-10 overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="absolute top-0 right-4 sm:right-8 -translate-y-[1px] bg-[#FF3B30] text-white text-[10px] font-bold px-3 py-1.5 rounded-b-xl uppercase tracking-wider flex items-center gap-1 shadow-md">
                                        <Clock className="w-3 h-3" /> Offre limitée
                                    </div>
                                    <div className="mb-6 flex-1 relative z-10">
                                        <h3 className="text-xl font-bold text-[#1D1D1F] mb-1">Créateur</h3>
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <div className="text-3xl font-black text-[#1D1D1F]">29€<span className="text-lg text-[#86868B] font-normal">/mois</span></div>
                                            <div className="text-lg text-[#86868B] line-through decoration-red-500/50">39€</div>
                                        </div>
                                        <p className="text-sm text-[#86868B] mb-6 min-h-[40px]">Débloque tous les agents et fonctionnalités expertes de OUTFITY.</p>
                                        <ul className="space-y-3">
                                            {['Les 5 Agents IA débloqués', 'Création illimitée de designs', 'Tech Packs PDF Exportables', 'Recherche d\'usines premium'].map((feat, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-[#1D1D1F] font-medium">
                                                    <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" /> {feat}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => {
                                            setPlan('creator');
                                            handleComplete('creator');
                                        }}
                                        className="relative z-10 w-full h-14 rounded-2xl bg-[#007AFF] text-white font-bold text-base hover:bg-[#0056CC] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-70"
                                    >
                                        {isSubmitting && plan === 'creator' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Redirection Sécurisée...
                                            </>
                                        ) : (
                                            <>
                                                Essai gratuit de 3 jours <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={goBack}
                                disabled={isSubmitting}
                                className="text-sm text-[#86868B] font-semibold hover:text-[#1D1D1F] transition-colors py-2"
                            >
                                Retour aux Agents
                            </button>
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
        { label: 'Initialisation du studio...', duration: 250 },
        { label: 'Connexion aux agents IA...', duration: 300 },
        { label: 'Analyse des tendances 2026...', duration: 250 },
        { label: 'Initialisation de ton ADN...', duration: 300 },
        { label: 'Finalisation du dashboard...', duration: 200 },
        { label: 'Bienvenue dans OUTFITY !', duration: 250 },
    ];

    useEffect(() => {
        setProgress(0);
        if (stepIndex >= STEPS.length) {
            // Pour les starters : aller choisir le plan. Pour les cr\u00e9ateurs : directement le dashboard.
            if (isCreator) {
                window.location.href = '/dashboard?tutorial=1';
            } else {
                window.location.href = '/auth/choose-plan';
            }
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
