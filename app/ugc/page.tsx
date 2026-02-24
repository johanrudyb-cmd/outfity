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
      },
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
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-1">
                UGC Lab
              </h1>
              <p className="text-muted-foreground text-sm">
                Créez votre contenu marketing viral avec l'Data & Sourcing
              </p>
            </div>
          </div>
        </div>

        <UGCLab
          brandId={brand.id}
          brandName={brand.name}
          designs={designs}
          brand={brandWithIdentity || undefined}
          userPlan={user.plan}
        />
      </div>
    </DashboardLayout>
  );
}
