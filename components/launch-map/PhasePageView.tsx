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
  Fingerprint,
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

  const isLocked = userPlan === 'free' && ![0, 1, 2, 4].includes(phaseId);

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

  const isCompleted = (phaseId === 0 && hasIdentity) ||
    (phaseId === 1 && strategyText) ||
    (phaseId === 2 && launchMap?.phase2) ||
    (phaseId === 3 && launchMap?.phase3) ||
    (phaseId === 4 && launchMap?.phase4) ||
    (phaseId === 5 && launchMap?.phase5);

  // Mode messagerie/immersif full width (Atelier phases 0,1,2 + Sourcing Ada 4 + Shopify 5)
  if ([0, 1, 2, 4, 5].includes(phaseId) && !isLocked) {

    // Si la phase est complétée et qu'on n'est pas en mode édition, on affiche le RECAP
    if (isCompleted && !isEditing) {
      if (phaseId === 1 && strategyText) {
        return (
          <div className="flex-1 w-full bg-[#F5F5F7] relative">
            <div className="absolute inset-0 flex flex-col overflow-hidden">
              <div className="px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between bg-white/95 backdrop-blur-xl border-b border-black/[0.05] sticky top-0 z-[60]">
                <Link href="/launch-map" className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[#86868B] hover:text-[#1D1D1F] transition-all rounded-full px-3 py-1.5 hover:bg-black/5 uppercase tracking-widest leading-none">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Launch Map</span>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="rounded-full border-black/10 hover:bg-black/5 gap-1.5 h-8 sm:h-9 px-3 sm:px-4 text-[10px] sm:text-xs font-bold transition-apple shadow-sm"
                >
                  <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Modifier
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto stylish-scrollbar">
                <StrategyPresentationView
                  isOpen={true}
                  strategyText={strategyText}
                  brandName={brand.name}
                  embedded={true}
                  isFree={userPlan === 'free'}
                />
              </div>
            </div>
          </div>
        );
      }

      // Recap générique pour les autres phases immersives (0, 2, 4, 5)
      return (
        <div className="flex-1 w-full bg-[#F5F5F7] relative">
          <div className="absolute inset-0 flex flex-col overflow-hidden">
            {/* Atelier Immersive Header - Recap Style */}
            <div className="px-3 py-2 sm:px-12 sm:py-6 flex items-center justify-between bg-white/95 backdrop-blur-xl border-b border-black/[0.05] sticky top-0 z-[60]">
              <Link href="/launch-map" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#86868B] hover:text-[#1D1D1F] transition-all rounded-full px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-black/5 uppercase tracking-widest leading-none">
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Launch Map</span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[#007AFF] hidden xs:block">Terminé</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="rounded-full border-black/10 hover:bg-black/5 gap-1.5 h-8 sm:h-10 px-3 sm:px-5 font-bold uppercase text-[9px] sm:text-[11px] tracking-widest shadow-apple-sm transition-apple"
                >
                  <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Modifier</span>
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto stylish-scrollbar relative z-10">
              {/* Immersive Background Decor */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className={cn("absolute top-[-10%] left-[-5%] w-[80%] h-[60%] rounded-full blur-[100px] sm:blur-[160px] opacity-10 sm:opacity-20 animate-pulse", currentColor.bg)} />
              </div>

              <div className="w-full max-w-7xl mx-auto px-4 sm:px-12 py-6 sm:py-12 lg:py-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-20 items-start">

                  {/* Left Side: Editorial Context */}
                  <div className="lg:col-span-5 space-y-4 sm:space-y-10">
                    <div className={cn("w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-[28px] flex items-center justify-center shadow-lg text-white mx-auto lg:mx-0", currentColor.bg, currentColor.text)}>
                      <PhaseIcon size={24} className="sm:hidden" />
                      <PhaseIcon size={36} className="hidden sm:block" />
                    </div>
                    <div className="space-y-1 sm:space-y-4 text-center lg:text-left">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Manifeste de Phase</p>
                      <h2 className="text-2xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-[#1D1D1F] leading-tight">{phase.title}</h2>
                      <p className="text-[13px] sm:text-xl lg:text-2xl text-[#86868B] font-medium leading-relaxed max-w-md mx-auto lg:mx-0">Vos choix stratégiques sont maintenant scellés dans l&apos;ADN de votre marque.</p>
                    </div>

                    {/* Dynamic Info Cards */}
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {phaseId === 0 && (
                        <div className="p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] bg-white shadow-apple-sm border border-black/5 flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#007AFF]/10 flex items-center justify-center shrink-0">
                            <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6 text-[#007AFF]" />
                          </div>
                          <div>
                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-black/30">Identité</p>
                            <p className="text-base sm:text-xl font-bold text-[#1D1D1F] truncate max-w-[140px] sm:max-w-none">{brand.name}</p>
                          </div>
                        </div>
                      )}
                      {phaseId === 2 && (
                        <div className="p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] bg-[#1D1D1F] text-white shadow-apple-lg flex items-center justify-between">
                          <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/40">Mockup Studio</p>
                            <p className="text-lg sm:text-2xl font-bold">{designCount} Créations</p>
                          </div>
                          <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-[#007AFF]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Bento Summaries */}
                  <div className="lg:col-span-7">
                    <div className="bg-white/70 backdrop-blur-2xl border border-black/5 shadow-apple-2xl rounded-[24px] sm:rounded-[48px] p-5 sm:p-16">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF] mb-6 sm:mb-12 text-center">Sommaire des Décisions</p>
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
              </div>
            </div>
          </div>
        </div>
      );
    }

    // STEPPER (mode édition ou première fois) - TRUE FULL SCREEN CHAT FEEL
    return (
      <div className="flex-1 w-full bg-[#F5F5F7] relative">
        <div className="absolute inset-0 flex flex-col overflow-hidden">
          <LaunchMapStepper brandId={brand.id} launchMap={launchMap} brand={brandFull} hasIdentity={hasIdentity} focusedPhase={phaseId} userPlan={userPlan} strategyText={strategyText} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans pb-6 sm:pb-0">
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
              {isCompleted && !isEditing ? (
                <div className="p-8 sm:p-16 flex flex-col items-center space-y-6 sm:space-y-10">
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className={cn("w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[22px] mx-auto flex items-center justify-center shadow-lg", currentColor.bg, currentColor.text)}>
                      <PhaseIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#1D1D1F]">Étape Validée</h3>
                    <p className="text-[13px] sm:text-base text-[#86868B] max-w-sm mx-auto">Vous avez complété cette phase. Voici vos informations enregistrées.</p>
                  </div>

                  <div className="w-full max-w-md bg-[#F5F5F7]/50 border border-black/5 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8">
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

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full border-black/10 hover:bg-black/5 h-12 sm:h-14 px-6 sm:px-8 gap-2 font-bold text-xs sm:text-sm transition-apple shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Modifier les informations
                  </Button>
                </div>
              ) : (
                <div ref={detailSectionRef} className="p-4 sm:p-8">
                  <LaunchMapStepper brandId={brand.id} launchMap={launchMap} brand={brandFull} hasIdentity={hasIdentity} focusedPhase={phaseId} userPlan={userPlan} />
                </div>
              )}
            </div>
          ) : (
            /* Locked State UI - More Premium & Less Broken */
            <div className="relative p-6 sm:p-20 text-center overflow-hidden bg-white min-h-[350px] sm:min-h-[400px] flex flex-col justify-center">
              {/* Fake blurred background elements */}
              <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden flex flex-col items-center justify-center gap-4 sm:gap-6 blur-[8px]">
                <div className="w-2/3 h-10 sm:h-12 bg-gray-200 rounded-xl sm:rounded-2xl" />
                <div className="w-1/2 h-6 sm:h-8 bg-gray-100 rounded-lg sm:rounded-xl" />
                <div className="w-full h-32 sm:h-48 bg-gray-50 rounded-[30px] sm:rounded-[40px] border border-black/5" />
              </div>

              <div className="relative z-10 max-w-sm mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-[#007AFF] to-[#00C6FF] rounded-[22px] sm:rounded-[28px] shadow-apple-lg flex items-center justify-center rotate-3 transform hover:rotate-6 transition-transform duration-500">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight">Accès Créateur</h3>
                  <p className="text-[13px] sm:text-[15px] text-[#86868B] font-medium leading-relaxed">
                    Cette phase est réservée aux membres Créateurs. Débloquez les outils avancés de production et de sourcing.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 sm:gap-3">
                  <Link href="/auth/choose-plan" className="inline-flex w-full items-center justify-center bg-[#1D1D1F] hover:bg-black text-white font-bold rounded-full h-12 sm:h-14 px-6 sm:px-8 shadow-apple-md transition-all active:scale-[0.98] text-[11px] sm:text-xs uppercase tracking-widest leading-none">
                    Découvrir le Plan Créateur
                  </Link>
                  <Link href="/launch-map" className="text-[10px] sm:text-xs font-bold text-[#86868B] hover:text-[#1D1D1F] uppercase tracking-widest transition-colors py-2">
                    Peut-être plus tard
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
