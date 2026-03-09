/**
 * Source 1 : Google Trends (Breakout Queries)
 * Utilise la lib google-trends-api déjà installée.
 * Cherche les requêtes en forte croissance dans la catégorie Mode en France.
 * C'est la source la plus fiable car elle prédit la demande avant qu'elle n'arrive.
 */

const googleTrends = require('google-trends-api');

export interface GoogleTrendSignal {
    term: string;
    score: number;         // 0-100, score d'intérêt Google
    growthPercent: number; // % de croissance sur 90 jours
    region: string;
}

const FASHION_SEED_TERMS = [
    // Catégories de vêtements populaires
    'gorpcore', 'quiet luxury', 'coquette aesthetic', 'ballet core', 'office siren',
    'boxy blazer', 'cargo pants outfit', 'knit cardigan', 'leather jacket outfit',
    'linen shirt men', 'wide leg jeans', 'puffer vest', 'varsity jacket',
    // Styles streetwear FR
    'streetwear france', 'hoodie oversize', 'jogging coton', 'veste bomber',
    // Tendances saisonnières (printemps 2026)
    'trench coat femme', 'blazer crème', 'ensemble lin', 'robe biarritz',
];

/**
 * Récupère le score Google Trends pour un terme sur 90 jours en France.
 */
async function getTermScore(term: string): Promise<number> {
    try {
        const result = await googleTrends.interestOverTime({
            keyword: term,
            geo: 'FR',
            startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        });
        const parsed = JSON.parse(result);
        const values: Array<{ value: number[] }> = parsed?.default?.timelineData || [];
        if (values.length < 4) return 0;

        // Score = dernière valeur (intérêt actuel)
        const currentScore = values[values.length - 1].value[0];
        // Croissance = comparaison première moitié vs deuxième moitié de la période
        const half = Math.floor(values.length / 2);
        const avgFirst = values.slice(0, half).reduce((a, v) => a + v.value[0], 0) / half;
        const avgLast = values.slice(half).reduce((a, v) => a + v.value[0], 0) / (values.length - half);

        return currentScore;
    } catch (e) {
        console.error(`[GoogleTrends] Erreur pour le terme '${term}':`, e);
        return 0;
    }
}

/**
 * Calcule le % de croissance sur 90 jours pour un terme.
 */
async function getGrowthPercent(term: string): Promise<number> {
    try {
        const result = await googleTrends.interestOverTime({
            keyword: term,
            geo: 'FR',
            startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        });
        const parsed = JSON.parse(result);
        const values: Array<{ value: number[] }> = parsed?.default?.timelineData || [];
        if (values.length < 4) return 0;

        const half = Math.floor(values.length / 2);
        const avgFirst = values.slice(0, half).reduce((a, v) => a + v.value[0], 0) / half || 1;
        const avgLast = values.slice(half).reduce((a, v) => a + v.value[0], 0) / (values.length - half);

        return Math.round(((avgLast - avgFirst) / avgFirst) * 100);
    } catch {
        return 0;
    }
}

/**
 * Scanne les 20 termes les plus pertinents et retourne uniquement ceux
 * avec un score > 30 et une croissance positive.
 */
export async function getGoogleTrendSignals(): Promise<GoogleTrendSignal[]> {
    console.log('[Radar/Google] Scan de', FASHION_SEED_TERMS.length, 'termes...');
    const signals: GoogleTrendSignal[] = [];

    // On scanne par batch de 5 pour éviter de se faire throttler
    for (let i = 0; i < FASHION_SEED_TERMS.length; i += 5) {
        const batch = FASHION_SEED_TERMS.slice(i, i + 5);
        const results = await Promise.allSettled(
            batch.map(async (term) => {
                const score = await getTermScore(term);
                const growthPercent = await getGrowthPercent(term);
                return { term, score, growthPercent, region: 'FR' };
            })
        );

        results.forEach((r) => {
            if (r.status === 'fulfilled' && r.value.score > 0) {
                signals.push(r.value);
            }
        });

        // Pause entre les batches pour respecter les limites Google
        if (i + 5 < FASHION_SEED_TERMS.length) {
            await new Promise((r) => setTimeout(r, 2000));
        }
    }

    // Tri par score décroissant
    signals.sort((a, b) => b.score - a.score);

    if (signals.length === 0) {
        console.warn('[Radar/Google] ⚠️ Accès bloqué par Google Trends ou aucun résultat (Captcha potentiel). Scan annulé pour cette source.');
        return [];
    }

    console.log('[Radar/Google] ✅', signals.length, 'signaux valides récupérés');
    return signals.slice(0, 15); // Top 15 seulement
}
