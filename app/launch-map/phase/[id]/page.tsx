'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { PhasePageView } from '@/components/launch-map/PhasePageView';
import type { BrandIdentity, LaunchMapData } from '@/components/launch-map/LaunchMapStepper';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function LaunchMapPhasePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const phaseId = parseInt(id, 10);

  const { data, isLoading } = useSWR(
    id ? `/api/launch-map/phase/${id}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#86868B]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (data.error === 'Unauthorized') {
    router.push('/auth/signin');
    return null;
  }

  if (data.isLocked) {
    router.push('/auth/choose-plan');
    return null;
  }

  return (
    <PhasePageView
      phaseId={phaseId}
      brand={data.brand}
      launchMap={data.launchMap as LaunchMapData | null}
      brandFull={data.brandFull as BrandIdentity}
      hasIdentity={data.hasIdentity}
      designCount={data.designCount}
      quoteCount={data.quoteCount}
      ugcCount={data.ugcCount}
      suppliers={data.suppliers}
      userPlan={data.userPlan}
    />
  );
}
