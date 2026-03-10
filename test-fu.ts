
import { getBrowser } from './lib/api/browser';
(async () => {
    const browser = await getBrowser();
    try {
        const page = await browser.newPage();
        await page.goto('https://fashionunited.fr/', { waitUntil: 'domcontentloaded' });
        const articles = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('a')).filter(a => a.href.includes('/actualite/') && a.innerText.length > 20);
            return items.map(a => ({ title: a.innerText, link: a.href }));
        });
        console.log(articles.slice(0, 5));
    } catch(e) { console.error(e); } finally { await browser.close(); }
})();

