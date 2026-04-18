'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Compass,
  Zap,
} from 'lucide-react';
import { getBrandLogoUrl } from '@/lib/curated-brands';
import {
  getReferenceBrandsForPositioning,
  getTargetAudienceOptionsForPositioning,
} from '@/lib/constants/audience-reference-brands';
import { BrandLogo } from '@/components/brands/BrandLogo';
import { Phase1StrategyChat } from './Phase1StrategyChat';
import { StrategyPresentationView } from './StrategyPresentationView';
import type { BrandIdentity } from './LaunchMapStepper';
import { cn } from '@/lib/utils';
import { isFreePlan } from '@/lib/plan-utils';
import { useToast } from '@/components/ui/toast';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { getTechnicalStyleKeywords } from '@/lib/brand-style-keywords';
import { PreviewWatermark } from '@/components/ui/preview-watermark';

interface Phase1StrategyProps {
  brandId: string;
  brand?: BrandIdentity | null;
  brandName?: string;
  onComplete: () => void;
  demoMode?: boolean;
  userPlan?: string;
  strategyText?: string | null;
  canComplete?: boolean;
  onStrategyReady?: (strategyText: string) => void;
}

function styleGuideField(sg: Record<string, unknown> | null | undefined, key: string): string {
  if (!sg || typeof sg !== 'object') return '';
  const v = sg[key];
  return typeof v === 'string' ? v : '';
}

