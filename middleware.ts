import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export default auth(async (req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  const isAuthPage = nextUrl.pathname.startsWith('/auth');
  const isApiRoute = nextUrl.pathname.startsWith('/api');
  const isPublicAsset = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.startsWith('/favicon');
  const isOnboardingPage = nextUrl.pathname.startsWith('/onboarding');
  const isPartnerJoin = nextUrl.pathname === '/partners/join';

  const isProtectedRoute = [
    '/dashboard',
    '/brands',
    '/trends',
    '/spy',
    '/sourcing',
    '/ugc',
    '/launch-map',
    '/design-studio',
    '/onboarding',
    '/settings',
    '/hub',
    '/academy',
    '/partners'
  ].some(route => {
    if (isPartnerJoin) return false;
    return nextUrl.pathname.startsWith(route);
  });

  // 1. Pages publiques => laisser passer
  if (isPublicAsset || isApiRoute) {
    return NextResponse.next();
  }

  // 2. Pages auth => laisser passer (pas de redirect si connecté pour éviter boucle)
  if (isAuthPage) {
    return NextResponse.next();
  }

  // 3. Route protégée + non connecté => signin
  if (isProtectedRoute && !isAuthenticated) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) callbackUrl += nextUrl.search;
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // 4. Connecté sur une route protégée (autre qu'onboarding) => vérifier onboarding
  if (isAuthenticated && isProtectedRoute && !isOnboardingPage) {
    try {
      const userId = req.auth?.user?.id;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { onboardingCompleted: true },
        });
        if (user && !user.onboardingCompleted) {
          return NextResponse.redirect(new URL('/onboarding', nextUrl));
        }
      }
    } catch {
      // En cas d'erreur DB, on laisse passer (fail-open)
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
