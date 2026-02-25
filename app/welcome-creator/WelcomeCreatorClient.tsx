'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentRevealCard, AGENTS_TEAM } from '@/components/onboarding/AgentRevealCard';
import {
    Crown, Sparkles, ArrowRight, Zap, Palette,
    FileText, TrendingUp, ShoppingBag, CheckCircle2
} from 'lucide-react';

// ─── Écrans ───────────────────────────────────────────────────
type Screen = 'intro' | 'johan' | 'features' | 'cta';
const SCREENS: Screen[] = ['intro', 'johan', 'features', 'cta'];

// ─── Features Creator ────────────────────────────────────────
const CREATOR_FEATURES = [
    {
        icon: Palette,
        color: '#a032ff',
        title: 'Studio Design illimité',
        desc: 'Génère des designs, mockups et Tech Packs complets sans limite grâce à Pharrell.',
    },
    {
        icon: TrendingUp,
        color: '#007AFF',
        title: 'Radar Tendances Premium',
        desc: 'Accès aux 100 tendances validées en temps réel + prédictions sur 30/60/90 jours.',
    },
    {
        icon: FileText,
        color: '#ff6b35',
        title: 'Tech Packs Professionnels',
        desc: 'Documents producteurs complets générés par IA — prêts à envoyer à ton usine.',
    },
    {
        icon: ShoppingBag,
        color: '#ffaa00',
        title: 'E-shop & Ventes avec Johan',
        desc: 'Ton nouvel agent personnel optimise ta boutique Shopify et booste ta conversion.',
    },
];

// ─── Main ────────────────────────────────────────────────────
export function WelcomeCreatorClient({ userName }: { userName: string }) {
    const router = useRouter();
    const [screen, setScreen] = useState<Screen>('intro');
    const [screenIndex, setScreenIndex] = useState(0);

    // Auto-avance de l'intro
    useEffect(() => {
        if (screen !== 'intro') return;
        const t = setTimeout(() => goNext(), 3200);
        return () => clearTimeout(t);
    }, [screen]);

    const goNext = () => {
        const next = screenIndex + 1;
        if (next < SCREENS.length) {
            setScreen(SCREENS[next]);
            setScreenIndex(next);
        }
    };

    const firstName = userName.split(' ')[0];

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans overflow-hidden flex flex-col">
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

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
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

                    {/* ── ÉCRAN 2 : RÉVÉLATION JOHAN ── */}
                    {screen === 'johan' && (
                        <motion.div
                            key="johan"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center gap-12 max-w-2xl w-full"
                        >
                            <div className="text-center space-y-3">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ffaa00]/30 bg-[#ffaa00]/10 text-[#ffaa00] text-xs font-bold uppercase tracking-widest mb-2"
                                >
                                    <Zap className="w-3.5 h-3.5" /> Nouvel Agent Débloqué
                                </motion.div>
                                <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">
                                    Johan est<br />
                                    <span style={{ color: '#ffaa00' }}>dans l&apos;équipe.</span>
                                </h2>
                                <p className="text-white/50 text-base max-w-sm mx-auto">
                                    Ton expert E-shop & Ventes. Il optimise ta boutique Shopify et booste tes taux de conversion.
                                </p>
                            </div>

                            {/* Carte Johan uniquement */}
                            <div className="flex justify-center">
                                <AgentRevealCard
                                    agent={AGENTS_TEAM.find(a => a.id === 'johan')!}
                                    delay={0}
                                />
                            </div>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                                onClick={goNext}
                                className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-bold text-base hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl"
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
                                    Par où<br />commencer ?
                                </h2>
                                <p className="text-white/50">
                                    Voici les 3 premières actions que recommande Virgil pour lancer ta marque vite.
                                </p>
                            </div>

                            <div className="space-y-3 text-left">
                                {[
                                    { num: '01', title: 'Génère ta Stratégie de Marque', href: '/launch-map/phase/1', color: '#007AFF', desc: 'Virgil analyse ton univers et crée ton ADN de marque complet.' },
                                    { num: '02', title: 'Lance ton premier Design', href: '/launch-map/phase/2', color: '#a032ff', desc: 'Pharrell génère tes mockups et Tech Pack en quelques minutes.' },
                                    { num: '03', title: 'Configure ton E-shop', href: '/launch-map/phase/5', color: '#ffaa00', desc: 'Johan t\'aide à lancer ta boutique Shopify optimisée.' },
                                ].map((item, i) => (
                                    <motion.a
                                        key={item.num}
                                        href={item.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.15 + 0.2 }}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/8 transition-all group"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                                            style={{ backgroundColor: `${item.color}20`, color: item.color }}
                                        >
                                            {item.num}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm">{item.title}</p>
                                            <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                                        </div>
                                        <CheckCircle2
                                            className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ color: item.color }}
                                        />
                                    </motion.a>
                                ))}
                            </div>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                onClick={() => { try { localStorage.setItem('show_tutorial_next', '1'); } catch (_) { } router.push('/dashboard'); }}
                                className="w-full h-14 rounded-2xl bg-white text-black font-bold text-lg flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl"
                            >
                                Explorer mon dashboard <ArrowRight className="w-5 h-5" />
                            </motion.button>

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
