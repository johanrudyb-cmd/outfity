'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, ChevronRight, ChevronLeft, Check, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import type { MockupQuestionnaireAnswers } from '@/lib/mockup-and-techpack-types';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';

const STEPS = [
  { id: 'product', title: 'Produit & coupe' },
  { id: 'materials', title: 'Matières & couleurs' },
  { id: 'details', title: 'Détails (encolure, manches)' },
  { id: 'design', title: 'Visuel (logo / impression)' },
  { id: 'inspiration', title: 'Inspiration & idée' },
  { id: 'render', title: 'Rendu photo' },
];

const PRODUCT_TYPES = ['T-shirt', 'Sweat', 'Hoodie', 'Polo', 'Veste', 'Pantalon', 'Short', 'Robe'];
const CUTS = ['Regular', 'Oversized', 'Slim', 'Cintré', 'Droite', 'Relaxed'];
const NECKLINES = ['Crew (col rond)', 'Col V', 'Col montant', 'Bateau', 'Sans col'];
const SLEEVES = ['Sans manches', 'Courtes', 'Manches 3/4', 'Longues', 'Raglan'];
const DESIGN_TYPES = [
  { value: 'none', label: 'Aucun' },
  { value: 'logo', label: 'Logo' },
  { value: 'text', label: 'Texte' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'photo', label: 'Photo' },
  { value: 'mixed', label: 'Mixte' },
];
const PLACEMENTS = ['Poitrine', 'Dos', 'Manche', 'Dos complet', 'Épaule', 'Bas'];
const BACKGROUNDS = [
  { value: 'white', label: 'Blanc' },
  { value: 'light_gray', label: 'Gris clair' },
  { value: 'floating_void', label: 'Flottant (fond sombre)' },
  { value: 'shadow', label: 'Ombre douce' },
];
const PHOTO_STYLES = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'lookbook', label: 'Lookbook' },
  { value: 'minimal', label: 'Minimaliste' },
];

const FITS = ['Regular', 'Relaxed', 'Fitted', 'Oversized', 'Slim'];
const defaultAnswers: MockupQuestionnaireAnswers = {
  productType: 'T-shirt',
  cut: 'Regular',
  length: '',
  material: 'Coton',
  weight: '',
  colorMain: 'Blanc',
  colorsSecondary: [],
  neckline: 'Crew (col rond)',
  sleeves: 'Courtes',
  hem: 'Droit',
  pockets: 'Aucune',
  closure: '',
  designType: 'none',
  designPlacement: 'Poitrine',
  designTechnique: 'Sérigraphie',
  designColors: [],
  designDescription: '',
  backgroundStyle: 'light_gray',
  photoStyle: 'ecommerce',
  viewAngle: 'front',
  brandName: '',
  inspiration: '',
  fit: 'Regular',
  targetGender: '',
  notes: '',
};

interface MockupQuestionnaireProps {
  brandId: string;
  brandName?: string;
  onDesignCreated?: (designId: string) => void;
}

