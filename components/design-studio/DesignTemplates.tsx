'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Sparkles, X } from 'lucide-react';

interface Design {
  id: string;
  type: string;
  cut: string | null;
  material: string | null;
  templateName: string | null;
  isTemplate: boolean;
  flatSketchUrl: string | null;
}

interface DesignTemplatesProps {
  brandId: string;
  onSelectTemplate: (template: Design) => void;
}

export function DesignTemplates({ brandId, onSelectTemplate }: DesignTemplatesProps) {
  const [templates, setTemplates] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/designs?brandId=${brandId}&templates=true`);
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.designs || []);
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground font-medium text-center py-4">
            Chargement des templates...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Templates de designs</CardTitle>
        <CardDescription className="font-medium">
          Réutilisez vos designs comme base pour de nouveaux projets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:shadow-modern transition-all bg-card text-left"
              >
                <div className="flex items-start gap-3">
                  {template.flatSketchUrl && (
                    <Image
                      src={template.flatSketchUrl}
                      alt={template.type}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground mb-1">
                      {template.templateName || template.type}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {template.type} - {template.cut} - {template.material}
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground font-medium text-center py-4">
            Aucun template disponible. Créez un design et sauvegardez-le comme template.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
