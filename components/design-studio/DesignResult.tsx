'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, X } from 'lucide-react';

interface Design {
  id: string;
  type: string;
  cut: string | null;
  material: string | null;
  flatSketchUrl: string | null;
  techPack: any;
  prompt: string | null;
  status: string;
  isTemplate?: boolean;
}

interface DesignResultProps {
  design: Design;
}

export function DesignResult({ design }: DesignResultProps) {
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-xl font-light tracking-wide">
          Design généré
        </CardTitle>
        <CardDescription className="font-light">
          {design.type} - {design.cut} - {design.material}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Flat Sketch */}
        {design.flatSketchUrl && (
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-3">
              Flat Sketch (Recto/Verso)
            </h3>
            <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
              <Image
                src={design.flatSketchUrl}
                alt="Flat sketch"
                width={1200}
                height={1200}
                className="w-full h-auto rounded"
              />
            </div>
          </div>
        )}

        {/* Tech Pack */}
        {design.techPack && (
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-3">
              Tech Pack - Composants
            </h3>
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">
                      Composant
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-stone-700">
                      Spécifications
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {Object.entries(design.techPack).map(([key, value]: [string, any]) => (
                    <tr key={key}>
                      <td className="px-4 py-3 font-medium text-stone-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Link
              href={`/designs/${design.id}/tech-pack`}
              className="inline-flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-white font-light tracking-wide uppercase text-xs py-2 px-4 rounded-md transition-colors"
            >
              Voir le tech pack
            </Link>
            {design.status === 'completed' && !design.isTemplate && (
              <Button
                variant="outline"
                onClick={() => setShowSaveTemplate(true)}
                className="border-stone-300 text-stone-700 font-light tracking-wide uppercase text-xs py-2 px-4"
              >
                <FileText className="w-4 h-4 mr-2" />
                Sauvegarder comme template
              </Button>
            )}
          </div>

          {/* Formulaire sauvegarder template */}
          {showSaveTemplate && (
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-stone-900">Sauvegarder comme template</h4>
                <button
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setTemplateName('');
                  }}
                  className="p-1 hover:bg-stone-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Input
                type="text"
                placeholder="Nom du template (ex: T-shirt Classique)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="border-stone-300"
              />
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    if (!templateName.trim()) {
                      alert('Veuillez donner un nom au template');
                      return;
                    }

                    try {
                      const response = await fetch(`/api/designs/${design.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          isTemplate: true,
                          templateName: templateName.trim(),
                        }),
                      });

                      if (response.ok) {
                        setTemplateName('');
                        setShowSaveTemplate(false);
                        alert('Template sauvegardé avec succès !');
                      } else {
                        alert('Erreur lors de la sauvegarde');
                      }
                    } catch (error) {
                      console.error('Erreur sauvegarde template:', error);
                      alert('Erreur lors de la sauvegarde');
                    }
                  }}
                  disabled={!templateName.trim()}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-light tracking-wide uppercase text-xs py-2 px-4"
                >
                  Sauvegarder
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setTemplateName('');
                  }}
                  className="border-stone-300 text-stone-700 font-light tracking-wide uppercase text-xs py-2 px-4"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <div className="px-6 pb-6 pt-2">
        <p className="text-[10px] text-stone-400 text-center font-medium leading-relaxed italic">
          Images générées par intelligence artificielle à but de visualisation créative. <br className="hidden sm:block" />
          Le rendu final physique peut varier selon les matières et techniques de fabrication choisies.
        </p>
      </div>
    </Card>
  );
}
