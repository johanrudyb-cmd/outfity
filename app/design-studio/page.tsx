export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DesignStudioForm } from '@/components/design-studio/DesignStudioForm';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Palette, FileText, Sparkles } from 'lucide-react';
import { isFreePlan } from '@/lib/plan-utils';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function DesignStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; type?: string; cut?: string; material?: string; prompt?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  if (isFreePlan(user.plan)) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-4xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col justify-center">
          <Card className="border-2 border-primary/20 bg-primary/5 py-16">
            <CardContent className="flex flex-col items-center text-center space-y-8 max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-foreground">Design Studio</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  La crÃ©ation de <strong>Tech Packs</strong> professionnels et la gÃ©nÃ©ration de <strong>Mockups IA</strong> sont des fonctionnalitÃ©s exclusives du plan <strong>CrÃ©ateur</strong>.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border shadow-sm">
                  <FileText className="w-6 h-6 text-primary" />
                  <span className="text-sm font-semibold">Tech Packs PDF</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background border border-border shadow-sm">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <span className="text-sm font-semibold">Mockups IA</span>
                </div>
              </div>
              <div className="pt-4">
                <Link
                  href="/auth/choose-plan"
                  className="inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] bg-black text-white hover:opacity-90 active:scale-[0.98] h-14 px-10 text-lg gap-3 shadow-xl shadow-primary/20"
                >
                  ðŸš€ Passer au plan CrÃ©ateur
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const params = await searchParams;
  const showMockupForm = params.mode === 'mockup';

  // RÃ©cupÃ©rer la marque la plus rÃ©cente
  let brand = await prisma.brand.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        userId: user.id,
        name: 'Ma PremiÃ¨re Marque',
      },
    });
  }

  // RÃ©cupÃ©rer les designs existants avec leurs collections
  const designs = await prisma.design.findMany({
    where: { brandId: brand.id },
    include: {
      collection: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (showMockupForm) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="mb-4">
            <Link
              href="/design-studio"
              className="inline-flex items-center justify-center rounded-lg font-semibold h-9 px-4 text-sm hover:bg-muted hover:text-foreground transition-colors"
            >
              â† Retour au choix
            </Link>
          </div>
          <h2 className="text-lg font-medium mb-4">CrÃ©er un nouveau tech pack (mockup IA)</h2>
          <DesignStudioForm
            brandId={brand.id}
            brand={brand}
            existingDesigns={designs}
            initialData={params.type ? {
              type: params.type,
              cut: params.cut || '',
              material: params.material || '',
              customPrompt: params.prompt ? decodeURIComponent(params.prompt) : '',
            } : undefined}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto min-h-[calc(100vh-8rem)] flex flex-col justify-center">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
            <Palette className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
            Design Studio
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            CrÃ©ez vos tech packs professionnels pour vos fournisseurs. Choisissez la mÃ©thode qui vous convient.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium text-center text-muted-foreground mb-6">
            Comment voulez-vous crÃ©er votre tech pack ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200 flex flex-col min-h-[280px]">
              <CardHeader className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">CrÃ©er depuis les tendances</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SÃ©lectionnez une tendance de la semaine (Paris, Berlin, Milanâ€¦) et copiez les Ã©lÃ©ments pour votre fournisseur : rÃ©fÃ©rence, catÃ©gorie, coupe, matiÃ¨re, image.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href="/design-studio/tech-pack"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Choisir une tendance
                </Link>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200 flex flex-col min-h-[280px]">
              <CardHeader className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Questionnaire mockup â†’ photo produit</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  RÃ©pondez Ã  un maximum de questions (produit, coupe, matiÃ¨re, couleurs, dÃ©tails). L&apos;IA gÃ©nÃ¨re une photo produit de votre article, puis vous enregistrez et crÃ©ez le tech pack visuel.
                </p>
              </CardHeader>
              <CardContent className="pt-0 flex gap-2">
                <Link
                  href="/design-studio/mockup"
                  className="inline-flex items-center justify-center gap-2 flex-1 h-11 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Questionnaire mockup
                </Link>
                <Link
                  href="/design-studio?mode=mockup"
                  className="inline-flex items-center justify-center gap-2 h-11 rounded-lg font-semibold border border-border bg-background hover:bg-muted hover:border-primary/50 transition-colors px-4"
                >
                  Ancien formulaire
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Vous pourrez exporter votre tech pack en PDF et l&apos;envoyer Ã  vos fournisseurs.
        </p>
      </div>
    </DashboardLayout>
  );
}

