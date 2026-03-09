import puppeteer from 'puppeteer';

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
    }

    console.log('🚀 [Browser] Démarrage du navigateur local...');
    return await puppeteer.launch({
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
