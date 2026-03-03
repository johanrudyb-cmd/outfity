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
    <div className="w-full bg-[#F5F5F7] min-h-screen">
      <div className="max-w-[1800px] mx-auto w-full px-4 md:px-8 lg:px-12 py-8 space-y-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/launch-map"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à la vue d&apos;ensemble
          </Link>
        </div>

        <MesTechPacksContent
          brandId={brand.id}
          brandName={brand.name}
          brand={brandForTechPack}
        />
      </div>
    </div>
  );
}

