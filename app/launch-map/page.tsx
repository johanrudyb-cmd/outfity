export const dynamic = 'force-dynamic';
import { LaunchMapOverview } from '@/components/launch-map/LaunchMapOverview';
import type { BrandIdentity, LaunchMapData } from '@/components/launch-map/LaunchMapStepper';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getWeekEvents } from '@/lib/calendar-week-events';

export default async function LaunchMapPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  let brand = await prisma.brand.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { launchMap: true },
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        userId: user.id,
        name: 'Ma Première Marque',
        launchMap: {
          create: {
            phase1: false,
            phase2: false,
            phase3: false,
            phase4: false,
            phase5: false,
          },
        },
      },
      include: { launchMap: true },
    });
  }

  const hasIdentity = Boolean(brand.name && brand.name.trim().length >= 2);

  const [designCount, quoteCount, ugcCount, quotesWithFactory, favoriteFactories] = await Promise.all([
    prisma.design.count({ where: { brandId: brand.id, status: 'completed' } }),
    prisma.quote.count({ where: { brandId: brand.id } }),
    prisma.uGCContent.count({ where: { brandId: brand.id } }),
    prisma.quote.findMany({
      where: { brandId: brand.id },
      include: { factory: true },
    }),
    prisma.brandFavoriteFactory.findMany({
      where: { brandId: brand.id },
      include: { factory: true },
    }),
  ]);

  const suppliersMap = new Map<string, { id: string; name: string; country: string; moq?: number; leadTime?: number; quoteCount: number }>();

  // D'abord ajouter les fournisseurs qui ont reçu des devis
  for (const q of quotesWithFactory) {
    const f = q.factory;
    const existing = suppliersMap.get(f.id);
    if (existing) {
      existing.quoteCount += 1;
    } else {
      suppliersMap.set(f.id, {
        id: f.id,
        name: f.name,
        country: f.country,
        moq: f.moq,
        leadTime: f.leadTime,
        quoteCount: 1,
      });
    }
  }

  // Ensuite ajouter les favoris (s'ils ne sont pas déjà dans la map)
  for (const fav of favoriteFactories) {
    const f = fav.factory;
    const existing = suppliersMap.get(f.id);
    if (!existing) {
      // Ajouter le favori comme fournisseur avec qui on travaille
      suppliersMap.set(f.id, {
        id: f.id,
        name: f.name,
        country: f.country,
        moq: f.moq,
        leadTime: f.leadTime,
        quoteCount: 0,
      });
    }
  }

  const suppliers = Array.from(suppliersMap.values());

  const lm = brand.launchMap;
  const completedPhases = [
    hasIdentity,
    lm?.phase1,
    lm?.phase2,
    lm?.phase3,
    lm?.phase4,
    lm?.phase5,
    lm?.phase6,
  ].filter(Boolean).length;
  const progressPercentage = Math.round((completedPhases / 7) * 100);

  const launchMapForClient = lm
    ? {
      id: lm.id,
      phase1: lm.phase1,
      phase2: lm.phase2,
      phase3: lm.phase3,
      phase4: lm.phase4,
      phase5: lm.phase5,
      phase6: lm.phase6,
      phase7: lm.phase7,
      shopifyShopDomain: lm.shopifyShopDomain,
      phase1Data: lm.phase1Data,
      baseMockupByProductType: lm.baseMockupByProductType,
      phaseSummaries: lm.phaseSummaries,
      siteCreationTodo: lm.siteCreationTodo,
    }
    : null;

  const weekEvents = getWeekEvents(lm?.contentCalendar ?? null);

  return (
    <LaunchMapOverview
      brand={{ id: brand.id, name: brand.name, logo: brand.logo }}
      launchMap={launchMapForClient as LaunchMapData | null}
      brandFull={brand as unknown as BrandIdentity}
      hasIdentity={hasIdentity}
      designCount={designCount}
      quoteCount={quoteCount}
      ugcCount={ugcCount}
      progressPercentage={progressPercentage}
      suppliers={suppliers}
      weekEvents={weekEvents}
      userPlan={user.plan}
    />
  );
}

