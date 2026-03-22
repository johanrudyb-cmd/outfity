import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, FileText, CheckCircle2, Clock, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { DeletePostButton } from '@/components/admin/DeletePostButton';

export const dynamic = 'force-dynamic';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    published: boolean;
    createdAt: Date;
    relatedBrands: string[];
    coverImage: string | null;
}

export const metadata = {
    title: 'Admin Blog | OUTFITY',
};

export default async function AdminBlogPage() {
    // Le layout gère déjà la protection admin, mais on peut garder un check pour getCurrentUser
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/signin');
    }

    const posts = await prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
    }).catch((e) => {
        console.error('ERREUR GESTION BLOG:', e);
        return [];
    });

    console.log(`[AdminBlog] Found ${posts.length} posts`);

    return (
        <div className="min-h-screen bg-[#F5F5F7]">
            <header className="bg-white border-b border-[#F2F2F2] sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#6e6e73] hover:text-[#007AFF] transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Retour</span>
                        </Link>
                        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
                            <Link href="/blog" target="_blank" className="shrink-0">
                                <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 text-[10px] font-black uppercase tracking-widest">
                                    <Globe className="w-3.5 h-3.5" />
                                    <span className="hidden xs:inline">Blog Public</span>
                                </Button>
                            </Link>
                            <Link href="/admin/blog/new" className="shrink-0">
                                <Button size="sm" className="h-9 px-4 gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10">
                                    <Plus className="w-3.5 h-3.5" />
                                    Post
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-20">
                <div className="mb-6 sm:mb-10">
                    <h1 className="text-3xl sm:text-4xl font-black text-[#1D1D1F] mb-2 uppercase italic tracking-tight">Gestion du <span className="text-[#007AFF]">Blog</span></h1>
                    <p className="text-[#6e6e73] text-sm sm:text-base font-medium">Créez et gérez vos articles pour le SEO et les mises à jour IA.</p>
                </div>

                <div className="grid gap-6">
                    {posts.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="py-20 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-semibold text-[#1D1D1F]">Aucun article pour le moment</h3>
                                <p className="text-[#6e6e73] mb-6">Commencez par créer votre premier article pour booster votre SEO.</p>
                                <Link href="/admin/blog/new">
                                    <Button className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Créer mon premier article
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        posts.map((post: BlogPost) => (
                            <Card key={post.id} className="hover:shadow-md transition-shadow overflow-hidden group">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row min-h-[160px]">
                                        {/* Thumbnail avec Image Preview */}
                                        <div className="w-full md:w-48 bg-gray-100 relative shrink-0 overflow-hidden">
                                            {post.coverImage ? (
                                                <Image
                                                    src={post.coverImage}
                                                    alt={post.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 192px"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#86868b] bg-gray-50 border-r">
                                                    <FileText className="w-8 h-8 opacity-20" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3">
                                                {post.published ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600 text-[10px] uppercase font-black tracking-widest">Live</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest">Brouillon</Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#86868b] bg-gray-100 px-2 py-0.5 rounded">
                                                        {new Date(post.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#007AFF] truncate max-w-[120px]">{post.slug}</span>
                                                </div>
                                                <h2 className="text-lg sm:text-xl font-black text-[#1D1D1F] uppercase italic tracking-tight mb-2 leading-tight group-hover:text-[#007AFF] transition-colors">{post.title}</h2>
                                                <p className="text-[11px] sm:text-xs text-[#6e6e73] line-clamp-2 font-medium leading-relaxed mb-4">{post.excerpt}</p>

                                                {post.relatedBrands && post.relatedBrands.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {post.relatedBrands.map((brand: string) => (
                                                            <span key={brand} className="px-2 py-0.5 rounded-full bg-black text-white text-[8px] font-black uppercase tracking-tighter">
                                                                {brand}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center justify-end gap-2 border-t border-black/5 pt-4">
                                                <DeletePostButton postId={post.id} postTitle={post.title} />
                                                <Link href={`/admin/blog/edit/${post.id}`}>
                                                    <Button variant="outline" size="sm" className="h-9 text-[9px] font-black uppercase tracking-widest border-black/5 bg-gray-50/50 hover:bg-white transition-all">Éditer</Button>
                                                </Link>
                                                <Link href={`/blog/${post.slug}`} target="_blank">
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 group-hover:bg-blue-50 group-hover:text-blue-600 rounded-full">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Info Box */}
                <Card className="mt-12 bg-[#007AFF]/5 border-[#007AFF]/20">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#007AFF]" />
                            Comment fonctionnent les mises à jour IA ?
                        </CardTitle>
                        <CardDescription>
                            Le système de mise à jour automatique des stratégies se base sur le champ <strong>"Marques liées"</strong> (relatedBrands).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-[#1D1D1F]/70 space-y-2">
                        <p>1. Lorsque vous publiez un article, indiquez les marques de référence concernées (ex: <code>nike</code>, <code>patagonia</code>).</p>
                        <p>2. Chaque nuit, notre IA scanne les articles publiés dans les 7 derniers jours.</p>
                        <p>3. Pour chaque article, elle identifie les utilisateurs dont la stratégie est calquée sur ces marques.</p>
                        <p>4. Elle génère une mise à jour subtile de leur positionnement et les notifie sur leur dashboard.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
