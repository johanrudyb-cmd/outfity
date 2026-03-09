/**
 * Moteur de scoring honnête pour le Radar OUTFITY.
 *
 * FORMULE FINALE :
 * Score = Google Trend (40%) + Pression marché (35%) + Signal indie (25%)
 *
 * Chaque composante est entre 0 et 100.
 * Le "Score Production" filtre ensuite par faisabilité MOQ.
 */

import type { GoogleTrendSignal } from './sources/google-trends';
import type { ZalandoTrendSignal } from './sources/zalando';
import type { IndieStoreSignal } from './sources/indie-stores';
import { getSeasonalRecommendation } from '../seasonal-recommendation';

export interface RadarTrend {
    name: string;             // Nom de la tendance / produit
    category: string;         // TSHIRT, SWEAT, JACKEX, JEAN, PANT, DRESS
    segment: 'homme' | 'femme' | 'unisex';
    score: number;            // Score global 0-100 (honnête)
    googleScore: number;      // Score Google Trends
    marketScore: number;      // Score pression marché (sellout, popularité)
    indieScore: number;       // Score signal indie labels
    growthPercent: number;    // % de croissance réel sur 90j
    trendLabel: 'EXPLOSIF' | 'ÉMERGENT' | 'STABLE' | 'DÉCLIN';
    productionViable: boolean;  // False si catégorie nécessite MOQ > 150
    productionWarning: string | null; // Message si risque MOQ
    imageUrl: string | null;
    sourceUrl: string;
    priceRange: { min: number; max: number };
    brandExamples: string[];  // Qui le fait déjà (référence)
    weatherSignal: string;
}

// MOQ moyen par catégorie (estimation fabricants asiatiques)
const MOQ_VIABILITY: Record<string, { viable: boolean; warning: string | null }> = {
    TSHIRT: { viable: true, warning: null },
    SWEAT: { viable: true, warning: null },
    JACKEX: { viable: true, warning: 'Vestes simples : OK à 50 pièces. Cuir/technique : MOQ 200+' },
    JEAN: { viable: false, warning: 'Denim nécessite généralement 200-500 pièces minimum' },
    PANT: { viable: true, warning: null },
    DRESS: { viable: true, warning: null },
    SHORTS: { viable: true, warning: null },
    UNKNOWN: { viable: true, warning: null },
};

/**
 * Détecte la catégorie d'un produit depuis son nom.
 */
export function detectCategory(name: string): string {
    const n = name.toLowerCase();
    if (/t-shirt|tshirt|tee|jersey|polo/.test(n)) return 'TSHIRT';
    if (/hoodie|sweat|pull|knit|cardigan|crewneck|fleece/.test(n)) return 'SWEAT';
    if (/jacket|veste|bomber|blazer|manteau|coat|trench|puffer|doudoune|blouson/.test(n)) return 'JACKEX';
    if (/jean|denim/.test(n)) return 'JEAN';
    if (/pant|cargo|jogger|trouser|bas|short|bermuda/.test(n)) return 'PANT';
    if (/dress|robe|skirt|jupe|robe/.test(n)) return 'DRESS';
    return 'UNKNOWN';
}

/**
 * Normalise un score entre 0 et 100.
 */
function normalize(value: number, min = 0, max = 100): number {
    return Math.min(100, Math.max(0, Math.round(((value - min) / (max - min)) * 100)));
}

/**
 * Calcule le label de tendance selon le score et la croissance.
 */
function getTrendLabel(score: number, growthPercent: number): RadarTrend['trendLabel'] {
    if (score >= 75 && growthPercent > 20) return 'EXPLOSIF';
    if (score >= 50 || growthPercent > 5) return 'ÉMERGENT';
    if (growthPercent >= -5) return 'STABLE';
    return 'DÉCLIN';
}

/**
 * Fusionne les signaux Google Trends, Zalando et Indie Stores
 * pour produire une liste de RadarTrend scorés honnêtement.
 */
