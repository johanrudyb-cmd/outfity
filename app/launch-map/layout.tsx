import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LaunchMapNav } from '@/components/launch-map/LaunchMapNav';
import { LaunchMapMobileNav } from '@/components/launch-map/LaunchMapMobileNav';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import React from 'react';

export default async function LaunchMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

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
          phase8: true,
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
            phase8: false,
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
            phase8: true,
          },
        },
      },
    });
  }

  if (!brand) {
    redirect('/onboarding');
  }

  const hasIdentity = Boolean(brand.name && brand.name.trim().length >= 2);
  const lm = brand.launchMap;

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
        phase8={lm?.phase8 ?? false}
      />
      <main className="flex-1 flex flex-col min-h-0 pb-20 lg:pb-0">{children}</main>
      <LaunchMapMobileNav />
    </DashboardLayout>
  );
}
