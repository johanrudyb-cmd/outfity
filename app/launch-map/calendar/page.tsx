import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ContentCalendarView } from '@/components/launch-map/ContentCalendarView';
import Link from 'next/link';

export default async function LaunchMapCalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  const brand = await prisma.brand.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { launchMap: true },
  });

  if (!brand) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Aucune marque. Créez une marque depuis la vue d&apos;ensemble.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-8">
      <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-10 max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/launch-map"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors mb-3 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Retour à la vue d'ensemble
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">Calendrier de Contenu</h1>
            <p className="text-sm text-[#86868B] mt-1.5 max-w-xl">
              Planifiez vos tournages, vos sessions de post-production et rédigez vos scripts avec l'aide de l'IA pour maximiser votre portée.
            </p>
          </div>
        </div>
        <ContentCalendarView
          brandId={brand.id}
          brandName={brand.name}
          allPhasesDone={
            Boolean(brand.name && brand.name.trim().length >= 2) &&
            Boolean(brand.launchMap?.phase1) &&
            Boolean(brand.launchMap?.phase2) &&
            Boolean(brand.launchMap?.phase3) &&
            Boolean(brand.launchMap?.phase4) &&
            Boolean(brand.launchMap?.phase5) &&
            Boolean(brand.launchMap?.phase6)
          }
        />
      </div>
    </div>
  );
}
