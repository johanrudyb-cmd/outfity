/**
 * Gestion de la consommation IA par utilisateur.
 * Pack Fashion Launch : quotas par feature (QUOTA_CONFIG).
 * Reset mensuel à la date d'abonnement (subscribedAt ou createdAt).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getBudgetForPlan, getCostForFeature, getMaxVirtualTryOnForPlan, getMaxPerMonthForFeature, getTokensForPlan, getTokensForFeature, getMaxPerDayForFeature, TOKENS_PER_EUR, type AIFeatureKey } from './ai-usage-config';
import { QUOTA_CONFIG, type QuotaFeatureKey } from './quota-config';
import { getSurplusAddedToLimit, getSurplusRemaining } from './surplus-credits';
import { isFreePlan } from './plan-utils';

/** Emails admin — accès illimité à toutes les fonctionnalités */
const ADMIN_EMAILS = ['contact@outfity.fr', 'johanrudyb@gmail.com'];

export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return !!user?.email && (ADMIN_EMAILS.includes(user.email) || user.email.endsWith('@biangory.com'));
  } catch {
    return false;
  }
}

/** Début du mois courant (UTC) — fallback si pas de subscribedAt */
function getCalendarMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Début de la période de facturation (même jour que subscribedAt/createdAt, mois courant ou précédent) */
export async function getBillingPeriodStart(userId: string): Promise<Date> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscribedAt: true, createdAt: true },
  });
  const ref = user?.subscribedAt ?? user?.createdAt;
  if (!ref) return getCalendarMonthStart();
  const now = new Date();
  const refDate = new Date(ref);
  // Même jour du mois que la référence
  const day = refDate.getUTCDate();
  let start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), Math.min(day, 28)));
  if (now < start) {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, Math.min(day, 28)));
  }
  return start;
}

/**
 * Retourne la consommation IA (en €) de l'utilisateur pour la période de facturation courante.
 */
export async function getMonthlyUsage(userId: string): Promise<number> {
  const periodStart = await getBillingPeriodStart(userId);
  const result = await prisma.aIUsage.aggregate({
    where: { userId, createdAt: { gte: periodStart } },
    _sum: { costEur: true },
  });
  return result._sum.costEur ?? 0;
}

/** Nombre d'utilisations virtual try-on ce mois */
export async function getVirtualTryOnCountThisMonth(userId: string): Promise<number> {
  return getFeatureCountThisMonth(userId, 'ugc_virtual_tryon');
}

/** Nombre d'utilisations d'une feature sur la période de facturation courante */
export async function getFeatureCountThisMonth(userId: string, feature: AIFeatureKey): Promise<number> {
  const periodStart = await getBillingPeriodStart(userId);
  return prisma.aIUsage.count({
    where: { userId, feature, createdAt: { gte: periodStart } },
  });
}

/** Nombre d'utilisations d'une feature aujourd'hui (depuis minuit UTC) */
export async function getFeatureCountToday(userId: string, feature: AIFeatureKey): Promise<number> {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return prisma.aIUsage.count({
    where: { userId, feature, createdAt: { gte: todayStart } },
  });
}

/**
 * Solde en jetons pour l'utilisateur (budget - consommé).
 * -1 = illimité.
 */
export async function getTokensRemaining(userId: string, plan: string): Promise<number> {
  const totalTokens = getTokensForPlan(plan);
  if (totalTokens < 0) return -1;
  const usedEur = await getMonthlyUsage(userId);
  const usedTokens = Math.round(usedEur * TOKENS_PER_EUR);
  return Math.max(0, totalTokens - usedTokens);
}

/**
 * Vérifie si l'utilisateur peut encore consommer la fonctionnalité IA.
 * @returns { allowed: boolean, remaining: number, message?: string }
 */
const FEATURE_LABELS: Partial<Record<AIFeatureKey, string>> = {
  ugc_virtual_tryon: 'Virtual try-on',
  brand_strategy: 'Changement de stratégie',
  launch_map_recommendations: 'Recommandations conseil',
  trends_hybrid_scan: 'Scanner visuel IA',
  assistant_chat_qa: 'Assistant IA',
};

