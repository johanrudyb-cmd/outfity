'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Loader2, RefreshCw } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import Link from 'next/link';
import { TrendsSubNav } from './TrendsSubNav';
import { SectionHeader } from '@/components/ui/section-header';
import { LoadingState } from '@/components/ui/loading-state';

interface TrendsAnalyseProps {
  userId: string;
  userPlan?: string;
}

export function TrendsAnalyse({ userId, userPlan = 'starter' }: TrendsAnalyseProps) {
  const { data, error: swrError, isLoading, mutate } = useSWR('/api/trends/analyse-ia', fetcher);

  const [gptTest, setGptTest] = useState<{ ok: boolean; message?: string } | null>(null);
  const [gptTestLoading, setGptTestLoading] = useState(false);

  const analysis = data?.analysis || null;
  const error = swrError?.message || data?.error || null;

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



  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <TrendsSubNav active="rapport" />
        <Card>
          <CardContent className="py-16">
            <LoadingState
              title="Tissage du rapport de tendances..."
              description="Analyse des coupes, matières et volumes en cours."
            />
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
              <Button onClick={() => mutate()} variant="outline" className="gap-2">
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
      <SectionHeader
        title="Synthèse des tendances"
        icon={BarChart3}
        description="Analyse contextuelle du marché à partir des données de scan mondiales."
        action={
          <>
            <Button variant="outline" size="sm" className="gap-2" onClick={testGptConnection} disabled={gptTestLoading} title="Vérifier l'analyse">
              {gptTestLoading ? 'Test…' : 'Vérifier l\'analyse'}
            </Button>
            {gptTest && (
              <span className={`text-xs px-2 py-1 rounded ${gptTest.ok ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                {gptTest.ok ? gptTest.message : gptTest.message}
              </span>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => mutate()}>
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
          </>
        }
      />

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
                <Link href="/trends/predictions" className="mx-1 underline hover:text-foreground font-medium text-primary">
                  Prévisions des tendances
                </Link>
                .
              </p>
              {(userPlan === 'starter' || userPlan === 'free') && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <span className="text-[14px]">🔒</span>
                  Les prédictions détaillées sont réservées au plan créateur.
                </div>
              )}
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
