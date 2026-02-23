'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Compass,
  Zap,
  Check,
  History,
  FileText,
  Upload,
  Image as ImageIcon,
  Layers,
  Fingerprint,
  Wind,
  Feather,
  Globe
} from 'lucide-react';
import { getBrandLogoUrl } from '@/lib/curated-brands';
import { POSITIONING_OPTIONS } from '@/lib/constants/identity-options';
import {
  getReferenceBrandsForPositioning,
  getTargetAudienceOptionsForPositioning,
} from '@/lib/constants/audience-reference-brands';
import { BrandLogo } from '@/components/brands/BrandLogo';
import { StrategyPresentationView } from './StrategyPresentationView';
import type { BrandIdentity } from './LaunchMapStepper';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { useSurplusModal } from '@/components/usage/SurplusModalContext';
import { getTechnicalStyleKeywords } from '@/lib/brand-style-keywords';
import { PreviewWatermark } from '@/components/ui/preview-watermark';

interface Phase1StrategyProps {
  brandId: string;
  brand?: BrandIdentity | null;
  brandName?: string;
  onComplete: () => void;
  demoMode?: boolean;
  userPlan?: string;
}

function styleGuideField(sg: Record<string, unknown> | null | undefined, key: string): string {
  if (!sg || typeof sg !== 'object') return '';
  const v = sg[key];
  return typeof v === 'string' ? v : '';
}