export async function checkAIUsageLimit(
  userId: string,
  plan: string,
  feature: AIFeatureKey
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  // 🔑 ADMIN BYPASS — accès illimité sans quota
  if (await isAdminUser(userId)) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  // Déterminer le quota config basé sur le plan
  const packId = isFreePlan(plan) ? 'free' : 'creator';
  const planQuotas = QUOTA_CONFIG[packId];

  // Mapper QuotaFeatureKey (quota-config.ts) vers AIFeatureKey (ai-usage-config.ts)
  // On utilise getMaxPerMonthForFeature en priorité pour permettre la granularité par plan (ex: starter vs creator)
  const featureToQuotaLimit: Partial<Record<AIFeatureKey, number>> = {
    brand_analyze: getMaxPerMonthForFeature(plan, 'brand_analyze'),
    brand_strategy: getMaxPerMonthForFeature(plan, 'brand_strategy'),
    strategy_view: getMaxPerMonthForFeature(plan, 'strategy_view'),
    ugc_scripts: getMaxPerMonthForFeature(plan, 'ugc_scripts'),
    brand_logo: getMaxPerMonthForFeature(plan, 'brand_logo'),
    trends_check_image: getMaxPerMonthForFeature(plan, 'trends_check_image'),
    trends_hybrid_scan: getMaxPerMonthForFeature(plan, 'trends_hybrid_scan'),
    ugc_shooting_photo: getMaxPerMonthForFeature(plan, 'ugc_shooting_photo'),
    ugc_shooting_product: getMaxPerMonthForFeature(plan, 'ugc_shooting_product'),
    launch_map_site_texts: getMaxPerMonthForFeature(plan, 'launch_map_site_texts'),
    factories_match: getMaxPerMonthForFeature(plan, 'factories_match'),
  };

  // Remplissage avec fallback sur QUOTA_CONFIG si la valeur est toujours -1 (indéfini dans ai-usage-config)
  if (featureToQuotaLimit.brand_analyze === -1) featureToQuotaLimit.brand_analyze = planQuotas.brand_analyze_limit;
  if (featureToQuotaLimit.brand_strategy === -1) featureToQuotaLimit.brand_strategy = planQuotas.brand_strategy_limit;
  if (featureToQuotaLimit.strategy_view === -1) featureToQuotaLimit.strategy_view = planQuotas.strategy_view_limit;
  if (featureToQuotaLimit.ugc_scripts === -1) featureToQuotaLimit.ugc_scripts = planQuotas.ugc_scripts_limit;
  if (featureToQuotaLimit.brand_logo === -1 || featureToQuotaLimit.brand_logo === 0) featureToQuotaLimit.brand_logo = planQuotas.brand_logo_limit;
  if (featureToQuotaLimit.trends_hybrid_scan === -1 || featureToQuotaLimit.trends_hybrid_scan === 0) {
    if (!isFreePlan(plan)) featureToQuotaLimit.trends_hybrid_scan = planQuotas.trends_hybrid_scan_limit;
  }

  // Pack Fashion Launch : quotas par feature (priorité)
  if (feature in featureToQuotaLimit || feature === 'ugc_virtual_tryon') {
    const quotaLimit = featureToQuotaLimit[feature] ?? (feature === 'ugc_virtual_tryon' ? -1 : 0);

    // ugc_virtual_tryon : premium avec essais inclus dans le plan Creator
    if (feature === 'ugc_virtual_tryon') {
      const maxFreeTryOn = getMaxVirtualTryOnForPlan(plan);
      const usedThisMonth = await getVirtualTryOnCountThisMonth(userId);
      if (usedThisMonth < maxFreeTryOn) {
        return { allowed: true, remaining: maxFreeTryOn - usedThisMonth };
      }

      const surplusRemaining = await getSurplusRemaining(userId, feature);
      if (surplusRemaining > 0) {
        return { allowed: true, remaining: surplusRemaining };
      }
      return {
        allowed: false,
        remaining: 0,
        message: `Essais Virtual Try-On épuisés (${maxFreeTryOn} inclus). Achetez un crédit à l'essai (7,90€) pour continuer.`,
      };
    }

    if (quotaLimit < 0) return { allowed: true, remaining: Number.POSITIVE_INFINITY }; // Illimité
    const surplus = await getSurplusAddedToLimit(userId, feature);
    const effectiveLimit = quotaLimit + surplus;
    const used = await getFeatureCountThisMonth(userId, feature);
    const remaining = Math.max(0, effectiveLimit - used);

    if (remaining === 0) {
      return {
        allowed: false,
        remaining: 0,
        message: `Quota épuisé (${effectiveLimit} utilisations ce mois). Rechargez ce module pour continuer ou attendez le mois prochain.`,
      };
    }
    return { allowed: true, remaining };
  }

  // Limites journalières (Assistant, etc.)
  const maxPerDay = getMaxPerDayForFeature(plan, feature);
  if (maxPerDay >= 0) {
    const countToday = await getFeatureCountToday(userId, feature);
    if (countToday >= maxPerDay) {
      const label = FEATURE_LABELS[feature] ?? feature;
      return {
        allowed: false,
        remaining: 0,
        message: `Limite journalière atteinte pour ${label} (${maxPerDay}). Réessaie demain !`,
      };
    }
  }

  const budget = getBudgetForPlan(plan);
  if (budget < 0) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  const used = await getMonthlyUsage(userId);
  const cost = getCostForFeature(feature);
  const remaining = Math.max(0, budget - used);

  if (cost > remaining) {
    return {
      allowed: false,
      remaining,
      message: `Quota IA épuisé (${used.toFixed(2)}€ / ${budget}€ ce mois). Passez à un plan supérieur pour plus de crédits.`,
    };
  }

  return { allowed: true, remaining: remaining - cost };
}

