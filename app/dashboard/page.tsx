import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { GatewayScreen } from '@/components/dashboard/GatewayScreen';
import { getCurrentUser, getIsAdmin } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const mode = params.mode;

  // Auth check — seul vrai blocage nécessaire côté serveur
  const user = await getCurrentUser();
  if ((user as any)?.isGhost) redirect('/api/auth/signout?callbackUrl=/auth/signin');
  if (!user) redirect('/auth/signin');

  // Vérification onboarding rapide
  const brand = await prisma.brand.findFirst({
    where: { userId: user.id },
    select: { name: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!brand) redirect('/onboarding');

  // Gateway pour admins/partners (peu fréquent)
  const [isAdmin, affiliate] = await Promise.all([
    getIsAdmin(),
    prisma.affiliate.findUnique({
      where: { userId: user.id },
      select: { status: true },
    }),
  ]);

  const isPartner = affiliate?.status === 'ACTIVE';
  if ((isPartner || isAdmin) && mode !== 'app') {
    return (
      <GatewayScreen
        userName={user.name || 'Créateur'}
        brandName={brand.name}
        isAdmin={isAdmin}
      />
    );
  }

  // Shell rendu immédiatement — DashboardClient fetch ses données en client-side
  return (
    <DashboardLayout>
      <DashboardClient />
    </DashboardLayout>
  );
}
