/**
 * Source 2 : Zalando "Trending Now" (via Browserless)
 * Zalando a une section "Articles Tendance" qui est mise à jour par leur algorithme.
 * C'est plus pertinent que ASOS "Nouveau" car c'est basé sur les ventes réelles.
 * On scrape aussi le stock pour détecter les pièces en rupture rapide.
 */

import { getBrowser } from '../../api/browser';

export interface ZalandoTrendSignal {
    name: string;
    brand: string;
    price: number;
    imageUrl: string | null;
    sourceUrl: string;
    isLowStock: boolean;    // Si peu de tailles restantes → demande forte
    segment: 'homme' | 'femme';
}

const ZALANDO_TRENDING_URLS = [
    // Pages "Articles Tendance" Zalando FR — mises à jour par l'algo Zalando
    {
        url: 'https://www.zalando.fr/vetements-homme/?sort=popularity',
        segment: 'homme' as const,
    },
    {
        url: 'https://www.zalando.fr/vetements-femme/?sort=popularity',
        segment: 'femme' as const,
    },
];

/**
 * Scrape une page Zalando et extrait les produits tendance.
 */
async function scrapePage(url: string, segment: 'homme' | 'femme'): Promise<ZalandoTrendSignal[]> {
    const browser = await getBrowser();
    try {
        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        );
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9' });

        console.log(`[Radar/Zalando] Navigation vers ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

        // Attente pour le rendu JS
        await new Promise((r) => setTimeout(r, 5000));

        // Scroll pour charger plus de produits
        await page.evaluate(async () => {
            for (let i = 0; i < 5; i++) {
                window.scrollBy(0, 800);
                await new Promise((r) => setTimeout(r, 600));
            }
        });

        const products = await page.evaluate((seg: string) => {
            const results: any[] = [];
            // Sélecteurs Zalando (peuvent changer, multiples fallbacks)
            const cards = document.querySelectorAll(
                'article[data-testid="product-card"], [class*="ProductCard"], [class*="z-productCard"]'
            );

            cards.forEach((card) => {
                try {
                    const nameEl = card.querySelector('h3, [class*="productName"], [class*="title"]');
                    const brandEl = card.querySelector('[class*="brand"], [class*="Brand"]');
                    const priceEl = card.querySelector('[class*="price"], [class*="Price"]');
                    const imgEl = card.querySelector('img');
                    const linkEl = card.querySelector('a');

                    const name = nameEl?.textContent?.trim() || '';
                    const brand = brandEl?.textContent?.trim() || '';
                    const priceText = priceEl?.textContent?.replace(/[^0-9,.]/g, '').replace(',', '.') || '0';
                    const price = parseFloat(priceText) || 0;
                    const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || null;
                    const sourceUrl = linkEl instanceof HTMLAnchorElement ? linkEl.href : '';

                    // Chercher des signaux de faible stock
                    const stockText = card.textContent?.toLowerCase() || '';
                    const isLowStock = stockText.includes('plus que') || stockText.includes('dernière') ||
                        stockText.includes('presque épuisé') || stockText.includes('only');

                    if (name && price > 0 && sourceUrl) {
                        results.push({ name, brand, price, imageUrl, sourceUrl, isLowStock, segment: seg });
                    }
                } catch { /* Skip */ }
            });

            return results;
        }, segment);

        await browser.close();
        console.log(`[Radar/Zalando] ✅ ${products.length} produits extraits (${segment})`);
        return products;
    } catch (error) {
        await browser.close().catch(() => { });
        console.error('[Radar/Zalando] ❌ Erreur:', error);
        return [];
    }
}

/**
 * Scrape les deux pages Zalando (homme + femme) en parallèle.
 */
export async function getZalandoTrendSignals(): Promise<ZalandoTrendSignal[]> {
    const results = await Promise.allSettled(
        ZALANDO_TRENDING_URLS.map((s) => scrapePage(s.url, s.segment))
    );

    const allProducts: ZalandoTrendSignal[] = [];
    results.forEach((r) => {
        if (r.status === 'fulfilled') allProducts.push(...r.value);
    });

    // Prioriser les produits en faible stock (signal de demande forte)
    return allProducts.sort((a, b) => {
        if (a.isLowStock && !b.isLowStock) return -1;
        if (!a.isLowStock && b.isLowStock) return 1;
        return 0;
    }).slice(0, 80);
}
