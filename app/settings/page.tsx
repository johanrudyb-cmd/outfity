import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Settings as SettingsIcon, User, Mail, Lock, Image as ImageIcon } from 'lucide-react';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/auth/signin');
  }

  // Récupérer les données utilisateur depuis la base de données (pas depuis le JWT)
  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      plan: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16 max-w-4xl mx-auto space-y-8 sm:space-y-12 lg:space-y-16">
        {/* Header */}
        <PageHeader
          title="Paramètres"
          description="Gérez votre profil et vos préférences"
          icon={SettingsIcon}
        />

        {/* Settings Form */}
        <SettingsForm user={user} />
      </div>
    </DashboardLayout>
  );
}
