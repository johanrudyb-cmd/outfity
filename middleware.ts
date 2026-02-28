import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth(async (req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  // 0. Tracking Affiliation (détection du paramètre ?v= ou ?ref=)
  const vTag = nextUrl.searchParams.get('v') || nextUrl.searchParams.get('ref');

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
    '/academy',
    '/welcome-creator',
  ].some(route => nextUrl.pathname.startsWith(route));

  // Préparer la réponse
  let response = NextResponse.next();

  // Redirection si route protégée et non connecté
  if (isProtectedRoute && !isAuthenticated) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) callbackUrl += nextUrl.search;
    response = NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl)
    );
  }

  // Poser le cookie d'affiliation si présent (valable 30 jours)
  if (vTag) {
    response.cookies.set('outfity_ref', vTag, {
      maxAge: 30 * 24 * 60 * 60, // 30 jours
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  // 1. Pages publiques ou API => laisser passer (avec le cookie éventuel)
  if (isPublicAsset || isApiRoute) {
    return response;
  }

  // 2. Pages d'auth => laisser passer
  if (isAuthPage) {
    return response;
  }

  return response;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
