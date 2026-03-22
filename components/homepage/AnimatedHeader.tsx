'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnimatedHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Fermer le menu sur changement de route
  useEffect(() => {
    if (!isMenuOpen) return;
    const timeout = window.setTimeout(() => setIsMenuOpen(false), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname, isMenuOpen]);

  // Empêcher le scroll quand le menu est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const navLinks = [
    { name: 'Fonctionnalités', href: '#features' },
    { name: 'Tarifs', href: '#pricing-section' },
    { name: 'Témoignages', href: '#testimonials-section' },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQ', href: '#faq-section' },
    { name: 'Communauté', href: '/communaute' },
  ];

  return (
    <>
      {/* Spacer pour compenser la hauteur du header fixed */}
      <div className="h-16 sm:h-20 lg:h-24" aria-hidden />
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-16 sm:h-20 lg:h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Menu Mobile Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-2 text-[#1D1D1F] hover:bg-black/5 rounded-full transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/" className="shrink-0">
              <Image src="/icon.webp" alt="Logo" width={140} height={140} className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 xl:h-32 xl:w-32 object-contain bg-transparent" priority={true} />
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden xl:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[#6e6e73] hover:text-[#007AFF] transition-colors whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/auth/signin"
              className="hidden sm:inline-flex px-5 py-2 rounded-full text-xs sm:text-sm font-bold text-[#6e6e73] hover:text-[#1D1D1F] transition-colors whitespace-nowrap"
            >
              Connexion
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#007AFF] text-white hover:bg-[#0056CC] transition-colors shadow-sm whitespace-nowrap"
            >
              Essai gratuit
            </Link>
          </div>
        </div>

        {/* Menu Mobile Overlay */}
        <div
          className={cn(
            'fixed inset-0 bg-white/60 backdrop-blur-md z-40 xl:hidden transition-opacity duration-200',
            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={cn(
            'absolute top-full left-0 w-full z-50 bg-white border-b border-black/5 overflow-hidden xl:hidden',
            'transition-all duration-300 origin-top',
            isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          )}
        >
          <div className="px-8 py-12 space-y-8 flex flex-col items-center text-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-black uppercase tracking-tighter text-black hover:text-[#007AFF] transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="w-full h-[1px] bg-black/5 my-4" />
            <div className="w-full">
              <Link
                href="/auth/signin"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full py-5 bg-[#007AFF] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-2xl shadow-[#007AFF]/20"
              >
                Connexion
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
