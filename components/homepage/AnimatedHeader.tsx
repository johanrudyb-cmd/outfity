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

      {/* Menu Mobile Plein Écran — visible en dessous de lg (1024px) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 bg-white flex flex-col lg:hidden"
          >
            {/* Header du menu mobile avec bouton fermer */}
            <div className="flex items-center justify-between px-6 h-16 sm:h-20 border-b border-black/5">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="shrink-0">
                <Image src="/icon.png" alt="Logo" width={80} height={80} className="h-14 w-14 sm:h-16 sm:w-16 object-contain" />
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-3 bg-black text-white rounded-full shadow-xl"
                aria-label="Fermer le menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Liens du menu */}
            <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8">
              {allLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                    className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black hover:text-[#007AFF] transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <div className="w-20 h-[1.5px] bg-black/10 my-2" />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: allLinks.length * 0.06 }}
                className="w-full max-w-xs"
              >
                <Link
                  href={isLoggedIn ? '/dashboard' : '/auth/signin'}
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full py-5 bg-black text-white rounded-2xl text-sm font-black uppercase tracking-widest text-center shadow-2xl hover:bg-[#007AFF] transition-all"
                >
                  {isLoggedIn ? 'Mon Dashboard' : 'Connexion'}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
