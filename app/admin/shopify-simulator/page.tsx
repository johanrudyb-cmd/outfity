import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingBag, Store, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ShopifySimulatorPage({ searchParams }: { searchParams: Promise<{ brandId?: string }> }) {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/login');

    const { brandId } = await searchParams;
    if (!brandId) redirect('/launch-map');

    const mockProducts = await prisma.mockShopifyProduct.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
    });

    const brand = await prisma.brand.findUnique({
        where: { id: brandId },
    });

    return (
        <div className="container max-w-5xl py-12 px-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/launch-map`}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shopify Simulator Console</h1>
                    <p className="text-muted-foreground">Environnement de test local pour {brand?.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Mock Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="rounded-3xl border-2 border-primary/20 bg-primary/5">
                        <CardContent className="pt-6 text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-apple p-3">
                                <Store className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-bold">Mode Simulateur</h3>
                            <p className="text-xs text-muted-foreground mt-2">
                                Les APIs Shopify sont interceptées en local. Aucun frais n&apos;est appliqué.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Products List */}
                <div className="md:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" /> Produits importés ({mockProducts.length})
                        </h2>
                    </div>

                    {mockProducts.length === 0 ? (
                        <Card className="rounded-3xl border-dashed border-2 py-12">
                            <CardContent className="text-center space-y-4">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                    <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">Aucun produit n&apos;a encore été exporté vers le simulateur.</p>
                                <Link href={`/launch-map/phase/7`}>
                                    <Button variant="outline">Aller à la phase d&apos;exportation</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {mockProducts.map((product) => (
                                <Card key={product.id} className="rounded-2xl shadow-apple-sm hover:shadow-apple transition-all overflow-hidden border-black/5">
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="relative w-full sm:w-32 h-32 bg-muted shrink-0 flex items-center justify-center overflow-hidden">
                                            {product.imageUrl ? (
                                                <Image src={product.imageUrl} alt={product.title} fill sizes="128px" className="object-cover" />
                                            ) : (
                                                <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                                            )}
                                        </div>
                                        <CardContent className="p-4 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-base">{product.title}</h4>
                                                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                        {product.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="text-sm font-bold text-primary">{product.price.toFixed(2)} €</span>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                                                        Modifier
                                                    </Button>
                                                    <Button variant="secondary" size="sm" className="h-8 text-xs gap-1">
                                                        <ExternalLink className="w-3 h-3" /> Voir JSON
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
