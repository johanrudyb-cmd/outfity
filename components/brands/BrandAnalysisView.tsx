'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Compass,
  Target,
  Radio,
  MessageCircle,
  Euro,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { ConfirmGenerateModal } from '@/components/ui/confirm-generate-modal';
import { useQuota } from '@/lib/hooks/useQuota';
import {
  slugToCuratedBrand,
  brandNameToSlug,
  CYCLE_PHASE_LABELS,
  LAUNCH_POTENTIAL_LABELS,
  getBrandLogoUrl,
  type CuratedBrand,
} from '@/lib/curated-brands';
import { BrandLogo } from './BrandLogo';
import { StrategyPresentationView } from '@/components/launch-map/StrategyPresentationView';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { FeatureUsageBadge } from '@/components/usage/FeatureUsageBadge';

function parseSections(analysis: string): { title: string; content: string }[] {
  const blocks = analysis.split(/\n(?=## )/).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.trim().split('\n');
    const title = lines[0]?.replace(/^##\s*/, '').trim() ?? '';
    const content = lines.slice(1).join('\n').trim();
    return { title, content };
  });
}

/** Retourne le contenu d'une section de l'analyse par titre (ex. "Positionnement", "Cible"). */
function getSectionContent(analysis: string, sectionKey: string): string {
  const sections = parseSections(analysis);
  const key = sectionKey.toLowerCase().trim();
  const found = sections.find((s) => s.title.toLowerCase().trim().includes(key) || key.includes(s.title.toLowerCase().trim()));
  return (found?.content ?? '').trim();
}

/** Icône + libellé court par thème (pour schéma et cartes). */
const SECTION_ICONS: { key: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'positionnement', label: 'Positionnement', Icon: Compass },
  { key: 'cible', label: 'Cible', Icon: Target },
  { key: 'canaux', label: 'Canaux', Icon: Radio },
  { key: 'messages', label: 'Messages', Icon: MessageCircle },
  { key: 'pricing', label: 'Prix', Icon: Euro },
  { key: 'timing', label: 'Plan d\'action', Icon: Calendar },
];

/** Construit un bloc de contexte pour l'IA à partir des données de la marque créateur. */
function buildCreatorBrandContext(b: { name: string; styleGuide?: unknown; domain?: string | null; socialHandles?: unknown }): string {
  const parts: string[] = [`Marque : ${b.name}`];
  if (b.domain) parts.push(`Domaine : ${b.domain}`);
  if (b.styleGuide && typeof b.styleGuide === 'object') {
    const sg = b.styleGuide as Record<string, unknown>;
    if (typeof sg.story === 'string' && sg.story.trim()) {
      parts.push(`Pourquoi le créateur a créé sa marque : ${sg.story.trim()}`);
    }
    const other: string[] = [];
    for (const key of ['tagline', 'description', 'mainProduct', 'stage', 'positioning', 'preferredStyle', 'targetAudience']) {
      const v = sg[key];
      if (typeof v === 'string' && v.trim()) other.push(`${key} : ${v.trim()}`);
    }
    if (other.length) parts.push(other.join(' | '));
  }
  if (b.socialHandles && typeof b.socialHandles === 'object') {
    try {
      parts.push(`Réseaux : ${JSON.stringify(b.socialHandles)}`);
    } catch {
      // ignore
    }
  }
  return parts.join('\n');
}

function getSectionMeta(title: string, index: number): { label: string; Icon: React.ComponentType<{ className?: string }> } {
  const def = SECTION_ICONS[Math.min(index, SECTION_ICONS.length - 1)];
  const shortTitle = title.replace(/^\d+\.\s*/, '').trim();
  return { label: shortTitle.length <= 25 ? shortTitle : def.label, Icon: def.Icon };
}

/** Extrait les 3–4 premières puces d'un contenu. */
function extractBullets(content: string, max = 4): string[] {
  return content
    .split('\n')
    .filter((l) => /^[-*]\s+/.test(l.trim()))
    .map((l) => l.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean)
    .slice(0, max);
}

