'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAccountNav } from '@/components/layout/UserAccountNav';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

// Liens de nav fixes — on utilise toujours /#ancre pour fonctionner sur toutes les pages
const NAV_LINKS = [
  { name: 'Fonctionnalités', href: '/#features' },
  { name: 'Tarifs', href: '/#pricing-section' },
  { name: 'Témoignages', href: '/#testimonials-section' },
  { name: 'Blog', href: '/blog' },
  { name: 'FAQ', href: '/#faq-section' },
  { name: 'Communauté', href: '/communaute' },
];

export function AnimatedHeader() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Fermer le menu sur changement de route
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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

  // Gestion du clic sur ancre : si on est déjà sur /, scroll smooth sans reload de page
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#') && pathname === '/') {
      e.preventDefault();
      const id = href.replace('/#', '');
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    } else {
      setIsMenuOpen(false);
    }
  };

  const dashboardLink = isLoggedIn ? [{ name: 'Dashboard', href: '/dashboard' }] : [];
  const allLinks = [...dashboardLink, ...NAV_LINKS];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-16 sm:h-20 lg:h-24 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Bouton hamburger — visible en dessous de lg (1024px) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'lg:hidden p-3 rounded-full transition-all duration-300 relative z-[60]',
              isMenuOpen
                ? 'bg-black text-white shadow-xl'
                : 'bg-black/5 text-black hover:bg-black/10'
            )}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link href="/" className="shrink-0">
            <Image
              src="/icon.png"
              alt="Logo"
              width={140}
              height={140}
              className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain bg-transparent"
              priority={true}
            />
          </Link>
        </div>

        {/* Navigation Desktop — visible à partir de lg (1024px) */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          {allLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="text-sm font-medium text-[#6e6e73] hover:text-[#007AFF] transition-colors whitespace-nowrap"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block">
                <NotificationsDropdown />
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest bg-black text-white hover:bg-[#007AFF] transition-all shadow-sm group"
              >
                <LayoutDashboard className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>App</span>
              </Link>
              <UserAccountNav />
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#007AFF] text-white hover:bg-[#0056CC] transition-colors shadow-sm whitespace-nowrap"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ backgroundColor: '#ffffff', position: 'fixed', inset: 0, zIndex: 9999 }}
          >
            {/* Bouton fermer */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/10">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="shrink-0">
                <Image src="/icon.png" alt="Logo" width={60} height={60} className="h-12 w-12 object-contain" />
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                style={{ backgroundColor: '#000', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Liens */}
            <div className="flex flex-col items-start px-8 pt-8 gap-6">
              {allLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#000', textDecoration: 'none' }}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="absolute bottom-12 left-8 right-8">
              <Link
                href={isLoggedIn ? '/dashboard' : '/auth/signin'}
                onClick={() => setIsMenuOpen(false)}
                style={{ display: 'block', width: '100%', padding: '1.25rem', backgroundColor: '#007AFF', color: '#fff', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', textDecoration: 'none' }}
              >
                {isLoggedIn ? 'Mon Dashboard' : 'Commencer'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