export function Phase1Strategy({ brandId, brand, brandName, onComplete, demoMode = false, userPlan = 'free' }: Phase1StrategyProps) {
  const router = useRouter();
  const { toast } = useToast();
  const openSurplusModal = useSurplusModal();
  const sg = brand?.styleGuide && typeof brand.styleGuide === 'object' ? brand.styleGuide as Record<string, unknown> : null;

  // --- States ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [positioning, setPositioning] = useState(() => styleGuideField(sg, 'preferredStyle') || styleGuideField(sg, 'positioning') || '');
  const [targetAudience, setTargetAudience] = useState(() => styleGuideField(sg, 'targetAudience') || '');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(brand?.templateBrandSlug || null);
  const [strategyResult, setStrategyResult] = useState<string | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState('');
  const [analyzedBrandsFromDb, setAnalyzedBrandsFromDb] = useState<Array<{ brandName: string; slug: string }>>([]);
  const [strategyHistory, setStrategyHistory] = useState<any[]>([]);
  const [showLogoStep, setShowLogoStep] = useState(false);
  const [logoGenerating, setLogoGenerating] = useState(false);
  const [logoProposals, setLogoProposals] = useState<Array<{ url: string; urlTransparent: string }>>([]);
  const [logoError, setLogoError] = useState('');
  const [validateLoading, setValidateLoading] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<any>(null);

  // --- Step Definitions ---
  const steps = useMemo(() => [
    {
      id: 'positioning',
      title: 'L\'Esprit.',
      subtitle: 'Quelle est l\'âme stylistique de votre mouvement ?',
      icon: <Compass className="w-6 h-6" />,
      accent: 'bg-[#007AFF]'
    },
    {
      id: 'audience',
      title: 'La Cible.',
      subtitle: 'Pour qui bat le cœur de votre création ?',
      icon: <Target className="w-6 h-6" />,
      accent: 'bg-indigo-500'
    },
    {
      id: 'inspiration',
      title: 'Le Génie.',
      subtitle: 'Sur les épaules de quels géants voulez-vous bâtir ?',
      icon: <Sparkles className="w-6 h-6" />,
      accent: 'bg-emerald-500'
    },
    {
      id: 'review',
      title: 'L\'Anatomie.',
      subtitle: 'Découvrez le plan d\'attaque forgé par l\'IA.',
      icon: <FileText className="w-6 h-6" />,
      accent: 'bg-rose-500'
    }
  ], []);

  // --- Logic ---
  useEffect(() => {
    fetch('/api/brands/analyze?list=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.analyzedBrands) setAnalyzedBrandsFromDb(d.analyzedBrands);
      });
  }, []);

  const fetchStrategyHistory = useCallback(async () => {
    if (!brandId || demoMode) return;
    try {
      const res = await fetch(`/api/brands/strategy/history?brandId=${encodeURIComponent(brandId)}`);
      const data = await res.json();
      if (res.ok && data.strategies) setStrategyHistory(data.strategies);
    } catch (e) { }
  }, [brandId, demoMode]);

  useEffect(() => { fetchStrategyHistory(); }, [fetchStrategyHistory]);

  const referenceBrands = useMemo(() => {
    const fromRef = positioning ? getReferenceBrandsForPositioning(positioning).map(b => ({ brandName: b.name, slug: b.slug })) : [];
    const refSlugs = new Set(fromRef.map(b => b.slug.toLowerCase()));
    const extra = analyzedBrandsFromDb.filter(b => !refSlugs.has(b.slug.toLowerCase()));
    return [...fromRef, ...extra];
  }, [positioning, analyzedBrandsFromDb]);

  const targetAudienceOptions = useMemo(
    () => (positioning ? getTargetAudienceOptionsForPositioning(positioning) : []),
    [positioning]
  );

  const handleCalquerStrategie = async (slug: string) => {
    if (userPlan === 'free') { openSurplusModal(); return; }
    const templateName = referenceBrands.find(b => b.slug === slug)?.brandName || slug;
    setStrategyLoading(true);
    try {
      const analysisRes = await fetch(`/api/brands/analyze?brandName=${encodeURIComponent(templateName)}`);
      const analysisText = analysisRes.ok ? (await analysisRes.json()).analysis : '';

      const strategyRes = await fetch('/api/brands/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateBrandName: templateName,
          creatorBrandName: brand?.name || brandName,
          analysisText: analysisText || undefined,
          positioning,
          targetAudience,
          brandId
        }),
      });
      const data = await strategyRes.json();
      if (!strategyRes.ok) throw new Error(data.error || 'Erreur');
      setStrategyResult(data.strategy);
      setStrategyModalOpen(true);
      fetchStrategyHistory();
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
      toast({ title: 'Stratégie générée', message: 'L\'IA a forgé votre plan d\'attaque.', type: 'success' });
      setCurrentStepIndex(3); // Go to review step
    } catch (e) {
      toast({ title: 'Erreur', message: 'Impossible de générer la stratégie.', type: 'error' });
    } finally {
      setStrategyLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidateLoading(true);
    try {
      if (demoMode) {
        setShowLogoStep(true);
        return;
      }
      const res = await fetch('/api/launch-map/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, templateBrandSlug: selectedSlug, positioning, targetAudience }),
      });
      if (!res.ok) throw new Error('Erreur');
      setShowLogoStep(true);
    } catch (e) {
      toast({ title: 'Erreur', message: 'Échec de la validation.', type: 'error' });
    } finally {
      setValidateLoading(false);
    }
  };

  const handleGenerateLogo = async () => {
    setLogoGenerating(true);
    setLogoError('');
    try {
      const res = await fetch(`/api/brands/${brandId}/generate-logo`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setLogoProposals(data.proposals || []);
    } catch (e) {
      setLogoError('Erreur de génération');
    } finally {
      setLogoGenerating(false);
    }
  };

  const currentStep = steps[currentStepIndex];
  const canGoNext = () => {
    if (currentStep.id === 'positioning') return !!positioning;
    if (currentStep.id === 'audience') return !!targetAudience;
    if (currentStep.id === 'inspiration') return !!selectedSlug;
    return true;
  };

  // --- UI Components ---

  const renderLogoStep = () => {
    const inspirationName = referenceBrands.find(b => b.slug === selectedSlug)?.brandName || "Inspiration";
    const technicalStyle = getTechnicalStyleKeywords(inspirationName);

    return (
      <div className="min-h-screen w-full bg-[#F5F5F7] flex flex-col items-center relative overflow-hidden text-[#1D1D1F]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[70%] bg-indigo-500/5 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-emerald-500/5 rounded-full blur-[140px]" />
        </div>

        <div className="w-full max-w-7xl px-8 pt-12 z-20 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Phase 1 : Identité Visuelle</p>
            <h2 className="text-2xl font-bold tracking-tight">Le Studio <span className="text-[#007AFF]">Logo</span></h2>
          </div>
          <Button variant="ghost" onClick={() => setShowLogoStep(false)} className="rounded-full">Retour</Button>
        </div>

        <div className="flex-1 w-full max-w-6xl px-8 flex flex-col z-20 py-12">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="w-20 h-20 rounded-[28px] bg-white border border-black/5 shadow-xl flex items-center justify-center text-[#007AFF]">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="space-y-4">
                <h3 className="text-6xl font-bold tracking-tight leading-[1]">L&apos;Emblème.</h3>
                <p className="text-2xl text-[#86868B] max-w-md font-medium leading-relaxed">
                  La synthèse visuelle de votre stratégie inspirée par <span className="text-[#1D1D1F]">{inspirationName}</span>.
                </p>
              </div>
              <div className="p-6 bg-white/60 backdrop-blur-xl rounded-[32px] border border-black/5 shadow-sm space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#007AFF]">Style technique détecté</p>
                <p className="text-lg font-bold">{technicalStyle}</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-8">
              {logoGenerating ? (
                <div className="w-full aspect-square max-w-md bg-white rounded-[56px] shadow-2xl flex flex-col items-center justify-center gap-6 border border-black/5 animate-pulse">
                  <Loader2 className="w-12 h-12 animate-spin text-[#007AFF]" />
                  <p className="text-sm font-bold uppercase tracking-widest text-black/40">Ciselage de vos emblèmes...</p>
                </div>
              ) : logoProposals.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 w-full">
                  {logoProposals.map((p, i) => (
                    <div key={i} className="aspect-square bg-white rounded-[40px] shadow-xl border border-black/5 p-6 group relative overflow-hidden">
                      <PreviewWatermark src={p.url} alt={`Option ${i + 1}`} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <a href={p.urlTransparent} target="_blank" download className="text-white text-[10px] font-bold uppercase tracking-widest hover:underline">Download PNG</a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={handleGenerateLogo}
                  className="w-full aspect-square max-w-md bg-white rounded-[56px] shadow-2xl flex flex-col items-center justify-center gap-6 border border-black/5 group hover:border-[#007AFF]/30 transition-all active:scale-95"
                >
                  <div className="w-20 h-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center group-hover:bg-[#007AFF] group-hover:text-white transition-colors">
                    <Zap className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-[0.4em] text-black/30 group-hover:text-[#007AFF]">Forger les Logos</span>
                </button>
              )}

              {logoProposals.length > 0 && (
                <Button
                  onClick={() => onComplete()}
                  className="h-16 px-12 rounded-[24px] bg-[#1D1D1F] text-white w-full max-w-md font-bold text-sm uppercase tracking-widest shadow-2xl"
                >
                  Valider & Continuer <ArrowRight className="w-5 h-5 ml-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showLogoStep) return renderLogoStep();

  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] flex flex-col items-center relative overflow-hidden text-[#1D1D1F] selection:bg-[#007AFF]/20 pb-20 sm:pb-0">

      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-[#007AFF]/5 rounded-full blur-[160px] animate-pulse duration-[8s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-slate-200 rounded-full blur-[140px] animate-pulse duration-[6s] delay-1000" />

        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
          <h1 className="text-[25vw] font-black tracking-tighter uppercase whitespace-nowrap leading-none text-black">
            {brand?.name || brandName || 'STRATEGY'}
          </h1>
        </div>
      </div>

      {/* Atelier Header */}
      <div className="w-full max-w-7xl px-8 pt-12 z-20 flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Phase 1 : La Stratégie</p>
          <h2 className="text-2xl font-bold tracking-tight">Atelier <span className="text-[#007AFF]">Marketing</span></h2>
        </div>
        <div className="flex gap-4 items-center">
          <div className="hidden sm:flex gap-1.5 bg-white/40 p-1.5 rounded-full backdrop-blur-xl border border-black/5 shadow-sm">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-700",
                  i <= currentStepIndex ? "w-10 bg-[#007AFF]" : "w-2 bg-black/10"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 w-full max-w-6xl px-8 flex flex-col z-20 py-12">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* Left Side: Context */}
          <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className={cn("w-20 h-20 rounded-[28px] flex items-center justify-center shadow-xl text-white transition-all duration-700 bg-white border border-black/5")}>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white", currentStep.accent)}>
                {currentStep.icon}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-6xl font-bold tracking-tight leading-[1] text-[#1D1D1F]">{currentStep.title}</h3>
              <p className="text-2xl text-[#86868B] max-w-md font-medium leading-relaxed">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Right Side: Interaction */}
          <div className="relative min-h-[450px] flex flex-col justify-center">
            <div className="max-w-xl w-full mx-auto">

              {currentStep.id === 'positioning' && (
                <div className="grid grid-cols-1 gap-4 w-full animate-in fade-in duration-700">
                  {POSITIONING_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPositioning(opt)}
                      className={cn(
                        "p-6 rounded-[28px] text-left border transition-all duration-500 group",
                        positioning === opt
                          ? "bg-white border-white text-black shadow-xl scale-[1.02]"
                          : "bg-white/40 border-black/5 text-[#86868B] hover:bg-white hover:border-black/10"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold tracking-tight text-[#1D1D1F]">{opt}</span>
                        {positioning === opt && <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white"><Check className="w-5 h-5" /></div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentStep.id === 'audience' && (
                <div className="grid grid-cols-1 gap-4 w-full animate-in fade-in duration-700">
                  {targetAudienceOptions.length > 0 ? targetAudienceOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTargetAudience(opt)}
                      className={cn(
                        "p-6 rounded-[28px] text-left border transition-all duration-500 group",
                        targetAudience === opt
                          ? "bg-white border-white text-black shadow-xl scale-[1.02]"
                          : "bg-white/40 border-black/5 text-[#86868B] hover:bg-white hover:border-black/10"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold tracking-tight text-[#1D1D1F]">{opt}</span>
                        {targetAudience === opt && <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white"><Check className="w-5 h-5" /></div>}
                      </div>
                    </button>
                  )) : (
                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 text-amber-800 text-sm font-medium">
                      Veuillez d&apos;abord choisir un positionnement.
                    </div>
                  )}
                </div>
              )}

              {currentStep.id === 'inspiration' && (
                <div className="w-full space-y-6 animate-in fade-in duration-700">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {referenceBrands.slice(0, 9).map((brand) => (
                      <button
                        key={brand.slug}
                        onClick={() => {
                          setSelectedSlug(brand.slug);
                          if (userPlan !== 'free') handleCalquerStrategie(brand.slug);
                        }}
                        className={cn(
                          "p-4 rounded-[32px] border transition-all duration-500 flex flex-col items-center gap-4 text-center group",
                          selectedSlug === brand.slug
                            ? "bg-white border-white shadow-xl scale-[1.05]"
                            : "bg-white/40 border-black/5 hover:bg-white hover:border-black/10"
                        )}
                      >
                        <div className="w-14 h-14 rounded-full bg-white border border-black/5 flex items-center justify-center p-3 shadow-sm group-hover:scale-110 transition-transform">
                          <BrandLogo brandName={brand.brandName} logoUrl={getBrandLogoUrl(brand.brandName)} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#1D1D1F] leading-tight px-1">{brand.brandName}</span>
                      </button>
                    ))}
                  </div>
                  {strategyLoading && (
                    <div className="flex items-center gap-3 p-4 bg-white/80 rounded-2xl border border-black/5 animate-pulse">
                      <Loader2 className="w-5 h-5 animate-spin text-[#007AFF]" />
                      <span className="text-xs font-bold uppercase tracking-widest">Génération du plan d&apos;attaque...</span>
                    </div>
                  )}
                </div>
              )}

              {currentStep.id === 'review' && (
                <div className="w-full space-y-6 animate-in zoom-in-95 duration-700 text-right">
                  {strategyResult ? (
                    <button
                      onClick={() => setStrategyModalOpen(true)}
                      className="p-10 rounded-[48px] bg-white shadow-2xl border border-black/5 text-left w-full group transition-all hover:scale-[1.02]"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 rounded-[22px] bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center group-hover:bg-[#007AFF] group-hover:text-white transition-colors">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black tracking-widest uppercase">Stratégie Prête</div>
                      </div>
                      <p className="text-2xl font-bold mb-2">Manifeste Strategique</p>
                      <p className="text-[#86868B] text-sm leading-relaxed line-clamp-3">
                        {strategyResult.slice(0, 300)}...
                      </p>
                      <div className="mt-8 flex items-center gap-2 text-[#007AFF] font-bold text-xs uppercase tracking-widest">
                        Lire l&apos;intégralité <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </button>
                  ) : (
                    <div className="p-10 rounded-[48px] bg-white/40 border border-black/5 text-center">
                      <p className="text-[#86868B] font-medium">Choisissez une marque d&apos;inspiration pour générer votre stratégie.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Architecture */}
      <div className="w-full max-w-7xl px-8 pb-16 z-20">
        <div className="flex items-center justify-between pt-12 border-t border-black/5">
          <div className="flex gap-4">
            <button
              onClick={() => currentStepIndex > 0 && setCurrentStepIndex(i => i - 1)}
              className={cn(
                "h-16 px-10 rounded-[24px] font-bold text-[13px] uppercase tracking-widest transition-all border border-black/5 bg-white flex items-center gap-3",
                currentStepIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          </div>

          <Button
            onClick={() => {
              if (currentStepIndex === steps.length - 1) handleValidate();
              else setCurrentStepIndex(i => i + 1);
            }}
            disabled={!canGoNext() || validateLoading || strategyLoading}
            className="h-16 px-16 rounded-[24px] bg-[#1D1D1F] hover:bg-black text-white font-bold text-[14px] uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 group overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center gap-4">
              {validateLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : currentStepIndex === steps.length - 1 ? (
                "Valider l'ADN"
              ) : (
                <>Suivant <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Button>
        </div>
      </div>

      {/* Strategy Overlay Modal */}
      {strategyModalOpen && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto py-24 px-8">
              <div className="flex justify-between items-center mb-16">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#007AFF]">Livrable Stratégique</p>
                  <h2 className="text-5xl font-bold tracking-tighter">Manifeste <span className="opacity-40">de Marque</span></h2>
                </div>
                <button onClick={() => setStrategyModalOpen(false)} className="w-16 h-16 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </div>

              <StrategyPresentationView
                isOpen={true}
                onClose={() => setStrategyModalOpen(false)}
                strategyText={strategyResult ?? ''}
                brandName={brandName || brand?.name || ''}
                isTemplateView={false}
                embedded={true}
                isFree={userPlan === 'free' && !demoMode}
              />
            </div>
          </div>
          <div className="p-8 border-t border-black/5 flex justify-center bg-white/40 backdrop-blur-xl">
            <Button onClick={() => setStrategyModalOpen(false)} className="h-16 px-20 rounded-full bg-[#007AFF] text-white font-bold uppercase tracking-widest shadow-xl">
              Continuer au Studio
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar Progress Tracker */}
      <div className="fixed right-12 top-1/2 -translate-y-1/2 flex flex-col gap-8 z-30 hidden 2xl:flex bg-white/60 backdrop-blur-3xl p-5 rounded-full border border-black/5 shadow-apple-sm">
        {steps.map((st, i) => (
          <div
            key={st.id}
            onClick={() => i <= currentStepIndex || (i === 1 && !!positioning) || (i === 2 && !!targetAudience) ? setCurrentStepIndex(i) : null}
            className={cn(
              "w-3.5 h-3.5 rounded-full transition-all duration-700 cursor-pointer border-2",
              i === currentStepIndex ? "bg-[#007AFF] scale-150 border-white shadow-lg" : "bg-black/10 hover:bg-black/20 border-transparent"
            )}
            title={st.title}
          />
        ))}
      </div>
    </div>
  );
}
