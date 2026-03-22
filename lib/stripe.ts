import Stripe from 'stripe';

/** Stripe en mode démo : utilise les clés test (sk_test_..., pk_test_...) dans .env */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { typescript: true })
  : null;

/** Packs surplus avec prix en centimes (Stripe) */
export const SURPLUS_PACKS_STRIPE: Record<
  string,
  {
    name: string;
    amount: number;
    currency: 'eur';
    description: string;
  }
> = {
  'logos-plus': {
    name: 'Logos+',
    amount: 990, // 9,90€
    currency: 'eur',
    description: '10 logos supplémentaires',
  },
  'photos-plus': {
    name: 'Photos+',
    amount: 1490, // 14,90€
    currency: 'eur',
    description: 'Shooting photo & produit',
  },
  'scripts-plus': {
    name: 'Scripts+',
    amount: 490, // 4,90€
    currency: 'eur',
    description: 'Scripts UGC en masse',
  },
  'tryon-premium': {
    name: 'Virtual Try-On',
    amount: 790, // 7,90€
    currency: 'eur',
    description: "Module Premium à l'essai",
  },
};

/** Plan d'abonnement mensuel (Créateur 29€/mois à vie). Clé utilisée en BDD : user.plan (ex: 'creator') */
export const SUBSCRIPTION_PLAN_ID = 'creator';
export const SUBSCRIPTION_PRICE_EUR = 29;
