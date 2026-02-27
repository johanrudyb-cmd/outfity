'use client';

import Link from 'next/link';
import { Instagram } from 'lucide-react';

const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://www.instagram.com/biangory/', icon: 'instagram' },
  { name: 'TikTok', href: 'https://www.tiktok.com/@biangory', icon: 'tiktok' },
] as const;

const footerLinks = {
  produit: [
    { name: 'Fonctionnalités', href: '#features' },
    { name: 'Tarifs', href: '#pricing-section' },
    { name: 'Témoignages', href: '#testimonials-section' },
  ],
  ressources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQ', href: '#faq-section' },
  ],
  entreprise: [
    { name: 'À propos', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Support', href: '/support' },
    { name: 'Communauté', href: '/communaute' },
  ],
  légal: [
    { name: 'CGV et CGU', href: '/legal/terms' },
    { name: 'Confidentialité', href: '/legal/privacy' },
    { name: 'Mentions légales', href: '/legal/mentions' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#F2F2F2] py-10 sm:py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 sm:gap-16 mb-16">
          {/* Produit */}
          <div className="text-center sm:text-left">
            <h3 className="text-[10px] sm:text-xs font-black text-black mb-6 uppercase tracking-[0.2em] opacity-30">
              Infrastructure
            </h3>
            <ul className="space-y-4">
              {footerLinks.produit.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-gray-500 font-bold hover:text-[#007AFF] transition-colors uppercase tracking-widest"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div className="text-center sm:text-left">
            <h3 className="text-[10px] sm:text-xs font-black text-black mb-6 uppercase tracking-[0.2em] opacity-30">
              Radar // Blog
            </h3>
            <ul className="space-y-4">
              {footerLinks.ressources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-gray-500 font-bold hover:text-[#007AFF] transition-colors uppercase tracking-widest"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div className="text-center sm:text-left">
            <h3 className="text-[10px] sm:text-xs font-black text-black mb-6 uppercase tracking-[0.2em] opacity-30">
              OUTFITY
            </h3>
            <ul className="space-y-4">
              {footerLinks.entreprise.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-gray-500 font-bold hover:text-[#007AFF] transition-colors uppercase tracking-widest"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div className="text-center sm:text-left">
            <h3 className="text-[10px] sm:text-xs font-black text-black mb-6 uppercase tracking-[0.2em] opacity-30">
              Protocole
            </h3>
            <ul className="space-y-4">
              {footerLinks.légal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-gray-500 font-bold hover:text-[#007AFF] transition-colors uppercase tracking-widest"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Réseaux sociaux - BIANGORY */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-6 sm:py-8 border-t border-[#F2F2F2]">
          {SOCIAL_LINKS.map((social) => (
            <Link
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 min-h-[44px] py-2 text-sm font-medium text-[#6e6e73] hover:text-[#007AFF] transition-colors touch-manipulation"
              aria-label={social.name + ' - BIANGORY'}
            >
              {social.icon === 'instagram' ? (
                <Instagram className="w-5 h-5" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              )}
              <span>{social.name}</span>
            </Link>
          ))}
        </div>

        {/* Copyright & Legal Disclaimer */}
        <div className="pt-6 border-t border-[#F2F2F2] space-y-4">
          <p className="text-xs sm:text-sm text-[#86868b] font-normal text-center max-w-3xl mx-auto leading-relaxed italic opacity-80">
            Les marques et logos cités appartiennent à leurs propriétaires respectifs. Leur mention sur OUTFITY est faite à des fins strictement informatives et d'analyse statistique, et n'implique aucune affiliation ou partenariat avec ces marques.
          </p>
          <p className="text-sm text-[#1d1d1f] font-bold text-center">
            © 2026 OUTFITY. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
