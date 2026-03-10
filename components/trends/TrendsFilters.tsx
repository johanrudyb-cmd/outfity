'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FASHION_STYLES } from '@/lib/constants/fashion-styles';
import { ALL_FASHION_CUTS as FASHION_CUTS } from '@/lib/constants/fashion-cuts';

interface Filters {
  category: string;
  style: string;
  cut: string;
  material: string;
  sortBy: string;
}

interface TrendsFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function TrendsFilters({ filters, onFiltersChange }: TrendsFiltersProps) {
  const categories = ['', 'Hoodie', 'T-shirt', 'Cargo', 'Accessoires', 'Pantalon', 'Short', 'Veste', 'Sweat'];
  const styles = ['', ...FASHION_STYLES];
  const cuts = ['', ...FASHION_CUTS];
  const materials = ['', 'Coton GSM élevé', 'Denim', 'Synthétique', 'Coton', 'Laine', 'Lin', 'Cachemire'];
  const sortOptions = [
    { value: 'saturability', label: 'Moins saturé (meilleur)' },
    { value: 'trendScore', label: 'Plus tendance' },
  ];

  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Catégorie
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat || 'Toutes'}
                </option>
              ))}
            </select>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Style (Niche)
            </label>
            <select
              value={filters.style}
              onChange={(e) => updateFilter('style', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {styles.map((style) => (
                <option key={style} value={style}>
                  {style || 'Tous'}
                </option>
              ))}
            </select>
          </div>

          {/* Coupe / Détail */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Coupe / Signature
            </label>
            <select
              value={filters.cut}
              onChange={(e) => updateFilter('cut', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {cuts.map((cut) => (
                <option key={cut} value={cut}>
                  {cut || 'Toutes'}
                </option>
              ))}
            </select>
          </div>

          {/* Matière */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Matière
            </label>
            <select
              value={filters.material}
              onChange={(e) => updateFilter('material', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {materials.map((mat) => (
                <option key={mat} value={mat}>
                  {mat || 'Toutes'}
                </option>
              ))}
            </select>
          </div>

          {/* Tri */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Trier par
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
