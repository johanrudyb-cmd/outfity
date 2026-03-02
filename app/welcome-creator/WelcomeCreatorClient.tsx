'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentRevealCard, AGENTS_TEAM } from '@/components/onboarding/AgentRevealCard';
import {
    Crown, Sparkles, ArrowRight, Zap, Palette,
    FileText, TrendingUp, ShoppingBag, CheckCircle2
} from 'lucide-react';

// ─── Écrans ───────────────────────────────────────────────────
type Screen = 'intro' | 'agents' | 'features' | 'strategy' | 'cta';

// ─── Features Creator ────────────────────────────────────────
const CREATOR_FEATURES = [
    {
        icon: Palette,
        color: '#a032ff',
        title: 'Studio Design & Création',
        desc: 'Pharrell t\'accompagne dans chaque étape de ta création, de la réflexion au guide sur les logiciels.',
    },
    {
        icon: FileText,
        color: '#ff2a5f',
        title: 'Tech Packs Professionnels',
        desc: 'Ada t\'aide à remplir tes fiches techniques de production pour tes usines (Phase 4).',
    },
    {
        icon: TrendingUp,
        color: '#007AFF',
        title: 'Radar Tendances Premium',
        desc: 'Virgil t\'accompagne dans ta stratégie d\'ADN et analyse les tendances en temps réel.',
    },
    {
        icon: ShoppingBag,
        color: '#ffaa00',
        title: 'E-shop & Ventes avec Johan',
        desc: 'Johan te conseille pour optimiser ta boutique Shopify et booster ta conversion.',
    },
    {
        icon: Sparkles,
        color: '#AF52DE',
        title: 'Social Media & Viralité',
        desc: 'Joy te guide pour créer du contenu viral et gérer ton image sur les réseaux.',
    },
];

