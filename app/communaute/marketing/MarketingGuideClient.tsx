'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, ChevronRight, Zap } from 'lucide-react';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';

interface GuideSection {
    heading: string;
    body: string;
    highlight: string;
}

interface GuideChapter {
    id: string;
    number: string;
    title: string;
    emoji: string;
    intro: string;
    sections: GuideSection[];
    key_takeaway: string;
}

interface GuideData {
    guide_title: string;
    guide_subtitle: string;
    intro: string;
    chapters: GuideChapter[];
}

function getMarketingUnlockedFromStorage(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const current = JSON.parse(localStorage.getItem('unlocked_resources_v2') || '[]');
        if (current.includes('marketing')) return true;

        const oldItems = JSON.parse(localStorage.getItem('unlocked_resources') || '[]');
        if (!oldItems.includes('marketing')) return false;

        localStorage.setItem('unlocked_resources_v2', JSON.stringify([...current, 'marketing']));
        return true;
    } catch {
        return false;
    }
}

export function MarketingGuideClient({ guideData }: { guideData: GuideData }) {
    const [isUnlocked] = useState(getMarketingUnlockedFromStorage);
    const [activeChapter, setActiveChapter] = useState(0);
    const [readChapters, setReadChapters] = useState<number[]>([0]);

    const goToChapter = (idx: number) => {
        setActiveChapter(idx);
        setReadChapters(prev => prev.includes(idx) ? prev : [...prev, idx]);
        // Scroller vers le panneau de contenu, pas vers le debut de la page
        const panel = document.getElementById('guide-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (!isUnlocked) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-8">
                    <Lock className="w-10 h-10 text-[#86868B]" />
                </div>
                <h1 className="text-4xl font-black mb-4 tracking-tight">ACCÈS VERROUILLÉ</h1>
                <p className="text-[#86868B] mb-8 max-w-md mx-auto text-lg font-medium">
                    Tu dois débloquer cette ressource avec ton code privé depuis le hub de la communauté.
                </p>
                <Link href="/communaute">
                    <Button className="bg-[#1D1D1F] hover:bg-black text-white px-10 py-7 rounded-2xl font-black uppercase tracking-widest text-[11px]">
                        Retour au Hub Communauté
                    </Button>
                </Link>
            </div>
        );
    }

    const chapter = guideData.chapters[activeChapter];

    // Formater le titre avec gradient sur la partie après ":"
    const titleParts = guideData.guide_title.split(':');

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-[#d80056]/20 pb-24">
            <AnimatedHeader />

            {/* ── HERO ── */}
            <div className="w-full bg-[#1D1D1F] pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#d80056]/15 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[#d80056]/8 blur-[180px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <Link
                        href="/communaute"
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors mb-12 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour aux ressources
                    </Link>

                    <div className="flex items-center gap-3 mb-8">
                        <span className="bg-[#d80056] text-white text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1.5 rounded-full">
                            Ressource Exclusive
                        </span>
                        <span className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em]">5 Chapitres</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] text-white uppercase mb-6">
                        {titleParts[0]}
                        {titleParts[1] && (
                            <>:<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d80056] to-[#ff6e6e]">{titleParts[1]}</span></>
                        )}
                    </h1>
                    <p className="text-white/40 text-xl sm:text-2xl font-medium max-w-3xl leading-relaxed">
                        {guideData.guide_subtitle}
                    </p>

                    {/* INTRO */}
                    <div className="mt-12 max-w-3xl border-l-2 border-[#d80056]/50 pl-8">
                        <p className="text-white/60 text-base sm:text-lg font-medium leading-relaxed">
                            {guideData.intro}
                        </p>
                    </div>

                    {/* CHAPTER PILLS */}
                    <div className="flex flex-wrap gap-3 mt-14">
                        {guideData.chapters.map((ch, idx) => (
                            <button
                                key={idx}
                                onClick={() => goToChapter(idx)}
                                className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${activeChapter === idx
                                    ? 'bg-[#d80056] text-white shadow-xl shadow-pink-500/20'
                                    : 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white'
                                    }`}
                            >
                                <span>{ch.emoji}</span>
                                <span className="hidden sm:inline">{ch.number}. {ch.title}</span>
                                <span className="sm:hidden">{ch.number}</span>
                                {readChapters.includes(idx) && idx !== activeChapter && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* SIDEBAR */}
                    <div className="lg:w-72 shrink-0">
                        <div className="sticky top-24 space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#86868B] mb-5 px-4">Au programme</p>
                            {guideData.chapters.map((ch, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => goToChapter(idx)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 ${activeChapter === idx
                                        ? 'bg-white shadow-xl shadow-black/5 border border-black/5'
                                        : 'hover:bg-black/5 text-[#86868B]'
                                        }`}
                                >
                                    <span className="text-2xl shrink-0">{ch.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${activeChapter === idx ? 'text-[#d80056]' : 'text-[#C7C7CC]'}`}>
                                            Chapitre {ch.number}
                                        </p>
                                        <p className={`text-sm font-black leading-tight ${activeChapter === idx ? 'text-[#1D1D1F]' : ''}`}>
                                            {ch.title}
                                        </p>
                                    </div>
                                    {readChapters.includes(idx) && (
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CONTENT PANEL */}
                    <div id="guide-panel" className="flex-1 min-w-0 scroll-mt-24">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeChapter}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.45 }}
                                className="space-y-8"
                            >
                                {/* CHAPTER HEADER */}
                                <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-xl shadow-black/5 border border-black/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 text-[180px] font-black text-[#F5F5F7] leading-none pointer-events-none select-none translate-x-4 -translate-y-8 z-0">
                                        {chapter.number}
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-start gap-5 mb-8">
                                            <span className="text-5xl shrink-0 mt-1">{chapter.emoji}</span>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d80056] mb-2">
                                                    Chapitre {chapter.number}
                                                </p>
                                                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1D1D1F]">
                                                    {chapter.title}
                                                </h2>
                                            </div>
                                        </div>
                                        <p className="text-lg sm:text-xl text-[#86868B] font-medium leading-relaxed">
                                            {chapter.intro}
                                        </p>
                                    </div>
                                </div>

                                {/* SECTIONS avec CTA intercalé au milieu */}
                                {chapter.sections.map((section, sIdx) => (
                                    <>
                                        <motion.div
                                            key={sIdx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + sIdx * 0.12 }}
                                            className="bg-white rounded-[32px] p-8 sm:p-12 shadow-xl shadow-black/5 border border-black/5"
                                        >
                                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F] mb-6">
                                                {section.heading}
                                            </h3>
                                            <p className="text-base sm:text-lg text-[#86868B] font-medium leading-relaxed mb-10 whitespace-pre-line">
                                                {section.body}
                                            </p>
                                            {/* HIGHLIGHT */}
                                            <div className="border-l-4 border-[#d80056] pl-6 py-1">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d80056] mb-2">À retenir</p>
                                                <p className="text-[#1D1D1F] font-bold text-base sm:text-lg leading-relaxed">
                                                    "{section.highlight}"
                                                </p>
                                            </div>
                                        </motion.div>

                                        {/* CTA natif apres la section du milieu */}
                                        {sIdx === Math.floor(chapter.sections.length / 2) && (
                                            <motion.div
                                                key={`cta-${sIdx}`}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25 + sIdx * 0.12 }}
                                                className="bg-[#1D1D1F] rounded-[28px] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group"
                                            >
                                                <div className="absolute top-0 right-0 w-48 h-48 bg-[#d80056]/20 blur-[60px] pointer-events-none group-hover:bg-[#d80056]/30 transition-colors" />
                                                <div className="relative z-10">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d80056] mb-2">OUTFITY Studio</p>
                                                    <p className="text-white font-bold text-base sm:text-lg">
                                                        {activeChapter === 0 ? 'Ton positionnement est clair ? Passe à la conception du produit.' :
                                                            activeChapter === 1 ? 'Tu manques de temps pour créer du contenu chaque jour ?' :
                                                                activeChapter === 2 ? 'Ta communauté est prête. Il te faut maintenant les bons outils de lancement.' :
                                                                    activeChapter === 3 ? 'Prêt pour ton premier drop ? Ne galere pas sur les détails techniques.' :
                                                                        'Fidéliser demande de l’organisation. OUTFITY centralise tout.'}
                                                    </p>
                                                </div>
                                                <Link href="/auth/choose-plan" className="shrink-0 relative z-10 w-full sm:w-auto">
                                                    <Button className="w-full bg-[#d80056] hover:bg-[#ff006e] text-white border-none rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-6 transition-all active:scale-95 shadow-lg shadow-pink-500/20">
                                                        Essai gratuit 3 jours →
                                                    </Button>
                                                </Link>
                                            </motion.div>
                                        )}
                                    </>
                                ))}

                                {/* KEY TAKEAWAY */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-[#1D1D1F] rounded-[32px] p-8 sm:p-12 text-white relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#d80056]/20 blur-[80px] pointer-events-none" />
                                    <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start">
                                        <Zap className="w-10 h-10 text-[#d80056] shrink-0 mt-1" />
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#d80056] mb-3">Action de la semaine</p>
                                            <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                                                {chapter.key_takeaway}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* NAV */}
                                <div className="flex items-center justify-between gap-4 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => goToChapter(Math.max(0, activeChapter - 1))}
                                        disabled={activeChapter === 0}
                                        className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest border-black/10 hover:bg-black hover:text-white transition-all disabled:opacity-20"
                                    >
                                        ← Précédent
                                    </Button>

                                    {activeChapter < guideData.chapters.length - 1 ? (
                                        <Button
                                            onClick={() => goToChapter(activeChapter + 1)}
                                            className="bg-[#1D1D1F] hover:bg-[#d80056] text-white rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest transition-all gap-2 flex items-center shadow-lg"
                                        >
                                            Chapitre suivant <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    ) : (
                                        <Link href="/auth/choose-plan">
                                            <Button className="bg-[#d80056] hover:bg-[#ff006e] text-white rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-pink-500/20">
                                                Démarrer mon essai gratuit →
                                            </Button>
                                        </Link>
                                    )}
                                </div>

                                {/* FINAL CTA */}
                                {activeChapter === guideData.chapters.length - 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="bg-gradient-to-br from-[#d80056] to-[#ff006e] rounded-[40px] p-12 sm:p-16 text-white text-center relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                                        <div className="relative z-10 max-w-2xl mx-auto">
                                            <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight mb-6">
                                                La théorie, c'est terminé.
                                            </h2>
                                            <p className="text-white/80 text-xl font-medium leading-relaxed mb-10">
                                                Tu as maintenant tous les fondamentaux. Maintenant, il te faut les bons outils pour exécuter 10x plus vite sans te perdre dans la technique.
                                            </p>
                                            <Link href="/auth/choose-plan">
                                                <Button className="bg-white text-[#d80056] hover:bg-white/90 h-16 px-12 rounded-full font-black uppercase tracking-widest text-sm shadow-2xl shadow-black/20 active:scale-95 transition-all">
                                                    Démarrer OUTFITY → 3 jours gratuits
                                                </Button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
