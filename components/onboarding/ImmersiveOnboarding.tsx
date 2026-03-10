'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Zap, Moon, ShieldCheck, Leaf, ArrowRight,
    Check, Loader2, CheckCircle2, Clock, Rocket, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { isPaidPlan } from '@/lib/plan-utils';

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

// Plan avant les agents : l'utilisateur choisit son plan, puis les agents se révèlent en conséquence
const STEP_ORDER: Step[] = ['welcome', 'profiling', 'universe_product', 'identity_pitch', 'plan', 'agents', 'launch'];

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
        const isCanceled = searchParams.get('canceled') === 'true';
        if (isUpgraded) {
            // Retour de Stripe après paiement → on pointe directement sur l'étape agents
            setPlan('creator');
            setStep('agents');
        } else if (isCanceled) {
            // Paiement annulé → repasser au choix du plan
            setPlan('starter');
            setStep('plan');
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

            // Toujours : lancer l'animation de lancement → puis dashboard
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
                                    {data.universeId && (
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
                                    {isCreator ? 'Ton Équipe Complète' : 'Ton Agent Activé'}
                                </h2>
                                <p className="text-base sm:text-lg text-[#86868B] max-w-lg mx-auto px-4">
                                    {isCreator
                                        ? <>Tous tes agents IA sont prêts pour <strong>{data.brandName || 'ta marque'}</strong>.</>
                                        : <>Virgil est prêt à guider <strong>{data.brandName || 'ta marque'}</strong>. Les 4 autres agents se débloquent avec le plan Créateur.</>}
                                </p>
                            </div>

                            {/* Agents : tous si Créateur, uniquement Virgil si Starter */}
                            <div className={isCreator ? "w-full max-w-6xl px-4 sm:px-6" : "w-full max-w-xs px-4"}>
                                <div className={isCreator ? "flex flex-wrap justify-center gap-6 sm:gap-8" : "flex justify-center"}>
                                    {AGENTS_TEAM
                                        .filter(a => isCreator || a.id === 'virgil')
                                        .map((agent, idx) => (
                                            <div key={agent.id} className="w-[220px] sm:w-[240px] shrink-0">
                                                <AgentRevealCard agent={agent} delay={idx * 0.15 + 0.2} />
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Teaser agents verrouillés — uniquement pour Starter */}
                            {!isCreator && (
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
                            )}

                            <div className="flex flex-col gap-3 w-full max-w-sm px-4">
                                <button
                                    disabled={isSubmitting}
                                    onClick={() => handleComplete(plan)}
                                    className="w-full h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : isCreator ? (
                                        <>Lancer le studio <ArrowRight className="w-4 h-4" /></>
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
                            className="w-full max-w-4xl flex flex-col items-center space-y-6 sm:space-y-8 px-4"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Choisis ton accès</h2>
                                <p className="text-[#86868B]">Ensuite, on te révèle les agents IA qui t'accompagnent.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">

                                {/* ── STARTER ── */}
                                <div className="bg-white rounded-[24px] p-6 sm:p-8 border-2 border-[#F2F2F2] flex flex-col hover:border-[#007AFF]/30 transition-all">
                                    <div className="mb-6 flex-1">
                                        <h3 className="text-xl font-bold text-[#1D1D1F] mb-1">Starter</h3>
                                        <div className="text-3xl font-black text-[#1D1D1F] mb-1">0€<span className="text-lg font-normal text-[#86868B]">/mois</span></div>
                                        <p className="text-sm text-[#86868B] mb-5">Virgil t'aide à poser les bases de ta stratégie.</p>
                                        {/* Agents */}
                                        <div className="space-y-3 mb-4">
                                            {[
                                                { name: 'Virgil', img: '/images/agents/virgil_final.webp', role: 'Je définis ta stratégie', isUnlocked: true },
                                                { name: 'Pharrell', img: '/images/agents/pharrell_final.webp', role: 'Je conçois ton produit', isUnlocked: false },
                                                { name: 'Ada', img: '/images/agents/ada_final.webp', role: 'Je trouve ton usine', isUnlocked: false },
                                                { name: 'Joy', img: '/images/agents/joy_final.webp', role: "J'écris tes scripts", isUnlocked: false },
                                                { name: 'Johan', img: '/images/agents/johan_final.webp', role: 'Je crée ta boutique', isUnlocked: false },
                                            ].map(agent => (
                                                <div key={agent.name} className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <img src={agent.img} alt={agent.name}
                                                            className={`w-9 h-9 rounded-full object-cover border border-black/10 ${!agent.isUnlocked ? 'grayscale opacity-40' : ''}`}
                                                        />
                                                        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm border border-black/10">
                                                            {agent.isUnlocked
                                                                ? <Check className="w-2.5 h-2.5 text-[#007AFF]" />
                                                                : <Lock className="w-2.5 h-2.5 text-amber-400" />}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold ${agent.isUnlocked ? 'text-[#1D1D1F]' : 'text-[#86868B]'}`}>{agent.name}</p>
                                                        <p className={`text-[11px] ${agent.isUnlocked ? 'text-[#6e6e73]' : 'text-[#86868B] italic'}`}>"{agent.role}"</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => { setPlan('starter'); handleComplete('starter'); }}
                                        className="w-full h-13 py-3.5 rounded-2xl border-2 border-[#E5E5EA] text-[#1D1D1F] font-bold text-sm hover:border-[#007AFF] hover:text-[#007AFF] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        Démarrer avec Virgil <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <p className="text-[11px] text-[#86868B] text-center mt-2">Sans carte bancaire</p>
                                </div>

                                {/* ── CRÉATEUR ── */}
                                <div className="relative bg-white rounded-[24px] p-6 sm:p-8 border-2 border-[#007AFF] shadow-xl shadow-blue-500/10 flex flex-col overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    {/* Timer promo */}
                                    <div className="flex items-center gap-1.5 text-[#FF3B30] font-bold text-[11px] mb-3 bg-red-50 border border-red-100 rounded-full px-3 py-1 w-fit">
                                        <Clock className="w-3 h-3" /> Offre limitée
                                    </div>
                                    <div className="mb-6 flex-1 relative z-10">
                                        <h3 className="text-xl font-bold text-[#1D1D1F] mb-1">Créateur</h3>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <div className="text-3xl font-black text-[#1D1D1F]">29€<span className="text-lg font-normal text-[#86868B]">/mois</span></div>
                                            <div className="text-base text-[#86868B] line-through decoration-red-500/50">39€</div>
                                        </div>
                                        <p className="text-sm text-[#86868B] mb-5">Offre limitée : 29€/mois à vie. 3 jours d'essai gratuit.</p>
                                        {/* Agents */}
                                        <div className="space-y-3 mb-4">
                                            {[
                                                { name: 'Virgil', img: '/images/agents/virgil_final.webp', role: 'Je définis ta stratégie', isUnlocked: true },
                                                { name: 'Pharrell', img: '/images/agents/pharrell_final.webp', role: 'Je conçois ton produit', isUnlocked: true },
                                                { name: 'Ada', img: '/images/agents/ada_final.webp', role: 'Je trouve ton usine', isUnlocked: true },
                                                { name: 'Joy', img: '/images/agents/joy_final.webp', role: "J'écris tes scripts", isUnlocked: true },
                                                { name: 'Johan', img: '/images/agents/johan_final.webp', role: 'Je crée ta boutique', isUnlocked: true },
                                            ].map(agent => (
                                                <div key={agent.name} className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <img src={agent.img} alt={agent.name}
                                                            className="w-9 h-9 rounded-full object-cover border border-black/10"
                                                        />
                                                        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm border border-black/10">
                                                            <Check className="w-2.5 h-2.5 text-[#34C759]" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-[#1D1D1F]">{agent.name}</p>
                                                        <p className="text-[11px] text-[#6e6e73]">"{agent.role}"</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => { setPlan('creator'); handleComplete('creator'); }}
                                        className="relative z-10 w-full py-3.5 rounded-2xl bg-[#007AFF] text-white font-bold text-sm hover:bg-[#0056CC] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-70"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Redirection...</>
                                        ) : (
                                            <>Essai gratuit 3 jours <ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                    <p className="text-[11px] text-[#86868B] text-center mt-2 relative z-10">Annulable à tout moment</p>
                                </div>
                            </div>

                            <button
                                onClick={goBack}
                                disabled={isSubmitting}
                                className="text-sm text-[#86868B] font-semibold hover:text-[#1D1D1F] transition-colors py-2"
                            >
                                Retour
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
            // Toujours aller au dashboard — le plan a déjà été choisi dans l'onboarding
            try { localStorage.setItem('show_tutorial_next', '1'); } catch (_) { }
            window.location.href = '/dashboard?tutorial=1';
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
    }, [stepIndex]);

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
