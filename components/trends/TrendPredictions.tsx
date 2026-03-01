'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, AlertCircle, Clock, Globe, Palette, Mail, BarChart3 } from 'lucide-react';
import { TrendsSubNav } from './TrendsSubNav';
import useSWR from 'swr';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface TrendPrediction {
  productKey: string;
  productName: string;
  productType: string;
  cut: string | null;
  material: string | null;
  color: string | null;
  predictionScore: number;
  velocityScore: number;
  diversityScore: number;
  emergenceScore: number;
  priceStabilityScore: number;
  brands: string[];
  countries: string[];
  averagePrice: number;
  priceRange: { min: number; max: number };
  firstSeenAt: string;
  lastSeenAt: string;
  daysSinceFirstSeen: number;
  appearanceCount: number;
  newInCount: number;
  bestSellersCount: number;
  predictedPeakDate: string | null;
  confidenceLevel: 'low' | 'medium' | 'high';
  trendPhase: 'emerging' | 'growing' | 'peak' | 'declining';
  style: string | null;
}

interface TrendPredictionsProps {
  userId: string;
  userPlan?: string;
}

export function TrendPredictions({ userId, userPlan = 'starter' }: TrendPredictionsProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<TrendPrediction | null>(null);

  const params = new URLSearchParams();
  if (selectedPhase !== 'all') {
    params.append('phase', selectedPhase);
  }
  params.append('limit', '30');

  const { data, isLoading, mutate } = useSWR(`/api/trends/predict?${params.toString()}`, fetcher);
  const predictions: TrendPrediction[] = data?.predictions || [];

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'emerging':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'growing':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'peak':
        return 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300';
      case 'declining':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'emerging':
        return 'Émergent';
      case 'growing':
        return 'En Croissance';
      case 'peak':
        return 'Pic';
      case 'declining':
        return 'Déclin';
      default:
        return phase;
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600 dark:text-green-400';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'low':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <TrendsSubNav active="phases" />
        <LoadingState title="Chargement des phases…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TrendsSubNav active="phases" />
      <SectionHeader
        title="Cycle de Vie Radar"
        icon={Sparkles}
        description="Émergent → Croissance → Pic → Déclin. Scores calculés à partir des données de scan (vitesse, diversité marques/pays, émergence, stabilité des prix). Ce n’est pas un rapport texte IA ; pour ça, utilisez « Synthèse du Radar » ou « Analyser » sur le classement."
      />

      {(userPlan === 'starter' || userPlan === 'free') && (
        <Card className="border-primary/50 bg-primary/5 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <span className="text-3xl mb-2">🔒</span>
              <h3 className="text-lg font-semibold text-primary">Prédictions réservées au plan créateur</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Ces données vous donnent un aperçu du fonctionnement. Pour exploiter vos propres analyses de façon illimitée, passez au plan Créateur.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres par phase */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedPhase === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedPhase('all')}
            >
              Toutes
            </Button>
            <Button
              variant={selectedPhase === 'emerging' ? 'default' : 'outline'}
              onClick={() => setSelectedPhase('emerging')}
            >
              Émergentes
            </Button>
            <Button
              variant={selectedPhase === 'growing' ? 'default' : 'outline'}
              onClick={() => setSelectedPhase('growing')}
            >
              En Croissance
            </Button>
            <Button
              variant={selectedPhase === 'peak' ? 'default' : 'outline'}
              onClick={() => setSelectedPhase('peak')}
            >
              Pic
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des prédictions */}
      {predictions.length === 0 ? (
        <EmptyState
          description="Aucune prédiction disponible pour le moment. Scannez les marques pour générer des prédictions."
        />
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <Card key={prediction.productKey || index} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{prediction.productName}</CardTitle>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPhaseColor(prediction.trendPhase)}`}>
                        {getPhaseLabel(prediction.trendPhase)}
                      </span>
                      <span className={`text-xs font-semibold ${getConfidenceColor(prediction.confidenceLevel)}`}>
                        {prediction.confidenceLevel === 'high' ? '🔮 Haute' :
                          prediction.confidenceLevel === 'medium' ? '📊 Moyenne' : '⚠️ Faible'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>{prediction.productType}</span>
                      {prediction.cut && <span>• {prediction.cut}</span>}
                      {prediction.material && <span>• {prediction.material}</span>}
                      {prediction.style && <span>• {prediction.style}</span>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Marques</div>
                    <div className="font-medium">{prediction.brands.length} marque{prediction.brands.length > 1 ? 's' : ''}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Pays</div>
                    <div className="font-medium">{prediction.countries.join(', ') || 'Non spécifié'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Apparitions</div>
                    <div className="font-medium">
                      {prediction.appearanceCount} ({prediction.newInCount} New In, {prediction.bestSellersCount} Best Sellers)
                    </div>
                  </div>
                  {prediction.predictedPeakDate && (
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Clock className="w-4 h-4" />
                        Pic estimé
                      </div>
                      <div className="font-medium">
                        {new Date(prediction.predictedPeakDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground mb-1">Détecté il y a</div>
                    <div className="font-medium">{prediction.daysSinceFirstSeen} jours</div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateDesign(prediction)}
                      className="gap-2"
                    >
                      <Palette className="w-4 h-4" />
                      Créer un Design
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestQuote(prediction)}
                      className="gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Demander un Devis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="max-w-7xl mx-auto px-6 text-[10px] text-[#86868B] text-center mt-8 font-medium leading-relaxed">
        Les analyses et prédictions de tendances sont basées sur des algorithmes de données et constituent un outil d'aide à la décision. <br />
        Elles ne garantissent pas les ventes futures ni le succès commercial.
      </p>
    </div>
  );

  const handleCreateDesign = async (prediction: TrendPrediction) => {
    try {
      const response = await fetch('/api/trends/to-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: prediction.productType,
          cut: prediction.cut,
          material: prediction.material,
          color: prediction.color,
          style: prediction.style,
          productName: prediction.productName,
          averagePrice: prediction.averagePrice,
          brands: prediction.brands,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const params = new URLSearchParams({
          type: data.designData.type,
          cut: data.designData.cut || '',
          material: data.designData.material || '',
          prompt: encodeURIComponent(data.designData.customPrompt),
        });

        window.location.href = `/design-studio?${params.toString()}`;
      } else {
        throw new Error(data.error || 'Erreur lors de la création');
      }
    } catch (error: unknown) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    }
  };

  const handleRequestQuote = async (prediction: TrendPrediction) => {
    try {
      const response = await fetch('/api/trends/supplier-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: prediction.productType,
          cut: prediction.cut,
          material: prediction.material,
          color: prediction.color,
          style: prediction.style,
          productName: prediction.productName,
          averagePrice: prediction.averagePrice,
          brands: prediction.brands,
          predictionScore: prediction.predictionScore,
          trendPhase: prediction.trendPhase,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const params = new URLSearchParams({
          trend: encodeURIComponent(JSON.stringify(data.emailData)),
          productType: data.productType || '',
          material: data.material || '',
          autoFilter: 'true',
        });
        window.location.href = `/sourcing?${params.toString()}`;
      } else {
        throw new Error(data.error || 'Erreur lors de la génération');
      }
    } catch (error: unknown) {
      alert(`Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`);
    }
  };
}
