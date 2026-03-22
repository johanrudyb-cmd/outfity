import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';

import { unstable_cache } from 'next/cache';

const getCachedBlogPosts = unstable_cache(
    async () => {
        try {
            return await prisma.blogPost.findMany({
                where: { published: true },
                orderBy: { publishedAt: 'desc' },
                take: 3,
            });
        } catch (e) {
            console.error('Failed to fetch blog posts', e);
            return [];
        }
    },
    ['homepage-blog-posts-v2'],
    { revalidate: 3600, tags: ['blog'] } // Cache 1 heure
);

export default async function BlogGrid() {
    const posts = await getCachedBlogPosts();

    // if (posts.length === 0) return null;

    return (
        <section className="py-24 sm:py-32 bg-[#F5F5F7]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-20 gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#007AFF]/10 rounded-full mb-6">
                            <Sparkles className="w-3 h-3 text-[#007AFF]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#007AFF]">Nouveautés // INSIGHTS</span>
                        </div>
                        <h2 className="text-4xl sm:text-7xl font-black tracking-tighter text-black uppercase leading-[0.9] sm:leading-[0.85] mb-6">
                            Le Radar <br className="hidden sm:block" />
                            <span className="text-[#007AFF]">VIRGIL.</span>
                        </h2>
                        <p className="text-base sm:text-xl text-gray-500 font-medium leading-relaxed max-w-xl">
                            Analyses de marché et prospectives : l'industrie de la mode sous un angle analytique radical.
                        </p>
                    </div>
                    <Link
                        href="/blog"
                        className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#007AFF] hover:gap-4 transition-all"
                    >
                        Accéder au blog
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                                <Card className="h-full border-none shadow-apple hover:shadow-apple-lg transition-all duration-500 bg-white overflow-hidden rounded-[32px] hover:-translate-y-2">
                                    {post.coverImage && (
                                        <div className="aspect-[16/10] w-full overflow-hidden bg-muted relative">
                                            <Image
                                                src={post.coverImage}
                                                alt={post.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className="px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md text-black text-[9px] font-black uppercase tracking-widest shadow-apple-sm">
                                                    ACTU & STRATÉGIE
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <CardContent className="p-8 flex flex-col h-full">
                                        <div className="text-[10px] font-bold text-[#6e6e73]/60 uppercase tracking-widest mb-4">
                                            {new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                        </div>

                                        <h3 className="text-xl font-black text-black group-hover:text-[#007AFF] transition-colors leading-tight mb-4">
                                            {post.title}
                                        </h3>

                                        <p className="text-sm text-[#6e6e73] font-medium line-clamp-3 mb-8 flex-1 leading-relaxed text-balance">
                                            {post.excerpt}
                                        </p>

                                        <div className="flex items-center justify-between pt-6 border-t border-black/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black">Lire l'article</span>
                                            <ArrowRight className="w-5 h-5 text-[#007AFF] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="md:col-span-3 text-center py-12 bg-white/50 backdrop-blur-sm rounded-[32px] border border-black/5 mt-[-100px] z-10">
                            <p className="text-[#6e6e73] font-medium">
                                Nos premières analyses sont en cours de rédaction. Revenez très vite !
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
