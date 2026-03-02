export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LaunchMapNav } from '@/components/launch-map/LaunchMapNav';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function LaunchMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  // Récupérer toutes les phases y compris phase6
  let brand = await prisma.brand.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      launchMap: {
        select: {
          phase1: true,
          phase2: true,
          phase3: true,
          phase4: true,
          phase5: true,
          phase6: true,
          phase7: true,
        },
      },
    },
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
            phase6: false,
            phase7: false,
          },
        },
      },
      include: {
        launchMap: {
          select: {
            phase1: true,
            phase2: true,
            phase3: true,
            phase4: true,
            phase5: true,
            phase6: true,
            phase7: true,
          },
        },
      },
    });
  }

  const hasIdentity = Boolean(brand.name && brand.name.trim().length >= 2);
  const lm = brand.launchMap;

  try {
    return (
      <DashboardLayout>
        <LaunchMapNav
          brand={{ id: brand.id, name: brand.name, logo: brand.logo }}
          hasIdentity={hasIdentity}
          phase1={lm?.phase1 ?? false}
          phase2={lm?.phase2 ?? false}
          phase3={lm?.phase3 ?? false}
          phase4={lm?.phase4 ?? false}
          phase5={lm?.phase5 ?? false}
          phase6={lm?.phase6 ?? false}
          phase7={lm?.phase7 ?? false}
        />
        <main className="flex-1 flex flex-col min-h-0">{children}</main>
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Erreur dans LaunchMapLayout:', error);
    // Fallback simple en cas d'erreur
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Erreur de chargement</h1>
          <p className="text-muted-foreground mb-4">
            Une erreur s'est produite lors du chargement de la page. Veuillez rafraîchir la page.
          </p>
          <a href="/launch-map" className="text-primary hover:underline">
            Retour à la page principale
          </a>
        </div>
      </div>
    );
  }
}
