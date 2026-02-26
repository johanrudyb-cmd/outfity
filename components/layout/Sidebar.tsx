'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { X, Settings, LogOut, Zap } from 'lucide-react';
import { InstallAppBanner } from './InstallAppBanner';

const navigation = [
  { name: 'Dashboard', description: 'Vue d\'ensemble Outfity', href: '/dashboard', tourId: 'tour-dashboard', badge: undefined as string | undefined },
  { name: 'Viral sur Tiktok', description: 'Le Top 15 des tendances validées par Outfity Intelligence (TikTok & Instagram)', href: '/trends', tourId: 'tour-trends', badge: undefined as string | undefined },
  { name: 'Détecter une tendance', description: 'Analyse la viralité d\'un vêtement par IA via photo', href: '/trends/visual', tourId: 'tour-spy', badge: 'NOUVEAU' },
];

const tools = [
  { name: 'Gérer ma marque', description: 'Guide de lancement — identité, stratégie, design, sourcing', href: '/launch-map', tourId: 'tour-launch-map', featured: true },
  { name: 'Calculateur de marge', description: 'Calculez votre marge bénéficiaire par vêtement', href: '/calculator', tourId: 'tour-calculator' },
  { name: 'Création de contenu', description: 'Générez des posts structurés par IA et planifiez-les', href: '/content-creation', tourId: 'tour-content-creation' },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const handleNav = () => onClose?.();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-[100dvh] lg:h-screen w-72 max-w-[85vw] backdrop-blur-xl bg-white/95 flex flex-col z-50 overflow-y-auto lg:overflow-y-hidden',
        'transform transition-transform duration-300 ease-out',
        'lg:translate-x-0',
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Header avec logo centré (desktop) / logo + fermer (mobile) */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-black/5 flex items-center justify-between lg:justify-center gap-4">
        <Link href="/dashboard" className="block shrink-0" onClick={handleNav}>
          <Image src="/icon.png" alt="Logo" width={96} height={96} className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-24 lg:w-24 shrink-0 object-contain bg-transparent mx-auto lg:mx-0" unoptimized />
        </Link>
        <button
          type="button"
          aria-label="Fermer le menu"
          className="lg:hidden touch-target flex items-center justify-center rounded-xl text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#1D1D1F] active:bg-black/10"
          onClick={onClose}
        >
          <X className="h-6 w-6 shrink-0" />
        </button>
      </div>

      {/* Navigation Apple - Glassmorphism */}
      <nav className="flex-1 lg:overflow-y-auto pt-6 pb-6 px-6 space-y-8 flex flex-col">
        {/* Section Navigation */}
        <div>
          <h2 className="px-4 mb-3 text-xs font-semibold text-[#1D1D1F]/40 uppercase tracking-wider">
            Navigation
          </h2>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-tour={item.tourId}
                  onClick={handleNav}
                  className={cn(
                    'flex items-center justify-between min-h-[44px] px-4 py-3 rounded-2xl text-base font-medium transition-all duration-200',
                    isActive
                      ? 'bg-black/5 text-[#007AFF]'
                      : 'text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#007AFF]'
                  )}
                  title={item.description}
                >
                  <span>{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 text-[10px] font-bold bg-[#007AFF] text-white hover:bg-[#007AFF]/90 border-none px-2 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Section Outils de création */}
        <div>
          <h2 className="px-4 mb-3 text-xs font-semibold text-[#1D1D1F]/40 uppercase tracking-wider">
            Outils de création
          </h2>
          <div className="space-y-1">
            {tools.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  data-tour={item.tourId}
                  onClick={handleNav}
                  className={cn(
                    'block min-h-[44px] px-4 py-3 rounded-2xl text-base font-medium transition-all duration-200 flex items-center',
                    isActive
                      ? 'bg-black/5 text-[#007AFF]'
                      : 'text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#007AFF]'
                  )}
                  title={item.description}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bannière Install App */}
        <InstallAppBanner />

        {/* Section Compte */}
        <div className="lg:mt-auto pt-4 space-y-1 pb-4">
          <h2 className="px-4 mb-3 text-xs font-semibold text-[#1D1D1F]/40 uppercase tracking-wider">
            Votre Compte
          </h2>
          <div className="pt-2 border-t border-black/5 space-y-1">
            <Link
              href="/usage"
              onClick={handleNav}
              className={cn(
                'min-h-[44px] px-4 py-3 rounded-2xl text-base font-medium transition-all duration-200 flex items-center gap-3',
                pathname === '/usage'
                  ? 'bg-black/5 text-[#007AFF]'
                  : 'text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#007AFF]'
              )}
              title="Gérer mes quotas et crédits"
            >
              <Zap className="w-5 h-5" />
              <span>Mes quotas</span>
            </Link>
            <Link
              href="/settings"
              onClick={handleNav}
              className={cn(
                'min-h-[44px] px-4 py-3 rounded-2xl text-base font-medium transition-all duration-200 flex items-center gap-3',
                pathname === '/settings'
                  ? 'bg-black/5 text-[#007AFF]'
                  : 'text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#007AFF]'
              )}
            >
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </Link>
            <button
              type="button"
              className="min-h-[44px] w-full text-left px-4 py-3 rounded-2xl text-base font-medium text-[#1D1D1F]/60 hover:bg-black/5 hover:text-[#007AFF] transition-all duration-200 flex items-center gap-3 active:bg-black/10"
              onClick={() => {
                onClose?.();
                signOut({ callbackUrl: '/' });
              }}
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
