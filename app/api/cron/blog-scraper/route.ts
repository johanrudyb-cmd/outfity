import { NextResponse } from 'next/server';
import { scrapeFashionNewsInput, processAndCreateBlogPost } from '@/lib/blog-scraper';
import { prisma } from '@/lib/prisma';

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

        const stats = { found: articles.length, created: 0, failed: 0, skipped: 0 };
        const results = [];

        // Protection anti-doublons absolue : on vérifie les URLs sources des 15 derniers jours
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 15);
        const existingPosts = await prisma.blogPost.findMany({
            where: {
                createdAt: { gte: limitDate },
                sourceUrl: { not: null }
            },
            select: { sourceUrl: true }
        });

        const existingUrls = new Set(existingPosts.map(p => p.sourceUrl));

        // On traite les articles 1 par 1 pour éviter de surcharger Browserless/GPT
        for (const article of articles) {
            if (existingUrls.has(article.link)) {
                console.log(`[API Blog Scraper] 🛑 Doublon détecté, article ignoré: ${article.title}`);
                stats.skipped++;
                continue;
            }

            const post = await processAndCreateBlogPost(article);
            if (post) {
                stats.created++;
                results.push({ title: post.title, slug: post.slug, source: post.sourceUrl, imageUrl: post.coverImage });
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
