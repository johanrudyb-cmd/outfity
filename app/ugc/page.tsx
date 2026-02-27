import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UGCLab } from '@/components/ugc/UGCLab';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Sparkles } from 'lucide-react';

export default async function UGCPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
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

  // Récupérer les designs pour Virtual Try-On
  const designs = await prisma.design.findMany({
    where: { brandId: brand.id, status: 'completed' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Récupérer l'identité de marque complète
  const brandWithIdentity = await prisma.brand.findUnique({
    where: { id: brand.id },
    select: {
      id: true,
      name: true,
      logo: true,
      colorPalette: true,
      typography: true,
      styleGuide: true,
    },
  });

  return (
    <DashboardLayout>
      <UGCLab
        brandId={brand.id}
        brandName={brand.name}
        designs={designs}
        brand={brandWithIdentity || undefined}
        userPlan={user.plan}
      />
    </DashboardLayout>
  );
}
