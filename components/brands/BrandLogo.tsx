'use client';

import { useState, useMemo } from 'react';

interface BrandLogoProps {
  logoUrl: string | null;
  brandName: string;
  className?: string;
  /** 'cover' = remplit tout le cadre (object-cover) ; 'contain' = garde les proportions (défaut). */
  objectFit?: 'contain' | 'cover';
}

/** URLs externes : Wikimedia et favicon Google en direct (fiables). Autres : proxy. */
function getLogoSrc(url: string | null): string | null {
  if (!url) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url;
  const isDirect =
    url.includes('upload.wikimedia.org') ||
    url.includes('commons.wikimedia.org') ||
    url.includes('google.com/s2/favicons') ||
    url.includes('cdn.simpleicons.org') ||
    url.includes('logo.clearbit.com') ||
    url.includes('brandfetch.io');
  if (isDirect) return url;
  return `/api/logo?url=${encodeURIComponent(url)}`;
}

export function BrandLogo({ logoUrl, brandName, className = 'w-12 h-12', objectFit = 'contain' }: BrandLogoProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = useMemo(() => getLogoSrc(logoUrl), [logoUrl]);
  const failed = !!src && failedSrc === src;

  if (!src || failed) {
    return (
      <div
        className={`rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden aspect-square ${className}`}
      >
        <span className="text-lg font-bold text-muted-foreground">
          {brandName.replace(/['"]/g, '').charAt(0) || brandName.charAt(0)}
        </span>
      </div>
    );
  }

  const imgClass = objectFit === 'cover'
    ? 'w-full h-full object-cover object-center'
    : 'w-full h-full max-w-[90%] max-h-[90%] object-contain object-center';

  return (
    <div
      className={`rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden aspect-square min-w-0 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={brandName}
        className={imgClass}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
}
