'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, BarChart3, Globe, Sparkles, Loader2, Palette, Mail, ImagePlus } from 'lucide-react';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';

export interface TrendDetailModalTrend {
  productName: string;
  productType: string;
  cut: string | null;
  material: string | null;
  color: string | null;
  brands: string[];
  averagePrice: number;
  confirmationScore: number;
  isConfirmed: boolean;
  country: string | null;
  countries?: string[];
  style: string | null;
  imageUrl?: string | null;
  generatedImageUrl?: string | null;
  /** Conseils IA (après scrape) */
  aiAdvice?: string | null;
  /** Note IA 1-10 (après scrape) */
  aiRating?: number | null;
  recommendation?: 'recommended' | 'avoid';
  segment?: 'homme' | 'femme' | 'enfant' | null;
}

interface TrendDetailModalProps {
  trend: TrendDetailModalTrend;
  onClose: () => void;
  onCreateDesign: (trend: TrendDetailModalTrend) => void;
  onRequestQuote: (trend: TrendDetailModalTrend) => void;
  onImageGenerated?: () => void;
}

const countryLabel: Record<string, string> = {
  FR: 'France',
  UK: 'Royaume-Uni',
  DE: 'Allemagne',
  US: 'États-Unis',
  ES: 'Espagne',
  IT: 'Italie',
};

export function TrendDetailModal({
  trend,
  onClose,
  onCreateDesign,
  onRequestQuote,
  onImageGenerated,
}: TrendDetailModalProps) {
  const [extraAdvice, setExtraAdvice] = useState<string | null>(null);
  const [extraAdviceLoading, setExtraAdviceLoading] = useState(false);
  const [extraAdviceError, setExtraAdviceError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(trend.generatedImageUrl ?? null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const hasStoredAdvice = !!trend.aiAdvice?.trim();
  const displayAdvice = trend.aiAdvice ?? null;
  const trendCut = trend.cut ?? '';
  const trendMaterial = trend.material ?? '';
  const trendColor = trend.color ?? '';
  const trendStyle = trend.style ?? '';
  const trendCountry = trend.country ?? '';
  const trendBrands = trend.brands;
  const trendAveragePrice = trend.averagePrice;
  const trendConfirmationScore = trend.confirmationScore;

  useEffect(() => {
    setGeneratedImageUrl(trend.generatedImageUrl ?? null);
    setImageError(null);
  }, [trend.generatedImageUrl, trend.productName, trend.productType, trendCut, trendMaterial]);

  // Analyse détaillée optionnelle (si pas d'advice stocké ou pour compléter)
  useEffect(() => {
    if (hasStoredAdvice) return;
    let cancelled = false;
    setExtraAdvice(null);
    setExtraAdviceError(null);
    setExtraAdviceLoading(true);
    (async () => {
      try {
        const res = await fetch('/api/trends/analyse-ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: trend.productName,
            productType: trend.productType,
            cut: trendCut || null,
            material: trendMaterial || null,
            color: trendColor || null,
            style: trendStyle || null,
            country: trendCountry || null,
            brands: trendBrands,
            averagePrice: trendAveragePrice,
            confirmationScore: trendConfirmationScore,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || 'Erreur');
        setExtraAdvice(data.analysis || '');
      } catch (e) {
        if (!cancelled) setExtraAdviceError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        if (!cancelled) setExtraAdviceLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [hasStoredAdvice, trend.productName, trend.productType, trendCut, trendMaterial, trendColor, trendStyle, trendCountry, trendBrands, trendAveragePrice, trendConfirmationScore]);

  const imgSrc = (generatedImageUrl?.startsWith('http') ? generatedImageUrl : null)
    || (trend.generatedImageUrl?.startsWith('http') ? trend.generatedImageUrl : null)
    || (trend.imageUrl?.startsWith('http') ? trend.imageUrl : null);

  const handleGenerateImage = async () => {
    setImageGenerating(true);
    setImageError(null);
    try {
      const res = await fetch('/api/trends/generate-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: trend.productName,
          productType: trend.productType,
          cut: trend.cut,
          material: trend.material,
          color: trend.color,
          style: trend.style,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setGeneratedImageUrl(data.imageUrl);
      onImageGenerated?.();
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setImageGenerating(false);
    }
  };

  const markets = trend.countries?.length ? trend.countries : (trend.country ? [trend.country] : []);
  const isRecommended = trend.recommendation === 'recommended';
  const isAvoid = trend.recommendation === 'avoid';

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border shadow-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="shrink-0 flex flex-row items-start justify-between gap-4 border-b">
          <div className="min-w-0">
            <CardTitle className="text-xl font-semibold leading-tight">{trend.productName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {[trend.productType, trend.cut, trend.material].filter(Boolean).join(' · ') || '—'}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {trend.aiRating != null && (
                <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs font-semibold">
                  Score {trend.aiRating}/10
                </span>
              )}
              {trend.segment && (
                <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs font-medium capitalize">
                  {trend.segment}
                </span>
              )}
              {isRecommended && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-xs font-medium">
                  À privilégier
                </span>
              )}
              {isAvoid && (
                <span className="px-2 py-0.5 rounded-md bg-amber-600/90 text-white text-xs font-medium">
                  À éviter
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
          <div className="flex flex-col gap-2">
            {imgSrc && (
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <Image src={imgSrc} alt={trend.productName} fill sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full"
              onClick={handleGenerateImage}
              disabled={imageGenerating}
            >
              {imageGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération de l&apos;image…
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4" />
                  Analyse visuelle
                  <GenerationCostBadge feature="trends_generate_image" />
                </>
              )}
            </Button>
            {imageError && <p className="text-sm text-destructive">{imageError}</p>}
          </div>

          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              Pourquoi c&apos;est une tendance
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ce produit est présent chez <strong>{trend.brands.length} marque{trend.brands.length > 1 ? 's' : ''}</strong>, avec un score de confirmation de{' '}
              <strong>{trend.confirmationScore}/5</strong>. Plus le score est élevé, plus la tendance est répandue sur le marché.
              {isAvoid && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  Cette tendance est en déclin ou très saturée : à éviter pour de nouveaux achats.
                </span>
              )}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4" />
              KPIs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Score tendance</div>
                <div className="text-lg font-semibold">{trend.confirmationScore}/5</div>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Nombre de marques</div>
                <div className="text-lg font-semibold">{trend.brands.length}</div>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Style</div>
                <div className="text-sm font-medium truncate">{trend.style || '—'}</div>
              </div>
            </div>
          </div>

          {markets.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4" />
                Marchés où la tendance est présente
              </h3>
              <p className="text-sm text-muted-foreground">
                Vous pouvez voir les tendances en France (marché principal) ou dans d&apos;autres pays pour ramener une tendance d&apos;ailleurs.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {markets.map((c) => (
                  <span
                    key={c}
                    className={`px-2 py-1 rounded-md text-xs font-medium ${c === 'FR' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {countryLabel[c] || c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              Analyses et recommandations
            </h3>
            {displayAdvice && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-3">
                {displayAdvice}
              </div>
            )}
            {!hasStoredAdvice && extraAdviceLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyse en cours…
              </div>
            )}
            {!hasStoredAdvice && extraAdviceError && (
              <p className="text-sm text-destructive">{extraAdviceError}</p>
            )}
            {!hasStoredAdvice && extraAdvice && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {extraAdvice}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={() => onCreateDesign(trend)}>
              <Palette className="w-4 h-4" />
              Créer un design
            </Button>
            <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={() => onRequestQuote(trend)}>
              <Mail className="w-4 h-4" />
              Demander un devis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
