'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertCircle, Zap, Mail, Palette, Eye } from 'lucide-react';
import { TrendDetailModal, type TrendDetailModalTrend } from './TrendDetailModal';
import { useDebounce } from '@/lib/hooks/useDebounce';
// Graphiques désactivés temporairement (recharts déjà installé mais peut nécessiter configuration)
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendSignal {
  productName: string;
  productType: string;
  cut: string | null;
  material: string | null;
  color: string | null;
  brands: string[];
  averagePrice: number;
  confirmationScore: number;
  isConfirmed: boolean;
  firstSeenAt: string;
  confirmedAt: string | null;
  country: string | null;
  countries?: string[];
  style: string | null;
  imageUrl?: string | null;
  /** Image générée par IA après enrichissement */
  generatedImageUrl?: string | null;
  /** Conseils IA sur la tendance (après scrape) */
  aiAdvice?: string | null;
  /** Note IA 1-10 (après scrape) */
  aiRating?: number | null;
  /** À privilégier (bonne tendance) ou à éviter (déclin / saturé) */
  recommendation?: 'recommended' | 'avoid';
  /** Segment : homme, femme ou enfant */
  segment?: 'homme' | 'femme' | 'enfant' | null;
}

interface TrendStats {
  byCountry: Array<{ country: string | null; count: number }>;
  byStyle: Array<{ style: string | null; count: number }>;
  byProductType: Array<{ productType: string; count: number }>;
  byCountryAndStyle: Array<{ country: string | null; style: string | null; count: number }>;
}

interface TrendRadarProps {
  userId: string;
}

