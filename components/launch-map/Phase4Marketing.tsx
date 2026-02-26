'use client';

import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { UGCLab } from '@/components/ugc/UGCLab';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Phase4MarketingProps {
  brandId: string;
  brandName: string;
  brand?: { id: string; name: string; logo?: string | null; colorPalette?: unknown; typography?: unknown; styleGuide?: unknown } | null;
  onComplete?: () => void;
  isCompleted: boolean;
  userPlan?: string;
}

interface DesignItem {
  id: string;
  type: string;
  flatSketchUrl: string | null;
}

export function Phase4Marketing({ brandId, brandName, brand, onComplete, isCompleted, userPlan = 'free' }: Phase4MarketingProps) {
  const { data: calendarData } = useSWR(
    brandId ? `/api/launch-map/calendar?brandId=${encodeURIComponent(brandId)}` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: designsData, isLoading: loading } = useSWR(
    brandId ? `/api/designs?brandId=${encodeURIComponent(brandId)}` : null,
    fetcher
  );

  const designs = useMemo(() => {
    return (designsData?.designs || []).slice(0, 10).map((d: { id: string; type: string; flatSketchUrl?: string | null }) => ({
      id: d.id,
      type: d.type,
      flatSketchUrl: d.flatSketchUrl ?? null,
    }));
  }, [designsData]);

  const scriptsCount = useMemo(() => {
    const events = Array.isArray(calendarData?.events) ? calendarData.events : [];
    return events.filter(
      (ev: { type?: string; structuredContent?: unknown }) =>
        ev.type === 'content' && ev.structuredContent && typeof ev.structuredContent === 'object'
    ).length;
  }, [calendarData]);

  useEffect(() => {
    if (scriptsCount >= 1 && !isCompleted && onComplete) {
      onComplete();
    }
  }, [scriptsCount, isCompleted, onComplete]);

  if (loading && designs.length === 0) {
    return (
      <div className="text-stone-700 font-light">Chargement...</div>
    );
  }

  return (
    <div className="space-y-6">
      {scriptsCount >= 1 && !isCompleted && (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
          ✅ Post structuré planifié dans le calendrier — cette phase est validée.
        </div>
      )}
      <UGCLab
        brandId={brandId}
        brandName={brandName}
        designs={designs}
        brand={brand || undefined}
        userPlan={userPlan}
      />
    </div>
  );
}
