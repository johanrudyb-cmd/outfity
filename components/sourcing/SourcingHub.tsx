'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FactoryCard } from './FactoryCard';
import { FactoryDetailModal } from './FactoryDetailModal';
import { QuoteList } from './QuoteList';
import { ActivePreferencesBadge } from '@/components/common/ActivePreferencesBadge';
import { filterFactoriesByProduct } from '@/lib/factory-product-matcher';
import { Truck } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Factory {
  id: string;
  name: string;
  country: string;
  moq: number;
  specialties: string[];
  leadTime: number;
  certifications: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  website?: string | null;
  rating: number | null;
}

interface Quote {
  id: string;
  factoryId: string;
  status: string;
  factory: Factory;
  createdAt: Date;
}

interface UserPreferences {
  preferredSourcingCountries?: string[];
  preferredMOQ?: number | null;
  maxLeadTime?: number | null;
}

interface SourcingHubProps {
  brandId: string;
  sentQuotes: Quote[];
  favoriteFactoryIds?: string[];
  preferences?: UserPreferences | null;
  trendEmailData?: {
    subject: string;
    body: string;
    productDetails: any;
  } | null;
  autoFilterData?: { productType: string | null; material: string | null } | null;
  userPlan?: string;
}

export function SourcingHub({ brandId, sentQuotes, favoriteFactoryIds = [], preferences, trendEmailData, autoFilterData, userPlan = 'free' }: SourcingHubProps) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(favoriteFactoryIds);
  const [filteredFactories, setFilteredFactories] = useState<Factory[]>([]);
  const [detailFactory, setDetailFactory] = useState<Factory | null>(null);

  const { data: factoriesData, isLoading } = useSWR('/api/factories', fetcher);
  const factories: Factory[] = factoriesData?.factories || [];
  const loading = isLoading;

  const { data: favData, mutate: mutateFav } = useSWR(
    favoriteIds.length > 0 ? `/api/brands/${brandId}/favorite-factories` : null,
    fetcher
  );
  const favoriteFactories: Factory[] = favData?.factories || [];

  useEffect(() => {
    setFavoriteIds(favoriteFactoryIds);
  }, [favoriteFactoryIds]);

  const toggleFavorite = async (factoryId: string) => {
    const isFav = favoriteIds.includes(factoryId);
    const nextIds = isFav ? favoriteIds.filter((id) => id !== factoryId) : [...favoriteIds, factoryId];
    setFavoriteIds(nextIds);
    try {
      const res = await fetch(`/api/brands/${brandId}/favorite-factories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factoryId, favorite: !isFav }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      await mutateFav();
    } catch (err) {
      setFavoriteIds(favoriteIds);
      const msg = err instanceof Error ? err.message : 'Impossible d\'enregistrer le fournisseur en favori.';
      window.alert(msg);
    }
  };

  // Afficher une alerte si on vient d'une tendance
  useEffect(() => {
    if (trendEmailData) {
      // Optionnel : afficher une notification
      console.log('Email pré-rempli depuis tendance:', trendEmailData);
    }
  }, [trendEmailData]);
  const [filters, setFilters] = useState({
    country: preferences?.preferredSourcingCountries?.[0] || '',
    moqMax: preferences?.preferredMOQ?.toString() || '',
    specialty: '',
    leadTimeMax: preferences?.maxLeadTime?.toString() || '',
    search: '',
  });

  useEffect(() => {
    applyFilters();
  }, [filters, factories, autoFilterData]);

  const applyFilters = () => {
    let filtered = [...factories];

    // Filtrage automatique par type de produit (si venant d'une tendance)
    if (autoFilterData?.productType) {
      filtered = filterFactoriesByProduct(
        filtered,
        autoFilterData.productType,
        autoFilterData.material
      );
    }

    if (filters.country) {
      filtered = filtered.filter((f) => f.country === filters.country);
    }

    if (filters.moqMax) {
      const moqMax = parseInt(filters.moqMax);
      filtered = filtered.filter((f) => f.moq <= moqMax);
    }

    if (filters.specialty) {
      filtered = filtered.filter((f) =>
        f.specialties.some((s) =>
          s.toLowerCase().includes(filters.specialty.toLowerCase())
        )
      );
    }

    if (filters.leadTimeMax) {
      const leadTimeMax = parseInt(filters.leadTimeMax);
      filtered = filtered.filter((f) => f.leadTime <= leadTimeMax);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchLower) ||
          f.country.toLowerCase().includes(searchLower)
      );
    }

    setFilteredFactories(filtered);
  };

  const countries = Array.from(new Set(factories.map((f) => f.country))).sort();
  const allSpecialties = Array.from(
    new Set(factories.flatMap((f) => f.specialties))
  ).sort();

  return (
    <div className="space-y-8">
      {/* Badge préférences actives */}
      <ActivePreferencesBadge type="sourcing" />

      {/* Filtres */}
      <Card>
        <CardHeader>
          <SectionHeader title="Filtres de recherche" className="text-lg" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Recherche
              </label>
              <Input
                type="text"
                placeholder="Nom, pays..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Pays
              </label>
              <select
                value={filters.country}
                onChange={(e) =>
                  setFilters({ ...filters, country: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">Tous les pays</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                MOQ max
              </label>
              <Input
                type="number"
                placeholder="Ex: 100"
                value={filters.moqMax}
                onChange={(e) =>
                  setFilters({ ...filters, moqMax: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Spécialité
              </label>
              <select
                value={filters.specialty}
                onChange={(e) =>
                  setFilters({ ...filters, specialty: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">Toutes les spécialités</option>
                {allSpecialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Délai max (jours)
              </label>
              <Input
                type="number"
                placeholder="Ex: 30"
                value={filters.leadTimeMax}
                onChange={(e) =>
                  setFilters({ ...filters, leadTimeMax: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fournisseurs avec qui vous travaillez */}
      {favoriteFactories.length > 0 && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Fournisseurs avec qui vous travaillez
            </CardTitle>
            <CardDescription>
              Vos fournisseurs favoris (mis en étoile) — {favoriteFactories.length} fournisseur{favoriteFactories.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteFactories.map((factory) => (
                <FactoryCard
                  key={factory.id}
                  factory={factory}
                  isFavorite={true}
                  onToggleFavorite={() => toggleFavorite(factory.id)}
                  onViewDetail={() => setDetailFactory(factory)}
                  userPlan={userPlan}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerte si email pré-rempli depuis tendance */}
      {trendEmailData && (
        <Card className="border-2 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  📧 Email Pré-rempli depuis la Tendance
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  Un message professionnel a été généré avec les informations essentielles.
                  Les usines ont été filtrées automatiquement selon le type de produit.
                </div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-500">
                  Produit : {trendEmailData.productDetails?.type || 'N/A'}
                  {trendEmailData.productDetails?.cut && ` • ${trendEmailData.productDetails.cut}`}
                  {trendEmailData.productDetails?.material && ` • ${trendEmailData.productDetails.material}`}
                </div>
                {autoFilterData && (
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-500">
                    ✓ Filtrage automatique activé : {autoFilterData.productType}
                    {autoFilterData.material && ` • ${autoFilterData.material}`}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des usines */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {filteredFactories.length} usine{filteredFactories.length > 1 ? 's' : ''} trouvée{filteredFactories.length > 1 ? 's' : ''}
          </h2>
        </div>

        {loading ? (
          <LoadingState title="Chargement des usines..." />
        ) : filteredFactories.length === 0 ? (
          <EmptyState
            description="Aucune usine ne correspond à vos critères"
            className="border-2"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFactories.map((factory) => (
              <FactoryCard
                key={factory.id}
                factory={factory}
                isFavorite={favoriteIds.includes(factory.id)}
                onToggleFavorite={() => toggleFavorite(factory.id)}
                onViewDetail={() => setDetailFactory(factory)}
                userPlan={userPlan}
              />
            ))}
          </div>
        )}
      </div>

      {/* Devis envoyés */}
      {sentQuotes.length > 0 && (
        <QuoteList quotes={sentQuotes} userPlan={userPlan} />
      )}

      {/* Modal détail fournisseur */}
      {detailFactory && (
        <FactoryDetailModal
          factory={detailFactory}
          isFavorite={favoriteIds.includes(detailFactory.id)}
          onToggleFavorite={() => toggleFavorite(detailFactory.id)}
          onClose={() => setDetailFactory(null)}
          userPlan={userPlan}
        />
      )}
      <p className="max-w-7xl mx-auto px-6 text-[10px] text-[#86868B] text-center mt-12 font-medium leading-relaxed italic">
        Les informations sur les usines et les prix de gros sont indicatifs. <br className="hidden sm:block" />
        Effectuez toujours vos propres vérifications (échantillonnage, audit) avant d'engager des fonds.
      </p>
    </div>
  );
}
