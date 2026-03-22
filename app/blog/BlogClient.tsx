'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { ChevronDown } from 'lucide-react';

type BlogClientPost = {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string | null;
    publishedAt: Date | string;
    tags: string[];
    readingTimeMinutes?: number;
};

export function BlogClient({ posts, categories }: { posts: BlogClientPost[], categories: string[] }) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filteredPosts = activeCategory
        ? posts.filter(post => post.tags?.includes(activeCategory))
        : posts;

    // We take the very first post of the current selection as the featured one
    const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
    const gridPosts = filteredPosts.slice(1);

    // estimate read time statically for the demo, normally derived from word count
    const getReadTime = (readingTimeMinutes?: number) => {
        if (!readingTimeMinutes) return "2 min de lecture";
        return `${readingTimeMinutes} min de lecture`;
    };

    const getOptimizedImageUrl = (url?: string | null) => {
        if (!url) return null;
        return `https://wsrv.nl/?url=${encodeURIComponent(url.trim())}&w=960&q=80&output=jpg`;
    };

    return (
        <main className="bg-white">
            {/* Editorial Hero & Featured Article */}
            <section className="bg-[#F5F5F7] pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden relative rounded-b-[40px] sm:rounded-b-[80px]">
                {/* Dynamic decorative blobs */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        {/* Left: Intro Text */}
                        <div className="w-full lg:w-5/12 flex flex-col items-start text-left">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 text-black border border-black/10 text-[10px] font-black uppercase tracking-widest mb-8">
                                Intelligence OUTFITY
                            </span>
                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#1D1D1F] leading-[0.9] mb-4 sm:mb-6">
                                Le radar <br />
                                <span className="text-[#86868b]/30 italic font-serif">MAGAZINE</span>
                            </h1>
                            <p className="text-base sm:text-xl text-[#6e6e73] font-medium leading-relaxed mb-6 sm:mb-8">
                                DÃ©crypte le futur de la mode. StratÃ©gies, analyses data et nouvelles tendances pour lancer la marque de demain.
                            </p>

                            {/* Scroll hint or generic call to action */}
                            <div className="hidden lg:flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-[#86868b]">
                                <ArrowRight className="w-4 h-4 animate-bounce-x" />
                                SÃ©lection Ã  la une
                            </div>
                        </div>

                        {/* Right: Featured Post */}
                        {featuredPost && (
                            <div className="w-full lg:w-7/12">
                                <Link href={`/blog/${featuredPost.slug}`} className="group relative block overflow-hidden rounded-[32px] sm:rounded-[40px] bg-black aspect-square sm:aspect-[4/3] lg:aspect-[16/10] w-full shadow-2xl shadow-black/10">
                                    {featuredPost.coverImage && (
                                        <Image
                                            src={getOptimizedImageUrl(featuredPost.coverImage)!}
                                            alt={featuredPost.title}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 58vw"
                                            className="object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-105"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                    <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
                                        <span className="px-4 py-2 bg-[#007AFF] shadow-xl shadow-[#007AFF]/20 backdrop-blur-md rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white">
                                            {featuredPost.tags && featuredPost.tags.length > 0 ? featuredPost.tags[0] : 'Ã€ LA UNE'}
                                        </span>
                                    </div>

                                    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-12">
                                        <div className="space-y-3 sm:space-y-4 max-w-[90%] sm:max-w-[85%]">
                                            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-[1.1] tracking-tight group-hover:text-[#007AFF] transition-colors drop-shadow-2xl line-clamp-3">
                                                {featuredPost.title}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-white/80 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                                                <span>{new Date(featuredPost.publishedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                                                <span className="opacity-40">â€¢</span>
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {getReadTime(featuredPost.readingTimeMinutes)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Categories / Filters Bar - Sticky */}
            {categories.length > 0 && (
                <section className="sticky top-14 sm:top-16 lg:top-20 z-40 bg-white/80 backdrop-blur-xl border-b border-[#F2F2F2] py-4 shadow-sm w-full">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">

                        {/* ðŸ“± Version Mobile - Select Natif StylisÃ© pour max de fluiditÃ© iOS/Android */}
                        <div className="block sm:hidden relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#86868b]">Filtrer</span>
                            </div>
                            <select
                                value={activeCategory || "ALL"}
                                onChange={(e) => setActiveCategory(e.target.value === "ALL" ? null : e.target.value)}
                                className="w-full appearance-none bg-[#F5F5F7] text-[#1D1D1F] rounded-full py-3.5 pl-20 pr-10 text-[12px] font-black uppercase tracking-wider outline-none border border-transparent focus:border-[#007AFF]/30 focus:ring-4 focus:ring-[#007AFF]/5 transition-all"
                            >
                                <option value="ALL">TOUT VOIR</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#1D1D1F]">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>

                        {/* ðŸ’» Version Desktop & Tablette - Pills Horizontales */}
                        <div className="hidden sm:flex items-center gap-2 lg:gap-4 overflow-x-auto no-scrollbar min-w-max pb-1 sm:pb-0">
                            <button
                                onClick={() => setActiveCategory(null)}
                                className={cn(
                                    "px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                    activeCategory === null
                                        ? "bg-black text-white shadow-lg"
                                        : "bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#6e6e73] hover:text-[#1D1D1F]"
                                )}
                            >
                                Tout voir
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        "px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                        activeCategory === cat
                                            ? "bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/25"
                                            : "bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#6e6e73] hover:text-[#1D1D1F]"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Article Grid - Bento / Apple Cards Style */}
            <section className="py-24 bg-white min-h-[50vh]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {gridPosts.map((post) => (
                                <div key={post.id}>
                                    <Link href={`/blog/${post.slug}`} className="group flex flex-col h-full bg-white border border-[#E5E5E7] rounded-[24px] sm:rounded-[32px] overflow-hidden hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500">

                                        {/* Image Cover */}
                                        <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F7]">
                                            {post.coverImage ? (
                                                <Image
                                                    src={getOptimizedImageUrl(post.coverImage)!}
                                                    alt={post.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                                            )}
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="absolute top-4 left-4 z-10">
                                                    <span className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-black shadow-sm">
                                                        {post.tags[0]}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                                        </div>

                                        {/* Content */}
                                        <div className="p-8 flex flex-col flex-1">
                                            <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#86868b] mb-4">
                                                <span>{new Date(post.publishedAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                                                <span className="w-1 h-1 rounded-full bg-[#E5E5E7]" />
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {getReadTime(post.readingTimeMinutes)}</span>
                                            </div>

                                            <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] tracking-tight leading-tight mb-4 group-hover:text-[#007AFF] transition-colors line-clamp-3">
                                                {post.title}
                                            </h3>

                                            <p className="text-[#6e6e73] text-sm font-medium leading-relaxed line-clamp-2 mt-auto">
                                                {post.excerpt}
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                    </div>

                    {gridPosts.length === 0 && (
                        <div
                            className="text-center py-20 text-[#6e6e73]"
                        >
                            <p className="text-xl font-medium">BientÃ´t de nouveaux articles dans cette catÃ©gorie.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Industry Newsletter Style CTA */}
            <section className="bg-[#1D1D1F] py-32 sm:py-40 overflow-hidden relative rounded-t-[40px] sm:rounded-t-[80px]">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#007AFF] blur-[200px] opacity-10 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <div className="max-w-3xl mx-auto space-y-12">
                        <Sparkles className="w-16 h-16 text-[#007AFF] mx-auto opacity-50" />
                        <h2 className="text-3xl sm:text-6xl font-black text-white leading-none tracking-tight">
                            REJOIGNEZ <br />
                            <span className="text-[#6e6e73]">L&apos;Ã‰LITE DU SECTEUR</span>
                        </h2>
                        <p className="text-white/60 text-lg sm:text-xl font-medium pb-2 px-4 sm:px-0">
                            OUTFITY n&apos;est pas qu&apos;un outil. C&apos;est votre veille stratÃ©gique automatisÃ©e. Chaque article ici met Ã  jour les algorithmes pour nos membres VIP.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                            <Link href="/auth/signup">
                                <Button size="lg" className="bg-white text-black hover:bg-[#007AFF] hover:text-white rounded-full font-black uppercase tracking-widest text-xs h-14 px-10 transition-all duration-300">
                                    Commencer maintenant
                                </Button>
                            </Link>
                            <Link href="/#pricing-section" className="text-white/40 font-black uppercase tracking-[0.1em] text-xs hover:text-white transition-colors">
                                Voir les plans premium
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
