'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Store, ArrowRight, LayoutDashboard, Map, Coins, CheckCircle } from 'lucide-react';
import { OnboardingFlowCreateBrand } from './OnboardingFlowCreateBrand';
import { OnboardingFlowExistingBrand } from './OnboardingFlowExistingBrand';

type Path = 'choice' | 'create' | 'existing';

interface OnboardingViewProps {
  userPlan: string;
  isAdmin?: boolean;
}

export function OnboardingView({ userPlan, isAdmin }: OnboardingViewProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement…</div>}>
      <OnboardingContent userPlan={userPlan} isAdmin={isAdmin} />
    </Suspense>
  );
}

function OnboardingContent({ userPlan, isAdmin }: OnboardingViewProps) {
  const searchParams = useSearchParams();
  const subscribed = searchParams.get('subscribed') === 'true';
  const [path, setPath] = useState<Path>('choice');
  const [existingBrands, setExistingBrands] = useState<Array<{ id: string; name: string; logo?: string | null; domain?: string | null; socialHandles?: unknown }>>([]);

  useEffect(() => {
    if (subscribed) {
      fetch('/api/brands')
        .then((r) => (r.ok ? r.json() : Promise.resolve({ brands: [] })))
        .then((data) => {
          if (data.brands && Array.isArray(data.brands) && data.brands.length > 0) {
            setExistingBrands(data.brands);
            // Auto-rediriger vers "existing" si marque existante
            setPath('existing');
          }
        })
        .catch(() => { });
    }
  }, [subscribed]);

  if (path === 'create') {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <OnboardingFlowCreateBrand onBack={() => setPath('choice')} demoMode={false} userPlan={userPlan} />
      </div>
    );
  }

  if (path === 'existing') {
    const firstBrand = existingBrands[0];
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <OnboardingFlowExistingBrand
          onBack={() => setPath('choice')}
          demoMode={false}
          prefilledData={firstBrand ? {
            name: firstBrand.name,
            logoUrl: firstBrand.logo || '',
            domain: firstBrand.domain || '',
            socialHandles: firstBrand.socialHandles as { instagram?: string; twitter?: string } | undefined,
          } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen relative">
      {isAdmin && (
        <Link
          href="/admin"
          className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Accès Admin
        </Link>
      )}
      {subscribed && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">
            Félicitations ! Votre Plan Créateur est activé. Je suis prêt à vous guider pour vos premiers pas.
          </p>
        </div>
      )}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Bienvenue dans l'aventure OUTFITY
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Je suis votre mentor. Choisissez comment vous souhaitez commencer aujourd'hui.
        </p>
      </div>

      <div className="grid gap-6 w-full sm:grid-cols-2">
        <Card
          className="border-2 cursor-pointer transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:bg-primary/5"
          onClick={() => setPath('create')}
        >
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Créer mon concept</CardTitle>
            <CardDescription>
              {(userPlan === 'free' || userPlan === 'starter')
                ? "Je n'ai pas encore de nom ou d'idée précise. Guidez-moi pour poser les bases de ma future marque."
                : "L'IA m'aide à transformer ma vision en une marque concrète avec un nom expert et un univers visuel."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2" variant="default">
              Démarrer le guide
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="border-2 cursor-pointer transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:bg-primary/5"
          onClick={() => setPath('existing')}
        >
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Importer ma marque</CardTitle>
            <CardDescription>
              J'ai déjà un nom et un logo. Je souhaite utiliser les outils OUTFITY pour mes prochaines étapes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2" variant="outline">
              Continuer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground mt-8 text-center max-w-md italic">
        "Chaque empire a commencé par un premier pas. Le vôtre commence ici."
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link href="/launch-map" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
          <Map className="w-4 h-4" />
          Launch Map
        </Link>
      </div>
    </div>
  );
}
