'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, ChevronRight, ChevronLeft, UserPlus, Image as ImageIcon, Upload, Lock } from 'lucide-react';
import {
  DEFAULT_MANNEQUIN_ANSWERS,
  mapTargetAudienceToGender,
  mapTargetAudienceToAgeRange,
  type MannequinQuestionnaireAnswers,
} from '@/lib/mannequin-questionnaire-types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface StrategyContext {
  targetAudience?: string | null;
  positioning?: string | null;
}

const STEPS = [
  { id: 'identity', title: '1. Identité / Cible' },
  { id: 'look', title: '2. Caractéristiques physiques' },
  { id: 'vibe', title: '3. Vibe & expression' },
  { id: 'method', title: '4. Méthode de création' },
];

const GENDERS: { value: MannequinQuestionnaireAnswers['gender']; label: string }[] = [
  { value: 'femme', label: 'Femmes' },
  { value: 'homme', label: 'Hommes' },
  { value: 'unisexe', label: 'Unisexe' },
];

const AGE_RANGES: { value: MannequinQuestionnaireAnswers['ageRange']; label: string }[] = [
  { value: '18-24', label: '18-24 ans' },
  { value: '25-34', label: '25-34 ans' },
  { value: '35-50', label: '35-50 ans' },
];

const ORIGINS: { value: MannequinQuestionnaireAnswers['origin']; label: string }[] = [
  { value: 'europeen', label: 'Européen' },
  { value: 'africain', label: 'Africain' },
  { value: 'asiatique', label: 'Asiatique' },
  { value: 'latino', label: 'Latino' },
  { value: 'metisse', label: 'Métisse' },
  { value: 'non_specifie', label: 'Non spécifié' },
];

const BODY_TYPES: { value: MannequinQuestionnaireAnswers['bodyType']; label: string }[] = [
  { value: 'mince', label: 'Mince' },
  { value: 'athletique', label: 'Athlétique' },
  { value: 'plus_size', label: 'Plus-size' },
  { value: 'muscle', label: 'Musclé' },
  { value: 'regular', label: 'Regular' },
  { value: 'svelte', label: 'Svelte' },
];

const FACIAL_EXPRESSIONS: { value: MannequinQuestionnaireAnswers['facialExpression']; label: string }[] = [
  { value: 'serieux', label: 'Sérieux / Déterminé (ex. Techwear)' },
  { value: 'souriant', label: 'Souriant / Accueillant (ex. Casual)' },
  { value: 'neutre', label: 'Neutre / Hautain (ex. Luxe)' },
  { value: 'hautain', label: 'Hautain' },
  { value: 'determine', label: 'Déterminé' },
];

const STYLE_VIBES = [
  'Gorpcore', 'Quiet Luxury', 'Streetwear', 'Minimal', 'Luxe', 'Casual', 'Sport', 'Preppy', 'Y2K', 'Techwear', 'Autre',
];

interface Design {
  id: string;
  type: string;
  flatSketchUrl: string | null;
}

interface VirtualTryOnProps {
  brandId: string;
  designs: Design[];
  onSelectImage?: (url: string) => void;
  userPlan?: string;
}

