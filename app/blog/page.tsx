import { prisma } from '@/lib/prisma';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import Footer from '@/components/homepage/Footer';
import { BlogClient } from './BlogClient';

export const metadata = {
  title: 'Le Radar OUTFITY | Intelligence Mode & Stratégie',
  description: 'Analyses quotidiennes des tendances mode, stratégies retail et innovations tech par l\'intelligence OUTFITY.',
  openGraph: {
    title: 'Le Radar OUTFITY | Intelligence Mode & Stratégie',
    description: 'Décryptez le futur de la mode avec nos analyses data et tendances.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'OUTFITY Blog' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Le Radar OUTFITY | Intelligence Mode & Stratégie',
    description: 'Analyses quotidiennes des tendances mode.',
    images: ['/og-image.jpg'],
  }
};

export const revalidate = 900;

import { unstable_cache } from 'next/cache';

const getCachedBlogPosts = unstable_cache(
  async () => {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        tags: true,
      },
      take: 12, // Keep initial payload lean for first paint and hydration
    });

    return posts.map((post) => ({
      ...post,
      excerpt: post.excerpt?.slice(0, 180) ?? '',
      tags: (post.tags || []).slice(0, 3),
    }));
  },
  ['blog-page-posts-v6'], // Invalidation manuelle du cache suite ? optimisation payload
  { revalidate: 3600, tags: ['blog'] }
);

export default async function BlogPage() {
  let allPosts: any[] = [];
  try {
    allPosts = await getCachedBlogPosts();
  } catch (e) {
    console.error('Failed to load blog posts, temporary display empty.', e);
  }

  // Extract all unique tags to use them as categories
  const allCategories = Array.from(new Set(allPosts.flatMap(post => post.tags || []))).filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <AnimatedHeader />
      <BlogClient posts={allPosts} categories={allCategories} />
      <Footer />
    </div>
  );
}
