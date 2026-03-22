'use client';

/**
 * Affichage des images de prévisualisation (designs, logos, mockups).
 * Pas de filigrane : l'image est affichée telle quelle pour une prévisualisation claire.
 */
/* eslint-disable @next/next/no-img-element */

interface PreviewWatermarkProps {
  src: string;
  alt: string;
  className?: string;
  /** Conservé pour compatibilité API ; n'a plus d'effet visuel. */
  validated?: boolean;
}

export function PreviewWatermark({ src, alt, className = '', validated: _validated = false }: PreviewWatermarkProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-contain ${className}`}
    />
  );
}
