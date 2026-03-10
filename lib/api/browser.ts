import puppeteer from 'puppeteer-core';

/**
 * Centraize the connection to Browserless on VPS or local fallback
 */
export async function getBrowser() {
    const browserlessUrl = process.env.BROWSERLESS_URL;

    if (browserlessUrl) {
        console.log('🌐 [Browser] Connexion à Browserless sur le VPS...');
        try {
            return await puppeteer.connect({
                browserWSEndpoint: browserlessUrl,
                defaultViewport: null
            });
        } catch (error) {
            console.error('❌ [Browser] Erreur de connexion à Browserless, fallback local...', error);
        }
    } else {
        console.warn('⚠️ [Browser] BROWSERLESS_URL est manquant ! Vous devez le configurer dans Vercel.');
    }

    // Si on est sur Vercel (Production), la version locale ne marchera jamais sans @sparticuz/chromium
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        throw new Error('❌ Scraping impossible sur Vercel : BROWSERLESS_URL est introuvable ou injoignable. Le fallback local est désactivé en production.');
    }

    console.log('🚀 [Browser] Démarrage du navigateur local (Développement uniquement)...');
    return await puppeteer.launch({
        channel: 'chrome',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--window-size=1280,800',
        ],
        defaultViewport: null,
    });
}
