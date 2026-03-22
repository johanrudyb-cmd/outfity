import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth(async (req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost || req.headers.get('host');
  const protocol =
    req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const requestOrigin = host ? `${protocol}://${host}` : nextUrl.origin;

  // 0. Tracking Affiliation (detection du parametre ?v= ou ?ref=)
  const vTag = nextUrl.searchParams.get('v') || nextUrl.searchParams.get('ref');
  const rTag = nextUrl.searchParams.get('resource');

  const isAuthPage = nextUrl.pathname.startsWith('/auth');
  const isApiRoute = nextUrl.pathname.startsWith('/api');
  const isPublicAsset =
    nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.startsWith('/favicon');

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
  ].some((route) => nextUrl.pathname.startsWith(route));

  let response = NextResponse.next();

  // Compat: anciens liens partenaires de type /join/creator-initiative-2026
  if (nextUrl.pathname.startsWith('/join/')) {
    const legacyTarget = new URL('/', requestOrigin);
    nextUrl.searchParams.forEach((value, key) => {
      legacyTarget.searchParams.set(key, value);
    });

    const legacyResponse = NextResponse.redirect(legacyTarget);

    if (vTag) {
      legacyResponse.cookies.set('outfity_ref', vTag, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    if (rTag) {
      legacyResponse.cookies.set('outfity_resource', rTag, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    return legacyResponse;
  }

  if (isProtectedRoute && !isAuthenticated) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) callbackUrl += nextUrl.search;
    const signInUrl = new URL('/auth/signin', requestOrigin);
    signInUrl.searchParams.set('callbackUrl', callbackUrl);
    response = NextResponse.redirect(signInUrl);
  }

  if (vTag) {
    response.cookies.set('outfity_ref', vTag, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  if (rTag) {
    response.cookies.set('outfity_resource', rTag, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  if (isPublicAsset || isApiRoute) {
    return response;
  }

  if (isAuthPage) {
    return response;
  }

  return response;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
