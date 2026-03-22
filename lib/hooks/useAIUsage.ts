'use client';

import { useEffect, useState, useCallback } from 'react';

export const USAGE_REFRESH_EVENT = 'usage:refresh';

export interface UsageData {
  tokens: number;
  tokensBudget: number | null;
  used: number;
  plan: string;
  costs: Record<string, number>;
}

export function useAIUsage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback((showLoading = false) => {
    if (showLoading) setLoading(true);
    return fetch('/api/usage/ai')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d && typeof d.tokens === 'number') {
          setData({
            tokens: d.tokens,
            tokensBudget: d.tokensBudget ?? null,
            used: d.used ?? 0,
            plan: d.plan ?? 'free',
            costs: d.costs ?? {},
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchUsage();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchUsage]);

  useEffect(() => {
    const handler = () => fetchUsage();
    window.addEventListener(USAGE_REFRESH_EVENT, handler);
    return () => window.removeEventListener(USAGE_REFRESH_EVENT, handler);
  }, [fetchUsage]);

  const costFor = (feature: string) => data?.costs?.[feature] ?? 0;
  const canAfford = (feature: string) => {
    if (!data) return true;
    if (data.tokens < 0) return true; // illimité
    return data.tokens >= costFor(feature);
  };

  const refresh = () => fetchUsage(true);

  return { data, loading, costFor, canAfford, refresh };
}
