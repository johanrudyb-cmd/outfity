'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  ImageOff,
  Upload,
  Sparkles,
  Globe,
  Fingerprint,
  Wind,
  Layers,
  Compass,
  Feather,
  Zap,
  Check
} from 'lucide-react';
import { BrandLogo } from '@/components/brands/BrandLogo';
import { cn } from '@/lib/utils';
import {
  getSeasonalRecommendation,
  getWeightOptions,
  getProductTypeLabel,
  PRODUCT_TYPE_IDS,
  type ProductTypeId,
} from '@/lib/seasonal-recommendation';
import { ALL_FASHION_CUTS, FASHION_CUTS_BY_CATEGORY } from '@/lib/constants/fashion-cuts';
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

  const signatureOptions = useMemo(() => {
    let cuts: readonly string[] = [];
    switch (productType) {
      case 'tshirt': cuts = FASHION_CUTS_BY_CATEGORY.TSHIRT; break;
      case 'hoodie': cuts = FASHION_CUTS_BY_CATEGORY.SWEAT; break;
      case 'veste': cuts = FASHION_CUTS_BY_CATEGORY.JACKEX; break;
      case 'pantalon': cuts = FASHION_CUTS_BY_CATEGORY.PANT; break;
      default: cuts = ALL_FASHION_CUTS;
    }
    return [{ v: '', l: 'Classique' }, ...cuts.map(c => ({ v: c, l: c }))];
  }, [productType]);

  const steps = useMemo(() => {
    const allSteps = [
      {
        id: 'name',
        title: 'Baptême.',
        subtitle: 'Le nom est l\'âme de votre projet. Manifestez-le.',
        icon: <Fingerprint className="w-6 h-6" />,
        accent: 'bg-[#007AFF]'
      },
      {
        id: 'logo',
        title: 'L\'Emblème.',
        subtitle: 'Un symbole pour rallier votre communauté.',
        icon: <Wind className="w-6 h-6" />,
        accent: 'bg-indigo-500'
      },
      {
        id: 'story',
        title: 'Le Manifeste.',
        subtitle: 'Pourquoi ce projet ? Pourquoi maintenant ?',
        icon: <Feather className="w-6 h-6" />,
        accent: 'bg-slate-700'
      },
      {
        id: 'stage',
        title: 'L\'Étape.',
        subtitle: 'Situons votre marque sur la carte du temps.',
        icon: <Compass className="w-6 h-6" />,
        accent: 'bg-emerald-500'
      },
      {
        id: 'product',
        title: 'La Pièce.',
        subtitle: 'Le premier contact physique avec votre univers.',
        icon: <Layers className="w-6 h-6" />,
        accent: 'bg-rose-500'
      },
      {
        id: 'socials',
        title: 'Le Réseau.',
        subtitle: 'Où le monde pourra-t-il vous rencontrer ?',
        icon: <Globe className="w-6 h-6" />,
        accent: 'bg-sky-500'
      }
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
      setError('Un nom de marque est requis.');
      return false;
    }
    setError('');
    setLoading(true);
    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 1200));
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
      if (!res.ok) throw new Error('Erreur');
      router.refresh();
      return true;
    } catch (e) {
      setError('Une erreur est survenue lors de l\'enregistrement.');
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

  const uploadLogoFile = async (file: File): Promise<void> => {
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Format image requis.');
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
      if (!res.ok) throw new Error('Erreur');
      if (data.url) {
        setLogo(data.url);
        setNoLogo(false);
      }
    } catch (e) {
      setLogoUploadError('Erreur d\'envoi.');
    } finally {
      setLogoUploading(false);
    }
  };

  const canGoNext = () => {
    const currentStepId = steps[currentStepIndex].id;
    if (currentStepId === 'name') return name.trim().length >= 2;
    return true;
  };

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] flex flex-col items-center relative overflow-hidden text-[#1D1D1F] selection:bg-[#007AFF]/20 pb-32 sm:pb-0">

      {/* Immersive Apple-Pro Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-[#007AFF]/5 rounded-full blur-[160px] animate-pulse duration-[8s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-slate-300/30 rounded-full blur-[140px] animate-pulse duration-[6s] delay-1000" />

        {/* Huge Background Text Overlay (Better Contrast) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] select-none pointer-events-none">
          <h1 className="text-[25vw] font-black tracking-tighter uppercase whitespace-nowrap leading-none text-black">
            {name || 'OUTFITY'}
          </h1>
        </div>
      </div>

      {/* Premium Navigation Bridge */}
      <div className="w-full max-w-7xl px-6 sm:px-8 pt-8 sm:pt-12 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Identité de Marque</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Atelier <span className="text-[#007AFF]">Digital</span></h2>
        </div>
        <div className="flex gap-4 items-center w-full sm:w-auto">
          <div className="flex flex-1 sm:flex-none gap-1 bg-white/40 p-1.5 rounded-full backdrop-blur-xl border border-black/5 shadow-sm">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 sm:h-2 rounded-full transition-all duration-700",
                  i <= currentStepIndex ? "flex-1 sm:w-10 bg-[#007AFF]" : "w-4 sm:w-2 bg-black/10"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Immersive Stage - Light & Airy */}
      <div className="flex-1 w-full max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col z-20 py-6 sm:py-8 lg:py-12">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 lg:gap-12 xl:gap-20 items-center">

          {/* Left Side: Context & Philosophy */}
          <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className={cn("w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] sm:rounded-[28px] flex items-center justify-center shadow-lg text-white transition-all duration-700 bg-white border border-black/5", currentStep.accent.replace('bg-', 'text-'))}>
              <div className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white", currentStep.accent)}>
                {currentStep.icon}
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-3xl sm:text-4xl md:text-5xl xl:text-7xl font-bold tracking-tight leading-[1] text-[#1D1D1F] break-words">{currentStep.title}</h3>
              <p className="text-base sm:text-lg md:text-xl xl:text-2xl text-[#86868B] max-w-md font-medium leading-relaxed">{currentStep.subtitle}</p>
            </div>

            <div className="pt-6 sm:pt-10 border-t border-black/5 grid grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-1">
                <p className="text-[9px] sm:text-[10px] font-bold text-black/30 uppercase tracking-widest">Étape</p>
                <p className="text-xs sm:text-sm font-bold text-[#1D1D1F]">{(currentStepIndex + 1).toString().padStart(2, '0')} / {steps.length.toString().padStart(2, '0')}</p>
              </div>
              <div className="space-y-1 text-right sm:text-left">
                <p className="text-[9px] sm:text-[10px] font-bold text-black/30 uppercase tracking-widest">Type</p>
                <p className="text-xs sm:text-sm font-bold text-[#1D1D1F]">DROP CONFIG</p>
              </div>
            </div>
          </div>

          {/* Right Side: High-End Interactive Workspace */}
          <div className="relative min-h-[260px] sm:min-h-[350px] md:min-h-[380px] xl:min-h-[450px] flex flex-col justify-center">
            <div className="max-w-xl w-full mx-auto">

              {currentStep.id === 'name' && (
                <div className="relative group animate-in zoom-in-95 duration-700">
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="Écrivez ici..."
                    autoFocus
                    className="w-full bg-transparent border-none text-3xl sm:text-5xl md:text-6xl xl:text-7xl font-bold text-[#1D1D1F] placeholder:text-black/10 focus:outline-none focus:ring-0 transition-all caret-[#007AFF] text-right uppercase tracking-tighter"
                  />
                  <div className="h-1.5 w-full bg-black/5 mt-4 sm:mt-6 relative overflow-hidden rounded-full">
                    <div className={cn("absolute inset-0 bg-[#007AFF] transition-all duration-1000", name.length >= 2 ? "translate-x-0" : "-translate-x-full")} />
                  </div>
                </div>
              )}

              {currentStep.id === 'logo' && (
                <div className="flex flex-col items-center lg:items-end gap-8 sm:gap-12 w-full animate-in fade-in slide-in-from-right-8 duration-1000">
                  <div
                    onClick={() => logoFileInputRef.current?.click()}
                    className={cn(
                      "w-48 h-48 sm:w-64 sm:h-64 rounded-[40px] sm:rounded-[56px] border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 group relative overflow-hidden shadow-2xl",
                      logo ? "border-black/5 bg-white scale-[1.05]" : "border-dashed border-black/10 hover:border-[#007AFF]/40 hover:bg-white bg-white/50"
                    )}
                  >
                    <input ref={logoFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoFile(f); }} />
                    {logo ? (
                      <BrandLogo logoUrl={logo} brandName={name} className="w-full h-full object-contain p-8 sm:p-10" />
                    ) : logoUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]/30" />
                    ) : (
                      <div className="text-center space-y-3 sm:space-y-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mx-auto transition-all group-hover:bg-[#007AFF] group-hover:text-white">
                          <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <span className="text-[10px] sm:text-[12px] font-bold text-black/30 uppercase tracking-[0.3em]">Déposez Logo</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setNoLogo(!noLogo)} className="text-[13px] sm:text-[14px] font-bold text-[#86868B] hover:text-[#1D1D1F] transition-colors flex items-center gap-3">
                    <div className={cn("w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-black/10 flex items-center justify-center transition-all", noLogo && "bg-[#007AFF] border-[#007AFF]")}>
                      {noLogo && <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white font-black" />}
                    </div>
                    Pas de logo pour l&apos;instant
                  </button>
                </div>
              )}

              {currentStep.id === 'story' && (
                <div className="w-full animate-in fade-in duration-1000">
                  <Textarea
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="Racontez-nous votre vision..."
                    className="w-full bg-white/80 backdrop-blur-2xl border border-black/5 focus:border-[#007AFF]/30 focus:ring-0 rounded-[32px] sm:rounded-[48px] text-lg sm:text-xl xl:text-2xl text-[#1D1D1F] p-8 sm:p-12 min-h-[250px] sm:min-h-[300px] xl:min-h-[350px] placeholder:text-black/10 shadow-2xl transition-all resize-none leading-relaxed"
                  />
                </div>
              )}

              {currentStep.id === 'stage' && (
                <div className="grid grid-cols-1 gap-3 sm:gap-4 w-full">
                  {[
                    { id: 'ideation', label: 'Simple Idée', icon: <Sparkles className="w-5 h-5" />, desc: 'Le voyage commence à peine.' },
                    { id: 'prelaunch', label: 'En Conception', icon: <Fingerprint className="w-5 h-5" />, desc: 'Prototypes et design en cours.' },
                    { id: 'launch', label: 'Prêt au Lancement', icon: <Zap className="w-5 h-5" />, desc: 'Prêt pour le marché.' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStage(s.id)}
                      className={cn(
                        "p-6 sm:p-8 rounded-[28px] sm:rounded-[36px] flex items-center gap-4 sm:gap-8 transition-all duration-700 text-left border relative overflow-hidden group",
                        stage === s.id
                          ? "bg-white border-white text-[#1D1D1F] shadow-2xl scale-[1.02]"
                          : "bg-white/40 border-black/5 text-[#86868B] hover:bg-white hover:border-black/10"
                      )}
                    >
                      <div className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-[22px] flex items-center justify-center transition-all shadow-sm", stage === s.id ? "bg-[#007AFF] text-white" : "bg-white text-black/20")}>
                        {s.icon}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1 flex-1">
                        <span className="text-base sm:text-[17px] font-bold tracking-tight text-[#1D1D1F]">{s.label}</span>
                        <p className="text-xs sm:text-sm opacity-60 leading-tight line-clamp-1">{s.desc}</p>
                      </div>
                      {stage === s.id && <div className="animate-in zoom-in duration-500"><div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center"><Check className="w-4 h-4 sm:w-5 h-5 text-[#007AFF]" /></div></div>}
                    </button>
                  ))}
                </div>
              )}

              {currentStep.id === 'product' && (
                <div className="space-y-8 sm:space-y-12 w-full animate-in fade-in duration-1000">
                  {[
                    {
                      label: 'Vêtement Phare',
                      val: productType,
                      opt: PRODUCT_TYPE_IDS.map(id => ({ v: id, l: getProductTypeLabel(id) })),
                      set: (val: ProductTypeId) => {
                        setProductType(val);
                        const newWeights = getWeightOptions(val);
                        if (newWeights.length > 0) setProductWeight(newWeights[0].value);
                        setProductSignature('');
                      }
                    },
                    { label: 'Signature Visuelle', val: productSignature, opt: signatureOptions, set: setProductSignature },
                    { label: 'Texile (GSM)', val: productWeight, opt: weightOptions.map(w => ({ v: w.value, l: w.label })), set: setProductWeight },
                  ].map((field, idx) => (
                    <div key={idx} className="space-y-3 sm:space-y-5">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-black/30 ml-2">{field.label}</p>
                      <div className="flex flex-wrap gap-2 sm:gap-2.5">
                        {field.opt.slice(0, 6).map((o: any) => (
                          <button
                            key={o.v}
                            onClick={() => field.set(o.v)}
                            className={cn(
                              "px-5 py-3 sm:px-8 sm:py-4 rounded-2xl sm:rounded-3xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-500 border",
                              field.val === o.v
                                ? "bg-white border-white text-[#007AFF] shadow-xl scale-105"
                                : "bg-white/50 border-black/5 text-[#86868B] hover:bg-white hover:border-black/10"
                            )}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentStep.id === 'socials' && (
                <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full animate-in fade-in slide-in-from-right-8 duration-1000">
                  {[
                    { val: domain, set: setDomain, ph: 'ma-marque.com', label: 'NOM DE DOMAINE' },
                    { val: tagline, set: setTagline, ph: 'Votre Baseline', label: 'SIGNATURE' },
                    { val: instagram, set: setInstagram, ph: '@pseudo', label: 'INSTAGRAM' },
                    { val: twitter, set: setTwitter, ph: '@pseudo', label: 'TIKTOK' },
                  ].map((x, i) => (
                    <div key={i} className="group relative">
                      <span className="absolute -top-2.5 left-6 sm:left-8 px-2 sm:px-3 bg-[#F5F5F7] text-[8px] sm:text-[10px] font-black text-black/30 uppercase tracking-[0.4em] z-10 transition-colors group-focus-within:text-[#007AFF]">
                        {x.label}
                      </span>
                      <input
                        value={x.val}
                        onChange={(e) => x.set(e.target.value)}
                        placeholder={x.ph}
                        className="w-full bg-white/50 border-2 border-black/5 rounded-2xl sm:rounded-[32px] h-16 sm:h-20 px-6 sm:px-10 font-bold text-lg sm:text-xl text-[#1D1D1F] placeholder:text-black/10 focus:bg-white focus:border-[#007AFF]/20 focus:ring-0 transition-all outline-none shadow-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic Control Dock - Mobile Optimized */}
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16 z-30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 lg:pt-12 border-t border-black/5">
          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={handlePrev}
              className={cn(
                "flex-1 sm:flex-none h-14 sm:h-16 px-6 sm:px-10 rounded-2xl sm:rounded-[24px] font-bold text-xs sm:text-[13px] uppercase tracking-widest transition-all border border-black/10 bg-white hover:bg-slate-50 flex items-center justify-center gap-3",
                currentStepIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Précédent</span>
            </button>
            {error && <p className="hidden lg:flex items-center text-rose-500 font-bold text-[13px] px-8 bg-rose-50 rounded-[24px] animate-in zoom-in duration-300">! {error}</p>}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoNext() || loading}
            className="w-full sm:w-auto h-14 sm:h-16 px-12 sm:px-16 rounded-2xl sm:rounded-[24px] bg-[#1D1D1F] hover:bg-black text-white font-bold text-xs sm:text-[14px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 group overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center justify-center gap-3 sm:gap-4">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLastStep ? (
                "Forger la Marque"
              ) : (
                <>Suivant <ArrowRight className="w-4 h-4 sm:w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Button>
        </div>
        {error && <p className="lg:hidden text-center text-rose-500 font-bold text-xs mt-4 animate-in fade-in">! {error}</p>}
      </div>

      {/* Floating Vertical Index (Desktop Only) */}
      <div className="fixed right-8 lg:right-12 top-1/2 -translate-y-1/2 flex flex-col gap-6 sm:gap-8 z-30 hidden 2xl:flex bg-white/60 backdrop-blur-3xl p-5 rounded-full border border-black/5 shadow-apple-sm">
        {steps.map((st, i) => (
          <div
            key={st.id}
            onClick={() => i === 0 || name.length >= 2 ? setCurrentStepIndex(i) : null}
            className={cn(
              "w-3.5 h-3.5 rounded-full transition-all duration-700 cursor-pointer border-2",
              i === currentStepIndex ? "bg-[#007AFF] scale-150 border-white shadow-lg" : "bg-black/10 hover:bg-black/20 border-transparent"
            )}
            title={st.title}
          />
        ))}
      </div>
    </div>
  );
}
