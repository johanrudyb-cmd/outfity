'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowRight, CheckCircle2, Sun, ImageOff, Upload, Sparkles, Globe } from 'lucide-react';
import { BrandLogo } from '@/components/brands/BrandLogo';
import { cn } from '@/lib/utils';
import {
  getSeasonalRecommendation,
  getWeightOptions,
  getProductTypeLabel,
  PRODUCT_TYPE_IDS,
  type ProductTypeId,
} from '@/lib/seasonal-recommendation';
import { ALL_FASHION_CUTS } from '@/lib/constants/fashion-cuts';
import type { BrandIdentity } from './LaunchMapStepper';

interface Phase0IdentityProps {
  brandId: string;
  brand?: BrandIdentity | null;
  brandName?: string;
  onComplete: () => void;
  /** En onboarding : masque le champ nom (affiché par le parent comme « Sélecteur de nom de marque ») */
  hideNameField?: boolean;
  /** Mode test (onboarding) : aucun enregistrement, simulation uniquement */
  demoMode?: boolean;
  userPlan?: string;
}

function styleGuideField(sg: Record<string, unknown> | null | undefined, key: string): string {
  if (!sg || typeof sg !== 'object') return '';
  const v = sg[key];
  return typeof v === 'string' ? v : '';
}

function styleGuideBool(sg: Record<string, unknown> | null | undefined, key: string): boolean {
  if (!sg || typeof sg !== 'object') return false;
  return sg[key] === true || sg[key] === 'true';
}

