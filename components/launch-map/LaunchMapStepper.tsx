'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Loader2,
  ChevronRight,
  BarChart3,
  LayoutDashboard,
  ChevronDown,
  Lock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { isFreePlan } from '@/lib/plan-utils';
import Link from 'next/link';
import { Phase0Identity } from './Phase0Identity';
import { Phase1Strategy } from './Phase1Strategy';
import { PhaseMockupCreation } from './PhaseMockupCreation';

import { PhaseTechPack } from './PhaseTechPack';
import { Phase3Sourcing } from './Phase3Sourcing';
import { Phase6Shopify } from './Phase6Shopify';
import { PhaseScanner } from './PhaseScanner';
import { PhaseCommunication } from './PhaseCommunication';
import { PhaseWaitlist } from './PhaseWaitlist';
import { PhaseCompletionCelebration } from './PhaseCompletionCelebration';
import { LAUNCH_MAP_PHASES } from '@/lib/launch-map-constants';

export { LAUNCH_MAP_PHASES };

export interface LaunchMapData {
  id: string;
  phase1: boolean;
  phase2: boolean;
  phase3: boolean;
  phase4: boolean;
  phase5: boolean;
  phase6?: boolean;
  phase7?: boolean;
  phase8?: boolean;
  shopifyShopDomain?: string | null;
  phase1Data: Record<string, unknown> | null;
  baseMockupByProductType?: Record<string, string> | null;
  phaseSummaries?: Record<string, string> | null;
  siteCreationTodo?: unknown;
}

export interface BrandIdentity {
  id: string;
  name: string;
  logo?: string | null;
  logoVariations?: unknown;
  colorPalette?: { primary?: string; secondary?: string; accent?: string } | null;
  typography?: { heading?: string; body?: string } | null;
  styleGuide?: {
    story?: string;
    targetAudience?: string;
    positioning?: string;
    preferredStyle?: string;
    mainProduct?: string;
    stage?: string;
    moodboard?: string[];
    tagline?: string;
    description?: string;
    productType?: string;
    productWeight?: string;
    noLogo?: boolean;
    mainVibe?: string;
  } | null;
  socialHandles?: unknown;
  domain?: string | null;
  templateBrandSlug?: string | null;
}

interface LaunchMapStepperProps {
  brandId: string;
  launchMap: LaunchMapData | null;
  brand: BrandIdentity | null;
  hasIdentity: boolean;
  focusedPhase?: number | null;
  userPlan?: string;
  strategyText?: string | null;
  designCount?: number;
  quoteCount?: number;
  onPhaseComplete?: (phaseId: number) => void;
  onExitFocus?: () => void;
}