export function TrendRadar({ userId }: TrendRadarProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  // Filtres (marché FR par défaut)
  const [selectedCountry, setSelectedCountry] = useState<string>('FR');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');

  // Debounce des filtres pour éviter trop de requêtes
  const debouncedCountry = useDebounce(selectedCountry, 500);
  const debouncedStyle = useDebounce(selectedStyle, 500);
  const debouncedProductType = useDebounce(selectedProductType, 500);
  const debouncedSegment = useDebounce(selectedSegment, 500);

  // Modal détail d'une tendance
  const [detailTrend, setDetailTrend] = useState<TrendSignal | null>(null);

  const trendsParams = new URLSearchParams();
  if (debouncedCountry) trendsParams.append('country', debouncedCountry);
  if (debouncedStyle) trendsParams.append('style', debouncedStyle);
  if (debouncedProductType) trendsParams.append('productType', debouncedProductType);
  if (debouncedSegment) trendsParams.append('segment', debouncedSegment);
  trendsParams.append('limit', '50');

  const { data: trendsData, isLoading: isTrendsLoading, mutate: mutateTrends } = useSWR(
    `/api/trends/confirmed?${trendsParams.toString()}`,
    fetcher
  );

  const { data: statsData, mutate: mutateStats } = useSWR(
    '/api/trends/stats',
    fetcher
  );

  const trends = trendsData?.trends || [];
  const isLoading = isTrendsLoading;

  const stats = useMemo<TrendStats>(() => ({
    byCountry: statsData?.byCountry || [],
    byStyle: statsData?.byStyle || [],
    byProductType: statsData?.byProductType || [],
    byCountryAndStyle: statsData?.byCountryAndStyle || [],
  }), [statsData]);

  const loadTrends = () => mutateTrends();
  const loadStats = () => mutateStats();

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/trends/scan-big-brands', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        // Recharger les tendances
        await loadTrends();
        const enrichedMsg = data.trendsEnriched > 0
          ? ` ${data.trendsEnriched} enrichie(s) par l'analyse (recommandations + score).`
          : '';
        alert(`Scan terminé ! ${data.trendsConfirmed} tendances confirmées.${enrichedMsg}`);
      } else {
        throw new Error(data.error || 'Erreur lors du scan');
      }
    } catch (error: unknown) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleEnrichTrends = async () => {
    setIsEnriching(true);
    try {
      const res = await fetch('/api/trends/enrich?limit=20', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await loadTrends();
        await loadStats();
        alert(data.message + (data.errors?.length ? '\nErreurs : ' + data.errors.slice(0, 3).join('; ') : ''));
      } else {
        throw new Error(data.error || 'Erreur');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur lors de l\'enrichissement');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleCreateDesign = async (trend: TrendSignal | TrendDetailModalTrend) => {
    try {
      // Convertir la tendance en données pour le Design Studio
      const response = await fetch('/api/trends/to-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: trend.productType,
          cut: trend.cut,
          material: trend.material,
          color: trend.color,
          style: trend.style,
          productName: trend.productName,
          averagePrice: trend.averagePrice,
          brands: trend.brands,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Rediriger vers le Design Studio avec les données pré-remplies
        const params = new URLSearchParams({
          type: data.designData.type,
          cut: data.designData.cut || '',
          material: data.designData.material || '',
          prompt: encodeURIComponent(data.designData.customPrompt),
        });

        window.location.href = `/design-studio?${params.toString()}`;
      } else {
        throw new Error(data.error || 'Erreur lors de la création');
      }
    } catch (error: unknown) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    }
  };

  const handleRequestQuote = async (trend: TrendSignal | TrendDetailModalTrend) => {
    try {
      // Générer l'email pour le fournisseur
      const response = await fetch('/api/trends/supplier-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: trend.productType,
          cut: trend.cut,
          material: trend.material,
          color: trend.color,
          style: trend.style,
          productName: trend.productName,
          averagePrice: trend.averagePrice,
          brands: trend.brands,
          confirmationScore: trend.confirmationScore,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Rediriger vers Sourcing Hub avec les données et filtres automatiques
        const params = new URLSearchParams({
          trend: encodeURIComponent(JSON.stringify(data.emailData)),
          productType: data.productType || '',
          material: data.material || '',
          autoFilter: 'true', // Activer le filtrage automatique
        });
        window.location.href = `/sourcing?${params.toString()}`;
      } else {
        throw new Error(data.error || 'Erreur lors de la génération');
      }
    } catch (error: unknown) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement des tendances...</div>
      </div>
    );
  }

  // Afficher un message si aucune tendance
  if (!isLoading && trends.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="w-12 h-12 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Aucune tendance détectée
                </h3>
                <p className="text-muted-foreground mb-4">
                  Pour afficher les tendances, vous devez d'abord scanner les grandes marques.
                  Le système détectera automatiquement les produits présents chez 3+ marques.
                </p>
                <Button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="gap-2"
                >
                  {isScanning ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin" />
                      Scan en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Lancer le scan des tendances
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  💡 Le scan peut prendre 2-5 minutes selon le nombre de marques configurées.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête : titre + sous-nav en 3 parties + action scan */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tendances</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Tendances actuelles par marché (France par défaut). Filtrez par pays pour voir les tendances ailleurs et ramener une tendance d&apos;un autre pays.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button onClick={handleEnrichTrends} disabled={isEnriching || trends.length === 0} variant="outline" size="sm" className="gap-2">
            {isEnriching ? (
              <>Analyse des tendances…</>
            ) : (
              <>Analyser les tendances</>
            )}
          </Button>
          <Button onClick={handleScan} disabled={isScanning} variant="outline" size="sm" className="gap-2">
            {isScanning ? (
              <>
                <Zap className="w-4 h-4 animate-spin" />
                Scan en cours…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Lancer un scan maintenant
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filtres sur une ligne */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Segment</label>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Tous</option>
                <option value="femme">Femme</option>
                <option value="homme">Homme</option>
                <option value="enfant">Enfant</option>
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Marché</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Tous les marchés</option>
                <option value="FR">France (FR)</option>
                {stats?.byCountry?.filter((s) => s.country && s.country !== 'FR').map((s) => (
                  <option key={String(s.country)} value={s.country || ''}>{s.country || '—'} ({s.count})</option>
                )) ?? []}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Style</label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Tous</option>
                {stats?.byStyle?.map((s) => (
                  <option key={String(s.style)} value={s.style || ''}>{s.style || '—'} ({s.count})</option>
                )) ?? []}
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type de produit</label>
              <select
                value={selectedProductType}
                onChange={(e) => setSelectedProductType(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Tous</option>
                {stats?.byProductType?.map((s) => (
                  <option key={s.productType} value={s.productType}>{s.productType} ({s.count})</option>
                )) ?? []}
              </select>
            </div>
            {(selectedCountry || selectedStyle || selectedProductType || selectedSegment) && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedCountry('FR'); setSelectedStyle(''); setSelectedProductType(''); setSelectedSegment(''); }}>
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Classement : bonnes tendances (à privilégier) et mauvaises (à éviter) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Classement des tendances</h2>
          <span className="text-sm text-muted-foreground">
            {trends.length} tendance{trends.length !== 1 ? 's' : ''} (à privilégier et à éviter)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {trends.map((trend: TrendSignal, index: number) => {
            const rank = index + 1;
            const isRecommended = trend.recommendation === 'recommended';
            const isAvoid = trend.recommendation === 'avoid';
            const imgSrc = (trend.generatedImageUrl?.startsWith('http') ? trend.generatedImageUrl : null)
              || (trend.imageUrl?.startsWith('http') ? trend.imageUrl : null);
            return (
              <Card key={`${trend.productType}-${trend.cut ?? ''}-${trend.material ?? ''}-${index}`} className="overflow-hidden flex flex-col">
                <div className="aspect-[3/4] bg-muted relative shrink-0">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={trend.productName}
                      fill
                      sizes="(max-width: 1024px) 50vw, 280px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <TrendingUp className="w-12 h-12 opacity-40" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-background/90 text-xs font-semibold shadow-sm">
                      #{rank}
                    </span>
                    {trend.segment && (
                      <span className="px-2 py-0.5 rounded-md bg-primary/90 text-white text-xs font-medium capitalize">
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
                <CardContent className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold line-clamp-2 leading-tight">{trend.productName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {[trend.productType, trend.cut, trend.material].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {trend.aiRating != null ? (
                        <span className="font-medium text-primary">Score {trend.aiRating}/10</span>
                      ) : null}
                      {trend.brands.length} marque{trend.brands.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-3 w-full gap-2"
                    onClick={() => setDetailTrend(trend)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Voir le détail
                  </Button>
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleCreateDesign(trend)}>
                      <Palette className="w-3.5 h-3.5" /> Design
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleRequestQuote(trend)}>
                      <Mail className="w-3.5 h-3.5" /> Devis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {detailTrend && (
        <TrendDetailModal
          trend={detailTrend}
          onClose={() => setDetailTrend(null)}
          onCreateDesign={handleCreateDesign}
          onRequestQuote={handleRequestQuote}
          onImageGenerated={loadTrends}
        />
      )}
    </div>
  );
}
