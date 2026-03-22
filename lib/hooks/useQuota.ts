'use client';

import { useEffect, useState, useCallback } from 'react';
import { USAGE_REFRESH_EVENT } from './useAIUsage';
import type { QuotaFeatureKey } from '@/lib/quota-config';

export interface QuotaFeatureStatus {
  limit: number;
  used: number;
  remaining: number;
  isExhausted: boolean;
  isAlmostFinished: boolean;
  isUnlimited: boolean;
}

export interface QuotaData {
  usage: Record<QuotaFeatureKey, QuotaFeatureStatus & { label: string }>;
}

function buildStatus(u: { limit: number; used: number; remaining: number; isUnlimited?: boolean } | undefined): QuotaFeatureStatus | null {
  if (!u) return null;
  const isUnlimited = u.isUnlimited ?? false;
  return {
    limit: u.limit,
    used: u.used,
    remaining: u.remaining,
    isExhausted: !isUnlimited && u.remaining === 0,
    isAlmostFinished: !isUnlimited && u.remaining > 0 && u.remaining <= 2,
    isUnlimited,
  };
}

type UseQuotaReturn =
  | QuotaFeatureStatus
  | null
  | { getFeatureStatus: (f: QuotaFeatureKey) => QuotaFeatureStatus | null; canUse: (f: QuotaFeatureKey) => boolean; data: QuotaData | null; loading: boolean; refresh: () => void };

export function useQuota(feature: QuotaFeatureKey): QuotaFeatureStatus | null;
export function useQuota(): { getFeatureStatus: (f: QuotaFeatureKey) => QuotaFeatureStatus | null; canUse: (f: QuotaFeatureKey) => boolean; data: QuotaData | null; loading: boolean; refresh: () => void };
export function useQuota(feature?: QuotaFeatureKey): UseQuotaReturn {
  const [data, setData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuota = useCallback((showLoading = false) => {
    if (showLoading) setLoading(true);
    return fetch('/api/usage/quota')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.usage) setData(d);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchQuota();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchQuota]);

  useEffect(() => {
    const handler = () => fetchQuota();
    window.addEventListener(USAGE_REFRESH_EVENT, handler);
    return () => window.removeEventListener(USAGE_REFRESH_EVENT, handler);
  }, [fetchQuota]);

  const getFeatureStatus = useCallback((f: QuotaFeatureKey): QuotaFeatureStatus | null => {
    const u = data?.usage?.[f];
    return buildStatus(u);
  }, [data]);

  const canUse = useCallback((f: QuotaFeatureKey) => {
    const s = getFeatureStatus(f);
    return !s || s.isUnlimited || s.remaining > 0;
  }, [getFeatureStatus]);

  if (feature !== undefined) {
    return getFeatureStatus(feature);
  }
  return { getFeatureStatus, canUse, data, loading, refresh: () => fetchQuota(true) };
}
