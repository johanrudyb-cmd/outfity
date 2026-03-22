/**
 * Utilitaire pour normaliser/proxyfier les URLs d'images externes.
 */

export function normalizeExternalImageUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') return null;

    const raw = url.trim();
    if (!raw) return null;

    if (raw.startsWith('data:')) return raw;
    if (raw.startsWith('blob:')) return null;

    // URL protocol-relative: //cdn.site.com/image.jpg
    if (raw.startsWith('//')) {
        return `https:${raw}`;
    }

    // URL absolue
    if (/^https?:\/\//i.test(raw)) {
        return raw;
    }

    // Domaine sans protocole: cdn.site.com/image.jpg
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(raw)) {
        return `https://${raw}`;
    }

    // URL locale
    if (raw.startsWith('/')) {
        return raw;
    }

    return null;
}

export function proxyImageUrl(url: string | null | undefined): string | null {
    const normalized = normalizeExternalImageUrl(url);
    if (!normalized) return null;

    // URLs locales / data URI: on les garde telles quelles
    if (normalized.startsWith('/') || normalized.startsWith('data:')) {
        return normalized;
    }

    // URLs externes: on passe par le proxy
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        return `/api/proxy-image?url=${encodeURIComponent(normalized)}`;
    }

    return normalized;
}

/**
 * Variante pour Next.js Image component qui necessite un loader
 */
export function imageLoader({ src }: { src: string }) {
    const normalized = normalizeExternalImageUrl(src);
    if (!normalized) return src;

    if (normalized.startsWith('/') || normalized.startsWith('data:')) {
        return normalized;
    }

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        return `/api/proxy-image?url=${encodeURIComponent(normalized)}`;
    }

    return normalized;
}