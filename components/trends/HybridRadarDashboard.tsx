'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Zap, Upload, Loader2, AlertTriangle, Sparkles, Eye, ChevronDown, ChevronUp, TrendingUp, Shirt, ArrowRight, Tag, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { getProductBrand } from '@/lib/brand-utils';
import { safeDisplayBrand } from '@/lib/constants/retailer-exclusion';

interface HybridTrend {
  id: string;
  name: string;
  category: string;
  marketZone: string | null;
  cut: string | null;
  trendScoreVisual: number | null;
  imageUrl: string | null;
  sourceBrand: string | null;
  isGlobalTrendAlert: boolean;
  businessAnalysis: string | null;
  weatherSignal?: string;
  productionSafety?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'TSHIRT': 'T-Shirts & Tops',
  'SWEAT': 'Sweats & Pulls',
  'JACKEX': 'Vestes & Manteaux',
  'PANT': 'Pantalons & Bas',
  'JEAN': 'Denim & Jeans',
  'DRESS': 'Robes & Ensembles',
  'AUTRE': 'Autres Styles'
};

const fetcher = (url: string) => fetch(url).then(r => r.json());
const proxyImageSrc = (url: string) => `/api/proxy-image?url=${encodeURIComponent(url)}`;

export function HybridRadarDashboard() {
  const [scanning, setScanning] = useState(false);
  const [zone, setZone] = useState<string>('');
  const [globalOnly, setGlobalOnly] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    matchInZones: string[];
    analysis?: { cut: string; productSignature: string };
    message: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generatingAnalysis, setGeneratingAnalysis] = useState<string | null>(null);
  const [scrapingOnly, setScrapingOnly] = useState(false);
  const [scrapeOnlyResult, setScrapeOnlyResult] = useState<{
    totalItems: number;
    results: Array<{
      sourceId: string;
      brand: string;
      marketZone: string;
      url: string;
      itemCount: number;
      items: Array<{
        name: string;
        price: number;
        imageUrl: string | null;
        sourceUrl: string;
        composition?: string | null;
        careInstructions?: string | null;
        color?: string | null;
        sizes?: string | null;
        countryOfOrigin?: string | null;
        articleNumber?: string | null;
      }>;
    }>;
  } | null>(null);
  const [scrapeOnlyExpanded, setScrapeOnlyExpanded] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (zone) params.set('marketZone', zone);
  if (globalOnly) params.set('globalOnly', 'true');
  params.set('limit', '50');

  const { data, error, isLoading: loading, mutate: loadTrends } = useSWR(
    `/api/trends/hybrid-radar?${params.toString()}`,
    fetcher
  );

  const trends: HybridTrend[] = data?.trends || [];

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/trends/hybrid-radar/scan', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        await loadTrends();
        alert(`Scan terminé. ${data.totalSaved} tendances enregistrées.`);
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setScanning(false);
    }
  };

  const handleScrapeOnly = async () => {
    setScrapingOnly(true);
    setScrapeOnlyResult(null);
    try {
      const res = await fetch('/api/trends/hybrid-radar/scrape-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: 'Zalando' }),
      });
      const data = await res.json();
      if (res.ok) {
        setScrapeOnlyResult({ totalItems: data.totalItems, results: data.results || [] });
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setScrapingOnly(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const form = new FormData();
      form.append('image', uploadFile);
      const res = await fetch('/api/trends/check-trend-image', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadResult({
          matchInZones: data.matchInZones || [],
          analysis: data.analysis,
          message: data.message || '',
        });
      } else {
        setUploadResult({ matchInZones: [], message: data.error || 'Erreur' });
      }
    } catch (e) {
      setUploadResult({
        matchInZones: [],
        message: e instanceof Error ? e.message : 'Erreur',
      });
    } finally {
      setUploading(false);
    }
  };

  const generateBusinessAnalysis = async (productId: string) => {
    setGeneratingAnalysis(productId);
    try {
      const res = await fetch('/api/trends/hybrid-radar/business-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadTrends();
      } else {
        alert(data.error || 'Erreur');
      }
    } finally {
      setGeneratingAnalysis(null);
    }
  };

  return (
    <div className="space-y-8">
      <GenerationLoadingPopup
        open={uploading}
        title="Analyse de l'image en cours…"
        messages={[
          "Scan des bases de données mondiales...",
          "Analyse de la récurrence visuelle...",
          "Calcul du score de viralité...",
          "Détection des signaux faibles...",
        ]}
      />
      <GenerationLoadingPopup
        open={!!generatingAnalysis}
        title="Génération de l'analyse business…"
        messages={[
          "Étude des volumes de recherche...",
          "Analyse de la saturation marché...",
          "Calcul des marges prévisionnelles...",
          "Extraction des opportunités locales...",
        ]}
      />
      <GenerationLoadingPopup
        open={scanning}
        title="Scan des tendances en cours…"
        messages={[
          "Inspection des boutiques leaders...",
          "Filtrage des nouveaux produits...",
          "Détection des ruptures de stock...",
          "Correlation multi-marchés...",
        ]}
      />
      <GenerationLoadingPopup
        open={scrapingOnly}
        title="Récupération des données…"
        messages={[
          "Connexion aux sources mondiales...",
          "Capture des visuels produits...",
          "Collecte des métadonnées techniques...",
          "Normalisation des informations...",
        ]}
      />
      <SectionHeader
        title="Analyse de Potentiel Global"
        icon={Globe}
        description="Données réelles + Analyse Visuelle. Tendances par zone (France, Europe, USA, Asie). Badge Potentiel Global si tendance présente dans 2+ zones."
      />

      {/* Actions */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
          <Button
            onClick={handleScrapeOnly}
            disabled={scrapingOnly || scanning}
            variant="outline"
            size="sm"
            className="gap-2"
            title="Voir les données récupérées (sans IA ni enregistrement)"
          >
            {scrapingOnly ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Récupération en cours…
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Récupérer les données
              </>
            )}
          </Button>
          <Button
            onClick={handleScan}
            disabled={scanning || scrapingOnly}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scan en cours…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Lancer le scan (New In par zone)
              </>
            )}
          </Button>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm font-medium">Zone</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Toutes</option>
              <option value="FR">France</option>
              <option value="EU">Europe</option>
              <option value="US">USA</option>
              <option value="ASIA">Asie</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={globalOnly}
                onChange={(e) => setGlobalOnly(e.target.checked)}
              />
              Potentiel Global uniquement
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Résultat scrape seul (données brutes) */}
      {scrapeOnlyResult && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Données récupérées ({scrapeOnlyResult.totalItems} produits, sans IA)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Cliquez sur une source pour afficher les produits récupérés.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {scrapeOnlyResult.results.map((source) => {
              const isExpanded = scrapeOnlyExpanded === source.sourceId;
              return (
                <div key={source.sourceId} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setScrapeOnlyExpanded(isExpanded ? null : source.sourceId)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted text-left text-sm font-medium"
                  >
                    <span>
                      {source.marketZone} — {source.itemCount} produit{source.itemCount !== 1 ? 's' : ''}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {isExpanded && (
                    <div className="p-4 border-t bg-background">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {source.items.map((item, idx) => {
                          const hasTechPack = item.composition || item.careInstructions || item.color || item.sizes || item.countryOfOrigin || item.articleNumber;
                          return (
                            <div
                              key={idx}
                              className="rounded-lg border overflow-hidden bg-muted/30 flex flex-col"
                            >
                                <div className="aspect-square bg-muted relative">
                                  {item.imageUrl ? (
                                  <Image
                                    src={proxyImageSrc(item.imageUrl)}
                                    alt={item.name}
                                    fill
                                    sizes="(max-width: 768px) 45vw, 220px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                    Pas d&apos;image
                                  </div>
                                )}
                              </div>
                              <div className="p-2 text-xs flex-1 flex flex-col min-w-0">
                                <p className="font-medium line-clamp-2 leading-tight">{item.name || '—'}</p>
                                {hasTechPack && (
                                  <>
                                    {item.articleNumber && <p className="mt-1 text-muted-foreground line-clamp-1">Ref: {item.articleNumber}</p>}
                                    {item.color && <p className="text-muted-foreground line-clamp-1">Couleur: {item.color}</p>}
                                    {item.composition && <p className="text-muted-foreground line-clamp-2 mt-0.5">Compo: {item.composition}</p>}
                                    {item.careInstructions && <p className="text-muted-foreground line-clamp-1">Entretien: {item.careInstructions}</p>}
                                    {item.sizes && <p className="text-muted-foreground line-clamp-1">Tailles: {item.sizes}</p>}
                                    {item.countryOfOrigin && <p className="text-muted-foreground line-clamp-1">Origine: {item.countryOfOrigin}</p>}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Upload photo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Radar Intelligence : Détectez le potentiel d'un article
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Uploadez une image produit ; le système indique si c&apos;est une tendance en Europe, USA ou Asie.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setUploadFile(e.target.files?.[0] ?? null);
                setUploadResult(null);
              }}
              className="text-sm"
            />
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              size="sm"
              className="gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Analyser
            </Button>
          </div>
          {uploadResult && (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="font-medium">{uploadResult.message}</p>
              {uploadResult.matchInZones?.length > 0 && (
                <p className="text-primary mt-1">
                  Zones : {uploadResult.matchInZones.join(', ')}
                </p>
              )}
              {uploadResult.analysis && (
                <p className="text-muted-foreground mt-1">
                  Coupe : {uploadResult.analysis.cut} · Signature : {uploadResult.analysis.productSignature}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des tendances */}
      {/* Liste des tendances groupées par catégorie */}
      <div className="space-y-12">
        <h2 className="text-xl font-black uppercase tracking-tighter text-black flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-[#007AFF]" />
          Tendances de la semaine
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#007AFF]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Synchronisation globale...</p>
          </div>
        ) : trends.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            description="Aucun flux détecté. Lancez un scan pour peupler votre radar de potentiel."
          />
        ) : (
          <div className="space-y-16">
            {Object.entries(
              trends.reduce((acc: Record<string, HybridTrend[]>, t) => {
                const cat = t.category || 'AUTRE';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(t);
                return acc;
              }, {})
            )
              .sort(([a], [b]) => {
                const order = ['TSHIRT', 'SWEAT', 'JACKEX', 'PANT', 'JEAN', 'DRESS', 'AUTRE'];
                const idxA = order.indexOf(a);
                const idxB = order.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
              })
              .map(([category, catTrends]) => (
                <div key={category} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-gray-200" />
                    <div className="bg-white px-6 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-3">
                      {(() => {
                        const Icon = category === 'TSHIRT' ? Shirt :
                          category === 'SWEAT' ? Tag :
                            category === 'JACKEX' ? Layers :
                              category === 'PANT' ? Tag :
                                category === 'JEAN' ? Layers :
                                  category === 'DRESS' ? Sparkles : Shirt;
                        return <Icon className="w-3.5 h-3.5 text-[#007AFF]" />;
                      })()}
                      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-black">
                        {CATEGORY_LABELS[category] || category}
                      </h3>
                    </div>
                    <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-gray-200" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {catTrends.map((t) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group"
                      >
                        <Card className="overflow-hidden flex flex-col h-full bg-white border-black/[0.03] hover:border-[#007AFF]/30 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] rounded-[32px]">
                          <div className="aspect-[3/4] bg-[#F5F5F7] relative shrink-0 overflow-hidden">
                            {t.imageUrl ? (
                              <Image
                                src={proxyImageSrc(t.imageUrl)}
                                alt={t.name}
                                fill
                                sizes="(max-width: 1024px) 50vw, 280px"
                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-200">
                                <Globe className="w-16 h-16 opacity-10" />
                              </div>
                            )}

                            {/* Badges Apple Style */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                              <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-xl">
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">
                                  {t.marketZone || 'GLOBAL'}
                                </span>
                              </div>
                              {t.isGlobalTrendAlert && (
                                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 border border-white/20">
                                  <span className="text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" /> POTENTIEL GLOBAL
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Potential Overlay on Hover */}
                            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/80 to-transparent">
                              <Button className="w-full h-10 bg-white text-black hover:bg-white/90 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2">
                                VOIR L'ANALYSE <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="mb-4">
                              <h3 className="text-base font-black text-black uppercase tracking-tight leading-tight line-clamp-2">{t.name}</h3>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm",
                                  t.productionSafety === 'SÛR' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                  PROD: {t.productionSafety || 'INCONNU'}
                                </span>
                                {t.weatherSignal && (
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm",
                                    t.weatherSignal.includes('Favorable') ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                  )}>
                                    {t.weatherSignal.includes('Favorable') ? '☀️ SAISON OK' : '⚠️ HORS-SAISON'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-auto">
                              <div className="flex items-center justify-between py-3 border-y border-black/[0.03] mb-4">
                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Indice Virality</span>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-lg font-black",
                                    (t.trendScoreVisual || 0) >= 80 ? "text-[#34C759]" : (t.trendScoreVisual || 0) > 50 ? "text-amber-500" : "text-red-500"
                                  )}>
                                    {t.trendScoreVisual ?? '—'}
                                  </span>
                                  <div className="h-4 w-px bg-gray-100" />
                                  <span className="text-[10px] font-black text-gray-400">100</span>
                                </div>
                              </div>

                              {t.businessAnalysis ? (
                                <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-black/[0.03]">
                                  <p className="text-[10px] text-gray-600 font-bold leading-relaxed italic">
                                    &quot;{t.businessAnalysis}&quot;
                                  </p>
                                </div>
                              ) : (
                                <motion.div whileTap={{ scale: 0.98 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-12 gap-2 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-black/[0.05] hover:bg-[#007AFF] hover:text-white transition-all duration-300"
                                    disabled={generatingAnalysis === t.id}
                                    onClick={() => generateBusinessAnalysis(t.id)}
                                  >
                                    {generatingAnalysis === t.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-4 h-4" />
                                    )}
                                    Générer analyse business
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
