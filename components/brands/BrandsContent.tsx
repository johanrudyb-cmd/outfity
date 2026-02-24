'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { useQuota } from '@/lib/hooks/useQuota';
import { ConfirmGenerateModal } from '@/components/ui/confirm-generate-modal';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { CURATED_TOP_BRANDS, CYCLE_PHASE_LABELS, LAUNCH_POTENTIAL_LABELS, getBrandLogoUrl, brandNameToSlug, getBrandKeyNormalized, type CuratedBrand } from '@/lib/curated-brands';
import { REFERENCE_BRAND_WEBSITES, toSlug } from '@/lib/constants/audience-reference-brands';
import { BrandLogo } from './BrandLogo';

/** URLs des sites officiels des marques (aucune plateforme). */
const BRAND_URLS: Record<string, string> = {
  "arc'teryx": 'https://arcteryx.com/fr/fr/',
  'stone island': 'https://www.stoneisland.com/fr/',
  zara: 'https://www.zara.com/fr/',
  adidas: 'https://www.adidas.fr/',
  'massimo dutti': 'https://www.massimodutti.com/fr/',
  'carhartt wip': 'https://www.carhartt-wip.com/',
  'ami paris': 'https://amiparis.com/fr/',
  salomon: 'https://www.salomon.com/fr-fr/',
  'mango man': 'https://shop.mango.com/fr/',
  mango: 'https://shop.mango.com/fr/',
  "h&m edition": 'https://www2.hm.com/fr_fr/',
};

function getBrandUrl(brandName: string): string {
  const key = brandName.toLowerCase().trim();
  const normalized = getBrandKeyNormalized(brandName);

  // 1. Recherche dans BRAND_URLS local
  const localUrl = BRAND_URLS[key] ?? BRAND_URLS[key.replace(/\s+/g, ' ')];
  if (localUrl) return localUrl;

  // 2. Recherche dans la liste globale de référence (constants)
  // On cherche par clé exacte puis par clé normalisée
  for (const [name, url] of Object.entries(REFERENCE_BRAND_WEBSITES)) {
    if (name.toLowerCase().trim() === key || getBrandKeyNormalized(name) === normalized) {
      return url;
    }
  }

  return '#';
}

function getDomain(url: string): string {
  if (!url || url === '#') return '';
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}


import { BrandAnalyzer } from './BrandAnalyzer';

import { useSession } from 'next-auth/react';
import { Lock } from 'lucide-react';

