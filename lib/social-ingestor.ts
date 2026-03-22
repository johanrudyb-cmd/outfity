import puppeteer, { type Browser } from 'puppeteer-core';

export interface SocialSignal {
    platform: 'TikTok' | 'Pinterest';
    trendName: string;
    rank?: number;
    growth?: string;
}

/**
 * Scrape les tendances publiques TikTok et Pinterest (Zéro Budget)
 */
export async function fetchSocialSignals(): Promise<SocialSignal[]> {
    const signals: SocialSignal[] = [];
    let browser: Browser | null = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // 1. TIKTOK TRENDS (Hashtags)
        try {
            await page.goto('https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            const tiktokTrends = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('span[class*="CardTitle"]'));
                return items.slice(0, 10).map(el => el.textContent?.trim() || '');
            });
            tiktokTrends.forEach((trend: string) => {
                if (trend) signals.push({ platform: 'TikTok', trendName: trend });
            });
        } catch (e) {
            console.error('[Social Ingestor] TikTok Error:', e);
        }

        // 2. PINTEREST TRENDS
        try {
            await page.goto('https://trends.pinterest.com/', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            const pinterestTrends = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('[class*="trend-item-title"]'));
                return items.slice(0, 10).map(el => el.textContent?.trim() || '');
            });
            pinterestTrends.forEach((trend: string) => {
                if (trend) signals.push({ platform: 'Pinterest', trendName: trend });
            });
        } catch (e) {
            console.error('[Social Ingestor] Pinterest Error:', e);
        }

    } catch (error) {
        console.error('[Social Ingestor] Main Error:', error);
    } finally {
        if (browser) await browser.close();
    }

    return signals;
}
