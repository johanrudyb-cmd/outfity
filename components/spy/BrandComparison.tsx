'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface Analysis {
  id: string;
  shopifyUrl: string;
  storeName?: string | null;
  category?: string | null;
  estimatedMonthlyRevenue?: number | null;
  productCount?: number | null;
  country?: string | null;
  createdAt: Date;
}

interface BrandComparisonProps {
  userId: string;
}

export function BrandComparison({ userId }: BrandComparisonProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, [userId]);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch('/api/spy/analyses');
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error('Erreur chargement analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 5
        ? [...prev, id]
        : prev
    );
  };

  const selectedAnalyses = analyses.filter((a) => selectedIds.includes(a.id));

  const formatRevenue = (revenue: number | null) => {
    if (!revenue) return 'N/A';
    if (revenue >= 1000000) return `${(revenue / 1000000).toFixed(1)}M€`;
    if (revenue >= 1000) return `${(revenue / 1000).toFixed(0)}K€`;
    return `${revenue.toFixed(0)}€`;
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground font-medium text-center py-4">
            Chargement des analyses...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélection des marques */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Comparer des marques</CardTitle>
          <CardDescription className="font-medium">
            Sélectionnez jusqu'à 5 marques à comparer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <p className="text-sm text-muted-foreground font-medium text-center py-4">
              Aucune analyse disponible. Analysez d'abord des marques.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {analyses.map((analysis) => {
                const isSelected = selectedIds.includes(analysis.id);
                return (
                  <button
                    key={analysis.id}
                    onClick={() => toggleSelection(analysis.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-modern'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">
                          {analysis.storeName || analysis.shopifyUrl}
                        </div>
                        {analysis.category && (
                          <div className="text-xs text-muted-foreground font-medium mt-1">
                            {analysis.category}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-white">✓</span>
                        </div>
                      )}
                    </div>
                    {analysis.estimatedMonthlyRevenue && (
                      <div className="text-xs font-bold text-primary mt-2">
                        {formatRevenue(analysis.estimatedMonthlyRevenue ?? null)}/mois
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableau de comparaison */}
      {selectedAnalyses.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Comparaison</CardTitle>
                <CardDescription className="font-medium">
                  {selectedAnalyses.length} marque{selectedAnalyses.length > 1 ? 's' : ''} sélectionnée{selectedAnalyses.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                  className="border-2"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Tout désélectionner
                </Button>
                <Link href={`/spy/compare?ids=${selectedIds.join(',')}`}>
                  <Button className="shadow-modern" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Voir comparaison détaillée
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-4 font-bold text-foreground">Critère</th>
                    {selectedAnalyses.map((analysis) => (
                      <th
                        key={analysis.id}
                        className="text-left py-3 px-4 font-bold text-foreground min-w-[200px]"
                      >
                        {analysis.storeName || analysis.shopifyUrl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">CA Mensuel</td>
                    {selectedAnalyses.map((analysis) => (
                      <td key={analysis.id} className="py-3 px-4 text-muted-foreground font-medium">
                        {formatRevenue(analysis.estimatedMonthlyRevenue ?? null)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Nombre de produits</td>
                    {selectedAnalyses.map((analysis) => (
                      <td key={analysis.id} className="py-3 px-4 text-muted-foreground font-medium">
                        {analysis.productCount || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Catégorie</td>
                    {selectedAnalyses.map((analysis) => (
                      <td key={analysis.id} className="py-3 px-4 text-muted-foreground font-medium">
                        {analysis.category || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Pays</td>
                    {selectedAnalyses.map((analysis) => (
                      <td key={analysis.id} className="py-3 px-4 text-muted-foreground font-medium">
                        {analysis.country || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-foreground">Actions</td>
                    {selectedAnalyses.map((analysis) => (
                      <td key={analysis.id} className="py-3 px-4">
                        <Link href={`/spy/${analysis.id}`}>
                          <Button variant="outline" size="sm" className="border-2">
                            Voir détails
                          </Button>
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
