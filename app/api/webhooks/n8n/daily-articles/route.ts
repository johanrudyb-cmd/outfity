import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
    try {
        // 1. Validation de la clé secrète (accepte Authorization Bearer OU x-n8n-secret)
        const authHeader = req.headers.get('authorization');
        const n8nSecretHeader = req.headers.get('x-n8n-secret');
        const secret = process.env.N8N_OUTBOUND_SECRET || 'bmad_n8n_secret_2024_ultra_secure';

        const isAuthorized =
            authHeader === `Bearer ${secret}` ||
            n8nSecretHeader === secret;

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Récupération des articles des 24 dernières heures
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const recentArticles = await prisma.blogPost.findMany({
            where: {
                published: true,
                publishedAt: {
                    gte: twentyFourHoursAgo
                }
            },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                // content: true, // Removed to avoid 504 timeout on large articles
                coverImage: true,
                tags: true,
                publishedAt: true
            },
            orderBy: {
                publishedAt: 'desc'
            }
        });

        // 3. Renvoi propre pour n8n — on expose les articles à la racine pour faciliter le Split
        return NextResponse.json({
            success: true,
            count: recentArticles.length,
            item: recentArticles
        }, { status: 200 });

    } catch (error) {
        console.error('[N8N_DAILY_ARTICLES_API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
