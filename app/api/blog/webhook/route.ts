import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60; // Set max duration for Vercel/Serverless to 60s
export const dynamic = 'force-dynamic';

function getJaccardSimilarity(str1: string, str2: string) {
    const tokenize = (text: string) => new Set(text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
    const set1 = tokenize(str1);
    const set2 = tokenize(str2);
    if (set1.size === 0 && set2.size === 0) return 1;
    if (set1.size === 0 || set2.size === 0) return 0;

    let intersection = 0;
    set1.forEach(word => {
        if (set2.has(word)) intersection++;
    });

    const union = set1.size + set2.size - intersection;
    return intersection / union;
}

export async function POST(req: Request) {
    console.log('[N8N_WEBHOOK] Received request...');

    try {
        // 1. Validation du secret n8n
        const authHeader = req.headers.get('x-n8n-secret');
        const secret = process.env.N8N_WEBHOOK_SECRET;

        // Log pour debug (attention à ne pas logger le secret en entier en prod si possible)
        console.log('[N8N_WEBHOOK] Auth Check:', authHeader ? 'Present' : 'Missing');

        if (!secret || authHeader !== secret) {
            console.error('[N8N_WEBHOOK] Authorization Failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parsing du body
        let body;
        try {
            body = await req.json();
            console.log('[N8N_WEBHOOK] Body Parsed successfully, Slug:', body.slug);
        } catch (e) {
            console.error('[N8N_WEBHOOK] Error parsing JSON body:', e);
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const {
            title,
            slug,
            excerpt,
            content,
            coverImage,
            published = true,
            tags = [],
            author = 'OUTFITY Intelligence',
            relatedBrands = [],
            sourceUrl
        } = body;

        // 3. Validation des champs requis
        if (!title || !slug || !content) {
            console.error('[N8N_WEBHOOK] Missing fields. Title:', !!title, 'Slug:', !!slug, 'Content:', !!content);
            return NextResponse.json({ error: 'Missing required fields: title, slug, or content' }, { status: 400 });
        }

        // 4. Opération Base de Données (Upsert)
        console.log('[N8N_WEBHOOK] Starting Database Upsert for slug:', slug);

        // Optionnel: On cherche un utilisateur par défaut pour l'auteur si besoin
        // Ici on laisse authorId à null pour l'instant car le schéma l'autorise
        // et le post appartient à "OUTFITY Intelligence" par défaut dans l'UI.

        try {
            // Anti-doublon : fenêtre élargie à 7 jours
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentPosts = await prisma.blogPost.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { id: true, title: true, slug: true, sourceUrl: true }
            });

            // 1. Si un article a le MÊME slug exact → mise à jour autorisée (upsert habituel)
            const isUpdate = recentPosts.some(p => p.slug === slug);

            if (!isUpdate) {
                // 2. Vérification par sourceUrl (fingerprint parfaite) — même URL = doublon certain
                if (sourceUrl) {
                    const sameSource = recentPosts.some(p => p.sourceUrl && p.sourceUrl === sourceUrl);
                    if (sameSource) {
                        console.log(`[N8N_WEBHOOK] 🛑 DUPLICATE DETECTED (same sourceUrl)! Skipping "${title}".`);
                        return NextResponse.json({
                            success: true,
                            message: 'Skipped. Duplicate post detected by sourceUrl.',
                            skipped: true
                        }, { status: 200 });
                    }
                }

                // 3. Vérification par similarité sémantique du titre (seuil abaissé à 55%)
                const isDuplicate = recentPosts.some(p => {
                    const similarity = getJaccardSimilarity(p.title, title);
                    console.log(`[N8N_WEBHOOK] Similarity "${title}" vs "${p.title}": ${Math.round(similarity * 100)}%`);
                    return similarity > 0.55;
                });

                if (isDuplicate) {
                    console.log(`[N8N_WEBHOOK] 🛑 DUPLICATE DETECTED (title similarity)! Skipping "${title}".`);
                    return NextResponse.json({
                        success: true,
                        message: 'Skipped. Duplicate post detected by title similarity.',
                        skipped: true
                    }, { status: 200 });
                }
            }

            const post = await prisma.blogPost.upsert({
                where: { slug },
                update: {
                    title,
                    excerpt,
                    content,
                    coverImage,
                    published,
                    publishedAt: published ? new Date() : undefined,
                    tags,
                    author, // On remplit la nouvelle colonne texte
                    relatedBrands,
                    sourceUrl
                },
                create: {
                    title,
                    slug,
                    excerpt,
                    content,
                    coverImage,
                    author, // On remplit la nouvelle colonne texte
                    published,
                    publishedAt: published ? new Date() : undefined,
                    tags,
                    relatedBrands,
                    sourceUrl
                },
            });

            console.log(`[N8N_WEBHOOK] Success! Post ID: ${post.id}`);

            return NextResponse.json({
                success: true,
                postId: post.id,
                slug: post.slug,
                url: `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`
            }, { status: 200 });

        } catch (dbError) {
            console.error('[N8N_WEBHOOK] Database Error during Upsert:', dbError);
            // Retourner une erreur 500 propre
            return NextResponse.json({ error: 'Database error during save', details: String(dbError) }, { status: 500 });
        }

    } catch (error) {
        console.error('[N8N_WEBHOOK_CRITICAL_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
