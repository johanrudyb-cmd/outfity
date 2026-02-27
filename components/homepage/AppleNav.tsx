'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { Menu, X } from 'lucide-react';

export function AppleNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-16 sm:h-20 lg:h-24 flex items-center justify-between">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="shrink-0">
          <Image src="/icon.png" alt="Logo" width={96} height={96} className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 object-contain bg-transparent" unoptimized />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {[
            { name: 'Fonctionnalités', href: '#features' },
            { name: 'Tarifs', href: '#pricing' },
            { name: 'Témoignages', href: '#testimonials' },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-[#000000] hover:text-[#007AFF] transition-colors duration-200"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
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

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-black"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "md:hidden absolute top-full left-0 w-full bg-white border-b border-black/5 transition-all duration-300 overflow-hidden",
        isMobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-8 space-y-6 flex flex-col items-center text-center">
          {[
            { name: 'Fonctionnalités', href: '#tech-pack-showcase' },
            { name: 'Infrastructure', href: '#stats-section' },
            { name: 'Tarifs', href: '#pricing-section' },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-black uppercase tracking-widest text-black"
            >
              {item.name}
            </Link>
          ))}
          <div className="w-full h-[1px] bg-black/5 my-4" />
          <Link
            href="/auth/signin"
            className="text-sm font-black uppercase tracking-widest text-black/40"
          >
            Se Connecter
          </Link>
          <Link
            href="/auth/signup"
            className="w-full py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