/** Découpe un long paragraphe en phrases courtes pour affichage en puces. */
function sentenceSplit(paragraph: string): string[] {
  const trimmed = paragraph.trim();
  if (!trimmed) return [];
  const parts = trimmed
    .replace(/([.!?])\s+/g, '$1|||')
    .split('|||')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts : [trimmed];
}

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const bullet = line.replace(/^[-*] /, '').trim();
      return (
        <div key={i} className="flex gap-2 my-1.5 ml-0 pl-4 border-l-2 border-primary/20">
          <span className="text-primary font-medium shrink-0">•</span>
          <span className="text-sm leading-relaxed">{bullet}</span>
        </div>
      );
    }
    if (trimmed) {
      const sentences = sentenceSplit(trimmed);
      if (sentences.length >= 2) {
        return (
          <ul key={i} className="my-3 space-y-1.5 list-none pl-0">
            {sentences.map((sent, j) => (
              <li key={j} className="flex gap-2 pl-4 border-l-2 border-muted">
                <span className="text-muted-foreground shrink-0 text-xs">◦</span>
                <span className="text-sm leading-relaxed">{sent}</span>
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={i} className="my-2 text-sm leading-relaxed max-w-prose text-muted-foreground">
          {trimmed}
        </p>
      );
    }
    return null;
  });
}

interface BrandAnalysisViewProps {
  slug: string;
}

export function BrandAnalysisView({ slug }: BrandAnalysisViewProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const resolvedSlug = (params?.slug as string) || slug;
  const nameParam = searchParams?.get('name')?.trim();
  const curatedBrand = slugToCuratedBrand(resolvedSlug);
  const brand = curatedBrand ?? (nameParam ? { brand: nameParam } as CuratedBrand : null);

  const { data: session } = useSession();
  const user = session?.user;
  const isFree = (user as any)?.plan === 'free' || (user as any)?.plan === 'starter';

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [visualIdentity, setVisualIdentity] = useState<{
    colorPalette?: { primary?: string; secondary?: string; accent?: string };
    typography?: { heading?: string; body?: string };
  } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [visualIdentityLoading, setVisualIdentityLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [launching, setLaunching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfirmAnalyze, setShowConfirmAnalyze] = useState(false);
  const analyzeQuota = useQuota('brand_analyze');
  const [modalOpen, setModalOpen] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState('');
  const [strategyResult, setStrategyResult] = useState<string | null>(null);
  const [calquerLoading, setCalquerLoading] = useState(false);
  const [calquerError, setCalquerError] = useState('');
  const [calquerShowConfirm, setCalquerShowConfirm] = useState(false);
  const [calquerConfirmTyped, setCalquerConfirmTyped] = useState('');
  const [activeTab, setActiveTab] = useState<'resume' | 'detail'>('resume');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [recommendationCreatorBrand, setRecommendationCreatorBrand] = useState('');
  const [userBrands, setUserBrands] = useState<{ id: string; name: string; styleGuide?: unknown; domain?: string | null; socialHandles?: unknown }[] | null>(null);
  const [userBrandsLoading, setUserBrandsLoading] = useState(false);
  const hasAutoTriggeredRef = useRef(false);

  useEffect(() => {
    if (!brand) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/brands/analyze?brandName=${encodeURIComponent(brand.brand)}`)
      .then((res) => {
        if (cancelled) return;
        if (res.ok) return res.json();
        if (res.status === 404) return { analysis: null };
        return res.json().then((d) => Promise.reject(new Error(d.error || 'Erreur')));
      })
      .then((data) => {
        if (cancelled) return;
        setAnalysis(data.analysis ?? null);
        setVisualIdentity(data.visualIdentity ?? null);
        setLogoUrl(data.logoUrl ?? null);
        setError('');
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [brand?.brand]);

  /** Récupère les marques de l'utilisateur une fois l'analyse chargée. */
  useEffect(() => {
    if (!analysis || !brand) return;
    let cancelled = false;
    setUserBrandsLoading(true);
    fetch('/api/brands')
      .then((res) => (res.ok ? res.json() : Promise.resolve({ brands: [] })))
      .then((data) => {
        if (!cancelled) setUserBrands(data.brands ?? []);
      })
      .catch(() => {
        if (!cancelled) setUserBrands([]);
      })
      .finally(() => {
        if (!cancelled) setUserBrandsLoading(false);
      });
    return () => { cancelled = true; };
  }, [analysis, brand]);

  /** Recommandation auto : croiser marque utilisateur + marque tendance dès qu'on a les deux. */
  useEffect(() => {
    if (!analysis || !brand || userBrandsLoading || hasAutoTriggeredRef.current) return;
    const first = userBrands?.length ? userBrands[0] : null;
    if (!first?.name?.trim()) return;
    hasAutoTriggeredRef.current = true;
    const creatorName = first.name.trim();
    const creatorBrandContext = buildCreatorBrandContext(first);
    const creatorStory = first.styleGuide && typeof first.styleGuide === 'object' ? (first.styleGuide as Record<string, unknown>).story : undefined;
    setRecommendationLoading(true);
    setRecommendationError('');
    setRecommendation(null);
    fetch('/api/brands/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateBrandName: brand.brand,
        creatorBrandName: creatorName,
        analysisText: analysis,
        creatorBrandContext: creatorBrandContext || undefined,
        creatorStory: typeof creatorStory === 'string' ? creatorStory.trim() || undefined : undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRecommendation(data.strategy || '');
        setRecommendationCreatorBrand(creatorName);
      })
      .catch((e) => setRecommendationError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setRecommendationLoading(false));
  }, [analysis, brand, userBrands, userBrandsLoading]);

  const handleLaunchAnalysis = async () => {
    if (!brand) return;
    setLaunching(true);
    setError('');
    try {
      const context = {
        signaturePiece: brand.signaturePiece,
        dominantStyle: brand.dominantStyle,
        cyclePhase: CYCLE_PHASE_LABELS[brand.cyclePhase],
        launchPotential: LAUNCH_POTENTIAL_LABELS[brand.launchPotential],
        indicativePrice: brand.indicativePrice,
        rank: brand.rank,
        score: brand.score,
      };
      const res = await fetch('/api/brands/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: brand.brand, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'analyse");
      setAnalysis(data.analysis || '');
      setVisualIdentity(data.visualIdentity ?? null);
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setLaunching(false);
    }
  };

  const handleGenerateVisualIdentity = async () => {
    if (!brand) return;
    setVisualIdentityLoading(true);
    try {
      const res = await fetch('/api/brands/analyze/visual-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: brand.brand }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setVisualIdentity(data.visualIdentity ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur identité visuelle');
    } finally {
      setVisualIdentityLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    setCalquerShowConfirm(false);
    setCalquerConfirmTyped('');
  };

  const handleGenerateStrategy = async () => {
    const name = userBrands?.[0]?.name?.trim() ?? '';
    if (!name || !analysis || !brand) {
      setStrategyError(userBrands?.length ? 'Analyse de marque manquante.' : 'Ajoutez une marque à votre profil pour générer une stratégie.');
      return;
    }
    const templatePositioning = getSectionContent(analysis ?? '', 'positionnement');
    const templateTarget = getSectionContent(analysis ?? '', 'cible');
    setStrategyLoading(true);
    setStrategyError('');
    setStrategyResult(null);
    try {
      const res = await fetch('/api/brands/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateBrandName: brand.brand,
          creatorBrandName: name,
          analysisText: analysis,
          positioning: templatePositioning || undefined,
          targetAudience: templateTarget || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération');
      setStrategyResult(data.strategy || '');
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
    } catch (e) {
      setStrategyError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setStrategyLoading(false);
    }
  };

  const downloadStrategy = () => {
    const name = userBrands?.[0]?.name?.trim() ?? '';
    if (!strategyResult || !name) return;
    const filename = `strategie-${name.replace(/\s+/g, '-').toLowerCase()}.md`;
    const blob = new Blob([strategyResult], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Calque la stratégie générée sur la marque de l'utilisateur (positionnement et cible = marque copiée). */
  const handleCalquerStrategy = async () => {
    const first = userBrands?.length ? userBrands[0] : null;
    if (!strategyResult || !brand || !first?.id || !analysis) return;
    const templatePositioning = getSectionContent(analysis, 'positionnement');
    const templateTarget = getSectionContent(analysis, 'cible');
    setCalquerError('');
    setCalquerLoading(true);
    try {
      const res = await fetch('/api/launch-map/apply-strategy-and-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: first.id,
          templateBrandSlug: brandNameToSlug(brand.brand),
          templateBrandName: brand.brand,
          strategyText: strategyResult,
          positioning: templatePositioning || undefined,
          targetAudience: templateTarget || undefined,
          visualIdentity: visualIdentity ? { colorPalette: visualIdentity.colorPalette, typography: visualIdentity.typography } : undefined,
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

  /** Régénère la recommandation pour la marque utilisateur (première marque du profil). */
  const handleRegenerateRecommendation = async () => {
    const first = userBrands?.length ? userBrands[0] : null;
    if (!brand || !analysis || !first?.name?.trim()) return;
    setRecommendationLoading(true);
    setRecommendationError('');
    setRecommendation(null);
    const creatorName = first.name.trim();
    const creatorBrandContext = buildCreatorBrandContext(first);
    const creatorStory = first.styleGuide && typeof first.styleGuide === 'object' ? (first.styleGuide as Record<string, unknown>).story : undefined;
    try {
      const res = await fetch('/api/brands/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateBrandName: brand.brand,
          creatorBrandName: creatorName,
          analysisText: analysis,
          creatorBrandContext: creatorBrandContext || undefined,
          creatorStory: typeof creatorStory === 'string' ? creatorStory.trim() || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération');
      setRecommendation(data.strategy || '');
      setRecommendationCreatorBrand(creatorName);
      window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
    } catch (e) {
      setRecommendationError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setRecommendationLoading(false);
    }
  };

  const copyRecommendation = () => {
    if (!recommendation) return;
    copyToClipboard(recommendation, 'rec');
  };

  const downloadRecommendation = () => {
    if (!recommendation || !recommendationCreatorBrand) return;
    const filename = `recommandation-${recommendationCreatorBrand.replace(/\s+/g, '-').toLowerCase()}.md`;
    const blob = new Blob([recommendation], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Affiche un texte type stratégie (## titres, puces, paragraphes). */
  function renderRecommendationText(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="text-base font-semibold mt-6 mb-2 first:mt-0 text-foreground">
            {line.replace(/^## /, '')}
          </h3>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} className="flex gap-2 my-1.5 pl-4 border-l-2 border-primary/20">
            <span className="text-primary shrink-0">•</span>
            <span className="text-sm text-foreground">{line.replace(/^[-*] /, '')}</span>
          </div>
        );
      }
      if (line.trim()) {
        return (
          <p key={i} className="my-2 text-sm leading-relaxed text-muted-foreground">
            {line}
          </p>
        );
      }
      return null;
    });
  }

  if (!brand) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground mb-4">Marque non trouvée.</p>
        <Link href="/brands">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour aux marques tendances
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 animate-fade-in">
        <div className="w-8 h-8 border-2 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-apple-spin" />
        <p className="text-[#1D1D1F]/60">Chargement de l&apos;analyse…</p>
      </div>
    );
  }

  if (!analysis && !error) {
    return (
      <div className="p-8 max-w-xl mx-auto space-y-6">
        <GenerationLoadingPopup
          open={launching}
          title="Analyse de la marque en cours…"
          messages={[
            "Extraction de l'ADN de la marque...",
            "Analyse du positionnement marché...",
            "Décryptage des codes visuels...",
            "Évaluation du potentiel de croissance...",
            "Identification de la cible principale...",
          ]}
        />
        <p className="text-muted-foreground text-center">
          Aucune analyse pour cette marque. Lancez l&apos;analyse IA pour générer le rapport.
        </p>
        <div className="flex flex-col items-center gap-4">
          <FeatureUsageBadge featureKey="brand_analyze" isFree={isFree} />
          <Button onClick={() => setShowConfirmAnalyze(true)} disabled={launching} className="gap-2">
            {launching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Lancer l&apos;analyse
              </>
            )}
          </Button>
        </div>
        <ConfirmGenerateModal
          open={showConfirmAnalyze}
          onClose={() => setShowConfirmAnalyze(false)}
          onConfirm={() => { setShowConfirmAnalyze(false); handleLaunchAnalysis(); }}
          actionLabel={brand ? `Analyser ${brand.brand}` : "Lancer l'analyse"}
          remaining={analyzeQuota?.remaining ?? 0}
          limit={analyzeQuota?.limit ?? 10}
          loading={launching}
        />
        <div className="flex justify-center">
          <Link href="/brands">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <p className="text-destructive">{error}</p>
        <Link href="/brands">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </Link>
      </div>
    );
  }

  /** Même mise en page que les stratégies des marques de référence (StrategyPresentationView) */
  return (
    <>
      <GenerationLoadingPopup
        open={strategyLoading || calquerLoading}
        title={calquerLoading ? 'Calquage de la stratégie…' : 'Génération de la stratégie…'}
        messages={calquerLoading ? [
          "Mise à jour de votre profil marque...",
          "Alignement des nouveaux objectifs...",
          "Réinitialisation du guide de lancement...",
          "Application des codes de succès...",
        ] : [
          "Fusion des concepts créatifs...",
          "Rédaction du plan d'attaque...",
          "Calcul de viabilité stratégique...",
          "Extraction des messages clés...",
        ]}
      />
      <StrategyPresentationView
        strategyText={analysis ?? ''}
        brandName={brand.brand}
        templateBrandName={brand.brand}
        isTemplateView
        titleMode="analysis"
        visualIdentity={visualIdentity ? { colorPalette: visualIdentity.colorPalette, typography: visualIdentity.typography } : null}
        visualIdentityLocked
        logoUrl={logoUrl}
        onClose={() => router.push('/brands')}
        optionalPrimaryAction={{
          label: 'Dupliquer pour ma marque',
          onClick: openStrategyModal,
        }}
      />
      {/* Modal Dupliquer pour ma marque (réutilisé) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95"
          onClick={(e) => e.target === e.currentTarget && closeStrategyModal()}
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col border-2 shadow-xl bg-background">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b shrink-0">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  Dupliquer pour ma marque
                </CardTitle>
                <CardDescription>Plan stratégique inspiré de {brand.brand}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeStrategyModal} aria-label="Fermer">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1 space-y-4">
              {!strategyResult ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    La stratégie sera générée pour votre marque <strong className="text-foreground">{userBrands?.[0]?.name ?? '—'}</strong> en reprenant le positionnement et la cible de {brand.brand}.
                  </p>
                  {strategyError && <p className="text-sm text-destructive font-medium">{strategyError}</p>}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleGenerateStrategy}
                      disabled={strategyLoading || !userBrands?.length}
                      className="gap-2"
                    >
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
                  <div className="max-h-[50vh] overflow-y-auto rounded-lg border bg-muted/30 p-4 prose prose-slate dark:prose-invert max-w-none text-sm">
                    {strategyResult.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return (
                          <h3 key={i} className="text-base font-semibold mt-4 mb-2 first:mt-0">
                            {line.replace(/^## /, '')}
                          </h3>
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
                      if (line.trim()) return <p key={i} className="my-2">{line}</p>;
                      return null;
                    })}
                  </div>
                  {calquerError && <p className="text-sm text-destructive font-medium">{calquerError}</p>}
                  {calquerShowConfirm ? (
                    <div className="rounded-lg border-2 border-amber-500/50 bg-amber-500/10 p-4 space-y-4">
                      {(() => {
                        const sg = userBrands?.[0]?.styleGuide as Record<string, unknown> | undefined;
                        const hasPos = !!((sg?.positioning ?? sg?.preferredStyle) as string)?.trim();
                        const hasCible = !!(sg?.targetAudience as string)?.trim();
                        const hasExistingStrategy = hasPos || hasCible;
                        return hasExistingStrategy ? (
                          /* Avant / Après : seulement si une stratégie est déjà enregistrée */
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border bg-background p-3 space-y-2">
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Avant (mon choix actuel)</p>
                              <p className="text-sm font-medium text-foreground">{userBrands?.[0]?.name ?? '—'}</p>
                              <div>
                                <p className="text-xs text-muted-foreground">Positionnement</p>
                                <p className="text-sm text-foreground line-clamp-3">
                                  {((sg?.positioning ?? sg?.preferredStyle) as string)?.trim() || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Cible</p>
                                <p className="text-sm text-foreground line-clamp-3">
                                  {(sg?.targetAudience as string)?.trim() || '—'}
                                </p>
                              </div>
                            </div>
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                              <p className="text-xs font-semibold uppercase text-primary">Après (stratégie calquée)</p>
                              <p className="text-sm font-medium text-foreground">{brand.brand}</p>
                              <div>
                                <p className="text-xs text-muted-foreground">Positionnement</p>
                                <p className="text-sm text-foreground line-clamp-3">
                                  {getSectionContent(analysis ?? '', 'positionnement') || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Cible</p>
                                <p className="text-sm text-foreground line-clamp-3">
                                  {getSectionContent(analysis ?? '', 'cible') || '—'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                            <p className="text-xs font-semibold uppercase text-primary">Ce que vous obtiendrez</p>
                            <p className="text-sm text-muted-foreground">
                              Vous n&apos;avez pas encore de stratégie enregistrée. Calquer appliquera la stratégie de <strong className="text-foreground">{brand.brand}</strong>.
                            </p>
                            <p className="text-sm font-medium text-foreground">{brand.brand}</p>
                            <div>
                              <p className="text-xs text-muted-foreground">Positionnement</p>
                              <p className="text-sm text-foreground line-clamp-3">
                                {getSectionContent(analysis ?? '', 'positionnement') || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Cible</p>
                              <p className="text-sm text-foreground line-clamp-3">
                                {getSectionContent(analysis ?? '', 'cible') || '—'}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                      <p className="text-sm font-medium text-foreground">
                        Cette action est irréversible. Toutes les étapes de Gérer ma marque seront réinitialisées et vous devrez tout recommencer.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pour confirmer, tapez le nom de votre marque : <strong className="text-foreground">{userBrands?.[0]?.name ?? ''}</strong>
                      </p>
                      <Input
                        placeholder="Nom de votre marque"
                        value={calquerConfirmTyped}
                        onChange={(e) => setCalquerConfirmTyped(e.target.value)}
                        disabled={calquerLoading}
                        className="max-w-xs"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleCalquerStrategy}
                          disabled={
                            calquerLoading ||
                            calquerConfirmTyped.trim().toLowerCase() !== (userBrands?.[0]?.name ?? '').trim().toLowerCase()
                          }
                          className="gap-2 bg-primary text-primary-foreground"
                        >
                          {calquerLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Calquage…
                            </>
                          ) : (
                            'Confirmer le calquage'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCalquerShowConfirm(false);
                            setCalquerConfirmTyped('');
                          }}
                          disabled={calquerLoading}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        onClick={() => setCalquerShowConfirm(true)}
                        disabled={!userBrands?.length}
                        className="gap-2 bg-primary text-primary-foreground"
                      >
                        Calquer la stratégie
                      </Button>
                      <Button onClick={downloadStrategy} className="gap-2" variant="outline">
                        <Download className="w-4 h-4" />
                        Télécharger .md
                      </Button>
                      <Button variant="outline" onClick={() => setStrategyResult(null)} disabled={strategyLoading}>
                        Nouvelle stratégie
                      </Button>
                      <Button variant="ghost" onClick={closeStrategyModal}>
                        Fermer
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
