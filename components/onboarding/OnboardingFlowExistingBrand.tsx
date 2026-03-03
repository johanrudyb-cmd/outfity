'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  getSeasonalRecommendation,
  getProductTypeLabel,
  getWeightOptions,
  PRODUCT_TYPE_IDS,
  type ProductTypeId,
} from '@/lib/seasonal-recommendation';
import { Phase0Identity } from '@/components/launch-map/Phase0Identity';
import type { BrandIdentity } from '@/components/launch-map/LaunchMapStepper';
import { WelcomeValidationAnimation } from '@/components/launch-map/WelcomeValidationAnimation';

type Step = 0 | 1 | 2;

const DEMO_BRAND_ID = 'demo-onboarding';

interface OnboardingFlowExistingBrandProps {
  onBack: () => void;
  /** Mode test : aucune donnée n'est enregistrée (parcours uniquement). */
  demoMode?: boolean;
  /** Données préremplies depuis une marque existante (après upgrade payant) */
  prefilledData?: {
    name?: string;
    logoUrl?: string;
    domain?: string;
    socialHandles?: { instagram?: string; twitter?: string };
  };
}

export function OnboardingFlowExistingBrand({ onBack, demoMode = false, prefilledData }: OnboardingFlowExistingBrandProps) {
  const [step, setStep] = useState<Step>(0);

  // Questionnaire (étape 0) - prérempli si données existantes
  const [name, setName] = useState(prefilledData?.name || '');
  const [logoUrl, setLogoUrl] = useState(prefilledData?.logoUrl || '');
  const [domain, setDomain] = useState(prefilledData?.domain || '');
  const [instagram, setInstagram] = useState(prefilledData?.socialHandles?.instagram || '');
  const [twitter, setTwitter] = useState(prefilledData?.socialHandles?.twitter || '');
  const [tagline, setTagline] = useState('');
  const [story, setStory] = useState('');
  const recommendation = useMemo(() => getSeasonalRecommendation(), []);
  const [productType, setProductType] = useState<ProductTypeId>(recommendation.productType);
  const [productWeight, setProductWeight] = useState(recommendation.weight);

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [brandId, setBrandId] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandIdentity | null>(null);

  const weightOptions = useMemo(() => getWeightOptions(productType), [productType]);

  const handleCreateBrand = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setCreateError('Le nom de la marque est requis.');
      return;
    }
    setCreateError('');
    setCreateLoading(true);
    try {
      if (demoMode) {
        setBrandId(DEMO_BRAND_ID);
        setStep(1);
        setCreateLoading(false);
        return;
      }
      const socialHandles: Record<string, string> = {};
      if (instagram.trim()) socialHandles.instagram = instagram.trim();
      if (twitter.trim()) socialHandles.twitter = twitter.trim();

      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          logo: logoUrl.trim() || null,
          domain: domain.trim() || null,
          socialHandles: Object.keys(socialHandles).length ? socialHandles : null,
          styleGuide: {
            mainProduct: getProductTypeLabel(productType),
            productType,
            productWeight,
            noLogo: !logoUrl.trim(),
            tagline: tagline.trim() || undefined,
            story: story.trim() || undefined,
          },
          creationMode: 'onboarding',
          status: 'in_progress',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBrandId(data.brand.id);
      setBrand(data.brand);
      setStep(1);
    } catch (e) {
      setCreateError('Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={step > 0}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Importe ton univers</h1>
          <p className="text-sm text-muted-foreground">
            {step === 0 && "Présente-moi ta marque actuelle, et Virgil t'aidera ensuite à affiner ta stratégie."}
            {step === 1 && "Vérifions ensemble les détails de ton identité."}
          </p>
        </div>
      </div>

      {/* Étape 0 : Formulaire Rapide */}
      {step === 0 && (
        <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Les Fondations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nom de la marque *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Zenith Apparel" className="border-2 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Site web (Optionnel)</label>
                <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="www.zenith.com" className="border-2 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Votre histoire en 1 phrase</label>
              <Input value={story} onChange={(e) => setStory(e.target.value)} placeholder="Nous créons des vêtements durables pour..." className="border-2 rounded-xl" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Instagram</label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@zenith" className="border-2 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Type de produit phare</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as ProductTypeId)}
                  className="w-full h-10 px-3 text-sm bg-background border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PRODUCT_TYPE_IDS.map((id) => (
                    <option key={id} value={id}>{getProductTypeLabel(id)}</option>
                  ))}
                </select>
              </div>
            </div>

            {createError && <p className="text-sm text-destructive">{createError}</p>}

            <div className="pt-4">
              <Button onClick={handleCreateBrand} disabled={createLoading || name.length < 2} className="w-full h-12 text-lg">
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "C'est tout bon, on continue !"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 1 : Validation finale */}
      {step === 1 && brandId && (
        <Phase0Identity
          brandId={brandId}
          brand={brand}
          onComplete={() => setStep(2)}
          hideNameField
          demoMode={demoMode}
        />
      )}

      {/* Étape 2 : Animation */}
      {step === 2 && (
        <WelcomeValidationAnimation />
      )}
    </div>
  );
}
