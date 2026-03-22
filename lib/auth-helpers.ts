import { cache } from 'react';
import { auth } from './auth';
import { isDatabaseAvailable, prisma } from './prisma';

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  plan: string;
  onboardingCompleted: boolean;
  subscribedAt: Date | null;
  createdAt: Date;
};

function isDynamicServerUsageError(error: unknown): boolean {
  const candidate = error as { digest?: string; message?: string; description?: string } | null;
  if (!candidate) return false;

  if (candidate.digest === 'DYNAMIC_SERVER_USAGE') {
    return true;
  }

  const text = `${candidate.message ?? ''} ${candidate.description ?? ''}`;
  return text.includes('Dynamic server usage');
}

function getSessionIdentity(session: unknown): { id: string; email: string | null; name: string | null } | null {
  const user = (session as { user?: { id?: unknown; email?: unknown; name?: unknown } } | null)?.user;
  if (!user || typeof user.id !== 'string' || user.id.length === 0) {
    return null;
  }

  return {
    id: user.id,
    email: typeof user.email === 'string' ? user.email : null,
    name: typeof user.name === 'string' ? user.name : null,
  };
}

// Request-level memoization to avoid duplicate DB hits inside the same tree
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const session = await auth();
    const identity = getSessionIdentity(session);
    if (!identity) return null;

    // Emergency recovery account
    if (identity.id === 'emergency-admin-id') {
      return {
        id: identity.id,
        email: identity.email ?? 'johanrudyb@gmail.com',
        name: 'Admin (Mode Secours)',
        plan: 'enterprise',
        onboardingCompleted: true,
        subscribedAt: new Date(),
        createdAt: new Date(),
      };
    }

    if (!isDatabaseAvailable()) {
      return {
        id: identity.id,
        email: identity.email,
        name: identity.name,
        plan: 'starter',
        onboardingCompleted: false,
        subscribedAt: null,
        createdAt: new Date(0),
      };
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: identity.id },
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
        console.warn('[getCurrentUser] Session active mais utilisateur introuvable en base');
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        onboardingCompleted: user.onboardingCompleted,
        subscribedAt: user.subscribedAt ?? null,
        createdAt: user.createdAt,
      };
    } catch (dbError) {
      console.error('[getCurrentUser] Database query failed, fallback session.', dbError);
      return {
        id: identity.id,
        email: identity.email,
        name: identity.name,
        plan: 'starter',
        onboardingCompleted: false,
        subscribedAt: null,
        createdAt: new Date(),
      };
    }
  } catch (error) {
    if (!isDynamicServerUsageError(error)) {
      console.error('[getCurrentUser] Auth error:', error);
    }
    return null;
  }
});

export async function getIsAdmin() {
  const user = await getCurrentUser();
  const adminEmails = ['contact@outfity.fr', 'johanrudyb@gmail.com', 'johanrudy.b@gmail.com'];
  return !!user?.email && (adminEmails.includes(user.email) || user.email.endsWith('@biangory.com'));
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Non authentifie');
  }
  return user;
}
