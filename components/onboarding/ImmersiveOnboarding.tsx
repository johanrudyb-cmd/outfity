'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Zap, Moon, ShieldCheck, Leaf, ArrowRight,
    Check, Loader2, CheckCircle2, Crown, Star, TrendingUp, Clock, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────

type Step = 'welcome' | 'universe' | 'product' | 'identity' | 'pitch' | 'agents' | 'launch';

interface OnboardingData {
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

const STEP_ORDER: Step[] = ['welcome', 'universe', 'product', 'identity', 'pitch', 'agents', 'launch'];
const STEP_LABELS = ['Univers', 'Produit', 'Identité', 'Mission', 'Équipe IA'];

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
    const [step, setStep] = useState<Step>('welcome');
    const [plan, setPlan] = useState(initialPlan || 'starter');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        universe: '',
        universeId: '',
        productType: '',
        brandName: '',
        pitch: '',
    });

    const isCreator = plan === 'creator';
    const stepIndex = STEP_ORDER.indexOf(step);

    useEffect(() => {
        const p = searchParams.get('plan');
        if (p === 'creator') setPlan('creator');
        else setPlan('starter');
    }, [searchParams]);

    const goNext = useCallback(() => {
        const nextIdx = stepIndex + 1;
        if (nextIdx < STEP_ORDER.length) {
            setStep(STEP_ORDER[nextIdx]);
        }
    }, [stepIndex]);

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
                body: JSON.stringify({ ...data, plan: plan === 'starter' ? 'starter' : plan }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Erreur lors de la sauvegarde');
            }
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

            {/* BACK BUTTON */}
            {step !== 'welcome' && step !== 'launch' && (
                <button
                    onClick={goBack}
                    className="fixed top-8 left-8 p-3 rounded-full hover:bg-white/80 transition-all z-40 group border border-transparent hover:border-black/5"
                >
                    <ArrowRight className="w-5 h-5 rotate-180 text-[#86868B] group-hover:text-black" />
                </button>
            )}

            <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <AnimatePresence mode="wait">

                    {/* ── WELCOME ── */}
                    {step === 'welcome' && (
                        <motion.div key="welcome"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-xl text-center space-y-8"
                        >
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-20 h-20 bg-white rounded-[22px] shadow-apple flex items-center justify-center mx-auto mb-8 cursor-default"
                                >
                                    <Sparkles className="w-10 h-10 text-[#007AFF]" />
                                </motion.div>
                                <div>
                                    <h1 className="text-4xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
                                        {isCreator ? 'Bienvenue dans\nle studio Créateur.' : 'Bienvenue dans\nle studio Starter.'}
                                    </h1>
                                    <p className="text-[#86868B] text-lg mt-3 leading-relaxed">
                                        {isCreator
                                            ? 'Prêt à transformer tes idées en marque rentable avec ton équipe IA complète ?'
                                            : 'Commençons par définir les bases de ta future marque de vêtement.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={goNext}
                                className="w-full h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
                            >
                                Commencer <ArrowRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}


                    {/* ── UNIVERSE ── */}
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

                    {/* ── PRODUCT ── */}
                    {step === 'product' && (
                        <motion.div key="product"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35 }}
                            className="max-w-2xl w-full space-y-6"
                        >
                            <div className="space-y-1">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Que veux-tu lancer ?</h2>
                                <p className="text-[#86868B]">Chaque produit a son propre potentiel de viralité et ses marges.</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {PRODUCTS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setData(d => ({ ...d, productType: p.label }))}
                                        className={cn(
                                            'p-4 rounded-2xl border-2 bg-white transition-all text-center flex flex-col items-center group',
                                            data.productType === p.label
                                                ? 'border-[#007AFF] bg-blue-50/30'
                                                : 'border-[#E5E5EA] hover:border-[#C7C7CC]'
                                        )}
                                    >
                                        <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{p.emoji}</span>
                                        <p className="font-bold text-sm text-[#1D1D1F]">{p.label}</p>
                                        <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-[#34C759] uppercase tracking-wider">
                                            <TrendingUp className="w-3 h-3" />
                                            {p.trend}% Trend
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
                                    disabled={!data.productType}
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-blue-500/20"
                                >
                                    Continuer <ArrowRight className="w-4 h-4" />
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

                                {isCreator && (
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                        <div className="flex items-center gap-2 text-[#007AFF] font-bold text-xs uppercase tracking-widest">
                                            <Sparkles className="w-4 h-4" /> Suggestions IA Créateur
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Studio Noir', 'Raw Aesthetic', 'Urban Flow', 'Vibe Gallery'].map(name => (
                                                <button
                                                    key={name}
                                                    onClick={() => setData(d => ({ ...d, brandName: name }))}
                                                    className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium hover:border-[#007AFF] hover:text-[#007AFF] transition-colors"
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
                                    onClick={handleComplete}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Finaliser <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>

                            <button
                                onClick={() => { setData(d => ({ ...d, pitch: 'À compléter' })); handleComplete(); }}
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
                                    plan === 'starter' ? "grid-cols-1 xs:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 xs:grid-cols-2 lg:grid-cols-4"
                                )}>
                                    {AGENTS_TEAM.filter(a => plan === 'creator' || a.id !== 'johan').map((agent, idx) => (
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
                                    onClick={goNext}
                                    className="flex-[2] h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
                                >
                                    Lancer ! <ArrowRight className="w-4 h-4" />
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
        { label: 'Configuration du studio...', duration: 900 },
        { label: 'Activation des tendances...', duration: 800 },
        { label: isCreator ? 'IA Créateur en ligne...' : 'Dashboard prêt...', duration: 700 },
        { label: 'Lancement !', duration: 600 },
    ];

    useEffect(() => {
        setProgress(0);
        if (stepIndex >= STEPS.length) {
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
