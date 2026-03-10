import { auth } from './auth';
import { prisma, isDatabaseAvailable } from './prisma';

import { cache } from 'react';

// Utiliser React.cache pour mémoriser le résultat par requête (Request Memoization)
// Cela évite de refaire la même requête prisma si getCurrentUser est appelé 
// plusieurs fois dans différents composants du même arbre (ex: layout + page)
export const getCurrentUser = cache(async () => {
  try {
    const session = await auth();

    // 1. EMERGENCY ADMIN CHECK
    if (session?.user?.id === 'emergency-admin-id') {
      return {
        id: 'emergency-admin-id',
        email: session.user.email || 'johanrudyb@gmail.com',
        name: 'Admin (Mode Secours)',
        plan: 'enterprise',
        subscribedAt: new Date(),
        createdAt: new Date(),
      };
    }

    if (!session?.user?.id || !isDatabaseAvailable()) {
      return null;
    }

    // Récupérer les infos essentielles depuis la DB
    // On ne sélectionne que ce dont on a vraiment besoin pour la navigation/UI
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          subscribedAt: true,
          createdAt: true,
          onboardingCompleted: true,
        },
      });

      if (!user) {
        console.warn('[getCurrentUser] Session active mais utilisateur introuvable en base (supprimé?)');
        return { isGhost: true }; // Flag spécial pour forcer la déconnexion
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || session.user.name,
        plan: user.plan,
        onboardingCompleted: user.onboardingCompleted,
        subscribedAt: user.subscribedAt ?? null,
        createdAt: user.createdAt,
      };
    } catch (dbError) {
      console.error('[getCurrentUser] Database query failed (Circuit Breaker?), falling back to session data.', dbError);
      // Fallback: Si la session est valide mais qu'on ne peut pas rafraîchir les infos, on utilise
      // les infos de la session (qui sont dans le cookie).
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        plan: (session.user as any).plan || 'starter', // Fallback plan
        onboardingCompleted: (session.user as any).onboardingCompleted ?? false,
        subscribedAt: new Date(), // Simulé
        createdAt: new Date(), // Simulé
      };
    }
  } catch (error) {
    console.error('[getCurrentUser] Erreur Auth:', error);
    return null;
  }
});

/**
 * Vérifie si l'utilisateur actuel a les droits admin
 */
export async function getIsAdmin() {
  const user = await getCurrentUser();
  const adminEmails = ['contact@outfity.fr', 'johanrudyb@gmail.com', 'johanrudy.b@gmail.com'];
  return !!user?.email && (adminEmails.includes(user.email) || user.email.endsWith('@biangory.com'));
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Non authentifié');
  }
  return user;
}
