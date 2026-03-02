export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ImmersiveOnboarding } from '@/components/onboarding/ImmersiveOnboarding';

export default async function OnboardingPage() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    redirect('/auth/signin?redirect=/onboarding');
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { plan: true, onboardingCompleted: true },
  });

  // On ne redirige plus d'ici vers le dashboard pour éviter les boucles infinies 
  // si le dashboard redirige vers le onboarding parce qu'il manque la marque.
  /*
  if (user?.onboardingCompleted) {
    redirect('/dashboard');
  }
  */

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ImmersiveOnboarding initialPlan={user?.plan || 'free'} />
    </Suspense>
  );
}

