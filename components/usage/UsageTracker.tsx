'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  QUOTA_LABELS,
  QUOTA_CATEGORIES,
  CATEGORY_LABELS,
  TRYON_PREMIUM_PRICE,
  type QuotaFeatureKey,
  type QuotaCategory,
} from '@/lib/quota-config';
import { USAGE_REFRESH_EVENT } from '@/lib/hooks/useAIUsage';

interface FeatureUsage {
  limit: number;
  used: number;
  remaining: number;
  label: string;
  isUnlimited?: boolean;
}

interface QuotaData {
  usage: Record<QuotaFeatureKey, FeatureUsage>;
  categories: Record<QuotaCategory, QuotaFeatureKey[]>;
  categoryLabels: Record<QuotaCategory, string>;
  tryonPremiumPrice: number;
}

function getProgressColor(remaining: number, limit: number): string {
  if (limit <= 0) return 'bg-emerald-500';
  const percent = (remaining / limit) * 100;
  if (percent > 50) return 'bg-emerald-500';
  if (percent >= 10) return 'bg-amber-500';
  return 'bg-red-500';
}

interface UsageTrackerFeatureProps {
  featureKey: QuotaFeatureKey;
  usage: FeatureUsage;
  isPremium?: boolean;
  onRecharge?: () => void;
  isFree?: boolean;
}

function UsageTrackerFeature({
  featureKey,
  usage,
  isPremium = false,
  onRecharge,
  isFree = false,
}: UsageTrackerFeatureProps) {
  const { limit, used, remaining, label, isUnlimited: isUnlimitedFlag } = usage;
  const isUnlimited = isUnlimitedFlag ?? limit >= 999;
  const percent = isUnlimited ? 100 : limit > 0 ? (remaining / limit) * 100 : 100;
  const color = getProgressColor(remaining, limit);
  // Afficher l'alerte seulement si le pourcentage est <= 20% ET qu'il reste des crédits (pas quand c'est 0)
  const isAlmostFinished = !isUnlimited && remaining > 0 && percent <= 20 && limit > 1;
  const isFinished = !isUnlimited && remaining === 0;

  // Module Premium (Try-On) : affiche crédits restants ou bouton achat
  if (isPremium) {
    // ... existing premium logic (assuming free users don't access premium module this way or it's handled separately)
    // Actually, free users MIGHT see this if they have access to try-on via free trial?
    // But request says "quand c'est finis faut passer direct a la version payante".
    // Let's assume this applies to standard quotas first.
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {remaining > 0
              ? `${remaining} essai${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`
              : `Module Premium : ${TRYON_PREMIUM_PRICE.toFixed(2)}€ / essai`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/30 transition-all duration-300"
              style={{ width: `${remaining > 0 ? (remaining / Math.max(1, limit)) * 100 : 0}%` }}
            />
          </div>
          <ButtonPremium onClick={onRecharge} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {isUnlimited ? 'Illimité' : `${remaining} / ${limit} restant${featureKey === 'agent_chat' ? 's aujourd\'hui' : 's'}`}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-300', color)}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
        {isAlmostFinished && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-amber-500/15 px-3 py-2 text-amber-800 dark:text-amber-200">
            <span className="text-xs font-medium">{isFree ? "Plus que quelques essais !" : "Stock épuisé bientôt !"}</span>
            <button
              type="button"
              onClick={onRecharge} // This will be handled by parent passing different fn for free user
              className="text-xs font-semibold underline hover:no-underline"
            >
              {isFree ? "Passer Créateur" : "Prendre une recharge"}
            </button>
          </div>
        )}
        {isFinished && (
          <button
            type="button"
            onClick={onRecharge}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:from-primary/90 hover:to-primary/70 hover:shadow-xl hover:shadow-primary/30"
          >
            <span className="drop-shadow-sm">{isFree ? "Débloquer plus de quotas" : "Recharger ce module"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function ButtonPremium({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-lg border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
    >
      Module Premium : {TRYON_PREMIUM_PRICE.toFixed(2)}€ / essai
    </button>
  );
}

interface UsageTrackerCategoryProps {
  category: QuotaCategory;
  features: QuotaFeatureKey[];
  usage: Record<QuotaFeatureKey, FeatureUsage>;
  categoryLabel: string;
  onRecharge: () => void;
  isFree?: boolean;
}

function UsageTrackerCategory({
  category,
  features,
  usage,
  categoryLabel,
  onRecharge,
  isFree = false,
}: UsageTrackerCategoryProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {categoryLabel}
      </h3>
      <div className="space-y-4">
        {features.map((key) => (
          <UsageTrackerFeature
            key={key}
            featureKey={key}
            usage={usage[key]}
            isPremium={key === 'ugc_virtual_tryon'}
            onRecharge={onRecharge}
            isFree={isFree}
          />
        ))}
      </div>
    </div>
  );
}

interface UsageTrackerProps {
  onRechargeClick?: () => void;
  isFree?: boolean;
}

export function UsageTracker({ onRechargeClick, isFree = false }: UsageTrackerProps) {
  const [data, setData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  // ... (fetch logic remains same)
  // But wait, I need to keep the fetch logic inside because I'm replacing the whole component body basically if I select large range.
  // I will just replace the component definitions and render part.

  const fetchQuota = useCallback(() => {
    fetch('/api/usage/quota')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.usage) setData(d);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    window.addEventListener(USAGE_REFRESH_EVENT, fetchQuota);
    return () => window.removeEventListener(USAGE_REFRESH_EVENT, fetchQuota);
  }, [fetchQuota]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const categories = (Object.keys(data.categories) as QuotaCategory[]).filter(
    (c) => data.categories[c]?.length > 0
  );

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <UsageTrackerCategory
          key={category}
          category={category}
          features={data.categories[category]}
          usage={data.usage}
          categoryLabel={data.categoryLabels[category] ?? category}
          onRecharge={onRechargeClick ?? (() => { })}
          isFree={isFree}
        />
      ))}
    </div>
  );
}
