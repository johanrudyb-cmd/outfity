export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MockupQuestionnaire } from '@/components/design-studio/MockupQuestionnaire';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function DesignStudioMockupPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin');

  const brand = await prisma.brand.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!brand) {
    redirect('/brands/create');
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">CrÃ©er un mockup avec le questionnaire</h1>
          <p className="text-muted-foreground mt-1">
            RÃ©pondez aux questions pour que lâ€™IA gÃ©nÃ¨re une photo produit de votre article, puis enregistrez et gÃ©nÃ©rez le tech pack.
          </p>
        </div>
        <MockupQuestionnaire brandId={brand.id} brandName={brand.name ?? undefined} />
      </div>
    </DashboardLayout>
  );
}

