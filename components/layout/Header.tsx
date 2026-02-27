'use client';

import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { SearchBar } from './SearchBar';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;


  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 border-b border-black/5">
      <div className="flex h-14 sm:h-16 items-center gap-3 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8">
        {/* Menu burger (mobile) */}
        {onMenuClick && (
          <button
            type="button"
            aria-label="Ouvrir le menu"
            className="md:hidden touch-target flex items-center justify-center rounded-xl text-[#1D1D1F] hover:bg-black/5 active:bg-black/10 active:scale-95 shrink-0"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6 shrink-0" />
          </button>
        )}
        {/* Recherche à gauche */}
        <div className="flex-1 min-w-0 max-w-xl">
          <SearchBar />
        </div>

        {/* À droite : cloche, mon nom */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0 ml-auto">
          <NotificationsDropdown />
          <div className="hidden sm:flex items-center gap-4 pl-2 lg:pl-6 lg:border-l border-black/5">
            {user && (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1D1D1F] leading-tight truncate max-w-[120px] lg:max-w-none">
                      {user.name || 'Utilisateur'}
                    </span>
                  </div>
                  <span className="text-xs text-[#1D1D1F]/60 leading-tight truncate max-w-[120px] lg:max-w-none hidden lg:block">
                    {user.email}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
