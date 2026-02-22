'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowRight, CheckCircle2, ImageOff, Upload, Sparkles, Globe } from 'lucide-react';
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
  hideNameField?: boolean;
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
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\u2019enregistrement');
      setSaved(true);
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\u2019enregistrement');
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
        setLogoUploadError(`Le logo doit faire exactement ${LOGO_SIZE}×${LOGO_SIZE} pixels. Votre image fait ${width}×${height} px.`);
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
    <div className="min-h-screen w-full bg-[#F5F5F7] relative">

      {/* Subtle gradient from top */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 space-y-20 pb-40 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* En-tête */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#007AFF]/8 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
            <span className="text-[11px] font-bold text-[#007AFF] uppercase tracking-widest">ADN de Marque</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1D1D1F] tracking-tight leading-[1.08]">
            Donnez vie à<br />
            <span className="text-[#007AFF]">votre marque.</span>
          </h2>
          <p className="text-[16px] text-[#86868B] max-w-md mx-auto leading-relaxed">
            Ces fondations guideront notre IA tout au long de votre parcours de création.
          </p>
        </div>

        {/* 01 — Nom */}
        {!hideNameField && (
          <div className="space-y-5">
            <div className="text-center">
              <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em]">01 — Le nom de votre marque</span>
            </div>
            <div className="relative group">
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Ex. Supreme, Jacquemus..."
                autoFocus
                className="h-[72px] text-center text-3xl sm:text-4xl font-black bg-transparent border-0 border-b-2 border-black/10 rounded-none focus:border-[#007AFF] focus:ring-0 shadow-none px-2 text-[#1D1D1F] placeholder:text-[#1D1D1F]/15 transition-colors"
              />
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#007AFF] scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-center" />
              {hasIdentity && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 animate-in fade-in zoom-in duration-300" />
              )}
            </div>
          </div>
        )}

        {/* 02 — Logo */}
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em]">02 — Votre emblème (optionnel)</span>
          </div>
          {!noLogo ? (
            <div className="flex flex-col items-center gap-5">
              <div
                onDrop={handleLogoDrop}
                onDragOver={handleLogoDragOver}
                onClick={() => logoFileInputRef.current?.click()}
                className={cn(
                  'w-32 h-32 rounded-[28px] flex flex-col items-center justify-center transition-all cursor-pointer relative group overflow-hidden',
                  logoUploading
                    ? 'border-2 border-[#007AFF]/30 bg-[#007AFF]/5'
                    : logo
                      ? 'border border-black/5 shadow-md bg-white'
                      : 'border-2 border-dashed border-black/10 hover:border-[#007AFF]/40 hover:bg-white bg-white/60'
                )}
              >
                <input ref={logoFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFileSelect} />
                {logo ? (
                  <>
                    <BrandLogo logoUrl={logo} brandName={name || 'Logo'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 rounded-[26px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-6 h-6 text-white mb-1" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Changer</span>
                    </div>
                  </>
                ) : logoUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-2 group-hover:bg-[#007AFF]/10 transition-colors">
                      <Upload className="w-5 h-5 text-[#86868B] group-hover:text-[#007AFF] transition-colors" />
                    </div>
                    <span className="text-[10px] text-[#86868B] font-semibold max-w-[80px] text-center leading-tight">Glissez votre logo</span>
                  </>
                )}
              </div>
              {logoUploadError && <p className="text-[12px] text-red-500 text-center">{logoUploadError}</p>}
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleNoLogo} className="h-10 px-5 rounded-full text-[13px] font-semibold text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5 transition-all">
                  Je n&apos;en ai pas
                </button>
                <div className="w-px h-4 bg-black/10" />
                <button
                  type="button"
                  onClick={() => router.push('/launch-map/phase/1')}
                  className="h-10 px-5 rounded-full text-[13px] font-bold text-[#007AFF] hover:bg-[#007AFF]/8 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Générer par IA
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-3xl bg-white border border-black/5 flex items-center justify-center shadow-sm">
                <ImageOff className="w-8 h-8 text-[#86868B]" />
              </div>
              <p className="text-[14px] text-[#86868B] font-medium">Mode sans logo</p>
              <button type="button" onClick={() => setNoLogo(false)} className="h-9 px-5 rounded-full text-[13px] font-bold text-[#007AFF] border border-[#007AFF]/20 hover:bg-[#007AFF]/8 transition-all">
                J&apos;ai un logo finalement
              </button>
            </div>
          )}
        </div>

        {/* Séparateur */}
        {hasIdentity && (
          <div className="w-full h-px bg-gradient-to-r from-transparent via-black/8 to-transparent" />
        )}

        {/* Sections suivantes — visibles quand le nom est valide */}
        <div className={cn(
          "space-y-20 transition-all duration-700",
          hasIdentity ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none hidden"
        )}>

          {/* 03 — Histoire */}
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em] block">03 — L&apos;histoire de {name || 'votre projet'}</span>
              <p className="text-[13px] text-[#86868B]">Elle nourrira vos fiches produits et votre stratégie IA.</p>
            </div>
            <div className="relative group">
              <Sparkles className="absolute top-5 left-5 w-4 h-4 text-[#86868B]/40 group-focus-within:text-[#007AFF]/60 transition-colors pointer-events-none" />
              <Textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Je voulais créer une marque qui..."
                rows={4}
                className="w-full bg-white border border-black/5 focus:border-[#007AFF]/40 focus:ring-1 focus:ring-[#007AFF]/20 rounded-[24px] text-[15px] text-[#1D1D1F] p-5 pl-12 leading-relaxed placeholder:text-[#86868B]/35 resize-none transition-all shadow-sm outline-none"
              />
            </div>
          </div>

          {/* 04 — Stade */}
          <div className="space-y-5">
            <div className="text-center">
              <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em] block">04 — Stade actuel du projet</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5">
              {[
                { id: 'ideation', label: '💡 Simple Idée' },
                { id: 'prelaunch', label: '⚙️ En construction' },
                { id: 'launch', label: '🚀 Prêt à lancer' },
                { id: 'growth', label: '📈 En Croissance' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id)}
                  className={cn(
                    "px-5 py-3 rounded-full text-[14px] font-semibold transition-all border",
                    stage === s.id
                      ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-md scale-105"
                      : "bg-white text-[#86868B] border-black/8 hover:border-black/20 hover:text-[#1D1D1F] shadow-sm"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 05 — Premier Drop */}
          <div className="bg-white rounded-[28px] border border-black/5 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="text-center space-y-1.5">
              <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em] block">05 — Votre premier Drop</span>
              <p className="text-[13px] text-[#86868B] max-w-xs mx-auto leading-relaxed">{recommendation.reason}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] pl-1">Vêtement</label>
                <select
                  value={productType}
                  onChange={(e) => {
                    const v = e.target.value as ProductTypeId;
                    setProductType(v);
                    setProductWeight(getWeightOptions(v)[0]?.value ?? '180 g/m²');
                  }}
                  className="w-full h-12 px-4 text-[14px] font-semibold text-[#1D1D1F] bg-[#F5F5F7] border-transparent rounded-xl focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  {PRODUCT_TYPE_IDS.map((id) => <option key={id} value={id}>{getProductTypeLabel(id)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] pl-1">Coupe</label>
                <select
                  value={productSignature}
                  onChange={(e) => setProductSignature(e.target.value)}
                  className="w-full h-12 px-4 text-[14px] font-semibold text-[#1D1D1F] bg-[#F5F5F7] border-transparent rounded-xl focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Optionnelle</option>
                  {ALL_FASHION_CUTS.map((cut) => <option key={cut} value={cut}>{cut}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] pl-1">Grammage</label>
                <select
                  value={productWeight}
                  onChange={(e) => setProductWeight(e.target.value)}
                  className="w-full h-12 px-4 text-[14px] font-semibold text-[#1D1D1F] bg-[#F5F5F7] border-transparent rounded-xl focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  {weightOptions.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 06 — Réseaux (optionnel) */}
          <div className="space-y-5 pb-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-[0.2em] block">
                <Globe className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />
                06 — Réseaux & Web (Optionnel)
              </span>
              <p className="text-[13px] text-[#86868B]">Si vous avez déjà préparé le terrain.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="ma-marque.com" className="h-12 px-5 text-[14px] bg-white border border-black/8 hover:border-black/15 focus:border-[#007AFF]/40 focus:ring-1 focus:ring-[#007AFF]/20 rounded-2xl text-center text-[#1D1D1F] placeholder:text-[#86868B]/40 shadow-none transition-all" />
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Slogan (si vous en avez un)" className="h-12 px-5 text-[14px] bg-white border border-black/8 hover:border-black/15 focus:border-[#007AFF]/40 focus:ring-1 focus:ring-[#007AFF]/20 rounded-2xl text-center text-[#1D1D1F] placeholder:text-[#86868B]/40 shadow-none transition-all" />
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@instagram" className="h-12 px-5 text-[14px] bg-white border border-black/8 hover:border-black/15 focus:border-[#007AFF]/40 focus:ring-1 focus:ring-[#007AFF]/20 rounded-2xl text-center text-[#1D1D1F] placeholder:text-[#86868B]/40 shadow-none transition-all" />
              <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@twitter / X" className="h-12 px-5 text-[14px] bg-white border border-black/8 hover:border-black/15 focus:border-[#007AFF]/40 focus:ring-1 focus:ring-[#007AFF]/20 rounded-2xl text-center text-[#1D1D1F] placeholder:text-[#86868B]/40 shadow-none transition-all" />
            </div>
          </div>
        </div>

        {error && <p ref={errorRef} className="text-[14px] text-red-500 font-medium text-center">{error}</p>}
        {saved && (
          <p className="text-[14px] text-emerald-600 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Informations sauvegardées avec succès.
          </p>
        )}
      </div>

      {/* Barre d'action flottante */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7]/95 to-transparent pointer-events-none transition-all duration-500 flex justify-center z-50",
        hasIdentity ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}>
        <div className="pointer-events-auto flex items-center gap-3 max-w-lg w-full bg-white/80 backdrop-blur-xl p-2.5 rounded-full border border-black/8 shadow-xl shadow-black/5">
          <button
            onClick={() => router.push('/brands/create')}
            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-[#F5F5F7] hover:bg-black/5 text-[#86868B] hover:text-[#1D1D1F] transition-all"
            title="Changer de marque"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>

          <Button
            onClick={handleValidateAndContinue}
            disabled={loading}
            className="flex-1 h-12 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-bold text-[15px] shadow-lg shadow-black/10 hover:shadow-xl transition-all active:scale-[0.98] group border-0"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Sauvegarde...</>
            ) : (
              <>Confirmer et continuer <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-0.5 transition-transform" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