export function BrandsContent() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();

  // ... (rest of the component state)
  const [view, setView] = useState<'ranking' | 'analyzer'>('ranking');
  const [brands, setBrands] = useState<CuratedBrand[]>(CURATED_TOP_BRANDS);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingBrand, setLoadingBrand] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showConfirmAnalyze, setShowConfirmAnalyze] = useState(false);
  const [brandToAnalyze, setBrandToAnalyze] = useState<CuratedBrand | null>(null);
  const analyzeQuota = useQuota('brand_analyze');

  useEffect(() => {
    async function fetchMonthlyBrands() {
      try {
        const res = await fetch('/api/cron/update-trending-brands');
        const data = await res.json();
        if (data.brands && data.brands.length > 0) {
          // Mapper les données de la DB vers le format CuratedBrand
          const mapped: CuratedBrand[] = data.brands.map((b: any) => ({
            rank: b.rank,
            brand: b.brand,
            score: b.score,
            scoreValue: b.scoreValue,
            signaturePiece: b.signaturePiece,
            dominantStyle: b.dominantStyle,
            cyclePhase: b.cyclePhase as any,
            launchPotential: b.launchPotential as any,
            indicativePrice: b.indicativePrice,
            websiteUrl: b.websiteUrl,
          }));
          setBrands(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch monthly brands:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    fetchMonthlyBrands();
  }, []);

  const handleAnalyze = async (brand: CuratedBrand) => {
    setLoadingBrand(brand.brand);
    setError('');

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

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }

      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
      router.push(`/brands/analyze/${brandNameToSlug(brand.brand)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoadingBrand(null);
    }
  };

  if (user?.plan === 'free') {
    return (
      <div className="space-y-6">
        {/* Header (visible but content locked) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Marques tendances
            </h1>
            <p className="text-muted-foreground text-sm">
              Découvrez les marques qui performent et analysez leur stratégie.
            </p>
          </div>
        </div>

        <div className="relative rounded-xl border-2 border-dashed p-12 text-center bg-muted/10 overflow-hidden">
          {/* Blur effect over fake content */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 shadow-xl">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-black text-black mb-2 uppercase tracking-tight">Fonctionnalité Premium</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              L'accès au classement des marques tendances et à l'analyseur stratégique est réservé aux membres Créateur.
            </p>
            <Link
              href="/auth/choose-plan"
              className="px-8 py-3 bg-[#007AFF] text-white rounded-full text-sm font-bold hover:bg-[#007AFF]/90 transition-all active:scale-95 shadow-xl uppercase tracking-widest"
            >
              Passer au Plan Créateur
            </Link>
          </div>

          {/* Fake background content to show behind blur */}
          <div className="grid grid-cols-1 gap-4 opacity-20 filter blur-sm pointer-events-none select-none">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GenerationLoadingPopup
        open={!!loadingBrand}
        title={loadingBrand ? `Analyse de ${loadingBrand} en cours…` : 'Analyse en cours…'}
      />
      {/* Header + CTA Analyse marques tendances */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Marques tendances
          </h1>
          <p className="text-muted-foreground text-sm">
            {view === 'ranking'
              ? "Les marques du radar pour s'inspirer."
              : "Analysez n'importe quelle marque pour en extraire sa stratégie."}
          </p>
        </div>

        {/* Switch / Onglets style Apple */}
        <div className="flex bg-muted/60 p-1 rounded-xl w-fit shrink-0">
          <button
            onClick={() => setView('ranking')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${view === 'ranking'
              ? 'bg-white text-primary shadow-apple-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Classement
          </button>
          <button
            onClick={() => setView('analyzer')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${view === 'analyzer'
              ? 'bg-white text-primary shadow-apple-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Analyseur
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {view === 'analyzer' ? (
        <BrandAnalyzer />
      ) : (
        <div className="space-y-4">
          {loadingInitial ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="border-2 p-6 h-40 animate-pulse bg-muted/20" />
              ))}
            </div>
          ) : (
            <>
              {/* Version Mobile / Cartes (masqué sur desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {brands.map((brand) => {
                  const websiteUrl = brand.websiteUrl || getBrandUrl(brand.brand);
                  const domain = getDomain(websiteUrl);
                  const isLoading = loadingBrand === brand.brand;

                  return (
                    <Card key={brand.brand} className="border-2 overflow-hidden">
                      <CardContent className="p-4 space-y-4">
                        {/* Header: Logo + Rang + Nom */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <BrandLogo
                              logoUrl={getBrandLogoUrl(brand.brand, websiteUrl)}
                              brandName={brand.brand}
                              className="w-12 h-12"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary text-sm">#{brand.rank}</span>
                                <p className="font-bold text-lg">{brand.brand}</p>
                              </div>
                              <a
                                href={websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                              >
                                {domain}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</p>
                            <span className="inline-flex items-center gap-1 font-bold text-lg text-green-600">
                              {brand.score}
                              <span className="text-sm">↑</span>
                            </span>
                          </div>
                        </div>

                        {/* Tags / Badges */}
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${brand.cyclePhase === 'emergent'
                              ? 'bg-blue-100 text-blue-700'
                              : brand.cyclePhase === 'croissance'
                                ? 'bg-green-100 text-green-700'
                                : brand.cyclePhase === 'pic'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                          >
                            {CYCLE_PHASE_LABELS[brand.cyclePhase]}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${brand.launchPotential === 'opportunite'
                              ? 'bg-emerald-100 text-emerald-700'
                              : brand.launchPotential === 'a_surveiller'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                              }`}
                          >
                            {LAUNCH_POTENTIAL_LABELS[brand.launchPotential]}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                            {brand.dominantStyle}
                          </span>
                        </div>

                        {/* Détails secondaires */}
                        <div className="grid grid-cols-2 gap-4 py-3 border-y border-dashed">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Prix moyen</p>
                            <p className="text-sm font-bold">{brand.indicativePrice}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Pièce phare</p>
                            <p className="text-sm font-medium truncate">{brand.signaturePiece}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 rounded-xl h-10"
                            onClick={() => { setBrandToAnalyze(brand); setShowConfirmAnalyze(true); }}
                            disabled={!!loadingBrand}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            Analyser
                          </Button>
                          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button variant="ghost" size="sm" className="w-full gap-2 rounded-xl h-10 bg-muted/30">
                              <ExternalLink className="w-4 h-4" />
                              Visiter
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Version Desktop / Tableau (masqué sur mobile) */}
              <Card className="border-2 overflow-hidden hidden lg:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-4 px-4 font-semibold text-sm">Rang</th>
                          <th className="text-left py-4 px-4 font-semibold text-sm">Marque</th>
                          <th className="text-left py-4 px-4 font-semibold text-sm">Score</th>
                          <th className="text-left py-4 px-4 font-semibold text-sm">Phase</th>
                          <th className="text-left py-4 px-4 font-semibold text-sm">Potentiel</th>
                          <th className="text-left py-4 px-4 font-semibold text-sm">Prix</th>
                          <th className="text-left py-4 px-4 font-semibold text-sm">Pièce maîtresse</th>
                          <th className="text-left py-4 px-4 font-semibold text-sm">Style</th>
                          <th className="text-right py-4 px-4 font-semibold text-sm">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brands.map((brand) => {
                          const websiteUrl = brand.websiteUrl || getBrandUrl(brand.brand);
                          const domain = getDomain(websiteUrl);
                          const isLoading = loadingBrand === brand.brand;
                          return (
                            <tr
                              key={brand.brand}
                              className="border-b last:border-b-0 transition-colors hover:bg-muted/30"
                            >
                              <td className="py-4 px-4">
                                <span className="font-bold text-primary">#{brand.rank}</span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <BrandLogo
                                    logoUrl={getBrandLogoUrl(brand.brand, websiteUrl)}
                                    brandName={brand.brand}
                                    className="w-10 h-10"
                                  />
                                  <div>
                                    <p className="font-semibold text-sm">{brand.brand}</p>
                                    <a
                                      href={websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                                    >
                                      {domain}
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center gap-1 font-semibold text-green-600">
                                  {brand.score}
                                  <span className="text-green-500">↑</span>
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${brand.cyclePhase === 'emergent'
                                    ? 'bg-blue-100 text-blue-700'
                                    : brand.cyclePhase === 'croissance'
                                      ? 'bg-green-100 text-green-700'
                                      : brand.cyclePhase === 'pic'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                >
                                  {CYCLE_PHASE_LABELS[brand.cyclePhase]}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${brand.launchPotential === 'opportunite'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : brand.launchPotential === 'a_surveiller'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-red-100 text-red-700'
                                    }`}
                                >
                                  {LAUNCH_POTENTIAL_LABELS[brand.launchPotential]}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-xs font-bold">
                                {brand.indicativePrice}
                              </td>
                              <td className="py-4 px-4 text-xs text-muted-foreground max-w-[140px] truncate">
                                {brand.signaturePiece}
                              </td>
                              <td className="py-4 px-4 text-xs">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-wider">
                                  {brand.dominantStyle}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-1 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-[10px]"
                                    onClick={() => { setBrandToAnalyze(brand); setShowConfirmAnalyze(true); }}
                                    disabled={!!loadingBrand}
                                  >
                                    {isLoading ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3.5 h-3.5" />
                                    )}
                                    Analyser
                                  </Button>
                                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[10px]">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      Visiter
                                    </Button>
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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
        loading={!!loadingBrand}
      />
    </div>
  );
}
