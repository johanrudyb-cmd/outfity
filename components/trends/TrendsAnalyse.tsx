'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { TrendsSubNav } from './TrendsSubNav';

interface TrendsAnalyseProps {
  userId: string;
}

export function TrendsAnalyse({ userId }: TrendsAnalyseProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gptTest, setGptTest] = useState<{ ok: boolean; message?: string } | null>(null);
  const [gptTestLoading, setGptTestLoading] = useState(false);

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/trends/analyse-ia');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'analyse');
      setAnalysis(data.analysis || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const testGptConnection = async () => {
    setGptTestLoading(true);
    setGptTest(null);
    try {
      const res = await fetch('/api/health/gpt');
      const data = await res.json();
      if (res.ok) setGptTest({ ok: true, message: data.message ?? 'Moteur d\'analyse opérationnel' });
      else setGptTest({ ok: false, message: data.error ?? 'Erreur' });
    } catch (e) {
      setGptTest({ ok: false, message: e instanceof Error ? e.message : 'Erreur réseau' });
    } finally {
      setGptTestLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <TrendsSubNav active="rapport" />
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-2 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-apple-spin" />
            <p className="text-[#1D1D1F]/70 font-semibold italic">Tissage du rapport de tendances...</p>
            <p className="text-sm text-[#1D1D1F]/50">Analyse des coupes, matières et volumes en cours.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <TrendsSubNav active="rapport" />
        <Card className="border-destructive/50">
          <CardContent className="py-8">
            <p className="text-destructive font-medium">Erreur</p>
            <p className="text-muted-foreground mt-1">{error}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={testGptConnection} variant="outline" size="sm" disabled={gptTestLoading} title="Vérifier l'analyse">
                {gptTestLoading ? 'Test…' : 'Vérifier l\'analyse'}
              </Button>
              {gptTest && (
                <span className={`text-xs px-2 py-1 rounded self-center ${gptTest.ok ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {gptTest.ok ? gptTest.message : gptTest.message}
                </span>
              )}
              <Button onClick={loadAnalysis} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TrendsSubNav active="rapport" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7" />
            Synthèse des tendances
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Analyse contextuelle du marché à partir des données de scan mondiales.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 items-center">
          <Button variant="outline" size="sm" className="gap-2" onClick={testGptConnection} disabled={gptTestLoading} title="Vérifier l'analyse">
            {gptTestLoading ? 'Test…' : 'Vérifier l\'analyse'}
          </Button>
          {gptTest && (
            <span className={`text-xs px-2 py-1 rounded ${gptTest.ok ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
              {gptTest.ok ? gptTest.message : gptTest.message}
            </span>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={loadAnalysis}>
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Synthèse des tendances</CardTitle>
          <CardDescription>
            Analyse des cycles, prévisions pour la France et pistes d&apos;action générées par l&apos;analyse des tendances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-semibold">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">{analysis ?? ''}</div>
          </div>
          {analysis && (
            <div className="mt-6 pt-6 border-t text-sm text-muted-foreground">
              <p>
                Analyse générée à partir des tendances confirmées et des statistiques mondiales. Pour des prévisions détaillées par phase (émergence, croissance, pic), utilisez la page
                <Link href="/trends/predictions" className="mx-1 underline hover:text-foreground">
                  Prévisions des tendances
                </Link>
                .
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="max-w-7xl mx-auto px-6 text-[10px] text-[#86868B] text-center mt-8 font-medium leading-relaxed">
        Les analyses et prédictions de tendances sont basées sur des algorithmes de données et constituent un outil d'aide à la décision. <br />
        Elles ne garantissent pas les ventes futures ni le succès commercial.
      </p>
    </div>
  );
}
