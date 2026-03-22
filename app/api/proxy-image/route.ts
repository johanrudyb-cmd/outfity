/**
 * Proxy pour afficher des images externes (ex. tendances Zalando/ASOS/TikTok)
 * sans blocage referrer/CORS.
 * GET /api/proxy-image?url=https://...
 */

import { NextRequest, NextResponse } from 'next/server';
import { normalizeExternalImageUrl } from '@/lib/image-proxy';

function isHttpImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function buildReferer(targetUrl: URL): string | undefined {
  const host = targetUrl.hostname.toLowerCase();

  // ASOS tolere souvent mieux sans referer
  if (host.includes('asos')) return undefined;

  // TikTok/CDN lies a TikTok peuvent bloquer sans referer plausible
  if (
    host.includes('tiktok') ||
    host.includes('tiktokcdn') ||
    host.includes('byteimg') ||
    host.includes('ibyteimg')
  ) {
    return 'https://www.tiktok.com/';
  }

  return `${targetUrl.origin}/`;
}

async function toImageResponse(res: Response): Promise<NextResponse> {
  const contentType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=21600, stale-while-revalidate=43200',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');
  const normalized = normalizeExternalImageUrl(rawUrl);

  if (!normalized || !isHttpImageUrl(normalized)) {
    return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
  }

  try {
    const targetUrl = new URL(normalized);
    const referer = buildReferer(targetUrl);

    const primaryHeaders: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    };

    if (referer) {
      (primaryHeaders as Record<string, string>).Referer = referer;
    }

    let res = await fetch(targetUrl.toString(), {
      headers: primaryHeaders,
      redirect: 'follow',
      cache: 'force-cache',
      next: { revalidate: 86400 },
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isImagePayload = contentType.startsWith('image/');

    // Retry plus permissif sur erreurs frequentes des CDNs/anti-bot
    if (!res.ok || !isImagePayload) {
      if (!res.ok) {
        console.warn(`[proxy-image] Fetch primaire KO: ${res.status} pour ${targetUrl}`);
      }

      res = await fetch(targetUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'image/*,*/*;q=0.8',
        },
        redirect: 'follow',
        cache: 'no-store',
      });
    }

    if (!res.ok) {
      console.warn(`[proxy-image] Fetch fallback KO: ${res.status} pour ${targetUrl}`);
      return new NextResponse(null, { status: res.status });
    }

    return toImageResponse(res);
  } catch (e) {
    console.error('[proxy-image] Erreur critique:', e);
    return new NextResponse(null, { status: 502 });
  }
}