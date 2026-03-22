'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Type, Upload, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneratedIdentity {
  names: string[];
  logos: string[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    heading: string;
    body: string;
  };
}

interface BrandIdentityStep3Props {
  generatedIdentity: GeneratedIdentity;
  selectedName: string;
  setSelectedName: (value: string) => void;
  selectedLogo: string;
  setSelectedLogo: (value: string) => void;
  selectedColors: { primary: string; secondary: string; accent: string } | null;
  setSelectedColors: (colors: { primary: string; secondary: string; accent: string }) => void;
  selectedTypography: { heading: string; body: string } | null;
  setSelectedTypography: (typography: { heading: string; body: string }) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function BrandIdentityStep3({
  generatedIdentity,
  selectedName,
  setSelectedName,
  selectedLogo,
  setSelectedLogo,
  selectedColors,
  setSelectedColors,
  selectedTypography,
  setSelectedTypography,
  onSubmit,
  loading,
}: BrandIdentityStep3Props) {
  const [customName, setCustomName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);

  return (
    <div className="space-y-8">
      {/* Nom de marque */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Nom de marque</h3>
        </div>
        
        <div className="space-y-3">
          {generatedIdentity.names.map((name, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedName(name);
                setUseCustomName(false);
              }}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-all',
                selectedName === name && !useCustomName
                  ? 'border-primary bg-primary/10 shadow-modern'
                  : 'border-border hover:border-primary/50 bg-card'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{name}</span>
                {selectedName === name && !useCustomName && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={() => setUseCustomName(!useCustomName)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {useCustomName ? '← Choisir parmi les suggestions' : 'Créer mon propre nom'}
          </button>
          {useCustomName && (
            <div className="mt-3">
              <Input
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  setSelectedName(e.target.value);
                }}
                placeholder="Votre nom de marque"
                className="border-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Logo */}
      {generatedIdentity.logos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Logo</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {generatedIdentity.logos.map((logo, index) => (
              <button
                key={index}
                onClick={() => setSelectedLogo(logo)}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all overflow-hidden',
                  selectedLogo === logo
                    ? 'border-primary ring-4 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Image
                  src={logo}
                  alt={`Logo option ${index + 1}`}
                  width={256}
                  height={128}
                  className="w-full h-32 object-contain"
                />
                {selectedLogo === logo && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="border-2"
              onClick={() => {
                // TODO: Implémenter upload logo
                alert('Upload logo - À implémenter');
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload mon logo
            </Button>
          </div>
        </div>
      )}

      {/* Palette de couleurs */}
      {selectedColors && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Palette de couleurs</h3>
          </div>
          
          <div className="flex gap-4">
            {Object.entries(selectedColors).map(([key, color]) => (
              <div key={key} className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-20 rounded-xl border-2 border-border shadow-modern"
                  style={{ backgroundColor: color }}
                />
                <div className="text-center">
                  <p className="text-xs font-semibold text-foreground capitalize">{key}</p>
                  <p className="text-xs text-muted-foreground font-medium">{color}</p>
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    setSelectedColors({
                      ...selectedColors,
                      [key]: e.target.value,
                    });
                  }}
                  className="w-12 h-8 rounded border-2 border-border cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typographie */}
      {selectedTypography && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Typographie</h3>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Titres
              </label>
              <Input
                type="text"
                value={selectedTypography.heading}
                onChange={(e) =>
                  setSelectedTypography({
                    ...selectedTypography,
                    heading: e.target.value,
                  })
                }
                className="border-2"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Texte
              </label>
              <Input
                type="text"
                value={selectedTypography.body}
                onChange={(e) =>
                  setSelectedTypography({
                    ...selectedTypography,
                    body: e.target.value,
                  })
                }
                className="border-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          onClick={onSubmit}
          disabled={loading || !selectedName}
          className="shadow-modern-lg"
        >
          {loading ? 'Création...' : 'Créer ma marque'}
          <CheckCircle2 className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
