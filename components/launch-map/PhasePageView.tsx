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
        <div className="flex flex-col w-full min-h-[calc(100dvh-64px)] bg-[#F5F5F7] relative overflow-x-hidden pb-32 sm:pb-0">
          {/* Immersive Background Decor */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className={cn("absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full blur-[160px] opacity-20 animate-pulse duration-[8s]", currentColor.bg)} />
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
              <h1 className="text-[20vw] font-black tracking-tighter uppercase whitespace-nowrap leading-none text-black">
                {brand.name}
              </h1>
            </div>
          </div>

          {/* Atelier Immersive Header - Recap Style */}
          <div className="px-6 sm:px-12 py-6 flex items-center justify-between bg-white/60 backdrop-blur-3xl border-b border-black/5 sticky top-0 z-[60]">
            <Link href="/launch-map" className="inline-flex items-center gap-2 text-sm font-bold text-[#86868B] hover:text-[#1D1D1F] transition-colors rounded-full px-4 py-2 hover:bg-black/5 uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" />
              <span>Launch Map</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF] hidden sm:block">Étape Terminée</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="rounded-full border-black/10 hover:bg-black/5 gap-2 h-10 px-5 font-bold uppercase text-[11px] tracking-widest shadow-apple-sm transition-all active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col z-10">
            <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 lg:py-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">

                {/* Left Side: Editorial Context */}
                <div className="lg:col-span-5 space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
                  <div className={cn("w-20 h-20 rounded-[28px] flex items-center justify-center shadow-xl text-white shadow-apple-lg", currentColor.bg, currentColor.text)}>
                    <PhaseIcon size={36} />
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Manifeste de Phase</p>
                    <h2 className="text-5xl sm:text-7xl font-bold tracking-tight text-[#1D1D1F] leading-[1.1]">{phase.title}</h2>
                    <p className="text-xl sm:text-2xl text-[#86868B] font-medium leading-relaxed max-w-md">Vos choix stratégiques sont maintenant scellés dans l&apos;ADN de votre marque.</p>
                  </div>

                  {/* Dynamic Relevant Info Cards based on Phase */}
                  {phaseId === 0 && (
                    <div className="space-y-4">
                      <div className="p-8 rounded-[40px] bg-white shadow-apple-lg border border-black/5 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center">
                            <Fingerprint className="w-8 h-8 text-[#007AFF]" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-black/30">Identité Actuelle</p>
                            <p className="text-2xl font-bold text-[#1D1D1F]">{brand.name}</p>
                          </div>
                        </div>
                      </div>

                      {brandFull?.styleGuide && (brandFull.styleGuide as any).story && (
                        <div className="p-8 rounded-[40px] bg-white/40 backdrop-blur-xl border border-black/5 space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-black/30">Vision de Marque</p>
                          <p className="text-sm text-[#86868B] italic leading-relaxed line-clamp-4">"{(brandFull.styleGuide as any).story}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {phaseId === 2 && (
                    <div className="p-8 rounded-[40px] bg-[#1D1D1F] text-white shadow-apple-lg space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Mockup Studio</p>
                          <p className="text-3xl font-bold">{designCount} Créations</p>
                        </div>
                        <PenTool className="w-10 h-10 text-[#007AFF]" />
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed">Vos prototypes visuels sont prêts pour la phase de Tech Pack.</p>
                    </div>
                  )}

                  {phaseId === 5 && launchMap?.shopifyShopDomain && (
                    <div className="p-8 rounded-[40px] bg-white shadow-apple-lg border border-black/5 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#95BF47]/10 flex items-center justify-center">
                          <Store className="w-8 h-8 text-[#5E8E3E]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-black/30">Boutique Live</p>
                          <p className="text-lg font-bold text-[#1D1D1F] truncate max-w-[200px]">{launchMap.shopifyShopDomain}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Bento Summaries */}
                <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                  <div className="bg-white/70 backdrop-blur-2xl border border-black/5 shadow-apple-2xl rounded-[48px] p-8 sm:p-16">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF] mb-12 text-center">Sommaire des Décisions</p>
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
      );
    }

    // Sinon on affiche le STEPPER (mode édition ou première fois)
    return (
      <div className={cn(
        "flex flex-col w-full m-0 p-0 bg-white relative pb-6 sm:pb-0",
        (phaseId === 1 || phaseId === 2 || phaseId === 4 || phaseId === 5) ? "h-[calc(100dvh-64px)] overflow-hidden" : "min-h-[calc(100dvh-64px)] overflow-y-auto"
      )}>
        {![1, 2, 4, 5].includes(Number(phaseId)) && (
          <div className="px-4 py-2 sm:py-3 flex items-center justify-between shrink-0 relative z-30 border-b border-black/5 bg-white sticky top-0">
            <Link href="/launch-map" className="inline-flex items-center gap-2 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors rounded-full px-3 py-1.5 hover:bg-[#F5F5F7]">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour à la vue d'ensemble</span>
              <span className="sm:hidden">Retour</span>
            </Link>
          </div>
        )}
        <div className="flex-1 w-full bg-white relative flex flex-col min-h-0">
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
                <div className="p-12 sm:p-16 flex flex-col items-center space-y-10">
                  <div className="text-center space-y-4">
                    <div className={cn("w-16 h-16 rounded-[22px] mx-auto flex items-center justify-center shadow-lg", currentColor.bg, currentColor.text)}>
                      <PhaseIcon size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1D1D1F]">Étape Validée</h3>
                    <p className="text-[#86868B] max-w-sm mx-auto">Vous avez complété cette phase. Voici vos informations enregistrées.</p>
                  </div>

                  <div className="w-full max-w-md bg-[#F5F5F7]/50 border border-black/5 rounded-[32px] p-8">
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
                    className="rounded-full border-black/10 hover:bg-black/5 h-14 px-8 gap-2 font-bold"
                  >
                    <Pencil className="w-4 h-4" />
                    Modifier les informations
                  </Button>
                </div>
              ) : (
                <div ref={detailSectionRef} className="p-6 sm:p-8">
                  <LaunchMapStepper brandId={brand.id} launchMap={launchMap} brand={brandFull} hasIdentity={hasIdentity} focusedPhase={phaseId} userPlan={userPlan} />
                </div>
              )}
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
