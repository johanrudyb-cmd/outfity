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
      {
        id: 'name',
        title: 'Baptême.',
        subtitle: 'Le nom est l\'âme de votre projet. Manifestez-le.',
        icon: <Fingerprint className="w-6 h-6" />,
        accent: 'bg-blue-600'
      },
      {
        id: 'logo',
        title: 'L\'Emblème.',
        subtitle: 'Un symbole pour rallier votre communauté.',
        icon: <Wind className="w-6 h-6" />,
        accent: 'bg-indigo-600'
      },
      {
        id: 'story',
        title: 'Le Manifeste.',
        subtitle: 'Pourquoi ce projet ? Pourquoi maintenant ?',
        icon: <Feather className="w-6 h-6" />,
        accent: 'bg-slate-800'
      },
      {
        id: 'stage',
        title: 'L\'Étape.',
        subtitle: 'Situons votre marque sur la carte du temps.',
        icon: <Compass className="w-6 h-6" />,
        accent: 'bg-emerald-600'
      },
      {
        id: 'product',
        title: 'La Pièce.',
        subtitle: 'Le premier contact physique avec votre univers.',
        icon: <Layers className="w-6 h-6" />,
        accent: 'bg-rose-600'
      },
      {
        id: 'socials',
        title: 'Le Réseau.',
        subtitle: 'Où le monde pourra-t-il vous rencontrer ?',
        icon: <Globe className="w-6 h-6" />,
        accent: 'bg-sky-600'
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
    <div className="min-h-screen w-full bg-[#0a0a0b] flex flex-col items-center relative overflow-hidden text-white selection:bg-blue-500/30">

      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-blue-900/20 rounded-full blur-[160px] animate-pulse duration-[8s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-slate-800/20 rounded-full blur-[140px] animate-pulse duration-[6s] delay-1000" />

        {/* Huge Background Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none overflow-hidden">
          <h1 className="text-[30vw] font-black tracking-tighter uppercase whitespace-nowrap leading-none">
            {name || 'OUTFITY'}
          </h1>
        </div>
      </div>

      {/* Persistent Atelier Header */}
      <div className="w-full max-w-7xl px-8 pt-12 z-20 flex justify-between items-end">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Phase 0 : L&apos;Origine</p>
          <h2 className="text-2xl font-light tracking-widest uppercase">Atelier <span className="font-bold">Créatif</span></h2>
        </div>
        <div className="flex gap-4 items-center">
          <div className="hidden sm:flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-1000",
                  i <= currentStepIndex ? "w-12 bg-white" : "w-2 bg-white/10"
                )}
              />
            ))}
          </div>
          <div className="px-4 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-3xl text-[12px] font-mono tracking-tighter">
            {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Immersive Main Stage */}
      <div className="flex-1 w-full max-w-6xl px-8 flex flex-col z-20 py-12">
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Side: Information & Context */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl text-white transition-all duration-700", currentStep.accent)}>
              {currentStep.icon}
            </div>
            <div className="space-y-4">
              <h3 className="text-6xl sm:text-7xl font-bold tracking-tighter leading-[0.95]">{currentStep.title}</h3>
              <p className="text-xl text-white/40 max-w-md font-medium leading-relaxed">{currentStep.subtitle}</p>
            </div>

            {/* Step Hint / Mini-Dashboard */}
            <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Focus Actuel</p>
                <p className="text-sm font-semibold">{currentStep.id.toUpperCase()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Collection</p>
                <p className="text-sm font-semibold">ESSENTIALS V1</p>
              </div>
            </div>
          </div>

          {/* Right Side: Editorial Interaction Area */}
          <div className="relative min-h-[400px] flex flex-col justify-center">
            <div className="max-w-xl w-full mx-auto">

              {currentStep.id === 'name' && (
                <div className="relative group animate-in zoom-in-95 duration-700">
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="Écrivez ici..."
                    autoFocus
                    className="w-full bg-transparent border-none text-5xl sm:text-7xl font-bold text-white placeholder:text-white/5 focus:outline-none focus:ring-0 transition-all caret-blue-500 text-right uppercase tracking-tighter"
                  />
                  <div className="h-0.5 w-full bg-white/5 mt-6 relative overflow-hidden">
                    <div className={cn("absolute inset-0 bg-blue-500 transition-all duration-1000", name.length >= 2 ? "translate-x-0" : "-translate-x-full")} />
                  </div>
                </div>
              )}

              {currentStep.id === 'logo' && (
                <div className="flex flex-col items-end gap-12 w-full animate-in fade-in slide-in-from-right-8 duration-1000">
                  <div
                    onClick={() => logoFileInputRef.current?.click()}
                    className={cn(
                      "w-64 h-64 rounded-[48px] border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 group relative overflow-hidden shadow-2xl shadow-blue-500/0 hover:shadow-blue-500/20",
                      logo ? "border-white/20 bg-white/5 backdrop-blur-3xl scale-[1.05]" : "border-dashed border-white/10 hover:border-white/30 hover:bg-white/5"
                    )}
                  >
                    <input ref={logoFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogoFile(f); }} />
                    {logo ? (
                      <BrandLogo logoUrl={logo} brandName={name} className="w-full h-full object-contain p-8 filter brightness-110 contrast-125" />
                    ) : logoUploading ? (
                      <Loader2 className="w-10 h-10 animate-spin text-white/20" />
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto transition-all group-hover:bg-white group-hover:text-black">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-[12px] font-black text-white/30 uppercase tracking-[0.3em]">Drop Image</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setNoLogo(!noLogo)} className="text-[14px] font-bold text-white/30 hover:text-white transition-colors flex items-center gap-3">
                    <div className={cn("w-5 h-5 rounded-full border-2 border-white/10 flex items-center justify-center transition-all", noLogo && "bg-white border-white")}>
                      {noLogo && <Check className="w-3 h-3 text-black font-black" />}
                    </div>
                    Je n&apos;ai pas de logo pour l&apos;instant
                  </button>
                </div>
              )}

              {currentStep.id === 'story' && (
                <div className="w-full animate-in fade-in duration-1000">
                  <Textarea
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="Racontez-nous la genèse..."
                    className="w-full bg-white/5 backdrop-blur-3xl border border-white/10 focus:border-white/30 focus:ring-0 rounded-[40px] text-2xl text-white p-10 min-h-[300px] placeholder:text-white/5 shadow-2xl transition-all resize-none font-light leading-relaxed"
                  />
                </div>
              )}

              {currentStep.id === 'stage' && (
                <div className="grid grid-cols-1 gap-4 w-full">
                  {[
                    { id: 'ideation', label: 'Inspiration', icon: <Sparkles className="w-5 h-5" />, desc: 'La graine vient d\'être plantée.' },
                    { id: 'prelaunch', label: 'Conception', icon: <Fingerprint className="w-5 h-5" />, desc: 'Les premiers prototypes prennent vie.' },
                    { id: 'launch', label: 'Manifestation', icon: <Zap className="w-5 h-5" />, desc: 'Prêt à bousculer le marché.' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStage(s.id)}
                      className={cn(
                        "p-8 rounded-[32px] flex items-center gap-6 transition-all duration-700 text-left border relative overflow-hidden group",
                        stage === s.id
                          ? "bg-white border-white text-black shadow-2xl scale-[1.02]"
                          : "bg-white/5 border-white/5 text-white hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", stage === s.id ? "bg-black text-white" : "bg-white/10 text-white")}>
                        {s.icon}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[16px] font-black uppercase tracking-widest">{s.label}</span>
                        <p className={cn("text-xs transition-colors", stage === s.id ? "text-black/50" : "text-white/30")}>{s.desc}</p>
                      </div>
                      {stage === s.id && <div className="ml-auto animate-in zoom-in duration-500"><Check className="w-6 h-6" /></div>}
                    </button>
                  ))}
                </div>
              )}

              {currentStep.id === 'product' && (
                <div className="space-y-12 w-full animate-in fade-in duration-1000">
                  {[
                    { label: 'Catégorie', val: productType, opt: PRODUCT_TYPE_IDS.map(id => ({ v: id, l: getProductTypeLabel(id) })), set: setProductType },
                    { label: 'Signature', val: productSignature, opt: [{ v: '', l: 'Standard' }, ...ALL_FASHION_CUTS.map(c => ({ v: c, l: c }))], set: setProductSignature },
                    { label: 'Grammage', val: productWeight, opt: weightOptions.map(w => ({ v: w.value, l: w.label })), set: setProductWeight },
                  ].map((field, idx) => (
                    <div key={idx} className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 ml-2">{field.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {field.opt.slice(0, 6).map((o: any) => (
                          <button
                            key={o.v}
                            onClick={() => field.set(o.v)}
                            className={cn(
                              "px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-500 border",
                              field.val === o.v
                                ? "bg-white border-white text-black shadow-lg"
                                : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20"
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
                <div className="grid grid-cols-1 gap-6 w-full animate-in fade-in slide-in-from-right-8 duration-1000">
                  {[
                    { val: domain, set: setDomain, ph: 'votre-marque.com', label: 'NOM DE DOMAINE' },
                    { val: tagline, set: setTagline, ph: 'Manifestez votre slogan', label: 'SLOGAN' },
                    { val: instagram, set: setInstagram, ph: '@pseudo', label: 'INSTAGRAM' },
                    { val: twitter, set: setTwitter, ph: '@pseudo', label: 'TIKTOK / X' },
                  ].map((x, i) => (
                    <div key={i} className="group relative">
                      <span className="absolute -top-3 left-6 px-3 bg-[#0a0a0b] text-[10px] font-black text-white/20 uppercase tracking-[0.4em] z-10 transition-colors group-focus-within:text-blue-500">
                        {x.label}
                      </span>
                      <input
                        value={x.val}
                        onChange={(e) => x.set(e.target.value)}
                        placeholder={x.ph}
                        className="w-full bg-transparent border-2 border-white/5 rounded-3xl h-20 px-10 font-bold text-xl text-white placeholder:text-white/5 focus:border-white/20 focus:ring-0 transition-all outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Architecture */}
      <div className="w-full max-w-7xl px-8 pb-16 z-20">
        <div className="flex items-center justify-between pt-12 border-t border-white/5">
          <div className="flex gap-4">
            <button
              onClick={handlePrev}
              className={cn(
                "h-16 px-10 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] transition-all border border-white/5 hover:bg-white/5",
                currentStepIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              Retour
            </button>
            {error && <p className="flex items-center text-rose-500 font-bold text-[12px] uppercase tracking-widest px-6 ml-4 bg-rose-500/10 rounded-2xl animate-in zoom-in duration-300">! {error}</p>}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoNext() || loading}
            className="h-16 px-14 rounded-2xl bg-white hover:bg-white/90 text-black font-black text-[12px] uppercase tracking-[0.4em] transition-all shadow-2xl shadow-blue-500/20 active:scale-95 group overflow-hidden relative"
          >
            <span className="relative z-10 flex items-center gap-3">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLastStep ? (
                "Forger la Marque"
              ) : (
                <>Continuer <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Button>
        </div>
      </div>

      {/* Floating Vertical Index */}
      <div className="fixed right-12 top-1/2 -translate-y-1/2 flex flex-col gap-8 z-30 hidden 2xl:flex bg-white/5 backdrop-blur-3xl p-4 rounded-full border border-white/5">
        {steps.map((st, i) => (
          <div
            key={st.id}
            onClick={() => i === 0 || name.length >= 2 ? setCurrentStepIndex(i) : null}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-700 cursor-pointer border-2 shadow-2xl",
              i === currentStepIndex ? "bg-white scale-150 border-white/50" : "bg-white/10 hover:bg-white/30 border-transparent"
            )}
            title={st.title}
          />
        ))}
      </div>
    </div>
  );
}
