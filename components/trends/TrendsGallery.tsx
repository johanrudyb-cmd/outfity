'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import { ProductCard } from './ProductCard';
import { TrendsFilters } from './TrendsFilters';
import { ActivePreferencesBadge } from '@/components/common/ActivePreferencesBadge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

interface Product {
  id: string;
  name: string;
  category: string;
  style: string;
  material: string;
  averagePrice: number;
  trendScore: number;
  saturability: number;
  imageUrl: string | null;
  description: string | null;
}

interface UserPreferences {
  preferredCategories?: string[];
  preferredStyles?: string[];
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  preferredCountry?: string | null;
}

interface TrendsGalleryProps {
  userId: string;
  favoriteIds: string[];
  preferences?: UserPreferences | null;
}

export function TrendsGallery({ userId, favoriteIds, preferences }: TrendsGalleryProps) {
  const [filters, setFilters] = useState({
    category: preferences?.preferredCategories?.[0] || '',
    style: preferences?.preferredStyles?.[0] || '',
    cut: '',
    material: '',
    sortBy: 'saturability', // saturability, trendScore, price
  });

  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.style) params.append('style', filters.style);
  if (filters.material) params.append('material', filters.material);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);

  const { data, error, isLoading } = useSWR(`/api/trends/products?${params.toString()}`, fetcher);

  const products = data?.products || [];
  const loading = isLoading;

  return (
    <div className="space-y-6">
      {/* Badge préférences actives */}
      <ActivePreferencesBadge type="trends" />

      {/* Filtres */}
      <TrendsFilters filters={filters} onFiltersChange={setFilters} />

      {/* Galerie */}
      {loading ? (
        <LoadingState title="Chargement des produits..." />
      ) : products.length === 0 ? (
        <EmptyState description="Aucun produit trouvé avec ces filtres" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              userId={userId}
              isFavorite={favoriteIds.includes(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
