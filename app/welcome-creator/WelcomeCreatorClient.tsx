'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, Sparkles, ArrowRight, Zap,
    Palette, FileText, TrendingUp, ShoppingBag, Check
} from 'lucide-react';
import Image from 'next/image';

// ─── Agents team data ─────────────────────────────────────────
const AGENTS = [
    {
        id: 'virgil', name: 'Virgil', role: 'Stratégie',
        image: '/images/agents/virgil_final.webp', color: '#007AFF',
        desc: 'Analyse les tendances et définit ta stratégie de marque.',
    },
    {
        id: 'pharrell', name: 'Pharrell', role: 'Design',
        image: '/images/agents/pharrell_final.webp', color: '#a032ff',
        desc: "T'accompagne dans la création de tes mockups et visuels.",
    },
    {
        id: 'ada', name: 'Ada', role: 'Sourcing',
        image: '/images/agents/ada_final.webp', color: '#ff2a5f',
        desc: 'Te guide pour trouver les meilleures usines et négocier.',
    },
    {
        id: 'joy', name: 'Joy', role: 'Contenu',
        image: '/images/agents/joy_final.webp', color: '#AF52DE',
        desc: 'Écrit tes scripts TikTok et gère ton image sur les réseaux.',
    },
    {
        id: 'johan', name: 'Johan', role: 'E-shop',
        image: '/images/agents/johan_final.webp', color: '#ffaa00',
        desc: "Te conseille pour optimiser ta boutique Shopify et convertir.",
    },
];

const STRATEGIES = [
    { label: 'Streetwear Luxury', icon: '💎', desc: 'Codes urbains premium' },
    { label: 'Quiet Luxury', icon: '🕊️', desc: 'Minimalisme chic' },
    { label: 'Gorpcore / Techwear', icon: '⛰️', desc: 'Performance & Tech' },
    { label: 'Parisian Minimalist', icon: '🏛️', desc: 'Chic intemporel' },
    { label: 'Néo-Vintage Sport', icon: '🏎️', desc: 'Rétro dynamique' },
    { label: 'Eco-Basics', icon: '🌿', desc: 'Durable & Essentiel' },
];

type Screen = 'celebrate' | 'team' | 'strategy';