export function Phase0Identity({ brandId, brand, brandName, onComplete, hideNameField = false, demoMode = false, userPlan = 'free' }: Phase0IdentityProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [noLogo, setNoLogo] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [domain, setDomain] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [story, setStory] = useState('');
  const [mainProduct, setMainProduct] = useState('');
  const [stage, setStage] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [productType, setProductType] = useState<ProductTypeId>('tshirt');
  const [productSignature, setProductSignature] = useState('');
  const [productWeight, setProductWeight] = useState('180 g/m²');

  const recommendation = useMemo(() => getSeasonalRecommendation(), []);
  const weightOptions = useMemo(() => getWeightOptions(productType), [productType]);

  useEffect(() => {
    if (!brand) return;
    setName(brand.name || '');
    setLogo(brand.logo || '');
    const sg = brand.styleGuide && typeof brand.styleGuide === 'object' ? (brand.styleGuide as Record<string, unknown>) : null;
    setNoLogo(styleGuideBool(sg, 'noLogo'));
    setDomain(brand.domain || '');
    const sh = brand.socialHandles && typeof brand.socialHandles === 'object' ? brand.socialHandles : {};
    setInstagram((sh as { instagram?: string }).instagram || '');
    setTwitter((sh as { twitter?: string }).twitter || '');
    setStory(styleGuideField(sg, 'story'));
    setMainProduct(styleGuideField(sg, 'mainProduct'));
    setStage(styleGuideField(sg, 'stage'));
    setTagline(styleGuideField(sg, 'tagline'));
    setDescription(styleGuideField(sg, 'description'));
    const pt = styleGuideField(sg, 'productType') as ProductTypeId;
    if (pt && PRODUCT_TYPE_IDS.includes(pt)) {
      setProductType(pt);
      const w = styleGuideField(sg, 'productWeight');
      if (w) setProductWeight(w);
      setProductSignature(styleGuideField(sg, 'productSignature'));
    } else {
      setProductType(recommendation.productType);
      setProductWeight(recommendation.weight);
      setProductSignature('');
    }
  }, [brand, recommendation.productType, recommendation.weight]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  const handleSave = async (): Promise<boolean> => {
    if (!name.trim() || name.trim().length < 2) {
      setError('Le nom de la marque est requis (2 caractères minimum).');
      return false;
    }
    setError('');
    setLoading(true);
    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 300));
        setSaved(true);
        return true;
      }
      const socialHandles: Record<string, string> = {};
      if (instagram.trim()) socialHandles.instagram = instagram.trim();
      if (twitter.trim()) socialHandles.twitter = twitter.trim();

      const styleGuide: Record<string, string | boolean> = {};
      if (story.trim()) styleGuide.story = story.trim();
      styleGuide.mainProduct = getProductTypeLabel(productType);
      if (stage.trim()) styleGuide.stage = stage.trim();
      if (tagline.trim()) styleGuide.tagline = tagline.trim();
      if (description.trim()) styleGuide.description = description.trim();
      styleGuide.productType = productType;
      styleGuide.productWeight = productWeight;
      styleGuide.productSignature = productSignature;
      styleGuide.noLogo = noLogo;

      const res = await fetch(`/api/brands/${brandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logo: noLogo ? null : (logo.trim() || null),
          logoVariations: !noLogo && logo.trim() ? { main: logo.trim() } : undefined,
          domain: domain.trim() || null,
          socialHandles: Object.keys(socialHandles).length ? socialHandles : null,
          styleGuide,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’enregistrement');
      setSaved(true);
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l’enregistrement');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAndContinue = async () => {
    const ok = await handleSave();
    if (ok) {
      onComplete();
      router.push('/launch-map/phase/1');
    }
  };

  const handleNoLogo = () => {
    setNoLogo(true);
    setLogo('');
    setLogoUploadError('');
  };

  const LOGO_SIZE = 256;

  const checkImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image invalide'));
      };
      img.src = url;
    });
  };

  const uploadLogoFile = async (file: File): Promise<void> => {
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Choisissez une image (PNG, JPG, etc.).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setLogoUploadError('L\'image ne doit pas dépasser 10 Mo.');
      return;
    }
    setLogoUploadError('');
    setLogoUploading(true);
    try {
      const { width, height } = await checkImageDimensions(file);
      if (width !== LOGO_SIZE || height !== LOGO_SIZE) {
        setLogoUploadError(`Le logo doit faire exactement ${LOGO_SIZE}×${LOGO_SIZE} pixels. Votre image fait ${width}×${height} px. Redimensionnez-la puis réessayez.`);
        setLogoUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('brandId', brandId);
      formData.append('isLogo', 'true');
      const res = await fetch('/api/ugc/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur upload');
      const url = typeof data.url === 'string' ? data.url : '';
      if (url) setLogo(url);
    } catch (e) {
      setLogoUploadError(e instanceof Error ? e.message : 'Erreur lors de l\'upload');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadLogoFile(file);
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadLogoFile(file);
    e.target.value = '';
  };

  const hasIdentity = Boolean(name.trim().length >= 2);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-foreground">
            Complétez l&apos;identité de votre marque (nom, logo si vous en avez un). Ce choix sera repris dans les étapes suivantes (modifiable avec confirmation).
          </p>
        </CardContent>
      </Card>

      {/* Identité de base */}
      <div className="grid gap-4 sm:grid-cols-2">
        {!hideNameField && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom de la marque *</label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Ex. Ma Marque"
              className="h-10 border-2"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Logo</label>
          {!noLogo ? (
            <div className="flex flex-col gap-2">
              <div
                onDrop={handleLogoDrop}
                onDragOver={handleLogoDragOver}
                onClick={() => logoFileInputRef.current?.click()}
                className={cn(
                  'flex gap-3 items-center min-h-[50px] rounded-xl border-2 border-dashed transition-all cursor-pointer p-1.5',
                  logoUploading ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30'
                )}
              >
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileSelect}
                />
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 border-2 flex items-center justify-center shadow-sm">
                  {logo ? (
                    <BrandLogo logoUrl={logo} brandName={name || 'Logo'} className="w-full h-full object-contain" />
                  ) : logoUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground leading-tight">
                    {logo ? 'Changer le logo' : 'Ajouter un logo (256x256)'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">PNG, JPG ou SVG</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tight text-muted-foreground gap-1.5 px-2" onClick={handleNoLogo}>
                  <ImageOff className="w-3 h-3" />
                  Pas de logo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold uppercase tracking-tight text-primary border-primary/20 hover:bg-primary/5 gap-1.5 px-2"
                  onClick={() => router.push('/launch-map/phase/1')}
                >
                  <Sparkles className="w-3 h-3" />
                  IA Logo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border-2 border-dashed border-muted-foreground/20">
              <span className="text-[11px] text-muted-foreground font-medium">Mode sans logo</span>
              <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-[11px] hover:bg-transparent underline" onClick={() => setNoLogo(false)}>
                En ajouter un
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Détails & Socials - Plus compact */}
      <div className="rounded-3xl border-2 border-black/5 bg-white p-4 sm:p-6 space-y-4 shadow-apple-sm">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Présence en ligne
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">URL du site / domaine</label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="ma-marque.com" className="h-10 bg-muted/20 border-none shadow-none focus-visible:ring-1" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Slogan / Baseline</label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="La marque qui..." className="h-10 bg-muted/20 border-none shadow-none focus-visible:ring-1" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Instagram</label>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@mamarque" className="h-10 bg-muted/20 border-none shadow-none focus-visible:ring-1" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Twitter / X</label>
            <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@mamarque" className="h-10 bg-muted/20 border-none shadow-none focus-visible:ring-1" />
          </div>
        </div>
      </div>

      {/* Produit Recommandé - Plus compact */}
      <div className="rounded-3xl border-2 border-primary/20 bg-primary/5 p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Sun className="w-4 h-4 text-primary" />
              Produit recommandé
            </h4>
            <p className="text-[11px] text-muted-foreground leading-snug">{recommendation.reason}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</label>
            <select
              value={productType}
              onChange={(e) => {
                const v = e.target.value as ProductTypeId;
                setProductType(v);
                const opts = getWeightOptions(v);
                setProductWeight(opts[0]?.value ?? '180 g/m²');
              }}
              className="w-full h-10 px-3 text-xs bg-white border-none rounded-xl focus:ring-1 focus:ring-primary shadow-apple-sm font-semibold"
            >
              {PRODUCT_TYPE_IDS.map((id) => (
                <option key={id} value={id}>{getProductTypeLabel(id)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Coupe / Signature</label>
            <select
              value={productSignature}
              onChange={(e) => setProductSignature(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white border-none rounded-xl focus:ring-1 focus:ring-primary shadow-apple-sm font-semibold"
            >
              <option value="">Sélectionner</option>
              {ALL_FASHION_CUTS.map((cut) => (
                <option key={cut} value={cut}>{cut}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Poids (g/m²)</label>
            <select
              value={productWeight}
              onChange={(e) => setProductWeight(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white border-none rounded-xl focus:ring-1 focus:ring-primary shadow-apple-sm font-semibold"
            >
              {weightOptions.map((w) => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Story - Plus compact */}
      <div className="rounded-3xl border-2 border-black/5 bg-white p-4 sm:p-6 space-y-3">
        <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Votre Histoire
        </h4>
        <p className="text-[11px] text-muted-foreground">
          Utilisée pour générer vos fiches produits et votre stratégie.
        </p>
        <Textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Racontez pourquoi vous lancez cette marque..."
          className="border-none bg-muted/30 min-h-[100px] text-sm rounded-2xl resize-none focus-visible:ring-1"
        />
      </div>

      {/* Étape / Stade - Plus compact */}
      <div className="rounded-3xl border-2 border-black/5 bg-white p-4 sm:p-6 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-foreground text-sm">Stade du projet</h4>
          <p className="text-[11px] text-muted-foreground">Où en êtes-vous ?</p>
        </div>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="h-10 px-4 text-xs font-bold bg-muted/30 border-none rounded-xl focus:ring-1 focus:ring-primary"
        >
          <option value="">Sélectionnez</option>
          <option value="ideation">Projet</option>
          <option value="prelaunch">Pré-lancement</option>
          <option value="launch">Lancement</option>
          <option value="growth">Croissance</option>
          <option value="established">Établie</option>
        </select>
      </div>

      {error && <p ref={errorRef} className="text-sm text-destructive font-medium">{error}</p>}
      {saved && <p className="text-sm text-green-600 font-medium flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Enregistré.</p>}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={loading || !name.trim()}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Mise à jour de l&apos;ADN…</> : 'Enregistrer les modifications'}
        </Button>
        {hasIdentity && (
          <Button variant="default" onClick={handleValidateAndContinue} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Mise à jour de l&apos;ADN…</> : <>Valider et continuer<ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push('/brands/create')}>
          Autre marque
        </Button>
      </div>
    </div>
  );
}
