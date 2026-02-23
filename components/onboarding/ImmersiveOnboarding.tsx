'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Zap, Moon, ShieldCheck, Leaf, ArrowRight,
    Check, Loader2, CheckCircle2, Crown, Star, TrendingUp
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
const STEP_LABELS = ['Univers', 'Produit', 'Identité', 'Mission', 'Ton Équipe'];

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
    const subscribed = searchParams.get('subscribed') === 'true';

    const [plan, setPlan] = useState(initialPlan);
    const [step, setStep] = useState<Step>('welcome');
    const [data, setData] = useState<Partial<OnboardingData>>({});
    const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isCreator = plan === 'creator';
    const stepIndex = STEP_ORDER.indexOf(step);
    const progressSteps = ['universe', 'product', 'identity', 'pitch', 'agents'] as Step[];
    const progressIndex = progressSteps.indexOf(step);

    // Re-check plan réel depuis la DB après retour Stripe
    useEffect(() => {
        if (subscribed) {
            fetch('/api/user/plan')
                .then(r => r.ok ? r.json() : null)
                .then(d => { if (d?.plan) setPlan(d.plan); })
                .catch(() => { });
        }
    }, [subscribed]);

    // Suggestions de noms IA pour plan Créateur
    const fetchNameSuggestions = useCallback(async () => {
        if (!data.universeId || plan !== 'creator') return;
        setLoadingSuggestions(true);
        try {
            const res = await fetch('/api/brands/generate-identity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    concept: UNIVERSES.find(u => u.id === data.universeId)?.description,
                    style: data.universe,
                    target: data.productType,
                }),
            });
            const json = await res.json();
            if (res.ok && json.names) setNameSuggestions(json.names.slice(0, 5));
        } catch { }
        finally { setLoadingSuggestions(false); }
    }, [data.universeId, data.universe, data.productType, plan]);

    useEffect(() => {
        if (step === 'identity' && nameSuggestions.length === 0) {
            fetchNameSuggestions();
        }
    }, [step, nameSuggestions.length, fetchNameSuggestions]);

    const goNext = () => {
        const next = STEP_ORDER[stepIndex + 1];
        if (next) setStep(next);
    };

    const handleComplete = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/user/complete-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Erreur');
            }
            setStep('agents');
        } catch (e) {
            setError((e as Error).message);
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] font-sans flex flex-col">

            {/* Creator badge */}
            {subscribed && isCreator && step === 'welcome' && (
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#007AFF] text-white px-5 py-2 rounded-full shadow-lg text-sm font-semibold"
                >
                    <Crown className="w-4 h-4" />
                    Plan Créateur activé !
                </motion.div>
            )}

            {/* Progress stepper — visible uniquement sur les étapes 2-5 */}
            {progressIndex >= 0 && (
                <div className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-[#E5E5EA]">
                    <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between gap-2">
                        {STEP_LABELS.map((label, i) => {
                            const isActive = i === progressIndex;
                            const isDone = i < progressIndex;
                            return (
                                <div key={label} className="flex items-center gap-2 flex-1">
                                    <div className={cn(
                                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                                        isDone ? 'bg-[#007AFF] text-white' :
                                            isActive ? 'bg-[#007AFF] text-white ring-4 ring-[#007AFF]/20' :
                                                'bg-[#E5E5EA] text-[#86868B]'
                                    )}>
                                        {isDone ? <Check className="w-3 h-3" /> : i + 1}
                                    </div>
                                    <span className={cn(
                                        'text-xs font-semibold hidden sm:block',
                                        isActive ? 'text-[#1D1D1F]' : isDone ? 'text-[#007AFF]' : 'text-[#86868B]'
                                    )}>{label}</span>
                                    {i < STEP_LABELS.length - 1 && (
                                        <div className={cn(
                                            'h-0.5 flex-1 rounded transition-all',
                                            isDone ? 'bg-[#007AFF]' : 'bg-[#E5E5EA]'
                                        )} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className={cn(
                'flex-1 flex items-center justify-center px-4',
                progressIndex >= 0 ? 'pt-28 pb-10' : 'py-10'
            )}>
                <AnimatePresence mode="wait">

                    {/* ── WELCOME ── */}
                    {step === 'welcome' && (
                        <motion.div key="welcome"
                            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-lg w-full text-center space-y-8"
                        >
                            {/* Logo / App mark */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-[28px] bg-[#007AFF] flex items-center justify-center shadow-xl shadow-blue-300/40">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
                                        {isCreator ? 'Bienvenue dans\nle studio Créateur.' : 'Construisons\nta marque ensemble.'}
                                    </h1>
                                    <p className="text-[#86868B] text-lg mt-3 leading-relaxed">
                                        {isCreator
                                            ? 'En 3 minutes, ton studio est configuré avec l\'IA. Suggestions de noms, tendances et visuels — tout est prêt.'
                                            : 'En 5 questions simples, je pose les fondations de ta marque de mode.'
                                        }
                                    </p>
                                </div>
                            </div>

                            {!isCreator && (
                                <div className="rounded-2xl bg-white border border-[#E5E5EA] p-4 flex items-start gap-3 text-left shadow-sm">
                                    <Star className="w-5 h-5 text-[#FF9F0A] shrink-0 mt-0.5" />
                                    <p className="text-sm text-[#1D1D1F]">
                                        Passe au plan <span className="font-semibold text-[#007AFF]">Créateur</span> pour les suggestions de noms IA, l'analyse de tendances et le studio visuel complet.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={goNext}
                                className="group w-full h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
                            >
                                Commencer
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                            <p className="text-[#86868B] text-sm">Environ 3 minutes · Gratuit</p>
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
                            <button
                                onClick={goNext}
                                disabled={!data.universeId}
                                className="w-full h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
                            >
                                Continuer <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {/* ── PRODUCT ── */}
                    {step === 'product' && (
                        <motion.div key="product"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-2xl w-full space-y-6"
                        >
                            <div className="space-y-1">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Ton produit phare ?</h2>
                                <p className="text-[#86868B]">Ta pièce de lancement. Tu pourras diversifier plus tard.</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {PRODUCTS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setData(d => ({ ...d, productType: p.label }))}
                                        className={cn(
                                            'relative text-left p-4 rounded-2xl border-2 bg-white transition-all duration-200',
                                            data.productType === p.label
                                                ? 'border-[#007AFF] bg-blue-50 shadow-md'
                                                : 'border-[#E5E5EA] hover:border-[#C7C7CC] hover:shadow-sm'
                                        )}
                                    >
                                        <div className="text-2xl mb-2">{p.emoji}</div>
                                        <p className="font-semibold text-sm text-[#1D1D1F]">{p.label}</p>
                                        <p className="text-[#86868B] text-[11px] mt-0.5">{p.desc}</p>
                                        {/* Score de tendance — visible pour les Créateurs uniquement */}
                                        <div className={cn(
                                            'absolute top-3 right-3 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                                            isCreator
                                                ? p.trend >= 90 ? 'bg-green-100 text-green-700' : p.trend >= 80 ? 'bg-blue-100 text-blue-700' : 'bg-[#F2F2F7] text-[#86868B]'
                                                : 'bg-[#F2F2F7] text-[#C7C7CC]'
                                        )}>
                                            {isCreator ? (
                                                <><TrendingUp className="w-2.5 h-2.5" />{p.trend}</>
                                            ) : (
                                                '🔒'
                                            )}
                                        </div>
                                        {data.productType === p.label && (
                                            <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-[#007AFF] flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {!isCreator && (
                                <p className="text-center text-[#86868B] text-xs">
                                    🔒 Les scores de tendance en temps réel sont disponibles avec le plan Créateur.
                                </p>
                            )}
                            <button
                                onClick={goNext}
                                disabled={!data.productType}
                                className="w-full h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
                            >
                                Continuer <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {/* ── IDENTITY ── */}
                    {step === 'identity' && (
                        <motion.div key="identity"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-xl w-full space-y-6"
                        >
                            <div className="space-y-1">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Le nom de ta marque</h2>
                                <p className="text-[#86868B]">Ton premier actif. Choisis-le avec soin.</p>
                            </div>

                            {/* IA suggestions — Creator only */}
                            {isCreator && (
                                <div className="bg-white rounded-2xl border border-[#E5E5EA] p-4 space-y-3 shadow-sm">
                                    <p className="text-xs font-semibold text-[#007AFF] flex items-center gap-1.5 uppercase tracking-wider">
                                        <Sparkles className="w-3 h-3" /> Suggestions IA · {UNIVERSES.find(u => u.id === data.universeId)?.name}
                                    </p>
                                    {loadingSuggestions ? (
                                        <div className="flex items-center gap-2 text-[#86868B] text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin text-[#007AFF]" />
                                            Génération en cours...
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {nameSuggestions.map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => setData(d => ({ ...d, brandName: n }))}
                                                    className={cn(
                                                        'px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all',
                                                        data.brandName === n
                                                            ? 'bg-[#007AFF] border-[#007AFF] text-white'
                                                            : 'border-[#E5E5EA] text-[#1D1D1F] hover:border-[#007AFF] hover:text-[#007AFF]'
                                                    )}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Name input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#1D1D1F]">Nom de la marque *</label>
                                <input
                                    type="text"
                                    value={data.brandName || ''}
                                    onChange={e => setData(d => ({ ...d, brandName: e.target.value }))}
                                    placeholder={isCreator ? 'Ou tape ton propre nom...' : 'Ex. Nomad Studio'}
                                    className="w-full h-14 rounded-2xl bg-white border-2 border-[#E5E5EA] px-5 text-lg font-semibold text-[#1D1D1F] placeholder:text-[#C7C7CC] placeholder:font-normal focus:outline-none focus:border-[#007AFF] transition-colors"
                                />
                                {!isCreator && (
                                    <p className="text-[#86868B] text-xs pl-1">
                                        💡 Le plan Créateur génère 5 suggestions de noms IA adaptées à ton univers.
                                    </p>
                                )}
                            </div>

                            {/* Instagram (optional) */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#1D1D1F]">Instagram <span className="font-normal text-[#86868B]">(optionnel)</span></label>
                                <input
                                    type="text"
                                    value={data.instagram || ''}
                                    onChange={e => setData(d => ({ ...d, instagram: e.target.value }))}
                                    placeholder="@ta_marque"
                                    className="w-full h-12 rounded-xl bg-white border-2 border-[#E5E5EA] px-4 text-sm text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#007AFF] transition-colors"
                                />
                            </div>

                            <button
                                onClick={goNext}
                                disabled={(data.brandName?.trim()?.length || 0) < 2}
                                className="w-full h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
                            >
                                Continuer <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {/* ── PITCH ── */}
                    {step === 'pitch' && (
                        <motion.div key="pitch"
                            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-xl w-full space-y-6"
                        >
                            <div className="space-y-1">
                                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Ta mission en une phrase</h2>
                                <p className="text-[#86868B]">Ce texte alimentera ton dashboard, ta bio et tes mots-clés IA.</p>
                            </div>

                            <div className="rounded-2xl bg-white border border-[#E5E5EA] p-4 shadow-sm">
                                <p className="text-xs font-semibold text-[#86868B] uppercase tracking-wider mb-2">Exemple</p>
                                <p className="text-sm text-[#1D1D1F] italic leading-relaxed">
                                    "Je crée des hoodies oversize haut de gamme pour les créatifs urbains qui refusent le compromis entre style et confort."
                                </p>
                            </div>

                            <textarea
                                value={data.pitch || ''}
                                onChange={e => setData(d => ({ ...d, pitch: e.target.value }))}
                                placeholder="Je crée des [produit] pour [cible] qui..."
                                rows={4}
                                className="w-full rounded-2xl bg-white border-2 border-[#E5E5EA] px-5 py-4 text-base text-[#1D1D1F] placeholder:text-[#C7C7CC] focus:outline-none focus:border-[#007AFF] transition-colors resize-none"
                            />

                            {error && (
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            )}

                            <button
                                onClick={handleComplete}
                                disabled={saving || (data.pitch?.trim()?.length || 0) < 10}
                                className="w-full h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                                ) : (
                                    <>Finaliser ma marque <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>

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

                            <div className="w-full max-w-full overflow-x-auto hide-scrollbar sm:overflow-visible pb-8 pt-4 px-4 sm:px-0">
                                <div className="flex sm:flex-wrap items-center sm:justify-center gap-6 w-max sm:w-auto mx-auto snap-x snap-mandatory">
                                    {AGENTS_TEAM.map((agent, i) => (
                                        <div key={agent.id} className="snap-center shrink-0">
                                            <AgentRevealCard agent={agent} delay={i * 0.4} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 3, duration: 0.5 }}
                                onClick={goNext}
                                className="w-full max-w-sm h-14 rounded-2xl bg-[#007AFF] text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
                            >
                                Commencer le Lancement <ArrowRight className="w-4 h-4" />
                            </motion.button>
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
            if (elapsed >= step.duration) {
                clearInterval(interval);
                setStepIndex(i => i + 1);
            }
        }, 50);
        return () => clearInterval(interval);
    }, [stepIndex]); // eslint-disable-line

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md w-full text-center space-y-8"
        >
            <div className="space-y-4">
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, delay: 0.15 }}
                    className="text-6xl"
                >
                    {isCreator ? '🏆' : '🎉'}
                </motion.div>
                <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">
                    {isCreator ? 'Studio Créateur prêt !' : 'Ta marque est en ligne !'}
                </h2>
                <p className="text-[#86868B]">
                    <span className="font-semibold text-[#1D1D1F]">{brandName}</span> — l'aventure commence maintenant.
                </p>
            </div>

            <div className="space-y-2">
                {STEPS.map((s, i) => (
                    <div
                        key={s.label}
                        className={cn(
                            'flex items-center gap-3 p-3 rounded-2xl border transition-colors bg-white',
                            i < stepIndex ? 'border-green-200 bg-green-50' :
                                i === stepIndex ? 'border-[#007AFF]/30 bg-blue-50' : 'border-[#E5E5EA]'
                        )}
                    >
                        {i < stepIndex ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        ) : i === stepIndex ? (
                            <Loader2 className="w-5 h-5 text-[#007AFF] animate-spin shrink-0" />
                        ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-[#E5E5EA] shrink-0" />
                        )}
                        <span className={cn(
                            'text-sm font-medium flex-1 text-left',
                            i < stepIndex ? 'text-green-700' :
                                i === stepIndex ? 'text-[#007AFF]' : 'text-[#86868B]'
                        )}>
                            {s.label}
                        </span>
                        {i === stepIndex && (
                            <div className="w-16 h-1 bg-[#E5E5EA] rounded-full overflow-hidden shrink-0">
                                <div
                                    className="h-full bg-[#007AFF] rounded-full transition-all duration-100"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
