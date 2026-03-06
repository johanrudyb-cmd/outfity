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

  const getHref = (hashString: string) => {
    if (pathname === '/') return hashString;
    return `/${hashString}`;
  };

  const navLinks = [
    ...(isLoggedIn ? [{ name: 'Dashboard', href: '/dashboard' }] : []),
    { name: 'Fonctionnalités', href: getHref('#features') },
    { name: 'Tarifs', href: getHref('#pricing-section') },
    { name: 'Témoignages', href: getHref('#testimonials-section') },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQ', href: getHref('#faq-section') },
    { name: 'Communauté', href: '/communaute' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-16 sm:h-20 lg:h-24 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Menu Mobile Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "xl:hidden p-3 rounded-full transition-all duration-300 relative z-[60]",
              isMenuOpen
                ? "bg-black text-white shadow-xl rotate-90"
                : "bg-black/5 text-black hover:bg-black/10"
            )}
            aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link href="/" className="shrink-0">
            <Image src="/icon.png" alt="Logo" width={140} height={140} className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 xl:h-32 xl:w-32 object-contain bg-transparent" priority={true} />
          </Link>
        </div>

        {/* Navigation Desktop */}
        <div className="hidden xl:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              scroll={true}
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
                <span className="hidden xs:inline">Dashboard</span>
                <span className="xs:hidden">App</span>
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

      {/* Menu Mobile Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/80 backdrop-blur-md z-40 xl:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 top-0 left-0 w-full h-full z-50 bg-white overflow-y-auto xl:hidden"
            >
              <div className="flex flex-col items-center justify-center min-h-screen px-8 py-24 space-y-10">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    scroll={true}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-3xl font-black uppercase tracking-tighter text-black hover:text-[#007AFF] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="w-20 h-[1.5px] bg-black/10" />
                <div className="w-full max-w-xs">
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/auth/signin"}
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full py-5 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center shadow-2xl hover:bg-[#007AFF] transition-all"
                  >
                    {isLoggedIn ? "Mon Dashboard" : "Connexion"}
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
