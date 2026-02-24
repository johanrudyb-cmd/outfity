
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { ShareButton } from '@/components/blog/ShareButton';
import { prisma } from '@/lib/prisma';
import Markdown from 'react-markdown';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import { Footer } from '@/components/homepage/Footer';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BlogPostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({
        where: { slug },
        include: { authorUser: true },
    });

    if (!post) return { title: 'Article non trouvé | OUTFITY' };

    const siteUrl = 'https://outfity.fr';
    const authorName = post.author || post.authorUser?.name || 'OUTFITY Team';

    return {
        title: `${post.title} | OUTFITY Radar`,
        description: post.excerpt,
        alternates: {
            canonical: `${siteUrl}/blog/${post.slug}`,
        },
        openGraph: {
            title: post.title,
            description: post.excerpt,
            url: `${siteUrl}/blog/${post.slug}`,
            siteName: 'OUTFITY',
            images: post.coverImage ? [
                {
                    url: post.coverImage,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                }
            ] : [],
            locale: 'fr_FR',
            type: 'article',
            publishedTime: post.publishedAt.toISOString(),
            authors: [authorName],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: post.coverImage ? [post.coverImage] : [],
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({
        where: { slug },
        include: { authorUser: true },
    });

    const isProd = process.env.NODE_ENV === 'production';
    if (!post || (isProd && !post.published)) notFound();

    const suggestedPosts = await prisma.blogPost.findMany({
        where: {
            published: true,
            id: { not: post.id },
        },
        orderBy: { publishedAt: 'desc' },
        take: 3,
    });

    const authorName = post.author || post.authorUser?.name || 'OUTFITY Team';

    return (
        <div className="min-h-screen bg-[#F5F5F7]">
            <AnimatedHeader />

            <main className="pb-32">
                {/* Article Hero */}
                <section className="relative pt-12 sm:pt-24 pb-12 sm:pb-32 bg-white">
                    <div className="max-w-4xl mx-auto px-6 relative z-10">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#007AFF] mb-12 hover:gap-4 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour à l'actualité
                        </Link>

                        <div className="flex flex-wrap items-center gap-4 mb-10">
                            <span className="px-3 py-1.5 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                {post.tags[0] || 'ACTU'}
                            </span>
                            <div className="h-4 w-px bg-black/10" />
                            <div className="flex items-center gap-2 text-xs font-bold text-[#6e6e73]">
                                <Calendar className="w-4 h-4" />
                                {new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight text-black leading-[1.1] mb-8 sm:mb-12">
                            {post.title}
                        </h1>

                        <div className="flex items-center justify-between py-10 border-y border-black/5">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                                    <User className="w-7 h-7 text-[#007AFF]" />
                                </div>
                                <div>
                                    <p className="text-base font-black text-black uppercase tracking-tight">{authorName}</p>
                                    <p className="text-[10px] font-bold text-[#6e6e73] uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {Math.max(2, Math.ceil(post.content.length / 800))} min de lecture
                                    </p>
                                </div>
                            </div>
                            <ShareButton
                                title={post.title}
                                text={post.excerpt}
                                className="w-12 h-12 hover:bg-black hover:text-white"
                                iconClassName="w-5 h-5"
                            />
                        </div>
                    </div>
                </section>

                {/* Content Area */}
                <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-20 pb-20">
                    <div className="bg-white rounded-[40px] shadow-2xl border border-black/[0.02] overflow-hidden">
                        {/* Huge Cover Image */}
                        {/* Smart Cover Image */}
                        <div className="aspect-[21/10] w-full relative overflow-hidden bg-[#F5F5F7]">
                            {post.coverImage ? (
                                <>
                                    <img
                                        src={`https://wsrv.nl/?url=${encodeURIComponent(post.coverImage.trim())}&w=1200&q=80&output=jpg`}
                                        alt={post.title}
                                        className="w-full h-full object-cover relative z-10"
                                    />
                                    {/* Fallback qui apparait si l'image est cachée */}
                                    <div className="absolute inset-0 flex items-center justify-center p-12 text-center z-0">
                                        <div className="max-w-3xl">
                                            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black leading-[1.1] mb-6">
                                                {post.title}
                                            </h1>
                                            <div className="w-24 h-2 bg-[#007AFF] mx-auto rounded-full" />
                                        </div>
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-20" />
                                </>
                            ) : (
                                /* Cas où il n'y a PAS d'image du tout dans la DB */
                                <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
                                    <div className="max-w-3xl">
                                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black leading-[1.1] mb-6">
                                            {post.title}
                                        </h1>
                                        <div className="w-24 h-2 bg-[#007AFF] mx-auto rounded-full" />
                                    </div>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                                </div>
                            )}
                        </div>

                        <div className="p-8 sm:p-16 lg:px-24 lg:py-20 relative">
                            {/* Floating Sidebar Info (Desktop) */}
                            <div className="hidden lg:block absolute left-[-180px] top-20 w-[140px] space-y-8 sticky top-32">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6e6e73]/50">Rédigé par</p>
                                    <div className="flex flex-col gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                                            <User className="w-5 h-5 text-[#007AFF]" />
                                        </div>
                                        <p className="text-sm font-black text-black leading-tight uppercase">{authorName}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-8 border-t border-black/5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6e6e73]/50">Temps de lecture</p>
                                    <p className="text-sm font-bold text-black flex items-center gap-2 uppercase">
                                        <Clock className="w-3.5 h-3.5" />
                                        {Math.max(2, Math.ceil(post.content.length / 800))} min
                                    </p>
                                </div>
                                <div className="space-y-4 pt-8 border-t border-black/5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6e6e73]/50">Partage</p>
                                    <ShareButton
                                        title={post.title}
                                        text={post.excerpt}
                                        className="w-10 h-10 hover:bg-[#007AFF] hover:text-white group"
                                        iconClassName="w-4 h-4"
                                    />
                                </div>
                            </div>

                            <article className="max-w-3xl mx-auto">
                                <Markdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-black mb-10 mt-16 leading-[1.1]" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black mb-8 mt-20 leading-tight flex items-center gap-4 before:h-[2px] before:w-8 before:bg-[#007AFF]/20" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-2xl font-black tracking-tight text-black mb-6 mt-12 leading-tight" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-lg sm:text-xl text-[#1d1d1f]/80 leading-relaxed mb-10 font-medium" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="space-y-4 mb-10 list-none pl-0" {...props} />,
                                        li: ({ node, ...props }) => (
                                            <li className="flex items-start gap-4 text-lg text-[#1d1d1f] font-medium group">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] mt-2.5 shrink-0 group-hover:scale-150 transition-transform" />
                                                <span className="leading-relaxed">{props.children}</span>
                                            </li>
                                        ),
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote className="my-16 p-10 sm:p-14 bg-[#F5F5F7] rounded-[32px] border-l-[8px] border-[#007AFF] relative overflow-hidden" {...props}>
                                                <Sparkles className="absolute top-8 right-8 w-12 h-12 text-[#007AFF]/5" />
                                                <div className="text-2xl sm:text-3xl font-black italic text-[#1d1d1f] leading-snug relative z-10">
                                                    {props.children}
                                                </div>
                                            </blockquote>
                                        ),
                                        strong: ({ node, ...props }) => <strong className="font-black text-black" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-[#007AFF] font-bold underline underline-offset-4 decoration-2 hover:bg-[#007AFF]/10 transition-all rounded px-1" {...props} />,
                                    }}
                                >
                                    {post.content}
                                </Markdown>

                                {/* Bottom Info (Mobile only) */}
                                <div className="lg:hidden mt-20 pt-10 border-t border-black/5 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                                                <User className="w-6 h-6 text-[#007AFF]" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-[#6e6e73]">Rédigé par</p>
                                                <p className="text-sm font-black text-black uppercase">{authorName}</p>
                                            </div>
                                        </div>
                                        <ShareButton
                                            title={post.title}
                                            text={post.excerpt}
                                            className="w-10 h-10"
                                            iconClassName="w-4 h-4"
                                        />
                                    </div>
                                </div>

                                {/* Tags at bottom */}
                                {post.tags && post.tags.length > 0 && (
                                    <div className="mt-24 pt-10 border-t-2 border-dashed border-black/5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#6e6e73] mr-4">Mots clés :</span>
                                            {post.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-4 py-2 rounded-xl bg-[#F5F5F7] text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#007AFF] hover:text-white transition-all cursor-pointer"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Source and CTA Section */}
                                <div className="mt-20 p-8 sm:p-12 bg-black rounded-[40px] text-white overflow-hidden relative group border border-white/10 shadow-2xl">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-white/10 transition-all duration-1000" />

                                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:justify-between text-center md:text-left">
                                        <div className="flex-1">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-md">
                                                <Sparkles className="w-4 h-4 text-white" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">OUTFITY INTELLIGENCE</span>
                                            </div>
                                            <h3 className="text-2xl sm:text-4xl font-black tracking-tighter mb-4 uppercase">
                                                Dominez votre marché <br className="hidden sm:block" /> avec la Data.
                                            </h3>
                                            <p className="text-white/50 text-base font-medium max-w-lg leading-relaxed">
                                                L'IA OUTFITY analyse des millions de points de données pour vous donner une longueur d'avance sur vos concurrents.
                                            </p>
                                        </div>
                                        <Link
                                            href="/"
                                            className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#F5F5F7] hover:scale-105 active:scale-95 transition-all shadow-2xl shrink-0"
                                        >
                                            Intégrer OUTFITY
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        </div>
                    </div>
                </div>

                {/* Suggested Articles */}
                {suggestedPosts.length > 0 && (
                    <section className="py-24 sm:py-32">
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tight text-black mb-4 uppercase">
                                        Continuer <br className="sm:hidden" />
                                        <span className="text-[#6e6e73]/40">l'exploration</span>
                                    </h2>
                                    <p className="text-[#6e6e73] font-medium text-lg">D'autres analyses pour affiner votre radar.</p>
                                </div>
                                <Link
                                    href="/blog"
                                    className="group flex items-center gap-3 text-[#007AFF] font-black uppercase tracking-[0.2em] text-[10px]"
                                >
                                    Toute l'actualité
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                                {suggestedPosts.map((suggested) => (
                                    <Link key={suggested.id} href={`/blog/${suggested.slug}`} className="group">
                                        <article className="flex flex-col h-full bg-white rounded-[40px] overflow-hidden shadow-apple transition-all duration-700 hover:shadow-apple-lg hover:-translate-y-3">
                                            <div className="relative aspect-[16/10] overflow-hidden bg-[#F5F5F7]">
                                                {suggested.coverImage && (
                                                    <img
                                                        src={suggested.coverImage}
                                                        alt={suggested.title}
                                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                    />
                                                )}
                                                <div className="absolute top-6 left-6">
                                                    <span className="px-3 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md text-black text-[9px] font-black uppercase tracking-widest shadow-apple-sm">
                                                        RECOMMANDÉ
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-10">
                                                <h3 className="text-2xl font-black text-black leading-tight mb-4 group-hover:text-[#007AFF] transition-colors line-clamp-2">
                                                    {suggested.title}
                                                </h3>
                                                <p className="text-base text-[#6e6e73] font-medium leading-relaxed line-clamp-2">
                                                    {suggested.excerpt}
                                                </p>
                                            </div>
                                        </article>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )
                }
            </main >

            <Footer />
        </div >
    );
}
