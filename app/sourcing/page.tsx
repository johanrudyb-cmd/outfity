export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SourcingHub } from '@/components/sourcing/SourcingHub';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ShoppingBag } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function SourcingPage({
  searchParams,
}: {
  searchParams: Promise<{ trend?: string; productType?: string; material?: string; autoFilter?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  const params = await searchParams;
  let trendData = null;
  let autoFilterData = null;

  if (params.trend) {
    try {
      trendData = JSON.parse(decodeURIComponent(params.trend));
    } catch (error) {
      console.error('Erreur parsing trend data:', error);
    }
  }

  if (params.autoFilter === 'true' && (params.productType || params.material)) {
    autoFilterData = {
      productType: params.productType || null,
      material: params.material || null,
    };
  }

  // Récupérer la marque la plus récente
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

  // Récupérer les devis envoyés
  const quotes = await prisma.quote.findMany({
    where: { brandId: brand.id },
    include: { factory: true },
  });

  // Fournisseurs favoris (après prisma generate + db push)
  let favoriteFactoryIds: string[] = [];
  try {
    const favoriteFactories = await prisma.brandFavoriteFactory.findMany({
      where: { brandId: brand.id },
      select: { factoryId: true },
    });
    favoriteFactoryIds = favoriteFactories.map((f) => f.factoryId);
  } catch (e) {
    console.warn('Favorite factories not available (run: npx prisma generate && npx prisma db push):', e);
  }

  // Récupérer les préférences utilisateur
  let preferences = null;
  try {
    preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });
  } catch (error) {
    console.warn('UserPreferences not available yet:', error);
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Sourcing"
          description="Trouvez les meilleures usines pour produire vos créations"
          icon={ShoppingBag}
        />

        <SourcingHub
          brandId={brand.id}
          sentQuotes={quotes}
          favoriteFactoryIds={favoriteFactoryIds}
          preferences={preferences}
          trendEmailData={trendData}
          autoFilterData={autoFilterData}
          userPlan={user.plan}
        />
      </div>
    </DashboardLayout>
  );
}