/**
 * Enregistre une consommation IA après un appel réussi.
 * Ne lève pas d'erreur pour ne pas bloquer le flux principal (analyse, etc.).
 */
export async function recordAIUsage(
  userId: string,
  feature: AIFeatureKey,
  metadata?: Record<string, unknown>
): Promise<string | undefined> {
  // 🔑 NOTE: On autorise l'enregistrement pour les admins pour l'historique (ex: Scanner IVS)
  // mais on peut mettre le coût à 0 si on veut vraiment qu'ils ne "consomment" rien.
  try {
    const isAdmin = await isAdminUser(userId);

    // ugc_virtual_tryon : consommer 1 surplus (payé via pack) au lieu d'enregistrer AIUsage
    if (feature === 'ugc_virtual_tryon' && !isAdmin) {
      const { consumeSurplus } = await import('./surplus-credits');
      if (await consumeSurplus(userId, feature)) {
        return; // Crédit consommé, pas de coût additionnel
      }
    }

    const cost = isAdmin ? 0 : getCostForFeature(feature);

    const usage = await prisma.aIUsage.create({
      data: {
        userId,
        feature,
        costEur: cost,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return usage.id;
  } catch (e) {
    console.warn('[AI Usage] Échec enregistrement consommation:', e);
    return undefined;
  }
}

/**
 * Wrapper pour exécuter une opération IA avec vérification de quota.
 * Vérifie avant, enregistre après succès.
 * @throws Error si quota dépassé (message explicite pour l'utilisateur)
 */
export async function withAIUsageLimit<T>(
  userId: string,
  plan: string,
  feature: AIFeatureKey,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const { allowed, message } = await checkAIUsageLimit(userId, plan, feature);
  if (!allowed) {
    throw new Error(message ?? 'Quota IA épuisé. Passez à un plan supérieur.');
  }

  const result = await fn();
  await recordAIUsage(userId, feature, metadata);
  return result;
}
