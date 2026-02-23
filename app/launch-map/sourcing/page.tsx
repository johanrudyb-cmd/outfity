import Link from 'next/link';
import { SourcingHub } from '@/components/sourcing/SourcingHub';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';

export default async function LaunchMapSourcingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  let brand = await prisma.brand.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        userId: user.id,
        name: 'Ma Première Marque',
      },
    });
  }

  const quotes = await prisma.quote.findMany({
    where: { brandId: brand.id },
    include: { factory: true },
  });

  let favoriteFactoryIds: string[] = [];
  try {
    const favoriteFactories = await prisma.brandFavoriteFactory.findMany({
      where: { brandId: brand.id },
      select: { factoryId: true },
    });
    favoriteFactoryIds = favoriteFactories.map((f) => f.factoryId);
  } catch (e) {
    console.warn('Favorite factories not available:', e);
  }

  let preferences = null;
  try {
    preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });
  } catch {
    // ignore
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/launch-map"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la vue d&apos;ensemble
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Sourcing — Fournisseurs
        </h1>
        <p className="text-sm text-muted-foreground">
          Choisissez vos usines, consultez les détails et enregistrez vos favoris pour obtenir des devis.
        </p>
      </div>

      <SourcingHub
        brandId={brand.id}
        sentQuotes={quotes}
        favoriteFactoryIds={favoriteFactoryIds}
        preferences={preferences}
        userPlan={user.plan}
      />
    </div>
  );
}
