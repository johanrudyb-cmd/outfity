'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const ENRICH_FIELDS = [
  'style', 'material', 'color', 'careInstructions', 'description', 'cut',
  'estimatedCogsPercent', 'complexityScore', 'sustainabilityScore',
  'visualAttractivenessScore', 'dominantAttribute',
] as const;

function hasMissingFields(product: {
  category?: string | null;
  style?: string | null;
  material?: string | null;
  color?: string | null;
  careInstructions?: string | null;
  description?: string | null;
  cut?: string | null;
  productBrand?: string | null;
  estimatedCogsPercent?: number | null;
  complexityScore?: string | null;
  sustainabilityScore?: number | null;
  visualAttractivenessScore?: number | null;
  dominantAttribute?: string | null;
}): boolean {
  if (product.category === 'Autre' || !product.category?.trim()) return true;
  if (!product.material || product.material.trim() === '' || product.material === 'Non spécifié') return true;
  if (!product.style || product.style.trim() === '') return true;
  if (!product.productBrand || product.productBrand.trim() === '' || /^\._\.$/i.test(product.productBrand.trim())) return true;
  if (!product.color || product.color.trim() === '') return true;
  if (!product.careInstructions || product.careInstructions.trim() === '') return true;
  if (product.estimatedCogsPercent == null) return true;
  if (!product.complexityScore || product.complexityScore.trim() === '') return true;
  if (product.sustainabilityScore == null) return true;
  if (product.visualAttractivenessScore == null) return true;
  if (!product.dominantAttribute || product.dominantAttribute.trim() === '') return true;
  return false;
}

interface ProductDetailEnricherProps {
  productId: string;
  product: {
    category?: string | null;
    style?: string | null;
    material?: string | null;
    color?: string | null;
    careInstructions?: string | null;
    description?: string | null;
    cut?: string | null;
    productBrand?: string | null;
    estimatedCogsPercent?: number | null;
    complexityScore?: string | null;
    sustainabilityScore?: number | null;
    visualAttractivenessScore?: number | null;
    dominantAttribute?: string | null;
  };
  children: React.ReactNode;
}

export function ProductDetailEnricher({ productId, product, children }: ProductDetailEnricherProps) {
  const router = useRouter();
  const [enriching, setEnriching] = useState(false);
  const hasEnriched = useRef(false);

  useEffect(() => {
    if (hasEnriched.current || !hasMissingFields(product)) return;
    hasEnriched.current = true;
    window.setTimeout(() => setEnriching(true), 0);
    fetch(`/api/trends/products/${productId}/enrich`, { method: 'POST' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.enriched) {
          router.refresh();
        }
      })
      .catch(() => { })
      .finally(() => setEnriching(false));
  }, [productId, product, router]);

  if (enriching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-2 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-apple-spin" />
        <p className="text-sm font-medium text-[#1D1D1F]/70 italic">Analyse approfondie du produit en cours…</p>
        <p className="text-xs text-[#1D1D1F]/50">Extraction des matières, coupes et spécifications techniques.</p>
      </div>
    );
  }

  return <>{children}</>;
}