export function VirtualTryOn({ brandId, designs, onSelectImage, userPlan = 'free' }: VirtualTryOnProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const { data: strategyData } = useSWR<StrategyContext>(
    brandId ? `/api/ugc/mannequin-strategy-context?brandId=${encodeURIComponent(brandId)}` : null,
    fetcher
  );

  const strategyContext = useMemo(() => ({
    targetAudience: strategyData?.targetAudience ?? null,
    positioning: strategyData?.positioning ?? null,
  }), [strategyData]);

  const strategyLocked = useMemo(() => {
    const gender = mapTargetAudienceToGender(strategyData?.targetAudience);
    const ageRange = mapTargetAudienceToAgeRange(strategyData?.targetAudience);
    return {
      gender: !!gender,
      ageRange: !!ageRange,
    };
  }, [strategyData]);

  const [answers, setAnswers] = useState<MannequinQuestionnaireAnswers>({ ...DEFAULT_MANNEQUIN_ANSWERS });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [showSaveMannequin, setShowSaveMannequin] = useState(false);
  const [mannequinName, setMannequinName] = useState('');
  const [savingMannequin, setSavingMannequin] = useState(false);
  const [saveMannequinError, setSaveMannequinError] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (strategyData?.targetAudience) {
      const gender = mapTargetAudienceToGender(strategyData.targetAudience);
      const ageRange = mapTargetAudienceToAgeRange(strategyData.targetAudience);
      if (gender || ageRange) {
        setAnswers((a) => ({
          ...a,
          ...(gender && { gender }),
          ...(ageRange && { ageRange }),
        }));
      }
    }
  }, [strategyData]);

  const update = (partial: Partial<MannequinQuestionnaireAnswers>) => {
    setAnswers((a) => ({ ...a, ...partial }));
    setError('');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      if (answers.creationMethod === 'reference_photo' && referenceFile) {
        const formData = new FormData();
        formData.append('file', referenceFile);
        formData.append('brandId', brandId);
        const uploadRes = await fetch('/api/ugc/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const d = await uploadRes.json();
          throw new Error(d.error || 'Erreur upload');
        }
        const { url } = await uploadRes.json();
        const res = await fetch('/api/ugc/generate-mannequin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId, referencePhotoUrl: url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        setResult(data.imageUrl);
      } else {
        const res = await fetch('/api/ugc/generate-mannequin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId, questionnaire: answers }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur génération');
        setResult(data.imageUrl);
        window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsMannequin = async () => {
    if (!result || !mannequinName.trim()) {
      setSaveMannequinError('Donnez un nom au mannequin');
      return;
    }
    setSavingMannequin(true);
    setSaveMannequinError('');
    try {
      const res = await fetch('/api/ugc/mannequins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          name: mannequinName.trim(),
          imageUrl: result,
          source: answers.creationMethod === 'reference_photo' ? 'upload' : 'virtual_tryon',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setShowSaveMannequin(false);
      setMannequinName('');
    } catch (err: unknown) {
      setSaveMannequinError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSavingMannequin(false);
    }
  };

  const onReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);
    setReferenceFile(file ?? null);
    setReferencePreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const stepId = STEPS[stepIndex]?.id ?? 'identity';
  const isLastStep = stepIndex === STEPS.length - 1;
  const canGenerate = isLastStep && (
    (answers.creationMethod === 'reference_photo' && referenceFile) ||
    (answers.creationMethod === 'ai_generate')
  );

  return (
    <div className="space-y-6">
      <GenerationLoadingPopup
        open={isGenerating}
        title="Génération du mannequin en cours…"
        messages={[
          "Génération des traits du visage...",
          "Ajustement de la morphologie...",
          "Calcul du rendu photoréaliste...",
          "Finalisation du profil mannequin...",
        ]}
      />
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Créer votre mannequin (cible)
          </CardTitle>
          <CardDescription>
            Définissez le profil de votre cible pour garder la même cohérence sur tous vos visuels. Les infos issues de votre stratégie sont verrouillées. Vous pouvez soit uploader une photo de référence, soit laisser l&apos;IA générer un visage unique.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {strategyContext && (strategyContext.targetAudience || strategyContext.positioning) && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <span className="font-medium flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Depuis votre stratégie
              </span>
              <p className="text-muted-foreground mt-1">
                {strategyContext.targetAudience && <>Cible : <strong>{strategyContext.targetAudience}</strong></>}
                {strategyContext.targetAudience && strategyContext.positioning && ' · '}
                {strategyContext.positioning && <>Positionnement : <strong>{strategyContext.positioning}</strong></>}
              </p>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStepIndex(i)}
                className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${i === stepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* 1. Identité / Cible */}
          {stepId === 'identity' && (
            <>
              <div>
                <Label className="flex items-center gap-1.5">
                  Sexe du mannequin
                  {strategyLocked.gender && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                </Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {GENDERS.map((g) => (
                    <Button
                      key={g.value}
                      type="button"
                      variant={answers.gender === g.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => !strategyLocked.gender && update({ gender: g.value })}
                      disabled={strategyLocked.gender}
                    >
                      {g.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1.5">
                  Âge apparent (segments)
                  {strategyLocked.ageRange && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                </Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {AGE_RANGES.map((a) => (
                    <Button
                      key={a.value}
                      type="button"
                      variant={answers.ageRange === a.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => !strategyLocked.ageRange && update({ ageRange: a.value })}
                      disabled={strategyLocked.ageRange}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Origine / ethnie (marketing ciblé)</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ORIGINS.map((o) => (
                    <Button
                      key={o.value}
                      type="button"
                      variant={answers.origin === o.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ origin: o.value })}
                    >
                      {o.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 2. Caractéristiques physiques (Look) */}
          {stepId === 'look' && (
            <>
              <div>
                <Label htmlFor="hair">Couleur et type de cheveux</Label>
                <Input
                  id="hair"
                  value={answers.hairDescription}
                  onChange={(e) => update({ hairDescription: e.target.value })}
                  placeholder="ex. Brun court, Blond bouclé, Rasé"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="eyes">Couleur des yeux</Label>
                <Input
                  id="eyes"
                  value={answers.eyeColor}
                  onChange={(e) => update({ eyeColor: e.target.value })}
                  placeholder="ex. Marron, Bleu, Vert"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Morphologie (body type) — tombé des vêtements</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {BODY_TYPES.map((b) => (
                    <Button
                      key={b.value}
                      type="button"
                      variant={answers.bodyType === b.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ bodyType: b.value })}
                    >
                      {b.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 3. Vibe & expression */}
          {stepId === 'vibe' && (
            <>
              <div>
                <Label>Expression faciale par défaut</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {FACIAL_EXPRESSIONS.map((f) => (
                    <Button
                      key={f.value}
                      type="button"
                      variant={answers.facialExpression === f.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ facialExpression: f.value })}
                      className="text-left whitespace-normal h-auto py-2"
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="skin">Type de peau</Label>
                <Input
                  id="skin"
                  value={answers.skinType}
                  onChange={(e) => update({ skinType: e.target.value })}
                  placeholder="ex. Teint mat, taches de rousseur, peau très claire"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Style / vibe (Gorpcore, Quiet Luxury, etc.)</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {STYLE_VIBES.map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={answers.styleVibe === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => update({ styleVibe: s })}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
                <Input
                  value={STYLE_VIBES.includes(answers.styleVibe) ? '' : answers.styleVibe}
                  onChange={(e) => update({ styleVibe: e.target.value })}
                  placeholder="Ou précisez"
                  className="mt-2"
                />
              </div>
            </>
          )}

          {/* 4. Méthode de création */}
          {stepId === 'method' && (
            <>
              <div>
                <Label>Comment créer le mannequin ?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <label className="flex flex-col gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="creationMethod"
                        checked={answers.creationMethod === 'reference_photo'}
                        onChange={() => update({ creationMethod: 'reference_photo' })}
                        className="accent-primary"
                      />
                      <span className="font-semibold text-sm">Via photo référence</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-5">
                      Copier un visage existant (upload).
                    </p>
                    {answers.creationMethod === 'reference_photo' && (
                      <div className="mt-1 ml-5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onReferenceFileChange}
                          className="hidden"
                          id="ref-photo"
                        />
                        <label htmlFor="ref-photo" className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs cursor-pointer hover:bg-muted/50">
                          <Upload className="w-3.5 h-3.5" />
                          {referenceFile ? <span className="truncate max-w-[120px]">{referenceFile.name}</span> : 'Choisir photo'}
                        </label>
                        {referencePreviewUrl && (
                          <div className="mt-2 w-16 h-16 rounded-md overflow-hidden border border-border">
                            <img src={referencePreviewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </label>
                  <label className="flex flex-col gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="creationMethod"
                        checked={answers.creationMethod === 'ai_generate'}
                        onChange={() => update({ creationMethod: 'ai_generate' })}
                        className="accent-primary"
                      />
                      <span className="font-semibold text-sm">Généré par l&apos;IA</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-5">
                      Visage unique basé sur vos critères.
                    </p>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>
            <span className="text-xs text-muted-foreground">{stepIndex + 1} / {STEPS.length}</span>
            {!isLastStep ? (
              <Button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                className="gap-1"
              >
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerate}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Génération…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">{answers.creationMethod === 'reference_photo' ? 'Créer le mannequin' : 'Générer'}</span>
                    <span className="sm:hidden">Générer</span>
                    {answers.creationMethod !== 'reference_photo' && <GenerationCostBadge feature="ugc_generate_mannequin" />}
                  </>
                )}
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
              Mannequin généré
            </CardTitle>
            <CardDescription>
              Enregistrez ce mannequin pour l&apos;utiliser dans Shooting photo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg overflow-hidden bg-muted aspect-[3/4] max-w-sm">
              <img src={result} alt="Mannequin cible" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => onSelectImage?.(result)}
                className="gap-2 bg-black text-[#25F4EE] hover:bg-black/90 border border-white/10 shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-[#FE2C55]" />
                Créer un script TikTok pour cette photo
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setShowSaveMannequin(true); setSaveMannequinError(''); setMannequinName(''); }}
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Enregistrer comme mannequin
              </Button>
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Régénérer
                {answers.creationMethod !== 'reference_photo' && <GenerationCostBadge feature="ugc_generate_mannequin" />}
              </Button>
            </div>

            {showSaveMannequin && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <Label htmlFor="mannequin-name">Nom du mannequin</Label>
                <Input
                  id="mannequin-name"
                  value={mannequinName}
                  onChange={(e) => setMannequinName(e.target.value)}
                  placeholder="Ex. Emma, Mannequin cible"
                />
                {saveMannequinError && <p className="text-sm text-destructive">{saveMannequinError}</p>}
                <div className="flex gap-2">
                  <Button onClick={handleSaveAsMannequin} disabled={savingMannequin || !mannequinName.trim()}>
                    {savingMannequin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowSaveMannequin(false); setSaveMannequinError(''); }} disabled={savingMannequin}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )
      }
    </div>
  );
}
