/**
 * Utilitaire centralisé pour déterminer le type de plan.
 * Le plan gratuit est stocké comme 'starter' en DB, mais certains anciens
 * composants utilisaient 'free'. Ce helper unifie la vérification.
 */

const FREE_PLAN_VALUES = ['free', 'starter'];

/** Renvoie true si le plan est gratuit (starter/free) */
export function isFreePlan(plan: string | null | undefined): boolean {
    return !plan || FREE_PLAN_VALUES.includes(plan);
}

/** Renvoie true si le plan donne accès aux fonctionnalités payantes */
export function isPaidPlan(plan: string | null | undefined): boolean {
    return !isFreePlan(plan);
}