export function LaunchMapStepper({
  brandId,
  launchMap,
  brand,
  hasIdentity,
  focusedPhase = null,
  userPlan = 'free',
  strategyText,
  designCount = 0,
  quoteCount = 0,
  onPhaseComplete,
  onExitFocus,
}: LaunchMapStepperProps) {
  const { toast } = useToast();

  const initialPhase = useMemo(() => {
    if (typeof focusedPhase === 'number') {
      return focusedPhase;
    }
    return !hasIdentity ? 0 :
      !launchMap?.phase1 ? 1 :
        !launchMap?.phase2 ? 2 :  // Mockup
          !launchMap?.phase3 ? 3 :  // Scanner
            !launchMap?.phase4 ? 4 :  // Communication
              !launchMap?.phase5 ? 5 :  // Waitlist
                !launchMap?.phase6 ? 6 :  // Tech Pack
                  !launchMap?.phase7 ? 7 :  // Sourcing
                    8;  // Création du site
  }, [focusedPhase, hasIdentity, launchMap]);

  const [currentPhase, setCurrentPhase] = useState(initialPhase);
  const [localStrategyText, setLocalStrategyText] = useState<string | null>(strategyText ?? null);

  useEffect(() => {
    if (strategyText) setLocalStrategyText(strategyText);
  }, [strategyText]);

  const phaseToRender = useMemo(() => {
    if (typeof focusedPhase === 'number') {
      return focusedPhase;
    }
    return currentPhase;
  }, [focusedPhase, currentPhase]);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState({
    phase0: hasIdentity,
    phase1: launchMap?.phase1 ?? false,
    phase2: launchMap?.phase2 ?? false,
    phase3: launchMap?.phase3 ?? false,
    phase4: launchMap?.phase4 ?? false,
    phase5: launchMap?.phase5 ?? false,
    phase6: launchMap?.phase6 ?? false,
    phase7: launchMap?.phase7 ?? false,
    phase8: launchMap?.phase8 ?? false,
  });

  const [summaries, setSummaries] = useState<Record<string, string>>(() => {
    const s = launchMap?.phaseSummaries;
    if (s && typeof s === 'object' && !Array.isArray(s)) return { ...s };
    return {};
  });
  const [savingSummary, setSavingSummary] = useState<string | null>(null);
  const phaseContentRef = useRef<HTMLDivElement>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [celebration, setCelebration] = useState<{ phaseId: number; phaseName: string; nextId?: number } | null>(null);

  useEffect(() => {
    const s = launchMap?.phaseSummaries;
    if (s && typeof s === 'object' && !Array.isArray(s)) {
      setSummaries({ ...s });
    }
  }, [launchMap?.phaseSummaries]);

  const saveSummaryLocally = useCallback(
    async (phaseId: number) => {
      const key = String(phaseId);
      setSavingSummary(key);
      try {
        const res = await fetch('/api/launch-map/summaries', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            phaseSummaries: { ...summaries, [key]: summaries[key] ?? '' },
            completedPhase: phaseId
          }),
        });
        if (!res.ok) throw new Error('Erreur sauvegarde');
      } catch {
        // silent
      } finally {
        setSavingSummary(null);
      }
    },
    [brandId, summaries]
  );

  useEffect(() => {
    if (typeof focusedPhase === 'number') {
      setCurrentPhase(focusedPhase);
      return;
    }
    const nextPhase = !progress.phase0 ? 0 :
      !progress.phase1 ? 1 :
        !progress.phase2 ? 2 :  // Mockup
          !progress.phase3 ? 3 :  // Scanner
            !progress.phase4 ? 4 :  // Communication
              !progress.phase5 ? 5 :  // Waitlist
                !progress.phase6 ? 6 :  // Tech Pack
                  !progress.phase7 ? 7 :  // Sourcing
                    8;  // Création du site
    setCurrentPhase(nextPhase);
  }, [progress, focusedPhase]);

  const handlePhaseComplete = (phase: number) => {
    setProgress((prev) => ({ ...prev, [`phase${phase}`]: true }));

    // Show celebration overlay
    const phaseDef = LAUNCH_MAP_PHASES.find(p => p.id === phase);
    const nextDef = LAUNCH_MAP_PHASES.find(p => p.id === phase + 1);
    setCelebration({ phaseId: phase, phaseName: phaseDef?.title ?? `Phase ${phase}`, nextId: nextDef?.id });

    setTimeout(() => saveSummaryLocally(phase), 500);
  };

  const handleCelebrationDone = () => {
    // Capture phase info BEFORE resolving state to null
    const completedPhaseId = celebration?.phaseId;
    setCelebration(null);

    if (typeof completedPhaseId !== 'number') return;

    // Trigger completion in parent/store
    onPhaseComplete?.(completedPhaseId);

    // If there is a next phase, transition to it
    if (completedPhaseId < 8) {
      const nextPhase = completedPhaseId + 1;
      setIsTransitioning(true);
      setTimeout(() => {
        // Update both local and focus if necessary
        setCurrentPhase(nextPhase);
        // If the user was in focus mode, we might want to update the URL or parent state
        // via onSelectPhase if available, but for now we update currentPhase locally.
        setIsTransitioning(false);
        phaseContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } else {
      // Completed the whole map!
      onExitFocus?.();
    }
  };

  const completedPhases = Object.values(progress).filter(Boolean).length;
  const progressPercentage = (completedPhases / LAUNCH_MAP_PHASES.length) * 100;

  const onlyPhaseContent = typeof focusedPhase === 'number';
  const isAtelierPhase = [0, 1, 2, 3, 4, 5, 6, 7, 8].includes(currentPhase);
  const isFullPage = onlyPhaseContent || isAtelierPhase;

  return (
    <div className={cn("w-full transition-all duration-500", !isFullPage ? "space-y-4 sm:space-y-6 max-w-4xl mx-auto px-1 sm:px-0" : "flex-1 flex flex-col min-h-0")}>
      {!isFullPage && (
        <Card className="border border-black/[0.06] shadow-apple overflow-hidden bg-white rounded-[24px] sm:rounded-[28px]">
          <CardHeader className="bg-gradient-to-b from-[#F5F5F7]/50 to-white border-b border-black/[0.06] py-4 px-4 sm:py-5 sm:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[16px] bg-[#007AFF]/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-[#007AFF]" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-[#1D1D1F]">Votre Progression</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-[#86868B]">Étape {currentPhase + 1} sur {LAUNCH_MAP_PHASES.length}</CardDescription>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-[11px] text-[#86868B] font-bold uppercase tracking-widest bg-[#F5F5F7] px-3 py-1.5 rounded-full">
                  {completedPhases}/{LAUNCH_MAP_PHASES.length} Phases
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full bg-black/5 h-1.5 sm:h-2 overflow-hidden">
              <div
                className="bg-[#007AFF] h-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div ref={phaseContentRef} className={cn("w-full", isFullPage && "flex-1 flex flex-col relative min-h-0")}>
        {!isFullPage && (
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8 bg-white border border-black/[0.06] rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-apple-sm">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#007AFF] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <span className="text-white font-bold text-xs sm:text-sm">{currentPhase + 1}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] truncate">
              {LAUNCH_MAP_PHASES[currentPhase]?.title}
            </h2>
            <div className="ml-auto h-px flex-1 bg-black/5 max-w-[150px] hidden sm:block" />
            <div className="flex gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1">
              {LAUNCH_MAP_PHASES.map((p: { id: number; title: string; subtitle: string }, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPhase(idx)}
                  disabled={idx > (hasIdentity ? (completedPhases) : 0)}
                  className={cn(
                    "w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-all duration-500 shrink-0",
                    currentPhase === idx ? "bg-[#007AFF] scale-125 shadow-md shadow-blue-500/10" :
                      idx < completedPhases ? "bg-[#007AFF]/40 hover:bg-[#007AFF]/60 cursor-pointer" : "bg-black/10 cursor-not-allowed"
                  )}
                  title={`Phase ${idx + 1}: ${LAUNCH_MAP_PHASES[idx]?.title}`}
                />
              ))}
            </div>
          </div>
        )}

        <Card className={cn(
          "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden",
          isTransitioning ? "opacity-0 translate-y-8 scale-[0.98] blur-[2px]" : "opacity-100",
          isFullPage ? "border-none shadow-none bg-transparent rounded-none flex-1 flex flex-col min-h-0" : "border border-black/[0.06] shadow-apple bg-white rounded-[32px] overflow-hidden"
        )}>
          {!isTransitioning && phaseToRender === 0 && (
            <Phase0Identity
              brandId={brandId}
              brandName={brand?.name ?? ''}
              onComplete={() => handlePhaseComplete(0)}
            />
          )}
          {!isTransitioning && phaseToRender === 1 && (
            <div className="flex-1 flex flex-col min-h-0">
              <Phase1Strategy
                brandId={brandId}
                brand={brand}
                brandName={brand?.name ?? ''}
                onComplete={() => handlePhaseComplete(1)}
                userPlan={userPlan}
                strategyText={localStrategyText}
                canComplete={Boolean(localStrategyText && localStrategyText.length > 50)}
                onStrategyReady={(text) => setLocalStrategyText(text)}
              />
            </div>
          )}
          {!isTransitioning && phaseToRender === 2 && (
            <PhaseMockupCreation
              brandId={brandId}
              brand={brand}
              onComplete={() => handlePhaseComplete(2)}
              userPlan={userPlan}
              canComplete={designCount > 0}
            />
          )}
          {!isTransitioning && phaseToRender === 3 && (
            <PhaseScanner
              brandId={brandId}
              brand={brand}
              onComplete={() => handlePhaseComplete(3)}
              userPlan={userPlan}
            />
          )}
          {!isTransitioning && phaseToRender === 4 && (
            <PhaseCommunication
              brandId={brandId}
              brand={brand}
              onComplete={() => handlePhaseComplete(4)}
              userPlan={userPlan}
            />
          )}
          {!isTransitioning && phaseToRender === 5 && (
            <PhaseWaitlist
              brandId={brandId}
              brand={brand}
              onComplete={() => handlePhaseComplete(5)}
              userPlan={userPlan}
            />
          )}
          {!isTransitioning && phaseToRender === 6 && (
            <Suspense fallback={
              <div className="flex-1 flex flex-col gap-4 p-6 sm:p-8">
                <div className="h-8 w-48 rounded-2xl bg-[#F5F5F7] animate-pulse" />
                <div className="h-4 w-72 rounded-xl bg-[#F5F5F7] animate-pulse" />
                <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
                  <div className="rounded-2xl bg-[#F5F5F7] animate-pulse h-full min-h-[300px]" />
                  <div className="rounded-2xl bg-[#F5F5F7] animate-pulse h-full min-h-[300px]" />
                </div>
              </div>
            }>
              <PhaseTechPack
                brandId={brandId}
                brand={brand}
                onComplete={() => handlePhaseComplete(6)}
              />
            </Suspense>
          )}
          {!isTransitioning && phaseToRender === 7 && (
            <Phase3Sourcing
              brandId={brandId}
              brand={brand}
              onComplete={() => handlePhaseComplete(7)}
              userPlan={userPlan}
              canComplete={quoteCount > 0}
            />
          )}
          {!isTransitioning && phaseToRender === 8 && (
            <Phase6Shopify
              brandId={brandId}
              brand={brand ? { id: brand.id, name: brand.name } : null}
              shopifyShopDomain={launchMap?.shopifyShopDomain ?? null}
              siteCreationTodo={(launchMap?.siteCreationTodo as { steps: { id: string; label: string; done: boolean }[] } | null | undefined) ?? null}
              onComplete={() => handlePhaseComplete(8)}
              userPlan={userPlan}
            />
          )}
        </Card>
      </div>

      {/* Phase completion celebration */}
      {celebration && (
        <PhaseCompletionCelebration
          phaseId={celebration.phaseId}
          phaseName={celebration.phaseName}
          nextPhaseName={celebration.nextId !== undefined ? LAUNCH_MAP_PHASES.find(p => p.id === celebration.nextId)?.title : undefined}
          nextPhaseHref={celebration.nextId !== undefined ? (
            celebration.nextId === 6 ? '/launch-map/tech-packs' :
              celebration.nextId === 7 ? '/launch-map/sourcing' :
                `/launch-map/phase/${celebration.nextId}`
          ) : undefined}
          onContinue={handleCelebrationDone}
        />
      )}
    </div>
  );
}
