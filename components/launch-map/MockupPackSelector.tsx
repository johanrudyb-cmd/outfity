'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, Check, Lock } from 'lucide-react';
import { useSurplusModal } from '@/components/usage/SurplusModalContext';
import { isFreePlan } from '@/lib/plan-utils';

interface MockupCategory {
  id: string;
  label: string;
  fileCount: number;
  files: string[];
}

interface MockupPackSelectorProps {
  brandId: string;
  brandName?: string;
  /** Si true, affiche une version compacte sans Card (pour intégration dans un autre bloc) */
  inline?: boolean;
  userPlan?: string;
  typeFilter?: string;
}

export function MockupPackSelector({ brandId, brandName, inline, userPlan, typeFilter }: MockupPackSelectorProps) {
  const openSurplusModal = useSurplusModal();
  const [categories, setCategories] = useState<MockupCategory[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/launch-map/mockup/categories')
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => {
        setCategories(data.categories || []);
        setSelected(new Set());
        if (typeFilter) {
          const matched = data.categories?.find((c: any) => c.id.toLowerCase() === typeFilter.toLowerCase() || c.label.toLowerCase().includes(typeFilter.toLowerCase()));
          if (matched) {
            setSelected(new Set([matched.id]));
          }
        }
      })
      .catch(() => setCategories([]))
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(categories.map((c) => c.id)));
  const deselectAll = () => setSelected(new Set());

  const handleDownload = async () => {
    if (isFreePlan(userPlan)) {
      openSurplusModal();
      return;
    }
    if (selected.size === 0) return;
    setIsDownloading(true);
    try {
      const types = Array.from(selected).join(',');
      const res = await fetch(
        `/api/launch-map/mockup/download-pack?brandId=${encodeURIComponent(brandId)}&types=${encodeURIComponent(types)}`
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pack-mockup-${brandName || 'marque'}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors du téléchargement');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors du téléchargement du pack de mockup');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Aucun mockup disponible pour le moment.
      </p>
    );
  }

  const filteredCategories = typeFilter
    ? categories.filter(c => c.id.toLowerCase() === typeFilter.toLowerCase() || c.label.toLowerCase().includes(typeFilter.toLowerCase()))
    : categories;

  const selectorContent = (
    <>
      {!typeFilter && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Tout sélectionner
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Tout désélectionner
          </Button>
        </div>
      )}

      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto ${inline ? 'max-h-[200px]' : 'max-h-[320px]'}`}>
        {filteredCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggle(cat.id)}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${selected.has(cat.id) ? 'border-primary bg-primary/10' : 'border-border'
              }`}
          >
            <div className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0">
              {selected.has(cat.id) ? <Check className="w-3 h-3 text-primary" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-sm block truncate">{cat.label}</span>
              <span className="text-xs text-muted-foreground">{cat.fileCount} fichier{cat.fileCount > 1 ? 's' : ''}</span>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleDownload}
        disabled={selected.size === 0 || isDownloading}
        size={inline ? 'sm' : 'md'}
        className="gap-2 w-full sm:w-auto"
      >
        {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isFreePlan(userPlan) ? <Lock className="w-5 h-5" /> : <Download className="w-5 h-5" />)}
        Télécharger ({selected.size} type{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''})
      </Button>
    </>
  );

  if (inline) {
    return <div className="mt-3 space-y-3">{selectorContent}</div>;
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Télécharger votre pack de mockup
        </CardTitle>
        <CardDescription>
          Sélectionnez les types de mockup que vous souhaitez télécharger. Seuls les modèles cochés seront inclus dans le ZIP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectorContent}
      </CardContent>
    </Card>
  );
}