export function WelcomeCreatorClient({
    userName, hasStrategy, brandId
}: {
    userName: string;
    hasStrategy: boolean;
    hasLogo: boolean;
    brandId: string | null;
}) {
    const router = useRouter();
    const [screen, setScreen] = useState<Screen>('celebrate');
    const [isSaving, setIsSaving] = useState(false);

    const firstName = userName.split(' ')[0];

    // Auto-advance de l'écran de célébration après 2.5s
    useEffect(() => {
        if (screen !== 'celebrate') return;
        const t = setTimeout(() => setScreen('team'), 2500);
        return () => clearTimeout(t);
    }, [screen]);

    const handleStrategy = async (strategy: string) => {
        setIsSaving(true);
        try {
            if (brandId) {
                await fetch(`/api/brands/${brandId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ styleGuide: { preferredStyle: strategy, positioning: strategy } }),
                });
            }
        } catch (_) { }
        setIsSaving(false);
        launchDashboard();
    };

    const launchDashboard = () => {
        try { localStorage.setItem('show_creator_tutorial', '1'); } catch (_) { }
        router.push('/dashboard?creator_tour=1');
    };

    return (
        <div className="min-h-[100dvh] w-full bg-[#0A0A0A] text-white font-sans flex flex-col overflow-x-hidden">
            {/* Progress bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-50 bg-white/5">
                <motion.div
                    className="h-full bg-gradient-to-r from-[#007AFF] to-[#5AC8FA]"
                    animate={{ width: screen === 'celebrate' ? '20%' : screen === 'team' ? (hasStrategy ? '100%' : '60%') : '100%' }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <AnimatePresence mode="wait">

                {/* ── ÉCRAN 1 : CÉLÉBRATION ── */}
                {screen === 'celebrate' && (
                    <motion.div
                        key="celebrate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center"
                    >
                        {/* Icône principale */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                            className="relative mb-10"
                        >
                            <div className="w-32 h-32 rounded-[38px] bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shadow-2xl shadow-blue-500/50">
                                <Crown className="w-16 h-16 text-white" />
                            </div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5, type: 'spring' }}
                                className="absolute -top-3 -right-3 w-12 h-12 bg-[#FFD60A] rounded-2xl flex items-center justify-center shadow-xl"
                            >
                                <Sparkles className="w-6 h-6 text-black" />
                            </motion.div>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xs font-bold uppercase tracking-[0.3em] text-[#007AFF] mb-4"
                        >
                            Plan Créateur Activé
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-5"
                        >
                            Bienvenue dans<br />
                            <span className="bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] bg-clip-text text-transparent">
                                l&apos;équipe, {firstName}.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-white/50 text-base sm:text-lg max-w-md leading-relaxed"
                        >
                            Ton studio complet est prêt. On prépare ton équipe d&apos;agents IA...
                        </motion.p>

                        {/* Dots loader */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.1 }}
                            className="flex gap-2 mt-10"
                        >
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-white/20"
                                    animate={{ opacity: [0.15, 0.8, 0.15], scale: [1, 1.3, 1] }}
                                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                )}

                {/* ── ÉCRAN 2 : ÉQUIPE + CTA ── */}
                {screen === 'team' && (
                    <motion.div
                        key="team"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 flex flex-col items-center min-h-[100dvh] px-4 sm:px-6 pt-16 pb-12"
                    >
                        {/* Header */}
                        <div className="text-center mb-10 max-w-xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#34C759]/30 bg-[#34C759]/10 text-white text-xs font-bold uppercase tracking-widest mb-5"
                            >
                                <Zap className="w-3.5 h-3.5 text-[#34C759]" /> 5 Agents Débloqués
                            </motion.div>
                            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
                                Ton équipe complète<br />
                                <span className="bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] bg-clip-text text-transparent">
                                    est là pour toi.
                                </span>
                            </h2>
                            <p className="text-white/50 text-sm sm:text-base leading-relaxed">
                                Chaque agent est spécialisé sur une phase clé de ton lancement.
                            </p>
                        </div>

                        {/* Agents grid - compact cards */}
                        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                            {AGENTS.map((agent, i) => (
                                <motion.div
                                    key={agent.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 + 0.2 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/8 hover:border-white/15 transition-colors"
                                >
                                    <div className="relative shrink-0">
                                        <Image
                                            src={agent.image}
                                            alt={agent.name}
                                            width={52}
                                            height={52}
                                            className="w-13 h-13 rounded-xl object-cover"
                                        />
                                        <div
                                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center"
                                            style={{ backgroundColor: agent.color }}
                                        >
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-black text-white text-sm">{agent.name}</p>
                                            <span
                                                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                                                style={{ backgroundColor: `${agent.color}25`, color: agent.color }}
                                            >
                                                {agent.role}
                                            </span>
                                        </div>
                                        <p className="text-white/40 text-xs leading-snug">{agent.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Avantages clés (3 pills) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="flex flex-wrap justify-center gap-2 mb-10"
                        >
                            {[
                                { icon: Palette, label: 'Mockups & Design', color: '#a032ff' },
                                { icon: FileText, label: 'Tech Packs PDF', color: '#ff2a5f' },
                                { icon: TrendingUp, label: 'Tendances illimitées', color: '#007AFF' },
                                { icon: ShoppingBag, label: 'Guide Shopify', color: '#ffaa00' },
                                { icon: Sparkles, label: 'Scripts TikTok', color: '#AF52DE' },
                            ].map((feat) => (
                                <div
                                    key={feat.label}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold"
                                    style={{ borderColor: `${feat.color}30`, color: feat.color, backgroundColor: `${feat.color}10` }}
                                >
                                    <feat.icon className="w-3 h-3" />
                                    {feat.label}
                                </div>
                            ))}
                        </motion.div>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="w-full max-w-sm flex flex-col items-center gap-4"
                        >
                            <button
                                onClick={() => hasStrategy ? launchDashboard() : setScreen('strategy')}
                                className="w-full h-14 rounded-2xl bg-white text-black font-bold text-base flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shadow-2xl"
                            >
                                {hasStrategy ? 'Accéder à mon studio' : 'Personnaliser mon atelier'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <p className="text-white/25 text-xs text-center">
                                ✨ Essai 3 jours activé · 29€/mois tarif lancement
                            </p>
                        </motion.div>
                    </motion.div>
                )}

                {/* ── ÉCRAN 3 : STRATÉGIE (si pas encore définie) ── */}
                {screen === 'strategy' && (
                    <motion.div
                        key="strategy"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-1 flex flex-col items-center min-h-[100dvh] px-4 sm:px-6 pt-16 pb-12"
                    >
                        {/* Back */}
                        <button
                            onClick={() => setScreen('team')}
                            className="self-start mb-8 text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
                        >
                            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Retour
                        </button>

                        <div className="text-center mb-8 max-w-lg">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-white text-xs font-bold uppercase tracking-widest mb-5"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Configuration rapide
                            </motion.div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
                                Quel est l&apos;esprit de<br />
                                <span className="bg-gradient-to-r from-[#007AFF] to-[#5AC8FA] bg-clip-text text-transparent">
                                    ton projet ?
                                </span>
                            </h2>
                            <p className="text-white/40 text-sm">
                                Virgil va personnaliser tout ton atelier en fonction de ta réponse.
                            </p>
                        </div>

                        <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                            {STRATEGIES.map((opt, i) => (
                                <motion.button
                                    key={opt.label}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 + 0.15 }}
                                    disabled={isSaving}
                                    onClick={() => handleStrategy(opt.label)}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#007AFF]/50 hover:bg-[#007AFF]/5 transition-all text-left group"
                                >
                                    <div className="text-2xl mb-2">{opt.icon}</div>
                                    <p className="font-bold text-white text-xs leading-snug group-hover:text-[#007AFF] transition-colors">
                                        {opt.label}
                                    </p>
                                    <p className="text-white/35 text-[10px] mt-0.5">{opt.desc}</p>
                                </motion.button>
                            ))}
                        </div>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            onClick={launchDashboard}
                            className="text-white/30 text-xs hover:text-white/50 transition-colors"
                        >
                            Passer cette étape →
                        </motion.button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
