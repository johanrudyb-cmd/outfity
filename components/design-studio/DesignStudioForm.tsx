'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DesignResult } from './DesignResult';
import { DesignGallery } from './DesignGallery';
import { CollectionsManager } from './CollectionsManager';
import { DesignTemplates } from './DesignTemplates';
import { Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';

interface Design {
  id: string;
  type: string;
  cut: string | null;
  material: string | null;
  flatSketchUrl: string | null;
  techPack: any;
  prompt: string | null;
  status: string;
  collectionId?: string | null;
  createdAt: Date;
}

interface Brand {
  id: string;
  name: string;
  logo?: string | null;
  colorPalette?: any;
  autoApplyIdentity?: boolean;
}

interface DesignStudioFormProps {
  brandId: string;
  brand?: Brand;
  existingDesigns: Design[];
  initialData?: {
    type: string;
    cut: string;
    material: string;
    customPrompt: string;
  };
}

export function DesignStudioForm({ brandId, brand, existingDesigns, initialData }: DesignStudioFormProps) {
  const [type, setType] = useState(initialData?.type || '');
  const [cut, setCut] = useState(initialData?.cut || '');
  const [material, setMaterial] = useState(initialData?.material || '');
  const [details, setDetails] = useState({
    seams: false,
    pockets: false,
    zipper: false,
    buttons: false,
    hood: false,
    collar: false,
  });
  const [customPrompt, setCustomPrompt] = useState(initialData?.customPrompt || '');
  const [autoApplyIdentity, setAutoApplyIdentity] = useState(brand?.autoApplyIdentity ?? true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDesign, setCurrentDesign] = useState<Design | null>(null);
  const [error, setError] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  const handleGenerate = async () => {
    if (!type || !cut || !material) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsGenerating(true);
    setError('');
    setCurrentDesign(null);

    try {
      const response = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          type,
          cut,
          material,
          details,
          customPrompt: customPrompt || undefined,
          autoApplyIdentity: autoApplyIdentity && brand?.logo && brand?.colorPalette,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      setCurrentDesign(data.design);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filtrer les designs par collection
  const filteredDesigns = selectedCollectionId
    ? existingDesigns.filter((d) => d.collectionId === selectedCollectionId)
    : existingDesigns;

  const handleSelectTemplate = (template: any) => {
    setType(template.type);
    setCut(template.cut || '');
    setMaterial(template.material || '');
    setShowTemplates(false);
    // Scroll vers le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <GenerationLoadingPopup open={isGenerating} title="Génération du tech pack…" />
      {/* Collections Sidebar */}
      <div className="lg:col-span-1">
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            className="w-full flex justify-between items-center text-sm font-bold h-11 border-2"
            onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
          >
            <span>📁 Collections & Archives</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isCollectionsOpen && "rotate-180")} />
          </Button>
        </div>
        <div className={cn(isCollectionsOpen ? "block" : "hidden lg:block")}>
          <CollectionsManager
            brandId={brandId}
            onCollectionSelect={setSelectedCollectionId}
            selectedCollectionId={selectedCollectionId}
          />
        </div>
      </div>

      {/* Formulaire et Galerie */}
      <div className="lg:col-span-2 space-y-6">
        {/* Templates Section */}
        {showTemplates && (
          <DesignTemplates brandId={brandId} onSelectTemplate={handleSelectTemplate} />
        )}

        <Card className="border-2 shadow- apple">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl font-black">
                  Nouveau design
                </CardTitle>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowTemplates(!showTemplates)}
                className="border-2 h-9 text-xs font-bold"
                size="sm"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {showTemplates ? 'Fermer' : 'Templates AI'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type de vêtement */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Type de vêtement *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-input rounded-lg bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={isGenerating}
              >
                <option value="">Sélectionner...</option>
                <option value="T-shirt">T-shirt</option>
                <option value="Hoodie">Hoodie</option>
                <option value="Sweatshirt">Sweatshirt</option>
                <option value="Pantalon">Pantalon</option>
                <option value="Cargo">Cargo</option>
                <option value="Short">Short</option>
                <option value="Veste">Veste</option>
              </select>
            </div>

            {/* Coupe */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Coupe *
              </label>
              <select
                value={cut}
                onChange={(e) => setCut(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-input rounded-lg bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={isGenerating}
              >
                <option value="">Sélectionner...</option>
                <option value="oversized">Oversized</option>
                <option value="slim">Slim</option>
                <option value="regular">Regular</option>
                <option value="relaxed">Relaxed</option>
                <option value="fitted">Fitted</option>
              </select>
            </div>

            {/* Matière */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Matière principale *
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-input rounded-lg bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={isGenerating}
              >
                <option value="">Sélectionner...</option>
                <option value="Coton 300GSM">Coton 300GSM</option>
                <option value="Coton 400GSM">Coton 400GSM</option>
                <option value="Coton 500GSM">Coton 500GSM</option>
                <option value="Denim">Denim</option>
                <option value="Polyester">Polyester</option>
                <option value="Coton/Polyester mix">Coton/Polyester mix</option>
                <option value="Jersey">Jersey</option>
              </select>
            </div>

            {/* Détails */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Détails
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(details).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-input hover:bg-muted hover:border-primary/50 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setDetails({ ...details, [key]: e.target.checked })
                      }
                      disabled={isGenerating}
                      className="rounded border-2 border-input text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-sm text-foreground font-medium capitalize">
                      {key === 'seams' ? 'Coutures' : key === 'pockets' ? 'Poches' : key === 'zipper' ? 'Fermeture éclair' : key === 'buttons' ? 'Boutons' : key === 'hood' ? 'Capuche' : 'Col'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prompt personnalisé (optionnel) */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Prompt personnalisé (optionnel)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ajoutez des détails supplémentaires pour votre design..."
                className="w-full px-4 py-3 border-2 border-input rounded-lg bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] placeholder:text-muted-foreground/60"
                disabled={isGenerating}
              />
            </div>

            {/* Toggle Appliquer identité */}
            {brand?.logo && brand?.colorPalette && (
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border-2 border-border">
                <input
                  type="checkbox"
                  id="autoApplyIdentity"
                  checked={autoApplyIdentity}
                  onChange={(e) => setAutoApplyIdentity(e.target.checked)}
                  disabled={isGenerating}
                  className="w-5 h-5 rounded border-2 border-input text-primary focus:ring-primary cursor-pointer"
                />
                <label
                  htmlFor="autoApplyIdentity"
                  className="text-sm font-semibold text-foreground cursor-pointer flex-1"
                >
                  Appliquer l'identité de marque (logo + couleurs)
                </label>
                {brand.logo && (
                  <div className="flex items-center gap-2">
                    <Image
                      src={brand.logo}
                      alt="Logo"
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain"
                    />
                    <div className="flex gap-1">
                      {brand.colorPalette && typeof brand.colorPalette === 'object' && (
                        <>
                          {brand.colorPalette.primary && (
                            <div
                              className="w-4 h-4 rounded border border-border"
                              style={{ backgroundColor: brand.colorPalette.primary }}
                            />
                          )}
                          {brand.colorPalette.secondary && (
                            <div
                              className="w-4 h-4 rounded border border-border"
                              style={{ backgroundColor: brand.colorPalette.secondary }}
                            />
                          )}
                          {brand.colorPalette.accent && (
                            <div
                              className="w-4 h-4 rounded border border-border"
                              style={{ backgroundColor: brand.colorPalette.accent }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 text-sm text-error bg-error/10 border-2 border-error/20 rounded-lg font-medium">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !type || !cut || !material}
              className="w-full shadow-modern-lg"
              variant="default"
            >
              {isGenerating ? 'Génération en cours...' : 'Générer le Tech Pack'}
              <GenerationCostBadge feature="design_tech_pack" />
            </Button>
          </CardContent>
        </Card>

        {/* Résultat */}
        {currentDesign && (
          <DesignResult design={currentDesign} />
        )}

        {/* Galerie des designs existants */}
        <DesignGallery
          designs={filteredDesigns}
          brandId={brandId}
          selectedCollectionId={selectedCollectionId}
        />
      </div>
    </div>
  );
}
