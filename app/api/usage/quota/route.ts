import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { getFeatureCountThisMonth } from '@/lib/ai-usage';
import { isAdminUser } from '@/lib/ai-usage';
import type { AIFeatureKey } from '@/lib/ai-usage-config';
import {
  QUOTA_LIMITS,
  QUOTA_LABELS,
  QUOTA_CATEGORIES,
  CATEGORY_LABELS,
  QUOTA_TO_AI_FEATURE,
  TRYON_PREMIUM_PRICE,
  QUOTA_CONFIG,
  type QuotaFeatureKey,
  type QuotaCategory,
  type PackId,
} from '@/lib/quota-config';
import { getSurplusAddedToLimit, getSurplusRemaining } from '@/lib/surplus-credits';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 🔑 ADMIN BYPASS — toutes les features illimitées
    if (await isAdminUser(user.id)) {
      const features = Object.keys(QUOTA_LIMITS) as QuotaFeatureKey[];
      const usage: any = {};
      for (const key of features) {
        usage[key] = { limit: 9999, used: 0, remaining: 9999, label: QUOTA_LABELS[key], isUnlimited: true };
      }
      return NextResponse.json({
        usage,
        categories: QUOTA_CATEGORIES,
        categoryLabels: CATEGORY_LABELS,
        tryonPremiumPrice: TRYON_PREMIUM_PRICE,
        packId: 'admin',
        isAdmin: true,
      });
    }

    const packId: PackId = user.plan === 'free' ? 'free' : 'fashion_launch';
    const planLimits = QUOTA_CONFIG[packId];

    // Mapper les clés du plan vers les clés QuotaFeatureKey
    const featureLimitMap: Record<QuotaFeatureKey, number> = {
      brand_analyze: planLimits.brand_analyze_limit,
      brand_strategy: planLimits.brand_strategy_limit,
      strategy_view: planLimits.strategy_view_limit,
      ugc_scripts: planLimits.ugc_scripts_limit,
      brand_logo: planLimits.brand_logo_limit,
      trends_check_image: planLimits.trends_check_limit,
      ugc_shooting_photo: planLimits.ugc_shooting_photo_limit,
      ugc_shooting_product: planLimits.ugc_shooting_product_limit,
      launch_map_site_texts: planLimits.site_texts_limit,
      factories_match: planLimits.factories_match,
      trends_hybrid_scan: planLimits.trends_hybrid_scan_limit,
      ugc_virtual_tryon: -1,
    };

    const features = Object.keys(featureLimitMap) as QuotaFeatureKey[];
    const usage: any = {};

    for (const key of features) {
      const baseLimit = featureLimitMap[key];
      // For free plan, limits are strict. For paid plan (-1), it's unlimited.
      // Special case: some features are limited even in paid plan (like tokens), but here we deal with counts.

      // Special case: ugc_virtual_tryon (premium)
      if (key === 'ugc_virtual_tryon') {
        const surplusRemaining = await getSurplusRemaining(user.id, key);
        usage[key] = {
          limit: surplusRemaining > 0 ? surplusRemaining : 999, // placeholder for unlimited
          used: 0,
          remaining: surplusRemaining,
          label: QUOTA_LABELS[key],
          isUnlimited: surplusRemaining <= 0
        };
        continue;
      }

      let used = 0;
      if (baseLimit > 0) {
        try {
          used = await getFeatureCountThisMonth(user.id, QUOTA_TO_AI_FEATURE[key] as any);
        } catch {
          used = 0;
        }
      }

      const surplus = await getSurplusAddedToLimit(user.id, key);
      // If baseLimit is -1 (unlimited for paid plan), it remains unlimited unless specific logic overrides it.
      // But here, -1 means unlimited.
      const isUnlimitedBase = baseLimit === -1;

      const effectiveLimit = isUnlimitedBase ? 999 : baseLimit + surplus;
      const isUnlimited = isUnlimitedBase;
      const remaining = isUnlimited ? 999 : Math.max(0, effectiveLimit - used);

      usage[key] = {
        limit: isUnlimited ? 999 : effectiveLimit,
        used,
        remaining,
        label: QUOTA_LABELS[key],
        isUnlimited
      };
    }

    // End of loop processing

    return NextResponse.json({
      usage,
      categories: QUOTA_CATEGORIES,
      categoryLabels: CATEGORY_LABELS,
      tryonPremiumPrice: TRYON_PREMIUM_PRICE,
      packId: 'fashion_launch',
    });
  } catch (error) {
    console.error('[usage/quota]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
