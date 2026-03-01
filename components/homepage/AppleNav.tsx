'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

import { motion } from 'framer-motion';

export function AppleNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const navLinks = [
    { href: '#features', label: 'Fonctionnalités' },
    { href: '#pricing', label: 'Tarifs' },
    { href: '#testimonials', label: 'Témoignages' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-20 flex items-center justify-between gap-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href={isLoggedIn ? '/dashboard' : '/'} className="shrink-0 block">
            <Image src="/icon.png" alt="Logo" width={96} height={96} className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 object-contain" priority />
          </Link>
        </motion.div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-4 lg:gap-8">
          {navLinks.map((link) => (
            <motion.div key={link.href} whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
              <Link
                href={link.href}
                className="text-sm font-medium text-[#1D1D1F]/60 hover:text-[#007AFF] transition-colors duration-200"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {isLoggedIn ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-[#007AFF] text-white rounded-full text-xs sm:text-sm font-bold hover:bg-[#0056CC] transition-all duration-300 shadow-lg shadow-blue-500/20 block"
              >
                Tableau de bord
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/auth/signin"
                  className="text-xs sm:text-sm font-bold text-[#1D1D1F]/60 hover:text-[#007AFF] transition-colors duration-200 whitespace-nowrap block"
                >
                  Se connecter
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 sm:px-5 sm:py-2.5 bg-black text-white rounded-full text-xs sm:text-sm font-bold hover:bg-zinc-800 transition-all duration-200 whitespace-nowrap block shadow-lg shadow-black/10"
                >
                  Créer un compte
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
