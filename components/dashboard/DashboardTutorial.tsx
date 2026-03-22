'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Compass, Sparkles, Zap, TrendingUp, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'dashboard_tutorial_done';

const TUTORIAL_STEPS = [
  {
    target: 'tour-dashboard',
    title: 'Tableau de Bord',
    body: 'Votre centre de commande central. Suivez l\'activité de votre marque et gérez vos priorités au quotidien.',
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50'
  },
  {
    target: 'tour-journey',
    title: 'Votre Progression',
    body: 'Suivez en temps réel l\'avancée de votre marque. Complétez chaque phase pour débloquer de nouvelles fonctionnalités.',
    icon: Rocket,
    color: 'text-green-500',
    bg: 'bg-green-50'
  },
  {
    target: 'tour-trends',
    title: 'Radar de Tendances',
    body: 'Captez les signaux faibles et les micro-tendances avant tout le monde pour garder une longueur d\'avance sur le marché.',
    icon: TrendingUp,
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  {
    target: 'tour-spy',
    title: 'Scanner IVS IA',
    body: 'Importez n\'importe quel visuel. Notre IA analyse instantanément son potentiel de viralité et sa compatibilité avec votre audience.',
    icon: Sparkles,
    color: 'text-purple-500',
    bg: 'bg-purple-50'
  },
  {
    target: 'tour-launch-map',
    title: 'Navigation Pro',
    body: 'Accédez à vos outils experts : Sourcing, Design Studio, et Stratégie Marketing personnalisée.',
    icon: Compass,
    color: 'text-orange-500',
    bg: 'bg-orange-50'
  },
];

function getTutorialDone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

const SHOW_NEXT_KEY = 'show_tutorial_next';

function shouldShowNow(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SHOW_NEXT_KEY) === '1';
  } catch {
    return false;
  }
}

export function DashboardTutorial({ forceShow = false }: { forceShow?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const pendingShow = shouldShowNow();
    if (!(forceShow || pendingShow || !getTutorialDone())) return;

    try { localStorage.removeItem(SHOW_NEXT_KEY); } catch (_) { }
    const timer = window.setTimeout(() => setIsVisible(true), 0);
    return () => window.clearTimeout(timer);
  }, [forceShow]);

  const currentStep = useMemo(() => TUTORIAL_STEPS[step], [step]);
  const isLast = step === TUTORIAL_STEPS.length - 1;

  const updateTargetRect = useCallback(() => {
    if (typeof document === 'undefined' || !currentStep) return;
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // On évite le scroll auto agressif si l'élément est déjà visible
      const isVisibleInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!isVisibleInViewport) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isVisible) return;
    const frame = window.requestAnimationFrame(updateTargetRect);
    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isVisible, step, updateTargetRect]);

  const handleNext = () => {
    if (isLast) {
      handleComplete();
      return;
    }
    setStep((s) => s + 1);
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (_) { }
    setIsVisible(false);
    // Retirer ?tutorial=1 de l'URL proprement
    const url = new URL(window.location.href);
    url.searchParams.delete('tutorial');
    setTimeout(() => router.replace(url.pathname + (url.search || '')), 500);
  };

  if (!isVisible || !currentStep) return null;

  // On mobile/tablet (<1024px) sidebar is hidden — no target elements visible, so we show modal centered
  const isMobileTablet = typeof window !== 'undefined' && window.innerWidth < 1024;
  const showSpotlight = !isMobileTablet && targetRect !== null;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] pointer-events-none",
      isMobileTablet ? "flex items-center justify-center px-4" : "flex flex-col justify-end"
    )}>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-500"
        style={showSpotlight ? {
          maskImage: `radial-gradient(circle ${Math.max(targetRect!.width, targetRect!.height) * 0.8}px at ${targetRect!.left + targetRect!.width / 2}px ${targetRect!.top + targetRect!.height / 2}px, transparent 100%, black 100%)`,
          WebkitMaskImage: `radial-gradient(circle ${Math.max(targetRect!.width, targetRect!.height) * 0.8}px at ${targetRect!.left + targetRect!.width / 2}px ${targetRect!.top + targetRect!.height / 2}px, transparent 100%, black 100%)`,
        } : undefined}
        onClick={handleComplete}
      />

      {/* Anneau de focus (desktop uniquement) */}
      <AnimatePresence mode="wait">
        {showSpotlight && (
          <motion.div
            key={`ring-${step}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-xl sm:rounded-2xl border-2 border-[#007AFF] shadow-[0_0_15px_rgba(0,122,255,0.4)] sm:shadow-[0_0_20px_rgba(0,122,255,0.4)] pointer-events-none"
            style={{
              left: targetRect!.left - 6,
              top: targetRect!.top - 6,
              width: targetRect!.width + 12,
              height: targetRect!.height + 12,
            }}
          />
        )}
      </AnimatePresence>

      {/* Tooltip Card */}
      <div className={cn(
        "relative pointer-events-auto flex justify-center",
        isMobileTablet ? "w-full max-w-sm" : "pb-8 sm:pb-12 px-4 sm:px-6"
      )}>
        <motion.div
          key={`card-${step}`}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="w-full max-w-[calc(100vw-32px)] sm:max-w-md bg-white rounded-[24px] sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden border border-[#E5E5EA]"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex gap-3 sm:gap-4">
              <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-inner", currentStep.bg)}>
                <currentStep.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", currentStep.color)} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 overflow-hidden">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] text-[#86868B] truncate">Visite Guidée</span>
                  <div className="w-1 h-1 rounded-full bg-[#E5E5EA] shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#007AFF] shrink-0">{step + 1}/{TUTORIAL_STEPS.length}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#1D1D1F] leading-tight truncate">{currentStep.title}</h3>
              </div>
            </div>
            <button
              onClick={handleComplete}
              className="p-1.5 sm:p-2 hover:bg-[#F2F2F7] rounded-full transition-colors text-[#86868B] hover:text-[#1D1D1F]"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <p className="text-[#424245] leading-relaxed text-[13px] sm:text-[15px]">
              {currentStep.body}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#F2F2F7]/50 border-t border-[#E5E5EA] flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex gap-1 sm:gap-1.5">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 sm:h-1.5 rounded-full transition-all duration-300",
                    i === step ? "w-3 sm:w-4 bg-[#007AFF]" : "w-1 sm:w-1.5 bg-[#E5E5EA]"
                  )}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="bg-[#007AFF] hover:bg-[#0056CC] text-white rounded-full px-4 sm:px-6 h-9 sm:h-10 text-sm sm:text-base font-semibold gap-1.5 sm:gap-2 border-none shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              {isLast ? 'Terminer' : 'Suivant'}
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function shouldShowTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}
