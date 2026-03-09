import { NextResponse } from 'next/server';
import { scrapeFashionNewsInput, processAndCreateBlogPost } from '@/lib/blog-scraper';

export const maxDuration = 300; // 5 mins Max limit for Browserless on API routes
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Sécurité Vercel Cron (si un cron est activé via apiKey)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return NextResponse.json({}, { status: 401 }); }

        console.log('[API Blog Scraper] Lancement du cronjob de scraping...');
        const articles = await scrapeFashionNewsInput();

        if (!articles.length) {
            return NextResponse.json({ message: 'Aucun nouvel article trouvé.' }, { status: 200 });
        }

        const stats = { found: articles.length, created: 0, failed: 0 };
        const results = [];

        // On traite les articles 1 par 1 pour éviter de surcharger Browserless/GPT
        for (const article of articles) {
            const post = await processAndCreateBlogPost(article);
            if (post) {
                stats.created++;
                results.push({ title: post.title, slug: post.slug, source: post.sourceUrl });
            } else {
                stats.failed++;
            }
        }

        console.log('[API Blog Scraper] Opération terminée.', stats);
        return NextResponse.json({ success: true, stats, results }, { status: 200 });

    } catch (e: any) {
        console.error('[API Blog Scraper] Critical Error:', e);
        return NextResponse.json({ error: 'Scraping failed', message: e.message }, { status: 500 });
    }
}
