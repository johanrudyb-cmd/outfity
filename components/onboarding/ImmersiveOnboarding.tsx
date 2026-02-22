'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Zap, Moon, ShieldCheck, Leaf, ArrowRight,
    Check, Upload, Loader2, CheckCircle2, Crown, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────

type Step = 'welcome' | 'universe' | 'product' | 'identity' | 'pitch' | 'launch';

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
        gradient: 'from-orange-500/10 to-red-500/5',
        border: 'border-orange-400',
        accent: 'text-orange-500',
        keywords: ['Hoodie', 'T-Shirt Boxy', 'Cargo', 'Bomber'],
    },
    {
        id: 'minimalist',
        name: 'Modern Minimal',
        emoji: '🤍',
        description: 'Épuré, intemporel, premium',
        icon: Moon,
        gradient: 'from-slate-500/10 to-zinc-500/5',
        border: 'border-slate-400',
        accent: 'text-slate-700',
        keywords: ['Blazer', 'Tee Basique', 'Pantalon droit', 'Lin'],
    },
    {
        id: 'premium',
        name: 'Luxe Accessible',
        emoji: '✨',
        description: 'Détails soignés, finitions haut de gamme',
        icon: Sparkles,
        gradient: 'from-purple-500/10 to-violet-500/5',
        border: 'border-purple-400',
        accent: 'text-purple-600',
        keywords: ['Veste cuir', 'Blazer premium', 'Robe', 'Accessoires'],
    },
    {
        id: 'outdoor',
        name: 'Techwear',
        emoji: '⚡',
        description: 'Fonctionnel, technique, futuriste',
        icon: ShieldCheck,
        gradient: 'from-blue-500/10 to-cyan-500/5',
        border: 'border-blue-400',
        accent: 'text-blue-600',
        keywords: ['Veste technique', 'Cargo', 'Softshell', 'Layer'],
    },
    {
        id: 'eco',
        name: 'Éco-Premium',
        emoji: '🌿',
        description: 'Naturel, éthique, durable',
        icon: Leaf,
        gradient: 'from-emerald-500/10 to-green-500/5',
        border: 'border-emerald-400',
        accent: 'text-emerald-600',
        keywords: ['Lin', 'Coton bio', 'Teinture naturelle', 'Recyclé'],
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

const STEP_LABELS: Record<Step, string> = {
    welcome: 'Bienvenue',
    universe: 'Ton univers',
    product: 'Ton produit',
    identity: 'Ton identité',
    pitch: 'Ta mission',
    launch: 'C\'est parti',
};

const STEP_ORDER: Step[] = ['welcome', 'universe', 'product', 'identity', 'pitch', 'launch'];

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
            setStep('launch');
        } catch (e) {
            setError((e as Error).message);
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden relative flex flex-col">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-600/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-blue-600/5 blur-[100px]" />
            </div>

            {/* Progress bar */}
            {step !== 'welcome' && step !== 'launch' && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <div className="h-0.5 bg-white/10">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((stepIndex - 1) / (STEP_ORDER.length - 3)) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="flex justify-between px-6 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        {(['universe', 'product', 'identity', 'pitch'] as Step[]).map((s, i) => (
                            <span key={s} className={cn(step === s && 'text-white/90')}>
                                {i + 1}. {STEP_LABELS[s]}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Creator badge after payment */}
            {subscribed && isCreator && step === 'welcome' && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-5 py-2 rounded-full shadow-xl shadow-purple-900/40 text-sm font-bold"
                >
                    <Crown className="w-4 h-4" />
                    Plan Créateur activé !
                </motion.div>
            )}

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-4 py-16">
                <AnimatePresence mode="wait">

                    {/* ── WELCOME ── */}
                    {step === 'welcome' && (
                        <motion.div key="welcome"
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="max-w-xl w-full text-center space-y-8"
                        >
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-5xl mb-6"
                                >
                                    🚀
                                </motion.div>
                                <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                                    {isCreator
                                        ? <>Bienvenue dans<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">le studio Créateur.</span></>
                                        : <>Construisons<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">ta marque ensemble.</span></>
                                    }
                                </h1>
                                <p className="text-white/50 text-lg leading-relaxed">
                                    {isCreator
                                        ? 'En moins de 3 minutes, ton studio sera configuré avec l\'IA. Suggestions de noms, analyse de tendances, visuels — tout est prêt.'
                                        : 'En 5 questions simples, je crée les fondations de ta marque de mode. Sans jargon, sans prise de tête.'
                                    }
                                </p>
                            </div>

                            {!isCreator && (
                                <div className="p-4 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/60 flex gap-3 items-start text-left">
                                    <Star className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                    <span>Passe au plan <strong className="text-white">Créateur</strong> pour débloquer les suggestions de noms IA, l'analyse de tendances et le studio visuel complet.</span>
                                </div>
                            )}

                            <button
                                onClick={goNext}
                                className="group w-full h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 font-black text-lg tracking-wide flex items-center justify-center gap-3 hover:from-purple-500 hover:to-blue-500 transition-all shadow-2xl shadow-purple-900/30"
                            >
                                Commencer
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <p className="text-white/25 text-xs">Environ 3 minutes</p>
                        </motion.div>
                    )}

                    {/* ── UNIVERSE ── */}
                    {step === 'universe' && (
                        <motion.div key="universe"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                            className="max-w-2xl w-full space-y-8"
                        >
                            <div className="text-center space-y-2 pt-10">
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Étape 1 / 4</p>
                                <h2 className="text-3xl font-black">Quel est ton univers ?</h2>
                                <p className="text-white/50">Choisir un univers te donne une direction claire dès le départ.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {UNIVERSES.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            setData(d => ({ ...d, universe: u.name, universeId: u.id }));
                                        }}
                                        className={cn(
                                            'group relative text-left p-5 rounded-2xl border transition-all duration-200',
                                            data.universeId === u.id
                                                ? `${u.border} bg-gradient-to-br ${u.gradient} border-2`
                                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{u.emoji}</span>
                                            <div className="flex-1">
                                                <p className={cn('font-black text-sm', data.universeId === u.id ? u.accent : 'text-white')}>{u.name}</p>
                                                <p className="text-white/50 text-xs mt-0.5">{u.description}</p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {u.keywords.slice(0, 2).map(k => (
                                                        <span key={k} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/50">{k}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            {data.universeId === u.id && (
                                                <Check className={cn('w-4 h-4 shrink-0', u.accent)} />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={goNext}
                                disabled={!data.universeId}
                                className="w-full h-14 rounded-2xl bg-white text-black font-black text-base flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity hover:bg-white/90"
                            >
                                Continuer <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {/* ── PRODUCT ── */}
                    {step === 'product' && (
                        <motion.div key="product"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                            className="max-w-2xl w-full space-y-8"
                        >
                            <div className="text-center space-y-2 pt-10">
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Étape 2 / 4</p>
                                <h2 className="text-3xl font-black">Ton produit phare ?</h2>
                                <p className="text-white/50">Ce sera ta pièce de lancement. Tu pourras en ajouter d'autres plus tard.</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {PRODUCTS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setData(d => ({ ...d, productType: p.label }))}
                                        className={cn(
                                            'relative text-left p-4 rounded-2xl border transition-all duration-200',
                                            data.productType === p.label
                                                ? 'border-white bg-white/10 border-2'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                        )}
                                    >
                                        <div className="text-2xl mb-2">{p.emoji}</div>
                                        <p className="font-black text-sm text-white">{p.label}</p>
                                        <p className="text-white/40 text-[10px]">{p.desc}</p>
                                        {/* Trend badge */}
                                        <div className={cn(
                                            'absolute top-3 right-3 text-[9px] font-black px-1.5 py-0.5 rounded-full',
                                            p.trend >= 90 ? 'bg-green-500/20 text-green-400' :
                                                p.trend >= 80 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/50'
                                        )}>
                                            {isCreator ? `${p.trend}/100` : '🔒'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {!isCreator && (
                                <p className="text-center text-white/30 text-xs">
                                    🔒 Les scores de tendance en temps réel sont disponibles avec le plan Créateur.
                                </p>
                            )}
                            <button
                                onClick={goNext}
                                disabled={!data.productType}
                                className="w-full h-14 rounded-2xl bg-white text-black font-black text-base flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-opacity"
                            >
                                Continuer <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {/* ── IDENTITY ── */}
                    {step === 'identity' && (
                        <motion.div key="identity"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                            className="max-w-xl w-full space-y-8"
                        >
                            <div className="text-center space-y-2 pt-10">
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Étape 3 / 4</p>
                                <h2 className="text-3xl font-black">Le nom de ta marque</h2>
                                <p className="text-white/50">Ton nom sera ton premier actif. Choisis-le avec soin.</p>
                            </div>

                            {/* IA suggestions — Creator only */}
                            {isCreator && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Suggestions IA basées sur ton univers
                                    </p>
                                    {loadingSuggestions ? (
                                        <div className="flex items-center gap-3 text-white/40 text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Génération en cours...
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {nameSuggestions.map(n => (
                                                <button
                                                    key={n}
                                                    onClick={() => setData(d => ({ ...d, brandName: n }))}
                                                    className={cn(
                                                        'px-4 py-2 rounded-full text-sm font-bold border transition-all',
                                                        data.brandName === n
                                                            ? 'bg-purple-600 border-purple-500 text-white'
                                                            : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
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
                                <input
                                    type="text"
                                    value={data.brandName || ''}
                                    onChange={e => setData(d => ({ ...d, brandName: e.target.value }))}
                                    placeholder="Ex. Nomad Studio"
                                    className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 px-6 text-xl font-black text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                                />
                                {!isCreator && (
                                    <p className="text-white/30 text-xs pl-1">
                                        💡 Le plan Créateur génère 5 suggestions de noms IA adaptées à ton univers.
                                    </p>
                                )}
                            </div>

                            {/* Instagram (optional) */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Instagram (optionnel)</p>
                                <input
                                    type="text"
                                    value={data.instagram || ''}
                                    onChange={e => setData(d => ({ ...d, instagram: e.target.value }))}
                                    placeholder="@ta_marque"
                                    className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-all"
                                />
                            </div>

                            <button
                                onClick={goNext}
                                disabled={(data.brandName?.trim()?.length || 0) < 2}
                                className="w-full h-14 rounded-2xl bg-white text-black font-black text-base flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-opacity"
                            >
                                Continuer <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {/* ── PITCH ── */}
                    {step === 'pitch' && (
                        <motion.div key="pitch"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                            className="max-w-xl w-full space-y-8"
                        >
                            <div className="text-center space-y-2 pt-10">
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Étape 4 / 4</p>
                                <h2 className="text-3xl font-black">Ta mission en une phrase</h2>
                                <p className="text-white/50">Ce texte alimentera ton dashboard, ta bio et tes mots-clés IA.</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/50">
                                <p className="font-bold text-white/70 mb-1">Exemple :</p>
                                <p className="italic">"Je crée des hoodies oversize haut de gamme pour les créatifs urbains qui refusent le compromis entre style et confort."</p>
                            </div>

                            <textarea
                                value={data.pitch || ''}
                                onChange={e => setData(d => ({ ...d, pitch: e.target.value }))}
                                placeholder="Je crée des [produit] pour [cible] qui..."
                                rows={4}
                                className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-base text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all resize-none"
                            />

                            {error && (
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            )}

                            <button
                                onClick={handleComplete}
                                disabled={saving || (data.pitch?.trim()?.length || 0) < 10}
                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:from-purple-500 hover:to-blue-500 transition-all shadow-2xl shadow-purple-900/30"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                                ) : (
                                    <>Finaliser ma marque <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>

                            <button onClick={goNext} className="w-full text-white/30 text-sm hover:text-white/50 transition-colors py-2">
                                Passer cette étape →
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
// Launch / Confirmation step
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
        <motion.div key="launch"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-10"
        >
            <div className="space-y-3">
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="text-6xl mx-auto"
                >
                    {isCreator ? '🏆' : '🎉'}
                </motion.div>
                <h2 className="text-3xl font-black">
                    {isCreator ? `Studio Créateur prêt !` : 'Ta marque est en ligne !'}
                </h2>
                <p className="text-white/50">
                    <strong className="text-white">{brandName}</strong> — on construit quelque chose de grand.
                </p>
            </div>

            <div className="space-y-3">
                {STEPS.map((s, i) => (
                    <div
                        key={s.label}
                        className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                            i < stepIndex ? 'border-green-800 bg-green-900/20' :
                                i === stepIndex ? 'border-purple-700 bg-purple-900/20' : 'border-white/5 bg-white/5'
                        )}
                    >
                        {i < stepIndex ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        ) : i === stepIndex ? (
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                        ) : (
                            <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                        )}
                        <span className={cn('text-sm font-semibold', i <= stepIndex ? 'text-white' : 'text-white/30')}>
                            {s.label}
                        </span>
                        {i === stepIndex && (
                            <div className="ml-auto w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-400 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
