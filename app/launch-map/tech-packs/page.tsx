export const dynamic = 'force-dynamic';
import { MesTechPacksContent } from '@/components/launch-map/MesTechPacksContent';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function MesTechPacksPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  const brand = await prisma.brand.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!brand) {
    redirect('/launch-map');
  }

  const brandForTechPack = {
    id: brand.id,
    name: brand.name,
    logo: brand.logo,
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/launch-map"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour Ã  la vue d&apos;ensemble
        </Link>
      </div>

      <MesTechPacksContent
        brandId={brand.id}
        brandName={brand.name}
        brand={brandForTechPack}
      />
    </div>
  );
}

