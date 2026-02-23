'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowRight, ArrowLeft, ImageOff, Upload, Sparkles, Globe, CheckCircle2 } from 'lucide-react';
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
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [noLogo, setNoLogo] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

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

  const steps = useMemo(() => {
    const allSteps = [
      { id: 'name', title: 'Le nom de votre marque', subtitle: 'Comment s\'appelle votre projet ?' },
      { id: 'logo', title: 'Votre emblème', subtitle: 'Avez-vous déjà un logo ou un symbole ? (Optionnel)' },
      { id: 'story', title: 'L\'histoire de votre marque', subtitle: 'Quelles sont vos inspirations ?' },
      { id: 'stage', title: 'Stade actuel', subtitle: 'Où en êtes-vous dans la création ?' },
      { id: 'product', title: 'Votre Premier Drop', subtitle: 'Quel sera votre premier vêtement phare ?' },
      { id: 'socials', title: 'Réseaux & Web', subtitle: 'Si vous avez déjà préparé le terrain (Optionnel)' }
    ];
    return hideNameField ? allSteps.slice(1) : allSteps;
  }, [hideNameField]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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

  const handleSave = async (): Promise<boolean> => {
    if (!hideNameField && (!name.trim() || name.trim().length < 2)) {
      setError('Le nom de la marque est requis (2 caractères minimum).');
      return false;
    }
    setError('');
    setLoading(true);
    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 600));
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
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\u2019enregistrement');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    } else {
      const ok = await handleSave();
      if (ok) {
        onComplete();
        router.push('/launch-map/phase/1');
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
    }
  };

  const handleNoLogo = () => {
    setNoLogo(true);
    setLogo('');
    setLogoUploadError('');
  };

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('brandId', brandId);
      formData.append('isLogo', 'true');
      const res = await fetch('/api/ugc/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur upload');
      const url = typeof data.url === 'string' ? data.url : '';
      if (url) {
        setLogo(url);
        setNoLogo(false);
      }
    } catch (e) {
      setLogoUploadError(e instanceof Error ? e.message : 'Erreur lors de l\'upload');
    } finally {
      setLogoUploading(false);
    }
  };

  const canGoNext = () => {
    const currentStepId = steps[currentStepIndex].id;
    if (currentStepId === 'name') return name.trim().length >= 2;
    return true; // other steps optional or have defaults
  };

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canGoNext() && currentStep.id !== 'story') {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-[#F5F5F7] flex flex-col relative overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/5 z-50">
        <div
          className="h-full bg-[#007AFF] transition-all duration-500 ease-out"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto relative z-10 w-full min-h-[500px]">

        {/* Step Header */}
        <div className="text-center space-y-3 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="inline-flex items-center gap-2 bg-[#007AFF]/8 rounded-full px-3 py-1 mb-2">
            <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest">Étape {currentStepIndex + 1} sur {steps.length}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1D1D1F] tracking-tight">{currentStep.title}</h2>
          <p className="text-[15px] text-[#86868B] max-w-sm mx-auto">{currentStep.subtitle}</p>
        </div>

        {/* Step Content Wrapper (Fixed Height Area to avoid jumping) */}
        <div className="w-full flex justify-center items-center min-h-[250px]">

          {currentStep.id === 'name' && (
            <div className="w-full max-w-lg animate-in zoom-in-95 fade-in duration-300">
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Ex. Supreme, Jacquemus..."
                autoFocus
                className="h-[80px] text-center text-3xl sm:text-4xl font-black bg-white border-none rounded-[24px] focus:ring-2 focus:ring-[#007AFF]/50 shadow-sm px-6 text-[#1D1D1F] placeholder:text-black/15 transition-all w-full"
              />
            </div>
          )}

          {currentStep.id === 'logo' && (
            <div className="w-full max-w-md flex flex-col items-center gap-6 animate-in zoom-in-95 fade-in duration-300">
              {!noLogo ? (
                <>
                  <div
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadLogoFile(f); }}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                    onClick={() => logoFileInputRef.current?.click()}
                    className={cn(
                      'w-40 h-40 rounded-[32px] flex flex-col items-center justify-center transition-all cursor-pointer relative group overflow-hidden',
                      logoUploading
                        ? 'border-2 border-[#007AFF]/30 bg-[#007AFF]/5'
                        : logo
                          ? 'border border-black/5 shadow-md bg-white'
                          : 'border-2 border-dashed border-black/10 hover:border-[#007AFF]/40 hover:bg-white bg-white/60'
                    )}
                  >
                    <input ref={logoFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoFile(f); e.target.value = ''; }} />
                    {logo ? (
                      <>
                        <BrandLogo logoUrl={logo} brandName={name || 'Logo'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Upload className="w-6 h-6 text-white mb-1" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Changer</span>
                        </div>
                      </>
                    ) : logoUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mb-3 group-hover:bg-[#007AFF]/10 transition-colors">
                          <Upload className="w-6 h-6 text-[#86868B] group-hover:text-[#007AFF] transition-colors" />
                        </div>
                        <span className="text-[12px] text-[#86868B] font-semibold text-center leading-tight">Glissez votre signature visuelle</span>
                      </>
                    )}
                  </div>
                  {logoUploadError && <p className="text-[13px] text-red-500 font-medium">{logoUploadError}</p>}
                  <button type="button" onClick={handleNoLogo} className="text-[14px] font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors underline decoration-black/20 underline-offset-4">
                    Je n&apos;en ai pas encore
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-[32px] bg-white border border-black/5 flex items-center justify-center shadow-sm">
                    <ImageOff className="w-10 h-10 text-[#86868B]/50" />
                  </div>
                  <p className="text-[15px] text-[#86868B] font-medium">Mode sans logo activé</p>
                  <Button variant="outline" onClick={() => setNoLogo(false)} className="rounded-full mt-2 border-black/10 text-[#1D1D1F]">
                    J&apos;ai un logo finalement
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep.id === 'story' && (
            <div className="w-full max-w-lg animate-in zoom-in-95 fade-in duration-300">
              <div className="relative group">
                <Sparkles className="absolute top-5 left-5 w-5 h-5 text-[#86868B]/40 group-focus-within:text-[#007AFF]/60 transition-colors pointer-events-none" />
                <Textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Je voulais créer une marque vêtement inspirée par..."
                  rows={5}
                  className="w-full bg-white border-none focus:ring-2 focus:ring-[#007AFF]/40 rounded-[28px] text-[16px] text-[#1D1D1F] p-6 pl-14 leading-relaxed placeholder:text-[#86868B]/40 resize-none shadow-sm outline-none transition-all"
                />
              </div>
            </div>
          )}

          {currentStep.id === 'stage' && (
            <div className="w-full max-w-lg animate-in zoom-in-95 fade-in duration-300">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { id: 'ideation', icon: '💡', label: 'Simple Idée', desc: 'Je démarre à peine' },
                  { id: 'prelaunch', icon: '⚙️', label: 'En construction', desc: 'Dessins / Protos en cours' },
                  { id: 'launch', icon: '🚀', label: 'Prêt à lancer', desc: 'Stocks dispos, site prêt' },
                  { id: 'growth', icon: '📈', label: 'En Croissance', desc: 'Déjà en train de vendre' },
                ].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setStage(s.id)}
                    className={cn(
                      "p-5 rounded-[24px] cursor-pointer transition-all border-2 flex flex-col gap-2",
                      stage === s.id
                        ? "bg-white border-[#007AFF] shadow-md shadow-[#007AFF]/10 scale-[1.02]"
                        : "bg-white/50 border-transparent hover:bg-white hover:border-black/5 hover:scale-[1.01]"
                    )}
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <span className="font-bold text-[#1D1D1F] text-[15px]">{s.label}</span>
                    <span className="text-[12px] text-[#86868B] leading-tight">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep.id === 'product' && (
            <div className="w-full max-w-3xl bg-white rounded-[32px] p-8 shadow-sm animate-in zoom-in-95 fade-in duration-300 border border-black/5">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#86868B] ml-1">Vêtement principal</label>
                  <select
                    value={productType}
                    onChange={(e) => {
                      const v = e.target.value as ProductTypeId;
                      setProductType(v);
                      setProductWeight(getWeightOptions(v)[0]?.value ?? '180 g/m²');
                    }}
                    className="w-full h-14 px-5 text-[15px] font-semibold text-[#1D1D1F] bg-[#F5F5F7] border border-transparent rounded-2xl focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all appearance-none cursor-pointer"
                  >
                    {PRODUCT_TYPE_IDS.map((id) => <option key={id} value={id}>{getProductTypeLabel(id)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#86868B] ml-1">Coupe (Optionnel)</label>
                  <select
                    value={productSignature}
                    onChange={(e) => setProductSignature(e.target.value)}
                    className="w-full h-14 px-5 text-[15px] font-semibold text-[#1D1D1F] bg-[#F5F5F7] border border-transparent rounded-2xl focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Classique</option>
                    {ALL_FASHION_CUTS.map((cut) => <option key={cut} value={cut}>{cut}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#86868B] ml-1">Grammage</label>
                  <select
                    value={productWeight}
                    onChange={(e) => setProductWeight(e.target.value)}
                    className="w-full h-14 px-5 text-[15px] font-semibold text-[#1D1D1F] bg-[#F5F5F7] border border-transparent rounded-2xl focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all appearance-none cursor-pointer"
                  >
                    {weightOptions.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/10 flex gap-3 items-start">
                <Sparkles className="w-5 h-5 text-[#007AFF] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#007AFF]/80 leading-relaxed font-medium">
                  {recommendation.reason}
                </p>
              </div>
            </div>
          )}

          {currentStep.id === 'socials' && (
            <div className="w-full max-w-2xl animate-in zoom-in-95 fade-in duration-300">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868B] ml-4">Site Web</label>
                  <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="ma-marque.com" className="h-[60px] px-6 text-[15px] bg-white border-none focus:ring-2 focus:ring-[#007AFF]/40 rounded-[20px] text-[#1D1D1F] placeholder:text-black/20 shadow-sm transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868B] ml-4">Slogan Marketing</label>
                  <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="ex: Just do it" className="h-[60px] px-6 text-[15px] bg-white border-none focus:ring-2 focus:ring-[#007AFF]/40 rounded-[20px] text-[#1D1D1F] placeholder:text-black/20 shadow-sm transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868B] ml-4">Instagram</label>
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@instagram" className="h-[60px] px-6 text-[15px] bg-white border-none focus:ring-2 focus:ring-[#007AFF]/40 rounded-[20px] text-[#1D1D1F] placeholder:text-black/20 shadow-sm transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#86868B] ml-4">TikTok / Twitter</label>
                  <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@pseudo" className="h-[60px] px-6 text-[15px] bg-white border-none focus:ring-2 focus:ring-[#007AFF]/40 rounded-[20px] text-[#1D1D1F] placeholder:text-black/20 shadow-sm transition-all" />
                </div>
              </div>
            </div>
          )}

        </div>

        {error && <p className="text-[14px] text-red-500 font-medium text-center mt-6">{error}</p>}
      </div>

      {/* Footer Navigation */}
      <div className="w-full bg-white/60 backdrop-blur-xl border-t border-black/5 p-4 sm:p-6 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">

          <Button
            variant="ghost"
            onClick={handlePrev}
            className={cn("h-12 px-5 rounded-full text-[14px] font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-all", currentStepIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Précédent
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canGoNext() || loading}
            className="h-14 px-8 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-bold text-[15px] shadow-lg shadow-black/10 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Création...</>
            ) : isLastStep ? (
              <>Créer ma marque <Sparkles className="w-5 h-5 ml-2" /></>
            ) : (
              <>Suivant <ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>

        </div>
      </div>

    </div>
  );
}