export function computeRadarScores(
    googleSignals: GoogleTrendSignal[],
    zalandoSignals: ZalandoTrendSignal[],
    indieSignals: IndieStoreSignal[]
): RadarTrend[] {
    const trends: RadarTrend[] = [];

    // Anticipation saisonnière (Production prend 2-3 mois, on vérifie la saison d'arrivée)
    const seasonal = getSeasonalRecommendation();

    // --- Traitement des signaux Google Trends (source principale) ---
    for (const google of googleSignals) {
        const category = detectCategory(google.term);
        const moq = MOQ_VIABILITY[category] || MOQ_VIABILITY['UNKNOWN'];

        // Anticrash : Le produit sera-t-il adapté à la saison de livraison ?
        const isSeasonallyAligned = google.term.toLowerCase().includes(seasonal.productType) ||
            category.toLowerCase() === seasonal.productType.toUpperCase() ||
            (category === 'JACKEX' && seasonal.productType === 'veste') ||
            category === 'UNKNOWN' || category === 'JEAN' || category === 'PANT'; // Les bas sont moins saisonniers

        let finalViability = moq.viable;
        let finalWarning = moq.warning;
        let weatherSignal = '✅ Favorable pour lancement';

        if (!isSeasonallyAligned) {
            weatherSignal = `⚠️ Hors-saison (Lancement prévu en ${seasonal.label})`;
            if (category === 'JACKEX' && seasonal.productType === 'tshirt') {
                finalWarning = `CRASH ASSURÉ : Livré en été. ${moq.warning || ''}`;
                finalViability = false; // Trop risqué
            }
        }

        // Cherche des correspondances dans Zalando (même terme dans le nom)
        const zalandoMatches = zalandoSignals.filter((z) =>
            z.name.toLowerCase().includes(google.term.toLowerCase()) ||
            google.term.toLowerCase().split(' ').some((word) => word.length > 4 && z.name.toLowerCase().includes(word))
        );

        // Cherche des correspondances dans les stores indie
        const indieMatches = indieSignals.filter((i) =>
            i.name.toLowerCase().includes(google.term.toLowerCase()) ||
            google.term.toLowerCase().split(' ').some((word) => word.length > 4 && i.name.toLowerCase().includes(word))
        );

        // Calcul du score marché basé sur le sellout Zalando
        const avgSellout = zalandoMatches.length > 0
            ? zalandoMatches.reduce((s, z) => s + (z.isLowStock ? 80 : 40), 0) / zalandoMatches.length
            : 30; // Pas de signal = score moyen bas

        // Score indie basé sur le sellout des studios
        const avgIndieSellout = indieMatches.length > 0
            ? indieMatches.reduce((s, i) => s + i.selloutRisk, 0) / indieMatches.length
            : 20;

        const googleScore = normalize(google.score, 0, 100);
        const marketScore = normalize(avgSellout, 0, 100);
        const indieScore = normalize(avgIndieSellout, 0, 100);

        // FORMULE FINALE : pondération explicite
        const finalScore = Math.round(
            googleScore * 0.40 +
            marketScore * 0.35 +
            indieScore * 0.25
        );

        // Exemples des marques qui le font déjà
        const brandExamples = [
            ...new Set([
                ...zalandoMatches.slice(0, 2).map((z) => z.brand).filter(Boolean),
                ...indieMatches.slice(0, 2).map((i) => i.brand).filter(Boolean),
            ])
        ].slice(0, 4);

        // Fourchette de prix basée sur les données réelles
        const allPrices = [
            ...zalandoMatches.map((z) => z.price),
            ...indieMatches.map((i) => i.price),
        ].filter((p) => p > 0);

        const priceRange = allPrices.length > 0
            ? { min: Math.min(...allPrices), max: Math.max(...allPrices) }
            : { min: 29, max: 89 }; // Fourchette par défaut vêtements FR

        const imageUrl =
            zalandoMatches[0]?.imageUrl ||
            indieMatches[0]?.imageUrl ||
            null;

        const sourceUrl =
            zalandoMatches[0]?.sourceUrl ||
            indieMatches[0]?.sourceUrl ||
            `https://www.google.com/search?q=${encodeURIComponent(google.term + ' vêtement')}`;

        trends.push({
            name: google.term,
            category,
            segment: google.term.toLowerCase().includes('femme') || google.term.includes('robe') || google.term.includes('skirt') ? 'femme' : 'unisex',
            score: finalScore,
            googleScore,
            marketScore,
            indieScore,
            growthPercent: google.growthPercent,
            trendLabel: getTrendLabel(finalScore, google.growthPercent),
            productionViable: finalViability,
            productionWarning: finalWarning,
            imageUrl,
            sourceUrl,
            priceRange,
            brandExamples,
            weatherSignal,
        });
    }

    // Tri par score global décroissant
    return trends.sort((a, b) => b.score - a.score);
}
