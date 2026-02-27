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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { unstable_cache } from 'next/cache';

const getCachedBlogPosts = unstable_cache(
  async () => {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      include: { authorUser: true },
      take: 100, // Fetch more posts to build accurate category filters
    });
  },
  ['blog-page-posts-v3'], // Nouvelle clé pour invalider l'ancien cache vide
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
