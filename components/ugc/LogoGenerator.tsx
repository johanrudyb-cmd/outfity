'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Download, PenTool, Palette, LayoutTemplate } from 'lucide-react';
import { GenerationCostBadge } from '@/components/ui/generation-cost-badge';
import { GenerationLoadingPopup } from '@/components/ui/generation-loading-popup';
import { cn } from '@/lib/utils';
import { useQuota } from '@/lib/hooks/useQuota';

interface LogoGeneratorProps {
    brandId: string;
}

const LOGO_STYLES = [
    { id: 'minimalist', label: 'Minimaliste', prompt: 'minimalist, clean lines, simple geometry, less is more' },
    { id: 'luxury', label: 'Luxe / Premium', prompt: 'luxury, elegant, serif typography, gold and black, sophisticated, high-end' },
    { id: 'start_up', label: 'Tech / Startup', prompt: 'modern tech, gradient, sans-serif, bold, futuristic, app icon style' },
    { id: 'vintage', label: 'Vintage / Rétro', prompt: 'vintage, retro badge style, textured, 70s vibe, nostalgic' },
    { id: 'handwritten', label: 'Manuscrit / Signature', prompt: 'handwritten signature, calligraphy, personal touch, organic' },
    { id: 'abstract', label: 'Abstrait', prompt: 'abstract art, fluid shapes, artistic, creative, non-literal' },
    { id: 'mascot', label: 'Mascotte / Personnage', prompt: 'mascot character, friendly face, illustrative style, vector character' },
] as const;

const ASPECT_RATIOS = [
    { id: '1:1', label: 'Carré (1:1)' },
    { id: '16:9', label: 'Paysage (16:9)' },
    { id: '9:16', label: 'Portrait (9:16)' },
    { id: '4:3', label: 'Standard (4:3)' },
] as const;

export function LogoGenerator({ brandId }: LogoGeneratorProps) {
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<string>('minimalist');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const quota = useQuota();
    const reloadQuota = typeof quota === 'object' && quota && 'refresh' in quota ? quota.refresh : () => { };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setResultUrl(null);

        try {
            // Construction du prompt enrichi avec le style
            const stylePrompt = LOGO_STYLES.find(s => s.id === selectedStyle)?.prompt || '';
            const fullPrompt = `Logo design for: ${prompt}. Style: ${stylePrompt}. Professional vector logo, plain background, high quality.`;

            const res = await fetch('/api/ugc/generate-logo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandId,
                    prompt: fullPrompt,
                    aspectRatio
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erreur lors de la génération');
            }

            setResultUrl(data.url);
            reloadQuota(); // Rafraîchir les quotas après génération
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <GenerationLoadingPopup
                open={isGenerating}
                title="Création de votre logo en cours..."
                messages={[
                    "Esquisse des premières formes...",
                    "Application de la colorimétrie...",
                    "Affinage de la typographie...",
                    "Optimisation du rendu vectoriel...",
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                {/* Colonne Gauche : Formulaire */}
                <div className="space-y-6 order-2 lg:order-1">
                    <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
                        <CardHeader className="px-0 sm:px-6">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <PenTool className="w-5 h-5 text-primary" />
                                Générateur de Logo & Identité
                            </CardTitle>
                            <CardDescription>
                                Créez des logos uniques, des affiches ou des éléments graphiques pour votre marque propulsés par OUTFITY AI.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 sm:px-6 space-y-6">

                            {/* Zone de prompt principal */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 block">Description de votre logo / affiche</Label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: Une marque de café nommée 'Velvet Bean', logo minimaliste avec une tasse fumante stylisée, couleurs crème et marron..."
                                    className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                    disabled={isGenerating}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Soyez précis sur le nom de la marque, les symboles, les couleurs et l'ambiance souhaitée.
                                </p>
                            </div>

                            {/* Sélecteur de Style */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Palette className="w-4 h-4" />
                                    Style artistique
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {LOGO_STYLES.map((style) => (
                                        <button
                                            key={style.id}
                                            type="button"
                                            onClick={() => setSelectedStyle(style.id)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                                selectedStyle === style.id
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                    : "bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground"
                                            )}
                                            disabled={isGenerating}
                                        >
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sélecteur de Format */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <LayoutTemplate className="w-4 h-4" />
                                    Format
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {ASPECT_RATIOS.map((ratio) => (
                                        <button
                                            key={ratio.id}
                                            type="button"
                                            onClick={() => setAspectRatio(ratio.id)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-xs font-medium transition-all border",
                                                aspectRatio === ratio.id
                                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                    : "bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground"
                                            )}
                                            disabled={isGenerating}
                                        >
                                            {ratio.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt.trim()}
                                className="w-full sm:w-auto"
                                size="lg"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Création en cours...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Générer le concept
                                        <GenerationCostBadge feature="brand_logo" className="ml-2" />
                                    </>
                                )}
                            </Button>

                        </CardContent>
                    </Card>
                </div>

                {/* Colonne Droite : Résultat */}
                <div className="order-1 lg:order-2 lg:sticky lg:top-4">
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-sm font-semibold">Aperçu du résultat</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {resultUrl ? (
                                <div className="relative group">
                                    {/* Container Image */}
                                    <div className="bg-[#f0f0f0] pattern-grid-lg relative aspect-square flex items-center justify-center overflow-hidden">
                                        <Image
                                            src={resultUrl}
                                            alt="Logo généré"
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 520px"
                                            className="max-w-full max-h-full object-contain shadow-lg"
                                        />
                                    </div>

                                    {/* Actions overlay */}
                                    <div className="bg-background/95 backdrop-blur-sm border-t p-4 flex flex-col gap-2">
                                        <Button
                                            variant="default"
                                            className="w-full"
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(resultUrl)}`);
                                                    if (!res.ok) throw new Error('Network error');
                                                    const blob = await res.blob();
                                                    const blobUrl = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = blobUrl;
                                                    link.download = `logo-ia-${Date.now()}.png`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                    window.URL.revokeObjectURL(blobUrl);
                                                } catch (e) {
                                                    console.error('Download failed', e);
                                                    window.open(resultUrl, '_blank');
                                                }
                                            }}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Télécharger HD
                                        </Button>
                                        <p className="text-[10px] text-muted-foreground text-center">
                                            Image générée par OUTFITY AI. Droits d'usage commerciaux inclus.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-square flex flex-col items-center justify-center text-muted-foreground p-6 text-center bg-muted/10">
                                    <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                                        <Sparkles className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-sm font-medium">Aucun résultat</p>
                                    <p className="text-xs mt-1 max-w-[200px]">
                                        Remplissez le formulaire et cliquez sur "Générer" pour voir votre création apparaître ici.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
