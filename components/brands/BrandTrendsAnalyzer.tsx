'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  Copy,
  Download,
  X,
  RefreshCw,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  CURATED_TOP_BRANDS,
  CYCLE_PHASE_LABELS,
  LAUNCH_POTENTIAL_LABELS,
  getBrandLogoUrl,
  brandNameToSlug,
  type CuratedBrand,
} from '@/lib/curated-brands';
import { REFERENCE_BRAND_WEBSITES } from '@/lib/constants/audience-reference-brands';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { useQuota } from '@/lib/hooks/useQuota';
import { ConfirmGenerateModal } from '@/components/ui/confirm-generate-modal';
import { BrandLogo } from './BrandLogo';
import { StrategyPresentationView } from '@/components/launch-map/StrategyPresentationView';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function AnalysisProse({ text }: { text: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3 prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-semibold mt-6 mb-2 first:mt-0">
              {line.replace(/^## /, '')}
            </h2>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 my-1 ml-4">
              <span className="text-muted-foreground">•</span>
              <span>{line.replace(/^[-*] /, '')}</span>
            </div>
          );
        }
        if (line.trim()) {
          return (
            <p key={i} className="my-2 leading-relaxed">
              {line}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}

const CALQUER_CONFIRM_MESSAGE =
  'Êtes-vous sûr ? Toutes les étapes de Gérer ma marque seront réinitialisées à 0. Seule la stratégie que vous venez de générer sera appliquée.';

export function BrandTrendsAnalyzer() {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState<CuratedBrand | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState('');
  const [strategyResult, setStrategyResult] = useState<string | null>(null);
  const [creatorBrandName, setCreatorBrandName] = useState('');
  const [strategyBudget, setStrategyBudget] = useState('');
  const [strategyPositioning, setStrategyPositioning] = useState('');
  const [strategyTargetAudience, setStrategyTargetAudience] = useState('');
  const [calquerLoading, setCalquerLoading] = useState(false);
  const [calquerError, setCalquerError] = useState('');
  const [showConfirmAnalyze, setShowConfirmAnalyze] = useState(false);
  const [brandToAnalyze, setBrandToAnalyze] = useState<CuratedBrand | null>(null);
  const analyzeQuota = useQuota('brand_analyze');

  const { data: brandsData } = useSWR<{ brands?: { id: string }[] }>(
    '/api/brands',
    fetcher
  );

  const userBrandId = useMemo(() => {
    return brandsData?.brands?.[0]?.id ?? null;
  }, [brandsData]);

  const handleAnalyze = async (brand: CuratedBrand) => {
    setSelectedBrand(brand);
    setLoading(true);
    setError('');
    setAnalysis(null);

    const context = {
      signaturePiece: brand.signaturePiece,
      dominantStyle: brand.dominantStyle,
      cyclePhase: CYCLE_PHASE_LABELS[brand.cyclePhase],
      launchPotential: LAUNCH_POTENTIAL_LABELS[brand.launchPotential],
      indicativePrice: brand.indicativePrice,
      rank: brand.rank,
      score: brand.score,
    };

    try {
      const res = await fetch('/api/brands/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: brand.brand, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'analyse");
      setAnalysis(data.analysis || '');
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const openStrategyModal = () => {
    setStrategyResult(null);
    setStrategyError('');
    setModalOpen(true);
  };

  const closeStrategyModal = () => {
    setModalOpen(false);
    setStrategyResult(null);
    setStrategyError('');
    setCalquerError('');
  };

  const handleGenerateStrategy = async () => {
    const name = creatorBrandName.trim();
    if (!name || name.length < 2) {
      setStrategyError('Saisissez le nom de votre marque (2 caractères min.)');
      return;
    }
    if (!analysis || !selectedBrand) {
      setStrategyError('Analyse de marque manquante.');
      return;
    }

    setStrategyLoading(true);
    setStrategyError('');
    setStrategyResult(null);

    try {
      const res = await fetch('/api/brands/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateBrandName: selectedBrand.brand,
          creatorBrandName: name,
          analysisText: analysis,
          budget: strategyBudget.trim() || undefined,
          positioning: strategyPositioning.trim() || undefined,
          targetAudience: strategyTargetAudience.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération');
      setStrategyResult(data.strategy || '');
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
    } catch (err: unknown) {
      setStrategyError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setStrategyLoading(false);
    }
  };

  const downloadStrategy = () => {
    if (!strategyResult || !creatorBrandName.trim()) return;
    const filename = `strategie-${creatorBrandName.trim().replace(/\s+/g, '-').toLowerCase()}.md`;
    const blob = new Blob([strategyResult], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCalquerStrategy = async () => {
    if (!strategyResult || !selectedBrand || !userBrandId) return;
    if (!window.confirm(CALQUER_CONFIRM_MESSAGE)) return;
    setCalquerError('');
    setCalquerLoading(true);
    try {
      const res = await fetch('/api/launch-map/apply-strategy-and-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: userBrandId,
          templateBrandSlug: brandNameToSlug(selectedBrand.brand),
          templateBrandName: selectedBrand.brand,
          strategyText: strategyResult,
          positioning: strategyPositioning.trim() || undefined,
          targetAudience: strategyTargetAudience.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du calquage');
      closeStrategyModal();
      router.push('/launch-map');
    } catch (err: unknown) {
      setCalquerError(err instanceof Error ? err.message : 'Erreur lors du calquage');
    } finally {
      setCalquerLoading(false);
    }
  };

  const currentBrandName = selectedBrand?.brand ?? '';

  if (selectedBrand && analysis) {
    return (
      <>
        <GenerationLoadingPopup
          open={strategyLoading || calquerLoading}
          title={calquerLoading ? 'Calquage de la stratégie…' : 'Génération de la stratégie…'}
        />
        <StrategyPresentationView
          strategyText={analysis}
          brandName={selectedBrand.brand}
          templateBrandName={selectedBrand.brand}
          isTemplateView
          titleMode="analysis"
          onClose={() => {
            setAnalysis(null);
            setSelectedBrand(null);
          }}
          optionalPrimaryAction={{
            label: 'Calquer la stratégie',
            onClick: openStrategyModal,
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      <GenerationLoadingPopup
        open={loading || strategyLoading || calquerLoading}
        title={
          loading ? 'Analyse de la marque…' : calquerLoading ? 'Calquage de la stratégie…' : 'Génération de la stratégie…'
        }
      />
      {/* Colonne gauche : liste des marques tendances */}
      <aside className="lg:w-80 xl:w-96 shrink-0 flex flex-col border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm">Marques tendances</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sélectionnez une marque pour lancer l&apos;analyse IA
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {CURATED_TOP_BRANDS.map((brand) => {
            const isSelected = selectedBrand?.brand === brand.brand;
            const isLoading = loading && isSelected;
            return (
              <button
                key={brand.brand}
                type="button"
                onClick={() => { setBrandToAnalyze(brand); setShowConfirmAnalyze(true); }}
                disabled={loading}
                className={`w-full text-left rounded-lg p-3 flex items-center gap-3 transition-colors border mb-1.5 ${isSelected
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                  : 'border-transparent hover:bg-muted/50'
                  }`}
              >
                <BrandLogo
                  logoUrl={getBrandLogoUrl(brand.brand, Object.entries(REFERENCE_BRAND_WEBSITES).find(([name]) => name.toLowerCase().trim() === brand.brand.toLowerCase().trim())?.[1])}
                  brandName={brand.brand}
                  className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-muted"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-xs">#{brand.rank}</span>
                    <span className="font-semibold text-sm truncate">{brand.brand}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-green-600 font-medium">{brand.score}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${brand.cyclePhase === 'emergent'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : brand.cyclePhase === 'croissance'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : brand.cyclePhase === 'pic'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                    >
                      {CYCLE_PHASE_LABELS[brand.cyclePhase]}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <BarChart3 className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Colonne droite : zone d'analyse */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/brands">
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 truncate">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              Analyse des marques tendances
            </h1>
            <p className="text-muted-foreground text-sm truncate">
              Positionnement, canaux, pricing, opportunités — puis dupliquez pour votre marque
            </p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col border-2 overflow-hidden min-h-[400px]">
          {!selectedBrand && (
            <CardContent className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Sélectionnez une marque</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Cliquez sur une marque dans la liste à gauche pour lancer l&apos;analyse IA (positionnement, cible, canaux, pricing, opportunités).
              </p>
            </CardContent>
          )}

          {selectedBrand && loading && (
            <CardContent className="flex-1 flex flex-col items-center justify-center py-16 animate-fade-in">
              <div className="w-8 h-8 border-2 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-apple-spin mb-3" />
              <p className="text-[#1D1D1F]/60 text-sm">Analyse en cours — {selectedBrand.brand}…</p>
            </CardContent>
          )}

          {selectedBrand && error && (
            <CardContent className="flex-1 flex flex-col items-center justify-center py-16">
              <p className="text-destructive font-medium text-center">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => { setBrandToAnalyze(selectedBrand); setShowConfirmAnalyze(true); }}>
                Réessayer
              </Button>
            </CardContent>
          )}

          {selectedBrand && analysis && (
            <>
              <CardHeader className="border-b bg-muted/30 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Analyse — {selectedBrand.brand}</CardTitle>
                    <CardDescription>
                      Pièce maîtresse : {selectedBrand.signaturePiece} · {selectedBrand.dominantStyle}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="default" size="sm" onClick={openStrategyModal} className="gap-2">
                      <Copy className="w-4 h-4" />
                      Dupliquer pour ma marque
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setBrandToAnalyze(selectedBrand); setShowConfirmAnalyze(true); }}
                      disabled={loading}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Actualiser
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                <AnalysisProse text={analysis} />
              </CardContent>
            </>
          )}
        </Card>
      </main>

      {/* Modal Dupliquer pour ma marque */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95"
          onClick={(e) => e.target === e.currentTarget && closeStrategyModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="strategy-modal-title"
        >
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col border-2 shadow-xl bg-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b shrink-0">
              <div>
                <CardTitle id="strategy-modal-title" className="text-lg flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  Dupliquer pour ma marque
                </CardTitle>
                <CardDescription>
                  Plan stratégique personnalisé inspiré de {currentBrandName}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeStrategyModal} aria-label="Fermer">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1 space-y-4">
              {!strategyResult ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="creator-brand-modal" className="text-sm font-medium">
                      Nom de votre marque <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="creator-brand-modal"
                      placeholder="Ex. Ma Marque"
                      value={creatorBrandName}
                      onChange={(e) => {
                        setCreatorBrandName(e.target.value);
                        setStrategyError('');
                      }}
                      disabled={strategyLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="strategy-budget-modal" className="text-sm font-medium text-muted-foreground">
                      Budget indicatif (optionnel)
                    </label>
                    <Input
                      id="strategy-budget-modal"
                      placeholder="Ex. 5 000 € pour le lancement"
                      value={strategyBudget}
                      onChange={(e) => setStrategyBudget(e.target.value)}
                      disabled={strategyLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="strategy-positioning-modal" className="text-sm font-medium text-muted-foreground">
                      Positionnement souhaité (optionnel)
                    </label>
                    <Input
                      id="strategy-positioning-modal"
                      placeholder="Ex. streetwear premium, durable"
                      value={strategyPositioning}
                      onChange={(e) => setStrategyPositioning(e.target.value)}
                      disabled={strategyLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="strategy-audience-modal" className="text-sm font-medium text-muted-foreground">
                      Cible visée (optionnel)
                    </label>
                    <Input
                      id="strategy-audience-modal"
                      placeholder="Ex. 18-30 ans, urbains, sensibles à l'éthique"
                      value={strategyTargetAudience}
                      onChange={(e) => setStrategyTargetAudience(e.target.value)}
                      disabled={strategyLoading}
                    />
                  </div>
                  {strategyError && <p className="text-sm text-destructive font-medium">{strategyError}</p>}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleGenerateStrategy} disabled={strategyLoading} className="gap-2">
                      {strategyLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Génération…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Générer ma stratégie
                          <GenerationCostBadge feature="brand_strategy" />
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={closeStrategyModal} disabled={strategyLoading}>
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="max-h-[50vh] overflow-y-auto rounded-lg border bg-muted/30 p-4">
                    <AnalysisProse text={strategyResult} />
                  </div>
                  {calquerError && (
                    <p className="text-sm text-destructive font-medium">{calquerError}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      onClick={handleCalquerStrategy}
                      disabled={calquerLoading || !userBrandId}
                      className="gap-2"
                    >
                      {calquerLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Calquer la stratégie (réinitialise Gérer ma marque)
                    </Button>
                    <Button onClick={downloadStrategy} variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Télécharger en .md
                    </Button>
                    <Button variant="outline" onClick={() => setStrategyResult(null)} disabled={strategyLoading}>
                      Nouvelle stratégie
                    </Button>
                    <Button variant="ghost" onClick={closeStrategyModal}>
                      Fermer
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmGenerateModal
        open={showConfirmAnalyze}
        onClose={() => { setShowConfirmAnalyze(false); setBrandToAnalyze(null); }}
        onConfirm={() => {
          const b = brandToAnalyze;
          setShowConfirmAnalyze(false);
          setBrandToAnalyze(null);
          if (b) handleAnalyze(b);
        }}
        actionLabel={brandToAnalyze ? `Analyser ${brandToAnalyze.brand}` : 'Analyser cette marque'}
        remaining={analyzeQuota?.remaining ?? 0}
        limit={analyzeQuota?.limit ?? 10}
        loading={loading}
      />
    </div>
  );
}
