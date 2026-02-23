'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Copy,
  Pencil,
  X,
  ArrowLeft,
  Palette,
  Target,
  PenTool,
  FileText,
  Truck,
  Store,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StrategyPresentationView } from './StrategyPresentationView';
import { LaunchMapStepper, type BrandIdentity } from './LaunchMapStepper';
import { LAUNCH_MAP_PHASES } from '@/lib/launch-map-constants';
import type { LaunchMapData } from './LaunchMapStepper';
import { PhaseRecap, PHASE_PRESENTATIONS, PHASE_ICONS, type SupplierRecap } from './PhaseShared';

export interface PhasePageViewProps {
  phaseId: number;
  brand: { id: string; name: string; logo?: string | null };
  launchMap: LaunchMapData | null;
  brandFull: BrandIdentity;
  hasIdentity: boolean;
  designCount: number;
  quoteCount: number;
  ugcCount: number;
  suppliers?: SupplierRecap[];
  userPlan?: string;
}

export function PhasePageView({
  phaseId,
  brand,
  launchMap,
  brandFull,
  hasIdentity,
  designCount,
  quoteCount,
  ugcCount,
  suppliers = [],
  userPlan = 'free',
}: PhasePageViewProps) {
  const [isShowingDetail, setShowingDetail] = useState(false);
  const [strategyText, setStrategyText] = useState<string | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const detailSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phaseId === 1 && brand.id) {
      setStrategyLoading(true);
      fetch(`/api/brands/strategy/history?brandId=${encodeURIComponent(brand.id)}`)
        .then((r) => r.json())
        .then((data) => {
          const latest = data?.strategies?.[0];
          setStrategyText(latest?.strategyText ?? null);
        })
        .finally(() => setStrategyLoading(false));
    }
  }, [phaseId, brand.id]);

  const phase = LAUNCH_MAP_PHASES.find(p => p.id === phaseId);
  const presentation = PHASE_PRESENTATIONS[phaseId];
  const PhaseIcon = PHASE_ICONS[phaseId] || Palette;

  const progress: Record<string, boolean> = {
    phase0: hasIdentity,
    phase1: launchMap?.phase1 ?? false,
    phase3: launchMap?.phase3 ?? false,
    phase4: launchMap?.phase4 ?? false,
    phase5: launchMap?.phase5 ?? false,
    phase7: launchMap?.phase7 ?? false,
  };

  useEffect(() => {
    if (isShowingDetail && detailSectionRef.current) {
      detailSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isShowingDetail]);

  const isLocked = userPlan === 'free' && ![0, 1].includes(phaseId);

  if (!phase || !presentation) {
    return (
      <div className="p-4">
        <Link href="/launch-map">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour à la vue d&apos;ensemble
          </Button>
        </Link>
        <p className="text-muted-foreground mt-4">Phase introuvable.</p>
      </div>
    );
  }

  // Colors for icons to match overview
  const PHASE_COLOR: Record<number, { bg: string; text: string }> = {
    0: { bg: 'bg-violet-50', text: 'text-violet-500' },
    1: { bg: 'bg-blue-50', text: 'text-blue-500' },
    2: { bg: 'bg-orange-50', text: 'text-orange-500' },
    3: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
    4: { bg: 'bg-amber-50', text: 'text-amber-500' },
    5: { bg: 'bg-[#95BF47]/10', text: 'text-[#5E8E3E]' },
  };

  const currentColor = PHASE_COLOR[phaseId] || { bg: 'bg-[#007AFF]/10', text: 'text-[#007AFF]' };

  // Mode messagerie/immersif full width (Atelier phases & Shopify)
  if ([0, 1, 2, 5].includes(phaseId) && !isLocked) {
    const isCompleted = (phaseId === 0 && hasIdentity) || (phaseId === 1 && strategyText) || (phaseId === 2 && launchMap?.phase2) || (phaseId === 5 && launchMap?.phase5);

    // Si la phase est complétée et qu'on n'est pas en mode édition, on affiche le RECAP
    if (isCompleted && !isEditing) {
      if (phaseId === 1 && strategyText) {
        return (
          <div className="flex flex-col w-full min-h-[calc(100dvh-64px)] bg-[#F5F5F7]">
            <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-black/5 sticky top-0 z-[60]">
              <Link href="/launch-map" className="inline-flex items-center gap-2 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors rounded-full px-3 py-1.5 hover:bg-[#F5F5F7]">
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la vue d'ensemble</span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="rounded-full border-black/10 hover:bg-black/5 gap-2"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier la stratégie
              </Button>
            </div>
            <div className="flex-1">
              <StrategyPresentationView
                isOpen={true}
                strategyText={strategyText}
                brandName={brand.name}
                embedded={true}
                isFree={userPlan === 'free'}
              />
            </div>
          </div>
        );
      }

      // Recap générique pour les autres phases immersives (0, 2, 5)
      return (
        <div className="flex flex-col w-full min-h-[calc(100dvh-64px)] bg-[#F5F5F7]">
          <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-black/5 sticky top-0 z-[60]">
            <Link href="/launch-map" className="inline-flex items-center gap-2 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors rounded-full px-3 py-1.5 hover:bg-[#F5F5F7]">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à la vue d'ensemble</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="rounded-full border-black/10 hover:bg-black/5 gap-2"
            >
              <Pencil className="w-3.5 h-3.5" />
              Modifier les informations
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-24 space-y-12">
            <div className="text-center space-y-4">
              <div className={cn("w-20 h-20 rounded-[28px] mx-auto flex items-center justify-center shadow-xl", currentColor.bg, currentColor.text)}>
                <PhaseIcon size={36} />
              </div>
              <h2 className="text-4xl font-black tracking-tight text-[#1D1D1F]">{phase.title}</h2>
              <p className="text-xl text-[#86868B] max-w-lg mx-auto font-medium">Vous avez complété cette étape. Voici un résumé de vos choix.</p>
            </div>

            <div className="w-full max-w-2xl bg-white border border-black/5 shadow-apple rounded-[40px] p-8 sm:p-12">
              <PhaseRecap
                phaseId={phaseId}
                brandFull={brandFull}
                launchMap={launchMap}
                designCount={designCount}
                quoteCount={quoteCount}
                ugcCount={ugcCount}
                progress={progress}
              />
            </div>
          </div>
        </div>
      );
    }

    // Sinon on affiche le STEPPER (mode édition ou première fois)
    return (
      <div className={cn(
        "flex flex-col w-full m-0 p-0 bg-white relative",
        phaseId === 5 ? "h-[calc(100dvh-64px)] overflow-hidden" : "min-h-[calc(100dvh-64px)] overflow-y-auto"
      )}>
        <div className="px-4 py-2 sm:py-3 flex items-center justify-between shrink-0 relative z-30 border-b border-black/5 bg-white sticky top-0">
          <Link href="/launch-map" className="inline-flex items-center gap-2 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors rounded-full px-3 py-1.5 hover:bg-[#F5F5F7]">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour à la vue d'ensemble</span>
            <span className="sm:hidden">Retour</span>
          </Link>
        </div>
        <div className="flex-1 w-full bg-white relative">
          <LaunchMapStepper brandId={brand.id} launchMap={launchMap} brand={brandFull} hasIdentity={hasIdentity} focusedPhase={phaseId} userPlan={userPlan} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans">
      <div className="px-4 sm:px-6 lg:px-12 py-8 max-w-5xl mx-auto space-y-6">

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/launch-map" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#86868B] hover:text-[#1D1D1F] transition-colors bg-white/50 hover:bg-white px-4 py-2 rounded-full border border-black/5 shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Retour à la vue d'ensemble
          </Link>
          {isLocked && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-sm uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5" />
              Plan Créateur requis
            </div>
          )}
        </div>

        {/* Main Card */}
        <div className="rounded-[32px] border border-black/[0.06] bg-white shadow-apple overflow-hidden">

          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-black/[0.06] bg-gradient-to-b from-[#F5F5F7]/50 to-white flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 ${currentColor.bg}`}>
              <PhaseIcon className={`w-7 h-7 ${currentColor.text}`} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#1D1D1F] leading-tight mb-1">{phase.title}</h1>
              <p className="text-[#86868B] text-[15px]">{presentation.intro}</p>
            </div>
          </div>

          {!isLocked ? (
            <div className="bg-white">
              <div ref={detailSectionRef} className="p-6 sm:p-8">
                <LaunchMapStepper brandId={brand.id} launchMap={launchMap} brand={brandFull} hasIdentity={hasIdentity} focusedPhase={phaseId} userPlan={userPlan} />
              </div>
            </div>
          ) : (
            /* Locked State UI */
            <div className="relative p-12 sm:p-20 text-center overflow-hidden bg-white">
              {/* Fake blurred background elements */}
              <div className="absolute inset-0 opacity-20 pointer-events-none select-none overflow-hidden flex flex-col items-center justify-center gap-4 blur-[4px]">
                <div className="w-2/3 h-12 bg-gray-200 rounded-xl" />
                <div className="w-1/2 h-8 bg-gray-100 rounded-lg" />
                <div className="w-3/4 h-32 bg-gray-50 rounded-2xl border" />
              </div>

              <div className="relative z-10 max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-[24px] shadow-lg flex items-center justify-center rotate-3 transform hover:rotate-6 transition-transform">
                  <Lock className="w-10 h-10 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-[#1D1D1F]">Fonctionnalité Premium</h3>
                  <p className="text-[15px] text-[#86868B] leading-relaxed">
                    Cette phase nécessite un compte Créateur. Débloquez la création de Tech Packs, le Sourcing d'Usines et la configuration Shopify IA.
                  </p>
                </div>

                <Link href="/auth/choose-plan" className="inline-flex w-full items-center justify-center bg-[#1D1D1F] hover:bg-black text-white font-bold rounded-full h-14 px-8 shadow-xl shadow-black/10 transition-all active:scale-[0.98]">
                  Passer au Plan Créateur
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
