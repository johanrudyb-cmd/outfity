/**
 * Configuration des coûts IA par fonctionnalité (en euros).
 * Système de jetons : 1€ = 100 jetons, 5€ = 500 jetons.
 */

export const TOKENS_PER_EUR = 100;

export type AIFeatureKey =
  | 'ugc_scripts'
  | 'brand_strategy'
  | 'strategy_view'
  | 'brand_analyze'
  | 'brand_logo'
  | 'brand_parse_website'
  | 'design_generate'
  | 'design_from_questionnaire'
  | 'design_product_description'
  | 'design_tech_pack'
  | 'design_base_mockup'
  | 'design_generate_sticker'
  | 'launch_map_recommendations'
  | 'launch_map_site_texts'
  | 'launch_map_structured_post'
  | 'launch_map_posts_from_strategy'
  | 'launch_map_extract_frequency'
  | 'launch_map_apply_strategy'
  | 'launch_map_todo'
  | 'trends_generate_image'
  | 'trends_analyse'
  | 'trends_check_image'
  | 'trends_detail_view'
  | 'trends_hybrid_scan'
  | 'ugc_shooting_photo'
  | 'ugc_shooting_product'
  | 'ugc_generate_mannequin'
  | 'ugc_virtual_tryon'
  | 'factories_match'
  | 'assistant_chat_qa'
  | 'assistant_chat_analysis'
  | 'other';

/** Coût estimé en € par appel (fallback si pas de quota fixe) */
export const AI_FEATURE_COSTS: Record<AIFeatureKey, number> = {
  ugc_scripts: 0.03,
  brand_strategy: 0.06,
  strategy_view: 0.01,
  brand_analyze: 0.04,
  brand_logo: 0.10,
  brand_parse_website: 0.02,
  design_generate: 0,
  design_from_questionnaire: 0,
  design_product_description: 0,
  design_tech_pack: 0,
  design_base_mockup: 0,
  design_generate_sticker: 0,
  launch_map_recommendations: 0.04,
  launch_map_site_texts: 0.03,
  launch_map_structured_post: 0.03,
  launch_map_posts_from_strategy: 0.05,
  launch_map_extract_frequency: 0.02,
  launch_map_apply_strategy: 0.04,
  launch_map_todo: 0.02,
  trends_generate_image: 0.10,
  trends_analyse: 0.05,
  trends_check_image: 0.03,
  trends_detail_view: 0,
  trends_hybrid_scan: 0.04,
  ugc_shooting_photo: 0.12,
  ugc_shooting_product: 0.40,
  ugc_generate_mannequin: 0.12,
  ugc_virtual_tryon: 2.5,
  factories_match: 0.02,
  assistant_chat_qa: 0.01,
  assistant_chat_analysis: 0.05,
  other: 0.04,
};

/** Budget mensuel en € par plan (pas utilisé pour les quotas fixes) */
export const AI_BUDGET_BY_PLAN: Record<string, number> = {
  starter: 5,
  creator: 34,
  growth: 75,
  pro: 150,
  enterprise: -1,
};

/** Virtual try-on : max utilisations par mois par plan */
export const MAX_VIRTUAL_TRYON_BY_PLAN: Record<string, number> = {
  starter: 1,
  creator: 5,
  growth: 15,
  pro: 50,
  enterprise: -1,
};

/**
 * Limites par feature : max utilisations/mois par plan.
 * Aligné sur quota-config.ts pour cohérence.
 */
export const MAX_PER_MONTH_BY_PLAN: Record<string, Partial<Record<AIFeatureKey, number>>> = {
  starter: {
    brand_strategy: 0,
    trends_hybrid_scan: 1,
    ugc_scripts: 3,
  },
  creator: {
    brand_strategy: 10,
    trends_hybrid_scan: 10,
    ugc_scripts: 60,
    brand_logo: 5,
    trends_check_image: -1, // Illimité "Viral sur tiktok"
    ugc_shooting_photo: 10,
    ugc_shooting_product: 5,
  },
  growth: {
    brand_strategy: 15,
    trends_hybrid_scan: 30,
    ugc_scripts: -1,
    brand_logo: 10,
    ugc_shooting_photo: 25,
    ugc_shooting_product: 15,
  },
  pro: {
    brand_strategy: 50,
    trends_hybrid_scan: 100,
    ugc_scripts: -1,
    brand_logo: 25,
    ugc_shooting_photo: 50,
    ugc_shooting_product: 30,
  },
  enterprise: {},
};

/** Limites journalières (Assistant) */
export const MAX_PER_DAY_BY_PLAN: Record<string, Partial<Record<AIFeatureKey, number>>> = {
  starter: {
    assistant_chat_qa: 5,
    assistant_chat_analysis: 1,
  },
  creator: {
    assistant_chat_qa: 40, // 40 par jour demandé
    assistant_chat_analysis: 10,
  },
  growth: {
    assistant_chat_qa: 100,
    assistant_chat_analysis: 25,
  },
  pro: {
    assistant_chat_qa: -1,
    assistant_chat_analysis: -1,
  },
};

export function getBudgetForPlan(plan: string): number {
  const key = (plan || 'starter').toLowerCase();
  return AI_BUDGET_BY_PLAN[key] ?? AI_BUDGET_BY_PLAN.starter;
}

export function getCostForFeature(feature: AIFeatureKey): number {
  return AI_FEATURE_COSTS[feature] ?? AI_FEATURE_COSTS.other;
}

export function getMaxVirtualTryOnForPlan(plan: string): number {
  const key = (plan || 'starter').toLowerCase();
  return MAX_VIRTUAL_TRYON_BY_PLAN[key] ?? MAX_VIRTUAL_TRYON_BY_PLAN.starter;
}

export function getTokensForPlan(plan: string): number {
  const budget = getBudgetForPlan(plan);
  if (budget < 0) return -1;
  return Math.round(budget * TOKENS_PER_EUR);
}

export function getTokensForFeature(feature: AIFeatureKey): number {
  const costEur = getCostForFeature(feature);
  return Math.round(costEur * TOKENS_PER_EUR);
}

export function getMaxPerMonthForFeature(plan: string, feature: AIFeatureKey): number {
  const key = (plan || 'starter').toLowerCase();
  const limits = MAX_PER_MONTH_BY_PLAN[key] ?? MAX_PER_MONTH_BY_PLAN.starter ?? {};
  const val = limits[feature];
  return val ?? -1;
}

export function getMaxPerDayForFeature(plan: string, feature: AIFeatureKey): number {
  const key = (plan || 'starter').toLowerCase();
  const limits = MAX_PER_DAY_BY_PLAN[key] ?? MAX_PER_DAY_BY_PLAN.starter ?? {};
  const val = limits[feature];
  return val ?? -1;
}
