import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getIsAdmin } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';
import { broadcastWebPushNotification } from '@/lib/web-push';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        const isAdmin = await getIsAdmin();

        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, slug, excerpt, content, coverImage, published, tags, relatedBrands, sourceUrl } = body;

        // Check slug uniqueness
        const existing = await prisma.blogPost.findUnique({
            where: { slug },
        });

        if (existing) {
            return NextResponse.json({ message: 'Ce slug existe déjà. Veuillez le modifier.' }, { status: 400 });
        }

        const post = await prisma.blogPost.create({
            data: {
                title,
                slug,
                excerpt,
                content,
                author: user?.name || 'OUTFITY Team', // Stockage du nom en texte
                authorUser: {
                    connect: {
                        id: user!.id
                    }
                },
                published,
                publishedAt: published ? new Date() : undefined,
                tags: tags || [],
                relatedBrands: relatedBrands || [],
                coverImage,
                sourceUrl,
            },
        });

        if (published) {
            // Envoyer une notification Push à tout le monde
            await broadcastWebPushNotification({
                title: "OUTFITY Magazine 📰",
                body: `Nouvel article : ${title}`,
                url: `/blog/${slug}`
            });
        }

        // Force revalidation of public pages
        revalidatePath('/');
        revalidatePath('/blog');
        revalidatePath(`/blog/${slug}`);

        return NextResponse.json(post);
    } catch (error) {
        console.error('[BLOG_POST]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
