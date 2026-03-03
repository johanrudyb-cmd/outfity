'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Sparkles, CheckCircle, Info } from 'lucide-react';
import {
  getSeasonalRecommendation,
  getProductTypeLabel,
  type ProductTypeId,
} from '@/lib/seasonal-recommendation';
import { Phase0Identity } from '@/components/launch-map/Phase0Identity';
import type { BrandIdentity } from '@/components/launch-map/LaunchMapStepper';
import { WelcomeValidationAnimation } from '@/components/launch-map/WelcomeValidationAnimation';
import { FASHION_UNIVERSES, FashionUniverse } from '@/lib/onboarding-universes';
import { cn } from '@/lib/utils';
import { isFreePlan } from '@/lib/plan-utils';

type Step = 'start' | 'universe' | 'identity' | 'validation';

const DEMO_BRAND_ID = 'demo-onboarding';

interface OnboardingFlowCreateBrandProps {
  onBack: () => void;
  demoMode?: boolean;
  userPlan?: string;
}

export function OnboardingFlowCreateBrand({ onBack, demoMode = false, userPlan = 'starter' }: OnboardingFlowCreateBrandProps) {
  const [step, setStep] = useState<Step>('start');
  const [selectedUniverse, setSelectedUniverse] = useState<FashionUniverse | null>(null);

  const [brandId, setBrandId] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandIdentity | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [nameSuggestionsLoading, setNameSuggestionsLoading] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  const recommendation = useMemo(() => getSeasonalRecommendation(), []);

  const handleStart = async () => {
    setStep('universe');
  };

  const handleSelectUniverse = async (universe: FashionUniverse) => {
    setSelectedUniverse(universe);
    setCreateLoading(true);
    try {
      // Création silencieuse de la marque en arrière-plan
      const initialName = "Ma Marque";
      const payload = {
        name: initialName,
        styleGuide: {
          mainProduct: getProductTypeLabel(recommendation.productType as ProductTypeId),
          productType: recommendation.productType,
          productWeight: recommendation.weight,
          preferredStyle: universe.name,
          targetAudience: universe.target,
          story: `Univers : ${universe.name}. ${universe.description}`,
          noLogo: true,
        },
        creationMode: 'quick',
        status: 'in_progress',
      };

      if (demoMode) {
        setBrandId(DEMO_BRAND_ID);
        setBrand({ id: DEMO_BRAND_ID, name: initialName, styleGuide: payload.styleGuide } as any);
      } else {
        const res = await fetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setBrandId(data.brand.id);
        setBrand(data.brand);
      }
      setStep('identity');
    } catch (e) {
      setCreateError('Erreur lors de l\'initialisation du studio.');
    } finally {
      setCreateLoading(false);
    }
  };

  const fetchNameSuggestions = useCallback(async () => {
    if (!selectedUniverse || isFreePlan(userPlan)) return;
    setNameSuggestionsLoading(true);
    try {
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 600));
        const names = [selectedUniverse.id + ' Co', 'Studio ' + selectedUniverse.name.split(' ')[0], 'Atelier ' + selectedUniverse.id.toUpperCase(), 'The ' + selectedUniverse.id, 'Nova ' + selectedUniverse.name.split(' ')[0]];
        setNameSuggestions(names);
        if (!selectedName) setSelectedName(names[0]);
      } else {
        const res = await fetch('/api/brands/generate-identity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            concept: selectedUniverse.description,
            style: selectedUniverse.name,
            target: selectedUniverse.target,
          }),
        });
        const data = await res.json();
        if (res.ok && data.names) {
          setNameSuggestions(data.names.slice(0, 5));
          if (!selectedName) setSelectedName(data.names[0]);
        }
      }
    } catch {
      setNameSuggestions([]);
    } finally {
      setNameSuggestionsLoading(false);
    }
  }, [selectedUniverse, userPlan, demoMode, selectedName]);

  useEffect(() => {
    if (step === 'identity' && selectedUniverse && nameSuggestions.length === 0) {
      fetchNameSuggestions();
    }
  }, [step, selectedUniverse, nameSuggestions.length, fetchNameSuggestions]);

  const brandForIdentity = brand && selectedName.trim()
    ? { ...brand, name: selectedName.trim() }
    : brand;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Mentor */}
      <div className="flex items-center gap-4">
        {step !== 'validation' && (
          <Button variant="ghost" size="icon" onClick={onBack} disabled={createLoading}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {step === 'start' && "Commençons cette aventure ensemble"}
            {step === 'universe' && "Choisissez votre univers visuel"}
            {step === 'identity' && "Donnons un nom à votre vision"}
            {step === 'validation' && "Félicitations !"}
          </h1>
          <p className="text-muted-foreground">
            {step === 'start' && "Je suis ton mentor OUTFITY. On va poser les bases ensemble, et Virgil prendra le relais pour ta stratégie."}
            {step === 'universe' && "L'univers définit le ton de ta marque. Choisis celui qui résonne le plus avec toi."}
            {step === 'identity' && "Ton nom est le premier point de contact avec ta communauté."}
          </p>
        </div>
      </div>

      {/* Étape START */}
      {step === 'start' && (
        <Card className="border-2 border-primary/20 bg-primary/5 shadow-xl transition-all hover:shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Pourquoi OUTFITY ?
            </CardTitle>
            <CardDescription className="text-base text-foreground/80 leading-relaxed">
              Oubliez les formulaires interminables. Ici, on parle de mode, de style et de passion.
              En 3 étapes, votre marque sera prête à être propulsée. Vous restez maître de chaque décision.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={handleStart} className="w-full sm:w-auto px-12 h-14 text-lg">
              C'est parti !
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Étape UNIVERS (Moodboards) */}
      {step === 'universe' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FASHION_UNIVERSES.map((u) => (
            <Card
              key={u.id}
              className={cn(
                "group relative border-2 cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-xl",
                selectedUniverse?.id === u.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-muted-foreground/10 hover:bg-muted/5"
              )}
              onClick={() => handleSelectUniverse(u)}
            >
              <CardHeader>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110", u.color, "bg-background shadow-md border border-muted/20")}>
                  <u.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">{u.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">{u.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 opacity-60">
                  {u.keywords.slice(0, 3).map(k => (
                    <span key={k} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-muted rounded-full">#{k}</span>
                  ))}
                </div>
              </CardContent>
              {selectedUniverse?.id === u.id && (
                <div className="absolute top-4 right-4 text-primary">
                  <CheckCircle className="w-6 h-6 fill-primary text-white" />
                </div>
              )}
            </Card>
          ))}
          {createLoading && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Préparation de votre univers...</p>
            </div>
          )}
        </div>
      )}

      {/* Étape IDENTITY & MENTOR TIP */}
      {step === 'identity' && brandId && brandForIdentity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 text-2xl">
            <Card className="border-2 shadow-sm font-bold">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Le Nom de votre Marque
                </CardTitle>
                <CardDescription>
                  {userPlan === 'creator'
                    ? "Mes suggestions basées sur votre univers visuel. Cliquez pour sélectionner ou tapez le vôtre."
                    : "Tapez le nom de votre futur empire de mode."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {userPlan === 'creator' && (
                  <div className="space-y-4">
                    {nameSuggestionsLoading ? (
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Génération de noms créatifs...
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {nameSuggestions.map(n => (
                          <Button
                            key={n}
                            variant={selectedName === n ? "default" : "outline"}
                            onClick={() => setSelectedName(n)}
                            className="h-10 px-4 rounded-full"
                          >
                            {n}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Input
                    value={selectedName}
                    onChange={(e) => setSelectedName(e.target.value)}
                    placeholder="Saisissez un nom ici"
                    className="h-14 text-xl border-2 px-6 focus:ring-4 focus:ring-primary/10 rounded-2xl"
                  />
                  {isFreePlan(userPlan) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2 ml-2">
                      <Sparkles className="w-3 h-3 text-primary" />
                      L'IA peut suggérer des noms experts pour vous en Plan Créateur.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Phase0Identity
              brandId={brandId}
              brand={brandForIdentity}
              onComplete={() => setStep('validation')}
              hideNameField
              demoMode={demoMode}
            />
          </div>

          {/* Mentor Sidebar */}
          <div className="space-y-6">
            <Card className="border-2 border-indigo-500/20 bg-indigo-500/5 sticky top-24 overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Info className="w-24 h-24 text-indigo-500" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
                  <Info className="w-5 h-5" />
                  Conseil du Mentor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-indigo-500/10 shadow-sm">
                  <p className="text-sm font-semibold text-indigo-900 mb-1">Impact Saisonnier :</p>
                  <p className="text-sm text-indigo-700 leading-relaxed font-bold">
                    {recommendation.reason}
                  </p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white/50 rounded-2xl text-2xl">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                    !
                  </div>
                  <p className="text-xs text-indigo-800 italic">
                    "Rien n'est imposé : si vous avez déjà un article phare en tête, ignorez ce conseil et foncez !"
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 bg-slate-50">
              <CardHeader>
                <CardTitle className="text-sm text-slate-500 font-bold">VOTRE UNIVERS</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white bg-slate-900")}>
                  {selectedUniverse?.icon && <selectedUniverse.icon className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedUniverse?.name}</p>
                  <p className="text-xs text-slate-500">Prêt pour le lancement</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Étape VALIDATION */}
      {step === 'validation' && (
        <Card className="border-2 border-green-500/10">
          <CardContent className="p-0">
            <WelcomeValidationAnimation />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
