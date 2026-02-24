import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth(async (req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  const isAuthPage = nextUrl.pathname.startsWith('/auth');
  const isApiRoute = nextUrl.pathname.startsWith('/api');
  const isPublicAsset = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.startsWith('/favicon');

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
    '/usage',
    '/hub',
    '/academy'
  ].some(route => nextUrl.pathname.startsWith(route));

  // 1. Pages publiques ou API => laisser passer
  if (isPublicAsset || isApiRoute) {
    return NextResponse.next();
  }

  // 2. Pages d'auth => laisser passer
  if (isAuthPage) {
    if (isAuthenticated && nextUrl.pathname !== '/auth/signout' && nextUrl.pathname !== '/auth/choose-plan') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  // 3. Route protégée + non connecté => signin
  if (isProtectedRoute && !isAuthenticated) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) callbackUrl += nextUrl.search;
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl)
    );
  }

  // On laisse le soin aux layouts/pages de gérer la redirection onboarding
  // pour éviter les crashs de Prisma dans le middleware (Edge Runtime).

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
