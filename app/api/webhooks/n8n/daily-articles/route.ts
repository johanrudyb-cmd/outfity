import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
    try {
        // 1. Validation de la clé secrète pour s'assurer que seul n8n peut appeler cette route
        const authHeader = req.headers.get('authorization');
        const expectedSecret = `Bearer ${process.env.N8N_OUTBOUND_SECRET || 'n8n_secret_token_default'}`;

        if (authHeader !== expectedSecret) {
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
                content: true,
                coverImage: true,
                tags: true,
                publishedAt: true
            },
            orderBy: {
                publishedAt: 'desc'
            }
        });

        // 3. Renvoi propre pour n8n
        return NextResponse.json({
            success: true,
            count: recentArticles.length,
            articles: recentArticles
        }, { status: 200 });

    } catch (error) {
        console.error('[N8N_DAILY_ARTICLES_API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
