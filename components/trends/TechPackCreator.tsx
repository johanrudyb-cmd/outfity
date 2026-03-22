'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Globe, FileText, ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';

interface TrendProduct {
  id: string;
  name: string;
  category: string;
  cut: string | null;
  material: string | null;
  description: string | null;
  averagePrice: number;
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceBrand: string | null;
  segment: string | null;
  marketZone: string | null;
}

const SEGMENT_OPTIONS = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
] as const;

const SORT_OPTIONS = [
  { value: 'best', label: 'Plus tendance' },
  { value: 'recent', label: 'Plus récents' },
  { value: 'priceAsc', label: 'Prix croissant' },
  { value: 'priceDesc', label: 'Prix décroissant' },
] as const;

const AGE_OPTIONS = [
  { value: '', label: 'Toutes' },
  { value: '25-34', label: '25-34 ans' },
  { value: '18-24', label: '18-24 ans' },
] as const;

function productImageSrc(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('http')) return null;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export function TechPackCreator({ preSelectedId }: { preSelectedId?: string | null }) {
  const [segment, setSegment] = useState<'homme' | 'femme'>('homme');
  const [sortBy, setSortBy] = useState<string>('best');
  const [ageRange, setAgeRange] = useState<string>('');
  const [trends, setTrends] = useState<TrendProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(preSelectedId ?? null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadTrends = useCallback(async () => {
    setLoading(true);
    setHasLoadedOnce(true);
    try {
      const params = new URLSearchParams({
        marketZone: 'EU',
        segment,
        sortBy: sortBy || 'best',
        limit: '50',
      });
      if (ageRange) params.set('ageRange', ageRange);
      const res = await fetch(`/api/trends/hybrid-radar?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.trends)) {
        setTrends(data.trends);
        if (preSelectedId) {
          const exists = data.trends.some((t: TrendProduct) => t.id === preSelectedId);
          if (exists) setSelectedId(preSelectedId);
        } else {
          setSelectedId(null);
        }
      } else {
        setTrends([]);
      }
    } finally {
      setLoading(false);
    }
  }, [segment, sortBy, ageRange, preSelectedId]);

  useEffect(() => {
    if (preSelectedId && trends.length > 0 && !selectedId) {
      const exists = trends.some((t) => t.id === preSelectedId);
      if (exists) setSelectedId(preSelectedId);
    }
  }, [preSelectedId, trends, selectedId]);

  const selected = trends.find((t) => t.id === selectedId);

  const copyToClipboard = async (label: string, value: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value.trim());
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_) { }
  };

  const copyFullTechPack = async () => {
    if (!selected) return;
    const lines = [
      '--- TECH PACK FOURNISSEUR ---',
      `Référence / Nom: ${selected.name}`,
      `Catégorie: ${selected.category}`,
      `Coupe: ${selected.cut || '—'}`,
      `Matière: ${selected.material || '—'}`,
      ...(selected.description ? [`Description / Spécifications:\n${selected.description}`] : []),
      ...(selected.imageUrl ? [`Image référence: ${selected.imageUrl}`] : []),
      '---',
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedField('tout');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_) { }
  };

  return (
    <div className="space-y-6">
      <GenerationLoadingPopup
        open={loading}
        title="Chargement des tendances…"
        messages={[
          "Scan des catalogues fournisseurs...",
          "Extraction des fiches techniques...",
          "Récupération des visuels HD...",
          "Analyse des spécifications tissus...",
        ]}
      />
      <div className="flex items-center gap-4">
        <Link
          href="/design-studio"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold transition-all hover:bg-muted hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour Design Studio
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7" />
          Créer un tech pack depuis une tendance
        </h1>
      </div>

      {/* Étape 1 : Choisir quelles tendances afficher (filtres) */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quelle tendance voulez-vous voir ?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Filtrez par segment, tri et tranche d&apos;âge, puis cliquez sur « Voir les tendances » pour afficher les produits avec leurs images.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Segment</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as 'homme' | 'femme')}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SEGMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tri</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tranche d&apos;âge (source)</label>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {AGE_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={loadTrends} disabled={loading} className="gap-2">
            {loading ? 'Chargement…' : 'Voir les tendances'}
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {hasLoadedOnce
          ? 'Sélectionnez un produit ci-dessous pour afficher les éléments à copier dans votre tech pack fournisseur (référence, catégorie, coupe, matière, image).'
          : 'Choisissez vos filtres ci-dessus et cliquez sur « Voir les tendances » pour afficher les produits.'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grille des produits avec images */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Produits tendance</CardTitle>
            <p className="text-xs text-muted-foreground">
              {hasLoadedOnce ? 'Cliquez sur un produit pour le sélectionner' : 'Chargez les tendances avec les filtres ci-dessus'}
            </p>
          </CardHeader>
          <CardContent>
            {!hasLoadedOnce ? (
              <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
                Choisissez vos filtres et cliquez sur « Voir les tendances » pour afficher les produits avec leurs images.
              </div>
            ) : loading ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Chargement…</div>
            ) : trends.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Aucune tendance pour ces filtres. Essayez d&apos;autres options ou récupérez des tendances depuis la page Tendances.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 max-h-[70vh] overflow-y-auto">
                {trends.map((t) => {
                  const src = productImageSrc(t.imageUrl);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`rounded-lg border-2 overflow-hidden text-left transition-colors ${selectedId === t.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30 hover:bg-muted/50'
                        }`}
                    >
                      <div className="aspect-[3/4] bg-muted relative">
                        {src ? (
                          <Image src={src} alt={t.name} fill sizes="(max-width: 1024px) 40vw, 220px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Globe className="w-8 h-8 opacity-40" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-2 leading-snug p-1.5">{t.name}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panneau détail : éléments à copier */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Éléments à copier</CardTitle>
            <p className="text-xs text-muted-foreground">
              {selected ? 'Cliquez sur « Copier » à côté de chaque champ pour le coller dans votre tech pack.' : 'Sélectionnez un produit dans la liste à gauche.'}
            </p>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="text-sm text-muted-foreground py-12 text-center border border-dashed rounded-lg">
                Sélectionnez un produit dans la liste pour afficher les champs à copier.
              </div>
            ) : (
              <div className="space-y-4">
                {selected.imageUrl && (
                  <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                    <div className="relative w-20 h-24 shrink-0 rounded overflow-hidden bg-muted">
                      <Image
                        src={productImageSrc(selected.imageUrl) ?? selected.imageUrl}
                        alt={selected.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Aperçu image</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => copyToClipboard('image', selected.imageUrl!)}
                      >
                        {copiedField === 'image' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'image' ? 'Copié' : 'Copier URL image'}
                      </Button>
                    </div>
                  </div>
                )}

                {[
                  { label: 'Référence / Nom', value: selected.name, key: 'nom' },
                  { label: 'Catégorie', value: selected.category, key: 'categorie' },
                  { label: 'Coupe', value: selected.cut || '—', key: 'coupe' },
                  { label: 'Matière', value: selected.material || '—', key: 'matiere' },
                  ...(selected.description ? [{ label: 'Description / Spécifications', value: selected.description, key: 'description' as const }] : []),
                ].map(({ label, value, key }) => (
                  <div key={key} className="flex items-start gap-2 rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
                      <p className="text-sm break-words whitespace-pre-wrap">{value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 shrink-0 text-xs"
                      onClick={() => copyToClipboard(key, value)}
                    >
                      {copiedField === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === key ? 'Copié' : 'Copier'}
                    </Button>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <Button variant="default" size="sm" className="gap-2" onClick={copyFullTechPack}>
                    {copiedField === 'tout' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedField === 'tout' ? 'Tech pack copié' : 'Copier tout le tech pack'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