export function MockupQuestionnaire({ brandId, brandName, onDesignCreated }: MockupQuestionnaireProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<MockupQuestionnaireAnswers>({ ...defaultAnswers, brandName: brandName || '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ imageUrl: string; prompt: string } | null>(null);
  const [refinePromptWithAI, setRefinePromptWithAI] = useState(true);

  const update = (partial: Partial<MockupQuestionnaireAnswers>) => {
    setAnswers((a) => ({ ...a, ...partial }));
    setError('');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/designs/generate-from-questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, questionnaire: answers, refinePromptWithAI }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur génération');
      setResult({ imageUrl: data.imageUrl, prompt: data.prompt });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDesign = async () => {
    if (!result) return;
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch('/api/designs/create-from-mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          productImageUrl: result.imageUrl,
          prompt: result.prompt,
          questionnaire: answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur sauvegarde');
      onDesignCreated?.(data.design.id);
      if (data.design?.id) router.push(`/designs/${data.design.id}/tech-pack`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const stepId = STEPS[stepIndex]?.id ?? 'product';
  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <GenerationLoadingPopup open={isGenerating} title="Génération de la photo produit…" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/design-studio" className="hover:text-foreground">Design Studio</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Questionnaire mockup</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStepIndex(i)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              i === stepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[stepIndex]?.title}</CardTitle>
          <CardDescription>Répondez pour que l’IA génère une photo produit fidèle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stepId === 'product' && (
            <>
              <div>
                <Label>Type de produit</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PRODUCT_TYPES.map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={answers.productType === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ productType: t })}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Coupe</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CUTS.map((c) => (
                    <Button
                      key={c}
                      type="button"
                      variant={answers.cut === c ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ cut: c })}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="length">Longueur (optionnel)</Label>
                <Input
                  id="length"
                  value={answers.length ?? ''}
                  onChange={(e) => update({ length: e.target.value })}
                  placeholder="ex. mi-long"
                  className="mt-1"
                />
              </div>
            </>
          )}

          {stepId === 'materials' && (
            <>
              <div>
                <Label htmlFor="material">Matière principale</Label>
                <Input
                  id="material"
                  value={answers.material}
                  onChange={(e) => update({ material: e.target.value })}
                  placeholder="ex. Coton, Jersey 180 g/m²"
                />
              </div>
              <div>
                <Label htmlFor="weight">Grammage (optionnel)</Label>
                <Input
                  id="weight"
                  value={answers.weight ?? ''}
                  onChange={(e) => update({ weight: e.target.value })}
                  placeholder="ex. 180 g/m²"
                />
              </div>
              <div>
                <Label htmlFor="colorMain">Couleur principale</Label>
                <Input
                  id="colorMain"
                  value={answers.colorMain}
                  onChange={(e) => update({ colorMain: e.target.value })}
                  placeholder="ex. Noir, Blanc, Bleu marine"
                />
              </div>
            </>
          )}

          {stepId === 'details' && (
            <>
              <div>
                <Label>Encolure</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {NECKLINES.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={answers.neckline === n ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ neckline: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Manches</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SLEEVES.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={answers.sleeves === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ sleeves: s })}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="pockets">Poches (optionnel)</Label>
                <Input
                  id="pockets"
                  value={answers.pockets ?? ''}
                  onChange={(e) => update({ pockets: e.target.value })}
                  placeholder="Aucune, Poitrine, Kangaroo…"
                />
              </div>
            </>
          )}

          {stepId === 'design' && (
            <>
              <div>
                <Label>Type de visuel</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DESIGN_TYPES.map((d) => (
                    <Button
                      key={d.value}
                      type="button"
                      variant={answers.designType === d.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ designType: d.value as MockupQuestionnaireAnswers['designType'] })}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>
              {answers.designType !== 'none' && (
                <>
                  <div>
                    <Label>Placement</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PLACEMENTS.map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant={answers.designPlacement === p ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => update({ designPlacement: p })}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="technique">Technique (optionnel)</Label>
                    <Input
                      id="technique"
                      value={answers.designTechnique ?? ''}
                      onChange={(e) => update({ designTechnique: e.target.value })}
                      placeholder="Sérigraphie, Broderie, DTF…"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {stepId === 'render' && (
            <>
              <div>
                <Label>Fond / ambiance</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {BACKGROUNDS.map((b) => (
                    <Button
                      key={b.value}
                      type="button"
                      variant={answers.backgroundStyle === b.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ backgroundStyle: b.value as MockupQuestionnaireAnswers['backgroundStyle'] })}
                    >
                      {b.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Style photo</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PHOTO_STYLES.map((p) => (
                    <Button
                      key={p.value}
                      type="button"
                      variant={answers.photoStyle === p.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ photoStyle: p.value as MockupQuestionnaireAnswers['photoStyle'] })}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Input
                  id="notes"
                  value={answers.notes ?? ''}
                  onChange={(e) => update({ notes: e.target.value })}
                  placeholder="Détails supplémentaires pour l’IA"
                />
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>
            {!isLastStep ? (
              <Button type="button" onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}>
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Générer la photo produit
                <GenerationCostBadge feature="design_from_questionnaire" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
      )}

      {result && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Photo produit générée
            </CardTitle>
            <CardDescription>Enregistrez ce design pour le retrouver et générer le tech pack.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg overflow-hidden bg-muted aspect-square max-w-md">
              <NextImage
                src={result.imageUrl}
                alt="Photo produit"
                width={1200}
                height={1200}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveDesign} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Enregistrer comme design
              </Button>
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Régénérer
              </Button>
              {onDesignCreated && (
                <Link href="/design-studio">
                  <Button variant="secondary">Retour au Design Studio</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
