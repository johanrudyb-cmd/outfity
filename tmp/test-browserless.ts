import 'dotenv/config';
import { getBrowser } from '../lib/api/browser';

async function test() {
    console.log('--- TEST BROWSERLESS ---');
    console.log('URL:', process.env.BROWSERLESS_URL);

    try {
        const browser = await getBrowser();
        const version = await browser.version();
        console.log('✅ Connecté ! version:', version);

        const page = await browser.newPage();
        await page.goto('https://example.com');
        const title = await page.title();
        console.log('✅ Page title:', title);

        await browser.close();
        console.log('✅ Browser fermé.');
    } catch (error) {
        console.error('❌ ECHEC TEST:', error);
    }
}

test();
