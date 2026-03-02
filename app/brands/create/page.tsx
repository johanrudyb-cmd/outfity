export const dynamic = 'force-dynamic';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { BrandIdentityWizard } from '@/components/brands/BrandIdentityWizard';

export default async function CreateBrandPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-modern">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Créez votre marque
              </h1>
              <p className="text-muted-foreground font-medium text-lg mt-1">
                Définissez l'identité de votre marque en quelques minutes
              </p>
            </div>
          </div>
        </div>

        {/* Brand Identity Wizard */}
        <BrandIdentityWizard />
      </div>
    </DashboardLayout>
  );
}

