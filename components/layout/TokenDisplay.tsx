'use client';

import { useEffect, useState, useCallback } from 'react';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageData {
  tokens: number;
  tokensBudget: number | null;
  generationsRemaining: number;
  generationsBudget: number | null;
  used: number;
  plan: string;
}

interface TokenDisplayProps {
  /** Variante compacte pour la sidebar (sans jauge) */
  compact?: boolean;
  /** Afficher la jauge (barre de progression) — navbar par défaut */
  showGauge?: boolean;
}

export function TokenDisplay({ compact = false, showGauge = true }: TokenDisplayProps) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(() => {
    fetch('/api/usage/ai')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d && typeof d.tokens === 'number') {
          const gen = d.generationsRemaining ?? Math.floor(d.tokens / 34);
          const budget = d.generationsBudget ?? (d.tokensBudget != null ? Math.round(d.tokensBudget / 34) : null);
          setData({ ...d, generationsRemaining: gen, generationsBudget: budget });
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    window.addEventListener(USAGE_REFRESH_EVENT, fetchUsage);
    return () => window.removeEventListener(USAGE_REFRESH_EVENT, fetchUsage);
  }, [fetchUsage]);

  if (loading) {
    return (
      <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-apple border border-black/5 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-black/5 shrink-0" />
          <div className="w-12 h-4 bg-black/5 rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const content = (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-md bg-[#007AFF]/10 flex items-center justify-center shrink-0">
        <Sparkles className="w-3 h-3 text-[#007AFF]" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-[#86868B] leading-none mb-0.5">
          IA Crédits
        </span>
        <span className="text-sm font-semibold text-[#1D1D1F] tabular-nums leading-none">
          {data.generationsRemaining < 0 || data.generationsBudget === null
            ? 'Illimité'
            : `${data.generationsRemaining} ${!compact ? `/ ${data.generationsBudget}` : ''}`}
        </span>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "bg-white/80 backdrop-blur-sm rounded-2xl shadow-apple border border-black/5 flex items-center gap-3 transition-all",
        compact ? "py-1.5 px-3" : "py-2 px-4"
      )}
      title={`${data.generationsRemaining} générations IA restantes`}
    >
      {content}
    </div>
  );
}
