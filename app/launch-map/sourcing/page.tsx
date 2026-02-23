import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Phase3SourcingChat } from '@/components/launch-map/Phase3SourcingChat';
import type { BrandIdentity } from '@/components/launch-map/LaunchMapStepper';

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

  const brandForClient: BrandIdentity = {
    id: brand.id,
    name: brand.name,
    logo: brand.logo,
    styleGuide: brand.styleGuide as BrandIdentity['styleGuide'],
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] overflow-hidden">
      <Phase3SourcingChat
        brandId={brand.id}
        brand={brandForClient}
        userPlan={user.plan}
      />
    </div>
  );
}