// ─── Main ────────────────────────────────────────────────────
export function WelcomeCreatorClient({ userName, hasStrategy, hasLogo, brandId }: { userName: string, hasStrategy: boolean, hasLogo: boolean, brandId: string | null }) {
    const router = useRouter();
    const { update } = useSession();
    const [screenIndex, setScreenIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Définition dynamique des écrans
    const SCREENS: Screen[] = [
        'intro',
        'agents',
        'features',
        ...(hasStrategy ? [] : (['strategy'] as Screen[])),
        'cta'
    ];

    const screen = SCREENS[screenIndex];

    // Rafraîchissement silencieux de la session si nécessaire, sans bloquer le rendu
    useEffect(() => {
        // Optionnel : update() seulement si on a un flag spécifique, mais on évite ici pour la perf
    }, []);

    // Auto-avance de l'intro
    useEffect(() => {
        if (screen !== 'intro') return;
        const t = setTimeout(() => goNext(), 3200);
        return () => clearTimeout(t);
    }, [screen, screenIndex]);

    const goNext = () => {
        const next = screenIndex + 1;
        if (next < SCREENS.length) {
            setScreenIndex(next);
        }
    };

    const [localStrategyDone, setLocalStrategyDone] = useState(false);

    const handleSelectStrategy = async (strategy: string) => {
        if (!brandId) {
            setLocalStrategyDone(true);
            goNext();
            return;
        }
        setIsSaving(true);
        try {
            await fetch(`/api/brands/${brandId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    styleGuide: {
                        preferredStyle: strategy,
                        positioning: strategy
                    }
                })
            });
            setLocalStrategyDone(true);
            goNext();
        } catch (e) {
            console.error(e);
            setLocalStrategyDone(true);
            goNext();
        } finally {
            setIsSaving(false);
        }
    };

    const firstName = userName.split(' ')[0];

    return (
        <div className="fixed inset-0 w-full h-[100dvh] bg-[#0A0A0A] text-white font-sans overflow-hidden flex flex-col">
            {/* Progress dots */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                {SCREENS.map((s, i) => (
                    <div
                        key={s}
                        className="h-1 rounded-full transition-all duration-500"
                        style={{
                            width: i === screenIndex ? 32 : 8,
                            backgroundColor: i <= screenIndex ? '#007AFF' : 'rgba(255,255,255,0.15)',
                        }}
                    />
                ))}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative w-full h-full overflow-y-auto overflow-x-hidden">
                <AnimatePresence mode="wait">

                    {/* ── ÉCRAN 1 : INTRO ── */}
                    {screen === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center space-y-8 max-w-lg"
                        >
                            {/* Icône animée */}
                            <div className="relative mx-auto w-28 h-28">
                                <motion.div
                                    animate={{ scale: [1, 1.08, 1] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-28 h-28 rounded-[34px] bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shadow-2xl shadow-blue-500/40"
                                >
                                    <Crown className="w-14 h-14 text-white" />
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                                    className="absolute -top-2 -right-2 w-10 h-10 bg-[#FFD60A] rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <Sparkles className="w-5 h-5 text-black" />
                                </motion.div>
                            </div>

                            <div className="space-y-3">
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xs font-bold uppercase tracking-[0.25em] text-[#007AFF]"
                                >
                                    Plan Créateur Activé
                                </motion.p>
                                <motion.h1
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 }}
                                    className="text-4xl sm:text-5xl font-black tracking-tight leading-tight"
                                >
                                    Bienvenue dans<br />
                                    <span className="bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] bg-clip-text text-transparent">
                                        l&apos;équipe, {firstName}.
                                    </span>
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-white/50 text-lg leading-relaxed"
                                >
                                    Tu as tout ce qu&apos;il faut pour lancer une marque<br className="hidden sm:block" /> de vêtements sérieuse. Voici ce qui change.
                                </motion.p>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                className="flex justify-center gap-1"
                            >
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-white/20"
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── ÉCRAN 2 : RÉVÉLATION AGENTS ── */}
                    {screen === 'agents' && (
                        <motion.div
                            key="agents"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center gap-8 sm:gap-12 max-w-4xl w-full py-8"
                        >
                            <div className="text-center space-y-3 px-2">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ffaa00]/30 bg-[#ffaa00]/10 text-white text-xs font-bold uppercase tracking-widest mb-2"
                                >
                                    <Zap className="w-3.5 h-3.5 text-[#ffaa00]" /> Nouveaux Agents Débloqués
                                </motion.div>
                                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
                                    Johan & Joy <br className="hidden sm:block" />
                                    <span className="bg-gradient-to-r from-[#ffaa00] to-[#AF52DE] bg-clip-text text-transparent">rejoignent l&apos;équipe.</span>
                                </h2>
                                <p className="text-white/50 text-sm sm:text-base max-w-lg mx-auto leading-relaxed px-4">
                                    Tes experts Ventes et Création de contenu. Ils optimisent ta boutique Shopify et gèrent tes réseaux sociaux.
                                </p>
                            </div>

                            {/* Cartes Johan & Joy */}
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-10 sm:gap-16 w-full">
                                <AgentRevealCard
                                    agent={AGENTS_TEAM.find(a => a.id === 'johan')!}
                                    delay={0}
                                />
                                <AgentRevealCard
                                    agent={AGENTS_TEAM.find(a => a.id === 'joy')!}
                                    delay={0.3}
                                />
                            </div>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                                onClick={goNext}
                                className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-bold text-base hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl mt-4"
                            >
                                Voir mes nouveaux outils <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── ÉCRAN 3 : FEATURES ── */}
                    {screen === 'features' && (
                        <motion.div
                            key="features"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-2xl w-full space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                                    Ce qui est maintenant<br />
                                    <span className="bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] bg-clip-text text-transparent">
                                        débloqué pour toi
                                    </span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {CREATOR_FEATURES.map((f, i) => (
                                    <motion.div
                                        key={f.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 + 0.2 }}
                                        className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors space-y-3"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${f.color}20` }}
                                        >
                                            <f.icon className="w-5 h-5" style={{ color: f.color }} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{f.title}</p>
                                            <p className="text-white/50 text-xs mt-1 leading-relaxed">{f.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                onClick={goNext}
                                className="w-full h-14 rounded-2xl bg-[#007AFF] text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#0056CC] active:scale-[0.98] transition-all shadow-xl shadow-blue-500/25"
                            >
                                Accéder à mon studio Créateur <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── ÉCRAN 3.5 : CHOIX STRATÉGIE (si manquant) ── */}
                    {screen === 'strategy' && (
                        <motion.div
                            key="strategy"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-2xl w-full space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-white text-xs font-bold uppercase tracking-widest mb-2"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Configuration de l&apos;Atelier
                                </motion.div>
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                                    Quel est l&apos;esprit de<br />
                                    <span className="bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] bg-clip-text text-transparent">
                                        ton projet ?
                                    </span>
                                </h2>
                                <p className="text-white/50 text-sm">Choisis une direction pour Virgil.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {[
                                    { label: 'Streetwear Luxury', desc: 'Codes urbains.', icon: '💎' },
                                    { label: 'Quiet Luxury', desc: 'Minimalisme chic.', icon: '🕊️' },
                                    { label: 'Gorpcore / Techwear', desc: 'Performance & Tech.', icon: '⛰️' },
                                    { label: 'Parisian Minimalist', desc: 'Chic intemporel.', icon: '🏛️' },
                                    { label: 'Néo-Vintage Sport', desc: 'Rétro dynamique.', icon: '🏎️' },
                                    { label: 'Eco-Basics', desc: 'Durable & Essentiel.', icon: '🌿' }
                                ].map((opt, i) => (
                                    <motion.button
                                        key={opt.label}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 + 0.2 }}
                                        disabled={isSaving}
                                        onClick={() => handleSelectStrategy(opt.label)}
                                        className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all text-left space-y-2 group relative overflow-hidden"
                                    >
                                        <div className="text-2xl mb-1">{opt.icon}</div>
                                        <p className="font-bold text-white text-sm group-hover:text-[#007AFF] transition-colors">{opt.label}</p>
                                        <p className="text-white/40 text-[10px] leading-tight">{opt.desc}</p>
                                        {isSaving && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── ÉCRAN 4 : CTA / CHECKLIST ── */}
                    {screen === 'cta' && (
                        <motion.div
                            key="cta"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="max-w-md w-full space-y-8 text-center"
                        >
                            <div className="space-y-3">
                                <h2 className="text-4xl font-black tracking-tight">
                                    {(!hasStrategy && !localStrategyDone) ? 'Action Requise' : 'Par où commencer ?'}
                                </h2>
                                <p className="text-white/80 font-medium">
                                    {(!hasStrategy && !localStrategyDone)
                                        ? "🚨 Attention : Tu dois impérativement finaliser ta Stratégie. Virgil a besoin de ton ADN de marque pour t'accompagner efficacement."
                                        : "Ton studio Créateur est prêt ! Voici les premières actions recommandées par Virgil pour lancer ta marque."}
                                </p>
                            </div>

                            <div className="space-y-3 text-left">
                                {(!hasStrategy && !localStrategyDone
                                    ? [
                                        // Stratégie en premier, toujours
                                        { num: '01', title: 'Générer ma Stratégie', href: '/launch-map/phase/1', color: '#ff3b30', desc: 'Obligatoire. Virgil a besoin de ton ADN pour t\'aider.', locked: false },
                                        // Logo recommandé après
                                        { num: '02', title: 'Créer mon Logo', href: '#', color: '#555', desc: '🔒 Recommandé après la Stratégie (Phase 1)', locked: true },

                                    ]
                                    : [
                                        { num: '01', title: 'Stratégie de Marque', href: '/launch-map/phase/1', color: '#34C759', desc: 'Virgil t\'a aidé à définir ton ADN.', locked: false, completed: true },
                                        { num: '02', title: 'Identité Visuelle (Logo)', href: '/launch-map/phase/1', color: hasLogo ? '#34C759' : '#007AFF', desc: hasLogo ? 'Terminé ! Ton logo est enregistré.' : 'Recommandé. Crée ton logo avec Pharrell au Studio.', locked: false, completed: hasLogo },
                                        { num: '03', title: 'Collection & Création', href: '/launch-map/phase/2', color: '#a032ff', desc: 'Pharrell te guide de l\'idée à la conception.', locked: false },
                                        { num: '04', title: 'Tech Packs (Fiches Usine)', href: '/launch-map/phase/4', color: '#ff2a5f', desc: 'Remplis tes fiches techniques avec Ada.', locked: false },
                                    ]
                                ).map((item, i) => (
                                    <motion.a
                                        key={item.num + item.title}
                                        href={item.locked ? undefined : item.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.15 + 0.2 }}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${item.locked
                                            ? 'bg-white/2 border-white/5 cursor-not-allowed opacity-40'
                                            : 'bg-white/5 border-white/10 hover:border-white/25 cursor-pointer'
                                            }`}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                                            style={{ backgroundColor: `${item.color}20`, color: item.color }}
                                        >
                                            {item.num}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm">{item.title}</p>
                                            <p className="text-white/60 text-xs mt-0.5">{item.desc}</p>
                                        </div>
                                        {(item as any).completed ? (
                                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#34C759]" />
                                        ) : (
                                            <CheckCircle2
                                                className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ color: item.color }}
                                            />
                                        )}
                                    </motion.a>
                                ))}
                            </div>

                            {(hasStrategy || localStrategyDone) && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    onClick={() => {
                                        try { localStorage.setItem('show_creator_tutorial', '1'); } catch (_) { }
                                        router.push('/dashboard?creator_tour=1');
                                    }}
                                    className="w-full h-14 rounded-2xl bg-white text-black font-bold text-lg flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl"
                                >
                                    Explorer mon dashboard <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            )}

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="text-white/30 text-xs"
                            >
                                ✨ 3 jours d&apos;essai gratuit confirmés · Annulable à tout moment
                            </motion.p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
