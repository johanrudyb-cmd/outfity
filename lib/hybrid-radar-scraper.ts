
// ============================================================================
//               SCRAPER HYBRIDE V2 (SIMPLE & ROBUSTE)
// ============================================================================
// Objectif : Scraper uniquement les données critiques (Image, Nom, Prix, Lien)
// Cibles : ASOS, ZARA
// Tech : Puppeteer Stealth + Attente explicite
// ============================================================================

import { getBrowser } from './api/browser';
type Browser = any; type Page = any;
import type { HybridRadarSource } from './hybrid-radar-sources';

import { isExcludedProduct } from './trend-filters';

export interface HybridScrapedItem {
    name: string;
    price: number;
    imageUrl: string | null;
    sourceUrl: string;
    brand: string;
    marketZone: 'FR' | 'EU' | 'US' | 'ASIA';
    segment?: 'homme' | 'femme' | 'garcon' | 'fille';
    productBrand?: string | null;
    trendGrowthPercent?: number | null;
    trendLabel?: string | null;
    composition?: string | null;
    careInstructions?: string | null;
    color?: string | null;
    sizes?: string | null;
    countryOfOrigin?: string | null;
    articleNumber?: string | null;
    originalPrice?: number | null;
    markdownPercent?: number | null;
    stockOutRisk?: string | null;
}

/**
 * Lance le navigateur via l'utilitaire centralisé
 */
async function launchStealthBrowser(): Promise<Browser> {
    return await getBrowser();
}

/**
 * Scrolle la page pour charger le lazy loading
 */
async function autoScroll(page: Page, maxScrolls: number = 10) {
    console.log(`📜 [Scraper V2] Scroll de la page (${maxScrolls} steps)...`);
    await page.evaluate(async (maxSteps: number) => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            let distance = 400;
            let steps = 0;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                steps++;

                if (totalHeight >= scrollHeight || steps >= maxSteps) {
                    clearInterval(timer);
                    resolve();
                }
            }, 500); // Scroll toutes les 500ms
        });
    }, maxScrolls);
    // Attente finale pour le chargement des images
    await new Promise((r) => setTimeout(r, 2000));
}

/**
 * Fonction Principale : Scrape une source
 */
export async function scrapeHybridSource(source: HybridRadarSource): Promise<HybridScrapedItem[]> {
    console.log(`Starting scrape for ${source.id} (${source.brand})...`);
    let browser: Browser | null = null;
    const products: HybridScrapedItem[] = [];

    try {
        browser = await launchStealthBrowser();
        const page = await browser.newPage();

        // Configuration Anti-Bot basique
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigation
        const targetUrl = source.baseUrl + source.newInPath;
        console.log(`🌐 [Scraper V2] Navigation vers : ${targetUrl}`);

        await page.goto(targetUrl, {
            waitUntil: 'networkidle2', // Attendre que le réseau soit calme
            timeout: 60000,
        });

        // Gestion des Cookies (ZARA / ASOS)
        try {
            // Sélecteurs génériques pour les bannières cookies
            const cookieSelectors = [
                '#onetrust-accept-btn-handler', // OneTrust (Zara, Asos)
                'button[data-testid="cookie-banner-accept-all"]', // Asos Old
                'button.cookie-banner__accept',
                '#reject-all-cookies', // Parfois rejeter est plus simple
                '#accept-all-cookies'
            ];

            for (const sel of cookieSelectors) {
                const btn = await page.$(sel);
                if (btn) {
                    console.log(`🍪 [Scraper V2] Bannière cookies détectée (${sel}), clic...`);
                    await btn.click();
                    await new Promise((r) => setTimeout(r, 1000));
                    break; // Un seul clic suffit souvent
                }
            }
        } catch (e) {
            console.log('⚠️ [Scraper V2] Erreur mineure cookie (ignoré).');
        }

        // Scroll pour charger les produits
        await autoScroll(page, 15); // Environ 3-4 pages de produits

        // Extraction des données
        console.log(`⛏️ [Scraper V2] Extraction des données via sélecteurs...`);

        const extractedData = await page.evaluate((sourceSelectors: any, brandName: string) => {
            const items: any[] = [];

            // Détection des conteneurs produits
            // Pour ASOS : li[class*="productTile"] (Validé)
            // Pour ZARA : .product-grid-product (Validé)
            // Fallback générique : article, .product-card
            const productElements = document.querySelectorAll(sourceSelectors.products || 'article, li[data-testid="productTile"], .product-grid-product');

            console.log(`[Browser Logic] ${productElements.length} éléments trouvés.`);

            productElements.forEach((el) => {
                try {
                    // Nom
                    let name = '';
                    const nameEl = el.querySelector(sourceSelectors.name);
                    if (nameEl) name = nameEl.textContent?.trim() || '';
                    // Fallback image alt si nom vide
                    const imgEl = el.querySelector(sourceSelectors.image);
                    if (!name && imgEl) name = imgEl.getAttribute('alt')?.trim() || '';

                    // Prix
                    let price = 0;
                    const priceEl = el.querySelector(sourceSelectors.price);
                    if (priceEl) {
                        const priceText = priceEl.textContent?.trim() || '';
                        // Nettoyage prix : "19,99 €" -> 19.99
                        const cleanPrice = priceText.replace(/[^\d.,]/g, '').replace(',', '.');
                        price = parseFloat(cleanPrice);
                    }

                    // Image URL
                    let imageUrl = null;
                    if (imgEl && imgEl instanceof HTMLImageElement) {
                        // Gestion srcset (Zalando/Asos)
                        const srcset = imgEl.getAttribute('srcset');
                        if (srcset) {
                            // Prendre la plus grande image du srcset
                            const sources = srcset.split(',').map(s => s.trim().split(' '));
                            if (sources.length > 0) imageUrl = sources[sources.length - 1][0];
                        }

                        if (!imageUrl) imageUrl = imgEl.getAttribute('src');
                        if (!imageUrl) imageUrl = imgEl.getAttribute('data-src');
                    }

                    // Source URL
                    let sourceUrl = '';
                    const linkEl = el.querySelector('a');
                    if (linkEl) sourceUrl = linkEl.href;
                    // Si lien relatif, ajouter la base (géré par browser automatiquement via .href mais bon safety check)

                    // Marque Produit (Si disponible dans le dom, sinon 'brandName' par défaut)
                    // Sur ASOS, parfois la marque est dans le nom ou un attribut data
                    let productBrand = null;

                    if (name && price > 0 && imageUrl && sourceUrl) {
                        items.push({
                            name,
                            price,
                            imageUrl,
                            sourceUrl,
                            brand: brandName,
                            marketZone: 'EU', // Par défaut
                            productBrand // Sera enrichi post-traitement si possible
                        });
                    }
                } catch (err) {
                    // Élément ignoré
                }
            });

            return items;
        }, source.selectors, source.brand);

        console.log(`✅ [Scraper V2] ${extractedData.length} produits extraits.`);

        // Post-processing et mapping
        extractedData.forEach((item: any) => {
            products.push({
                ...item,
                marketZone: source.marketZone,
                segment: source.segment,
            });
        });

    } catch (error) {
        console.error(`❌ [Scraper V2] Erreur critique sur ${source.id}:`, error);
    } finally {
        if (browser) await browser.close();
    }

    return products;
}
