'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag,
  Play,
  Pause,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface LiveTrackingIndicatorProps {
  shopifyUrl: string;
  storeName: string;
}

interface TrackingData {
  brand: {
    id: string;
    isTrackingActive: boolean;
    lastSales24h: number;
    lastRevenue24h: number;
  };
  tracking: boolean;
  chartData: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}

export function LiveTrackingIndicator({ shopifyUrl, storeName }: LiveTrackingIndicatorProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const fetchTrackingData = useCallback(async () => {
    try {
      const response = await fetch(`/api/spy/track?url=${encodeURIComponent(shopifyUrl)}`);
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du tracking:', error);
    } finally {
      setIsLoading(false);
    }
  }, [shopifyUrl]);

  useEffect(() => {
    fetchTrackingData();
    // Rafraîchir toutes les 30 secondes si le tracking est actif
    const interval = setInterval(() => {
      if (trackingData?.tracking) {
        fetchTrackingData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTrackingData, trackingData?.tracking]);

  const toggleTracking = async () => {
    setIsToggling(true);
    try {
      if (trackingData?.tracking) {
        // Désactiver
        await fetch(`/api/spy/track?brandId=${trackingData.brand.id}`, {
          method: 'DELETE',
        });
      } else {
        // Activer
        await fetch('/api/spy/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: shopifyUrl, name: storeName }),
        });
      }
      await fetchTrackingData();
    } catch (error) {
      console.error('Erreur lors du toggle du tracking:', error);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isTracking = trackingData?.tracking || false;
  const sales24h = trackingData?.brand?.lastSales24h || 0;
  const revenue24h = trackingData?.brand?.lastRevenue24h || 0;
  const chartData = trackingData?.chartData || [];

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <CardTitle className="text-lg font-semibold">
              Tracking Live
            </CardTitle>
            {isTracking && (
              <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                <Activity className="w-3 h-3 mr-1" />
                Actif
              </Badge>
            )}
          </div>
          <Button
            variant={isTracking ? 'outline' : 'default'}
            size="sm"
            onClick={toggleTracking}
            disabled={isToggling}
            className="border-2"
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isTracking ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Activer
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Indicateurs 24h */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-background/80 backdrop-blur rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ventes 24h
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {sales24h.toLocaleString('fr-FR')}
            </div>
            {isTracking && (
              <p className="text-xs text-muted-foreground mt-1">
                Mise à jour toutes les heures
              </p>
            )}
          </div>

          <div className="p-4 bg-background/80 backdrop-blur rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Revenu 24h
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {revenue24h >= 1000 
                ? `${(revenue24h / 1000).toFixed(1)}K€`
                : `${revenue24h.toFixed(0)}€`}
            </div>
            {isTracking && (
              <p className="text-xs text-muted-foreground mt-1">
                Estimé depuis les stocks
              </p>
            )}
          </div>
        </div>

        {/* Graphique 7 jours */}
        {chartData.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tendances 7 derniers jours
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K€`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any, name: any) => {
                    if (name === 'revenue') {
                      return [`${(value ?? 0).toFixed(2)}€`, 'Revenu'];
                    }
                    return [value ?? 0, 'Ventes'];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Ventes"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Revenu (€)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!isTracking && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p className="font-semibold mb-2">💡 Activez le tracking pour voir les données réelles</p>
            <p className="text-xs">Le tracking analyse les stocks toutes les heures et calcule les ventes réelles</p>
            <p className="text-xs mt-1">Sans tracking, les commandes affichées sont des estimations basées sur le trafic estimé</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

