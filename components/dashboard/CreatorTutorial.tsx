'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Crown, Palette, TrendingUp, FileText, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'creator_tutorial_done';

const CREATOR_STEPS = [
    {
        target: 'tour-launch-map',
        title: '🚀 Gérer ma Marque — DÉBLOQUÉ',
        body: 'Toutes les phases de ta Launch Map sont maintenant accessibles. Stratégie, Design, Sourcing, Tech Packs... Virgil et Pharrell t\'attendent.',
        icon: Crown,
        color: 'text-yellow-500',
        bg: 'bg-yellow-50',
        accent: '#FFD60A',
    },
    {
        target: 'tour-trends',
        title: '📈 Radar Tendances Premium',
        body: 'Accès complet aux 100+ tendances validées chaque semaine. Prédictions IA sur 30/60/90 jours et alertes automatiques en temps réel.',
        icon: TrendingUp,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        accent: '#007AFF',
    },
    {
        target: 'tour-spy',
        title: '🔍 Scanner de Tendances IA',
        body: 'Analyse n\'importe quelle photo de vêtement pour mesurer son potentiel viral en quelques secondes. Quotas augmentés avec ton plan Créateur.',
        icon: Sparkles,
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        accent: '#a032ff',
    },
    {
        target: 'tour-launch-map',
        title: '🎨 Studio Design & Tech Packs',
        body: "Pharrell t'assiste pour générer tes mockups, fiches produits et Tech Packs complets. Télécharge-les et envoie-les à ton usine. Entièrement débloqué pour toi.",
        icon: Palette,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        accent: '#ff6b35',
    },
    {
        target: 'tour-launch-map',
        title: '🛍️ Johan — Ton Expert E-shop',
        body: 'Ton nouvel agent optimise ta boutique Shopify, aide à rédiger tes pages produits et analyse tes taux de conversion. Disponible maintenant !',
        icon: ShoppingBag,
        color: 'text-green-500',
        bg: 'bg-green-50',
        accent: '#34C759',
    },
];

const SHOW_KEY = 'show_creator_tutorial';

export function CreatorTutorial({ forceShow = false }: { forceShow?: boolean }) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
        const shouldShow = forceShow ||
            localStorage.getItem(SHOW_KEY) === '1' ||
            localStorage.getItem(STORAGE_KEY) !== '1';

        if (shouldShow) {
            try { localStorage.removeItem(SHOW_KEY); } catch (_) { }
            // Petit délai pour laisser la page se charger
            setTimeout(() => setIsVisible(true), 600);
        }
    }, [forceShow]);

    const currentStep = useMemo(() => CREATOR_STEPS[step], [step]);
    const isLast = step === CREATOR_STEPS.length - 1;

    const updateTargetRect = useCallback(() => {
        if (typeof document === 'undefined' || !currentStep) return;
        const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);
            const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
            if (!isInView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setTargetRect(null);
        }
    }, [currentStep]);

    useEffect(() => {
        if (!mounted || !isVisible) return;
        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect, true);
        return () => {
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect, true);
        };
    }, [mounted, isVisible, step, updateTargetRect]);

    const handleNext = () => {
        if (isLast) { handleComplete(); return; }
        setStep((s) => s + 1);
    };

    const handleComplete = () => {
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) { }
        setIsVisible(false);
        const url = new URL(window.location.href);
        url.searchParams.delete('creator_tour');
        setTimeout(() => router.replace(url.pathname + (url.search || '')), 400);
    };

    if (!mounted || !isVisible || !currentStep) return null;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const showSpotlight = !isMobile && targetRect !== null;

    return (
        <div className={cn(
            "fixed inset-0 z-[110] pointer-events-none",
            isMobile ? "flex items-center justify-center px-4" : "flex flex-col justify-end"
        )}>
            {/* Overlay sombre */}
            <div
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-500"
                style={showSpotlight ? {
                    maskImage: `radial-gradient(ellipse ${targetRect!.width * 0.9}px ${targetRect!.height * 0.9}px at ${targetRect!.left + targetRect!.width / 2}px ${targetRect!.top + targetRect!.height / 2}px, transparent 100%, black 100%)`,
                    WebkitMaskImage: `radial-gradient(ellipse ${targetRect!.width * 0.9}px ${targetRect!.height * 0.9}px at ${targetRect!.left + targetRect!.width / 2}px ${targetRect!.top + targetRect!.height / 2}px, transparent 100%, black 100%)`,
                } : undefined}
                onClick={handleComplete}
            />

            {/* Anneau de focus coloré */}
            <AnimatePresence mode="wait">
                {showSpotlight && (
                    <motion.div
                        key={`ring-${step}`}
                        initial={{ opacity: 0, scale: 1.15 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute rounded-xl border-2 pointer-events-none"
                        style={{
                            left: targetRect!.left - 8,
                            top: targetRect!.top - 8,
                            width: targetRect!.width + 16,
                            height: targetRect!.height + 16,
                            borderColor: currentStep.accent,
                            boxShadow: `0 0 24px ${currentStep.accent}60`,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Carte de tuto */}
            <div className={cn(
                "relative pointer-events-auto flex justify-center",
                isMobile ? "w-full max-w-sm" : "pb-10 px-6"
            )}>
                <motion.div
                    key={`card-${step}`}
                    initial={{ opacity: 0, y: 40, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="w-full max-w-md bg-white rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.22)] overflow-hidden border border-[#E5E5EA]"
                >
                    {/* Badge Créateur */}
                    <div
                        className="flex items-center justify-center gap-2 py-2.5 text-white text-[11px] font-black uppercase tracking-widest"
                        style={{ background: `linear-gradient(90deg, ${currentStep.accent}CC, ${currentStep.accent})` }}
                    >
                        <Crown className="w-3.5 h-3.5" />
                        Fonctionnalité Créateur — {step + 1}/{CREATOR_STEPS.length}
                    </div>

                    {/* Contenu */}
                    <div className="p-5 flex items-start gap-4">
                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', currentStep.bg)}>
                            <currentStep.icon className={cn('w-6 h-6', currentStep.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-[17px] font-black text-[#1D1D1F] leading-tight mb-1.5">{currentStep.title}</h3>
                            <p className="text-[#424245] leading-relaxed text-[14px]">{currentStep.body}</p>
                        </div>
                        <button
                            onClick={handleComplete}
                            className="p-1.5 hover:bg-[#F2F2F7] rounded-full transition-colors text-[#86868B] shrink-0"
                            aria-label="Fermer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3.5 bg-[#F8F8FA] border-t border-[#E5E5EA] flex items-center justify-between">
                        {/* Progress dots */}
                        <div className="flex gap-1.5">
                            {CREATOR_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className="h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                        width: i === step ? 20 : 6,
                                        backgroundColor: i <= step ? currentStep.accent : '#E5E5EA',
                                    }}
                                />
                            ))}
                        </div>

                        <Button
                            onClick={handleNext}
                            className="rounded-full px-5 h-9 text-sm font-bold gap-1.5 text-white border-none shadow-md active:scale-[0.98] transition-all"
                            style={{ backgroundColor: currentStep.accent }}
                        >
                            {isLast ? '🎉 C\'est parti !' : 'Suivant'}
                            {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
