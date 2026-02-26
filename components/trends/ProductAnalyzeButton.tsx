'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface ProductAnalyzeButtonProps {
  productName: string;
}

export function ProductAnalyzeButton({ productName }: ProductAnalyzeButtonProps) {
  const router = useRouter();
  const [shopifyUrl, setShopifyUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!shopifyUrl.trim()) {
      setError('Veuillez saisir une URL Shopify');
      return;
    }

    // Validation basique de l'URL
    try {
      new URL(shopifyUrl); // Vérifier que l'URL est valide
      // La validation Shopify se fera côté serveur
    } catch {
      setError('URL invalide');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/spy/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: shopifyUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }

      // Rediriger vers la page de détail de l'analyse
      router.push(`/spy/${data.analysis.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://exemple.myshopify.com"
          value={shopifyUrl}
          onChange={(e) => {
            setShopifyUrl(e.target.value);
            setError('');
          }}
          className="flex-1 border-2"
          disabled={isAnalyzing}
        />
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !shopifyUrl.trim()}
          className="shadow-modern-lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyse...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Analyser
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-error font-medium bg-error/10 border-2 border-error/20 rounded-lg p-3">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground font-medium">
        💡 Saisissez l'URL d'une boutique Shopify qui vend des produits similaires à "{productName}" pour analyser leur stratégie
      </p>
    </div>
  );
}
