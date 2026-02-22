'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from './ProductCard';
import { TrendsFilters } from './TrendsFilters';
import { ActivePreferencesBadge } from '@/components/common/ActivePreferencesBadge';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: preferences?.preferredCategories?.[0] || '',
    style: preferences?.preferredStyles?.[0] || '',
    cut: '',
    material: '',
    sortBy: 'saturability', // saturability, trendScore, price
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.style) params.append('style', filters.style);
        if (filters.material) params.append('material', filters.material);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);

        const response = await fetch(`/api/trends/products?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Badge préférences actives */}
      <ActivePreferencesBadge type="trends" />

      {/* Filtres */}
      <TrendsFilters filters={filters} onFiltersChange={setFilters} />

      {/* Galerie */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground font-medium">
          Chargement des produits...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground font-medium">
          Aucun produit trouvé avec ces filtres
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
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