export function Phase1Strategy({
  brandId,
  brand,
  brandName,
  onComplete,
  demoMode = false,
  userPlan = 'free',
  strategyText,
  canComplete = true,
  onStrategyReady,
}: Phase1StrategyProps) {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const sg = brand?.styleGuide && typeof brand.styleGuide === 'object' ? brand.styleGuide as Record<string, unknown> : null;

  // Clé de session unique par marque pour la persistance inter-onglets
  const SESSION_KEY = `strategy_result_${brandId}`;

  // --- States ---
  const [viewMode, setViewMode] = useState<'chat' | 'classic'>('chat');
  const [changesRemaining, setChangesRemaining] = useState(3);
  const [positioning, setPositioning] = useState(() => styleGuideField(sg, 'preferredStyle') || styleGuideField(sg, 'positioning') || '');
  const [targetAudience, setTargetAudience] = useState(() => styleGuideField(sg, 'targetAudience') || '');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(brand?.templateBrandSlug || null);

  const [strategyResult, setStrategyResultState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return strategyText || null;
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      return cached || strategyText || null;
    } catch { return strategyText || null; }
  });

  const setStrategyResult = useCallback((val: string | null) => {
    setStrategyResultState(val);
    try {
      if (val) sessionStorage.setItem(SESSION_KEY, val);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch { }
  }, [SESSION_KEY]);

  const [strategyLoading, setStrategyLoading] = useState(false);
  const [analyzedBrandsFromDb, setAnalyzedBrandsFromDb] = useState<Array<{ brandName: string; slug: string }>>([]);
  const [showLogoStep, setShowLogoStep] = useState(false);
  const [logoGenerating, setLogoGenerating] = useState(false);
  const [logoProposals, setLogoProposals] = useState<Array<{ url: string; urlTransparent: string }>>([]);
  const [logoError, setLogoError] = useState('');
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);

  // --- Logic ---
  useEffect(() => {
    fetch('/api/brands/analyze?list=1')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.analyzedBrands) setAnalyzedBrandsFromDb(d.analyzedBrands);
      });
  }, []);

  const referenceBrands = useMemo(() => {
    const fromRef = positioning ? getReferenceBrandsForPositioning(positioning).map(b => ({ brandName: b.name, slug: b.slug })) : [];
    const refSlugs = new Set(fromRef.map(b => b.slug.toLowerCase()));
    const extra = analyzedBrandsFromDb.filter(b => !refSlugs.has(b.slug.toLowerCase()));
    return [...fromRef, ...extra];
  }, [positioning, analyzedBrandsFromDb]);

  const handleCalquerStrategie = useCallback(async (slug: string) => {
    if (isFreePlan(userPlan)) { router.push('/auth/choose-plan'); return; }
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
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
      toast({ title: 'Stratégie générée', message: 'L\'IA a forgé votre plan d\'attaque.', type: 'success' });
    } catch (e) {
      toast({ title: 'Erreur', message: 'Impossible de générer la stratégie.', type: 'error' });
    } finally {
      setStrategyLoading(false);
    }
  }, [brand?.name, brandId, brandName, positioning, referenceBrands, router, setStrategyResult, targetAudience, toast, userPlan]);

  useEffect(() => {
    const shouldGenerate = searchParams.get('generate') === 'true';
    if (shouldGenerate && !strategyLoading && !strategyResult) {
      const slug = selectedSlug || brand?.templateBrandSlug;
      if (slug) {
        handleCalquerStrategie(slug);
      } else {
        toast({ title: 'Informations manquantes', message: 'Virgil a besoin d\'une marque d\'inspiration pour générer le manifeste.', type: 'info' });
      }
    }
  }, [searchParams, selectedSlug, brand?.templateBrandSlug, strategyResult, handleCalquerStrategie, strategyLoading, toast]);

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

  const handleDownloadLogo = async (e: React.MouseEvent, url: string, index: number) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('Network error');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `logo-option-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const renderLogoStep = () => {
    const inspirationName = referenceBrands.find(b => b.slug === selectedSlug)?.brandName || "Inspiration";
    const technicalStyle = getTechnicalStyleKeywords(inspirationName);

    return (
      <div className="min-h-screen w-full bg-[#F5F5F7] flex flex-col items-center relative overflow-y-auto overflow-x-hidden text-[#1D1D1F] pb-32 sm:pb-0">
        <div className="w-full max-w-7xl px-6 sm:px-8 pt-6 sm:pt-10 z-20 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Phase 1 : Identité Visuelle</p>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Le Studio <span className="text-[#007AFF]">Logo</span></h2>
          </div>
          <Button variant="ghost" onClick={() => setShowLogoStep(false)} className="rounded-full h-10 px-6">Retour</Button>
        </div>

        <div className="flex-1 w-full max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col z-20 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="w-20 h-20 rounded-[28px] bg-white border border-black/5 shadow-xl flex items-center justify-center text-[#007AFF]">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="space-y-4">
                <h3 className="text-5xl font-bold tracking-tight leading-[1.1]">L&apos;Emblème.</h3>
                <p className="text-xl text-[#86868B] max-w-md font-medium">
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
                  <p className="text-sm font-bold uppercase tracking-widest text-black/40">Ciselage...</p>
                </div>
              ) : logoProposals.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 w-full">
                  {logoProposals.map((p, i) => (
                    <div key={i} className="aspect-square bg-white rounded-[40px] shadow-xl border border-black/5 p-6 group relative overflow-hidden">
                      <PreviewWatermark src={p.url} alt={`Option ${i + 1}`} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <button onClick={(e) => handleDownloadLogo(e, p.urlTransparent || p.url, i)} className="text-white text-[10px] font-bold uppercase tracking-widest hover:underline">Download PNG</button>
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

              <Button
                onClick={() => onComplete()}
                className="h-16 px-12 rounded-[24px] bg-[#1D1D1F] text-white w-full max-w-md font-bold text-sm uppercase tracking-widest shadow-2xl mt-4"
              >
                {logoProposals.length > 0 ? "Valider & Continuer" : "Continuer sans logo"} <ArrowRight className="w-5 h-5 ml-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showLogoStep) return renderLogoStep();

  if (viewMode === 'chat') {
    const inspirName = referenceBrands.find(b => b.slug === selectedSlug)?.brandName
      || referenceBrands.find(b => b.slug === brand?.templateBrandSlug)?.brandName
      || (brand?.templateBrandSlug ?? null);

    return (
      <Phase1StrategyChat
        brandId={brandId}
        brand={brand}
        onComplete={onComplete}
        canComplete={canComplete}
        userPlan={userPlan}
        onShowClassic={() => setViewMode('classic')}
        onShowManifeste={() => setStrategyModalOpen(true)}
        inspirationBrandName={inspirName}
        inspirationBrandSlug={selectedSlug || brand?.templateBrandSlug || null}
        changesRemaining={changesRemaining}
        onStrategyReady={(text) => {
          setStrategyResult(text);
          onStrategyReady?.(text);
        }}
      />
    );
  }

  // --- Simple View (Manifesto Recap) ---
  return (
    <div className="flex-1 w-full bg-[#F5F5F7] flex flex-col items-center relative min-h-0 overflow-y-auto stylish-scrollbar text-[#1D1D1F] pb-32 sm:pb-0">
      <div className="w-full max-w-7xl px-6 sm:px-8 pt-6 sm:pt-10 z-20 flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Phase 1 : La Stratégie</p>
          <h2 className="text-2xl font-bold tracking-tight">Manifeste <span className="text-[#007AFF]">Stratégique</span></h2>
        </div>
        <button
          onClick={() => setViewMode('chat')}
          className="flex items-center gap-2 text-[11px] font-bold text-[#007AFF] bg-white border border-[#007AFF]/20 px-4 py-2 rounded-full shadow-sm hover:bg-[#F5F5F7] transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à Virgil
        </button>
      </div>

      <div className="flex-1 w-full max-w-6xl px-4 sm:px-6 lg:px-8 z-20 py-8">
        {strategyResult ? (
          <div className="rounded-[48px] bg-white shadow-2xl border border-black/5 overflow-hidden">
            <StrategyPresentationView
              isOpen={true}
              onClose={() => setViewMode('chat')}
              strategyText={strategyResult}
              brandName={brandName || brand?.name || ''}
              embedded={true}
              isFree={isFreePlan(userPlan) && !demoMode}
            />
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-[#007AFF]">
              <Compass className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Initialise ta stratégie</h3>
              <p className="text-[#86868B] max-w-sm">
                Discute avec <b>Virgil</b> pour définir ton ADN de marque. Une fois prêt, ton manifeste apparaîtra ici.
              </p>
            </div>
            <Button onClick={() => setViewMode('chat')} className="rounded-full h-12 px-8 bg-[#007AFF] text-white">
              Lancer la discussion
            </Button>
          </div>
        )}
      </div>

      {/* Manifeste Modal */}
      {strategyModalOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300">
          <div className="flex-1 overflow-y-auto">
            <StrategyPresentationView
              isOpen={true}
              onClose={() => setStrategyModalOpen(false)}
              strategyText={strategyResult ?? ''}
              brandName={brandName || brand?.name || ''}
              isTemplateView={false}
              embedded={true}
              isFree={isFreePlan(userPlan) && !demoMode}
            />
          </div>
          <div className="p-6 border-t flex justify-center gap-4 bg-white/80 backdrop-blur-md">
            <Button variant="outline" onClick={() => setStrategyModalOpen(false)} className="rounded-full px-8">Fermer</Button>
            <Button
              onClick={() => {
                const url = `${window.location.origin}/share/strategy/${brandId}`;
                navigator.clipboard.writeText(url);
                toast({ title: 'Lien copié !', message: 'Le lien de partage public a été copié.', type: 'success' });
              }}
              className="rounded-full px-8 bg-[#007AFF] text-white"
            >
              Partager
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
