/**
 * Source 3 : Stores Shopify Indie FR/EU
 * Ces labels ont le nez creux. Quand Kith ou Corteiz lance quelque chose,
 * ça devient tendance grand public 3-6 mois plus tard.
 * On utilise l'API publique /products.json (aucune clé requise).
 */

import { fetchShopifyProducts } from '../../shopify-storefront-api';

export interface IndieStoreSignal {
    name: string;
    brand: string;
    price: number;
    imageUrl: string | null;
    sourceUrl: string;
    isNewDrop: boolean;     // Si le produit est apparu récemment
    selloutRisk: number;    // % de variantes sold out = demande forte
}

// Labels sélectionnés pour leur capacité à "prédire" les tendances grand public
const INDIE_STORES = [
    // Avant-gardistes US (ce qu'ils lancent, H&M le fait 6 mois après)
    { domain: 'kith.com', brand: 'Kith' },
    { domain: 'aimeleondore.com', brand: 'Aimé Leon Dore' },
    { domain: 'jjjjound.com', brand: 'Jjjjound' },

    // Européens/Français (plus pertinents pour ton marché cible)
    { domain: 'drole-de-monsieur.com', brand: 'Drôle de Monsieur' },
    { domain: 'corteiz.com', brand: 'Corteiz' },
    { domain: 'representclo.com', brand: 'Represent' },
    { domain: 'patta.nl', brand: 'Patta' },
    { domain: 'satisfyrunning.com', brand: 'Satisfy' },
];

/**
 * Filtre pour ne garder que les vêtements (pas d'accessoires ni de chaussures).
 */
function isClothing(title: string, productType: string | null): boolean {
    const text = `${title} ${productType || ''}`.toLowerCase();
    const EXCLUDE = ['shoe', 'sneaker', 'boot', 'bag', 'hat', 'cap', 'beanie',
        'watch', 'jewelry', 'sock', 'underwear', 'chaussure', 'casquette'];
    return !EXCLUDE.some((kw) => text.includes(kw));
}

/**
 * Calcule le risque de rupture de stock (proxy pour la demande).
 * Plus le % de variantes sold out est élevé, plus la demande est forte.
 */
function calcSelloutRisk(variants: Array<{ availableForSale: boolean }>): number {
    if (variants.length === 0) return 0;
    const soldOut = variants.filter((v) => !v.availableForSale).length;
    return Math.round((soldOut / variants.length) * 100);
}

/**
 * Scrape un store indie et retourne ses produits filtrés.
 */
async function scrapeStore(domain: string, brand: string): Promise<IndieStoreSignal[]> {
    try {
        const products = await fetchShopifyProducts(`https://${domain}`, 50);
        return products
            .filter((p) => isClothing(p.title, p.productType) && p.price > 0)
            .map((p) => ({
                name: p.title,
                brand,
                price: p.price,
                imageUrl: p.images[0] || null,
                sourceUrl: `https://${domain}/products/${p.id}`,
                isNewDrop: false, // TODO: comparer avec un snapshot précédent en DB
                selloutRisk: calcSelloutRisk(p.variants),
            }));
    } catch (error) {
        console.warn(`[Radar/IndieStores] Erreur pour ${domain}:`, error);
        return [];
    }
}

/**
 * Scrape tous les stores indie en parallèle.
 * Retourne les produits triés par risque de rupture de stock décroissant.
 */
export async function getIndieStoreSignals(): Promise<IndieStoreSignal[]> {
    console.log('[Radar/IndieStores] Scan de', INDIE_STORES.length, 'stores...');

    const results = await Promise.allSettled(
        INDIE_STORES.map((s) => scrapeStore(s.domain, s.brand))
    );

    const allProducts: IndieStoreSignal[] = [];
    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            console.log(`[Radar/IndieStores] ✅ ${INDIE_STORES[i].brand}: ${r.value.length} produits`);
            allProducts.push(...r.value);
        } else {
            console.warn(`[Radar/IndieStores] ⚠️ ${INDIE_STORES[i].brand}: échec`);
        }
    });

    // Trier par pression de sellout décroissante
    return allProducts.sort((a, b) => b.selloutRisk - a.selloutRisk).slice(0, 60);
}
