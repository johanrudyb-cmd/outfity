'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

export function AppleNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;


  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-20 flex items-center justify-between gap-2">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="shrink-0">
          <Image src="/icon.png" alt="Logo" width={96} height={96} className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 object-contain bg-transparent" unoptimized />
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-4 lg:gap-8">
          <Link
            href="#features"
            className="text-sm font-medium text-[#000000] hover:text-[#007AFF] transition-colors duration-200"
          >
            Fonctionnalités
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-[#000000] hover:text-[#007AFF] transition-colors duration-200"
          >
            Tarifs
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-[#000000] hover:text-[#007AFF] transition-colors duration-200"
          >
            Témoignages
          </Link>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            href="/auth/signin"
            className="text-xs sm:text-sm font-medium text-[#000000] hover:text-[#007AFF] transition-colors duration-200 whitespace-nowrap"
          >
            Se connecter
          </Link>
          <Link
            href="/auth/signup"
            className="px-3 py-1.5 sm:px-5 sm:py-2 bg-[#000000] text-white rounded-full text-xs sm:text-sm font-medium hover:bg-[#1D1D1F] transition-all duration-200 whitespace-nowrap"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </nav>
  );
}
