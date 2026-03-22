import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getIsAdmin } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await getCurrentUser();
        const isAdmin = await getIsAdmin();

        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, slug, excerpt, content, coverImage, published, tags, relatedBrands, sourceUrl } = body;

        // Check slug uniqueness (if changed)
        const existing = await prisma.blogPost.findUnique({
            where: { slug },
        });

        if (existing && existing.id !== id) {
            return NextResponse.json({ message: 'Ce slug est déjà pris par un autre article.' }, { status: 400 });
        }

        const previousPost = await prisma.blogPost.findUnique({
            where: { id },
            select: { slug: true, published: true },
        });

        const post = await prisma.blogPost.update({
            where: { id },
            data: {
                title,
                slug,
                excerpt,
                content,
                coverImage,
                published,
                publishedAt: published && !previousPost?.published ? new Date() : undefined,
                tags: tags || [],
                relatedBrands: relatedBrands || [],
                sourceUrl,
            },
        });

        // Force revalidation of public pages
        revalidatePath('/');
        revalidatePath('/blog');
        if (previousPost?.slug && previousPost.slug !== post.slug) {
            revalidatePath(`/blog/${previousPost.slug}`);
        }
        revalidatePath(`/blog/${post.slug}`);

        return NextResponse.json(post);
    } catch (error) {
        console.error('[BLOG_PUT]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await getCurrentUser();
        const isAdmin = await getIsAdmin();

        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const post = await prisma.blogPost.findUnique({
            where: { id },
            select: { slug: true },
        });

        await prisma.blogPost.delete({
            where: { id },
        });

        // Force revalidation of public pages
        revalidatePath('/');
        revalidatePath('/blog');
        if (post?.slug) {
            revalidatePath(`/blog/${post.slug}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[BLOG_DELETE]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
