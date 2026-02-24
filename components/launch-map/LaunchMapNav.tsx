'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  CheckCircle2,
  Circle,
  Calendar,
  Palette,
  Target,
  PenTool,
  FileText,
  Truck,
  Store,
  LucideIcon,
} from 'lucide-react';
import { LAUNCH_MAP_PHASES } from '@/lib/launch-map-constants';

const PHASE_ICONS: Record<number, LucideIcon> = {
  0: Palette,
  1: Target,
  2: PenTool,
  3: FileText,
  4: Truck,
  5: Store,
};

export interface LaunchMapNavProps {
  brand: { id: string; name: string; logo?: string | null };
  hasIdentity: boolean;
  phase1: boolean;
  phase2: boolean;
  phase3: boolean;
  phase4: boolean;
  phase5: boolean;
  phase6: boolean;
  phase7: boolean;
}

export function LaunchMapNav({
  brand,
  hasIdentity,
  phase1,
  phase2,
  phase3,
  phase4,
  phase5,
  phase6,
  phase7,
}: LaunchMapNavProps) {
  const pathname = usePathname();

  if (
    pathname === '/launch-map/formation' ||
    pathname.startsWith('/launch-map/formation/') ||
    pathname.startsWith('/launch-map/phase/')
  ) {
    return null;
  }

  const progress = {
    phase0: hasIdentity,
    phase1,
    phase2,
    phase3,
    phase4,
    phase5,
    phase6,
    phase7,
  };

  const isOverview = pathname === '/launch-map' || pathname === '/launch-map/';
  const phaseMatch = pathname.match(/^\/launch-map\/phase\/(\d+)$/);
  const activePhaseIndex = phaseMatch ? parseInt(phaseMatch[1], 10) : -1;

  const isPhaseAccessible = () => true;

  return (
    <nav className={cn(
      "sticky top-14 sm:top-16 z-30 w-full border-b border-border bg-card shadow-sm",
      !isOverview && "hidden lg:block"
    )}>
      <div className="relative overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity lg:hidden" />

        <div className="flex overflow-x-auto no-scrollbar lg:flex-wrap lg:h-14 items-center gap-1 p-1 md:px-6 md:gap-2">
          <Link
            href="/launch-map"
            className={cn(
              'flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-2 px-1 py-2 lg:px-3 lg:py-2 rounded-lg text-[10px] lg:text-sm font-semibold transition-all duration-200 flex-shrink-0',
              isOverview ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <BarChart3 className="w-4 h-4 lg:w-4 lg:h-4" />
            <span className="text-center lg:text-left leading-tight">Vue</span>
          </Link>

          <Link
            href="/launch-map/calendar"
            className={cn(
              'flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-2 px-1 py-2 lg:px-3 lg:py-2 rounded-lg text-[10px] lg:text-sm font-semibold transition-all duration-200 flex-shrink-0',
              pathname === '/launch-map/calendar' || pathname.startsWith('/launch-map/calendar/')
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title="Planifier tournages et posts"
          >
            <Calendar className="w-4 h-4 lg:w-4 lg:h-4" />
            <span className="text-center lg:text-left leading-tight">Calendrier</span>
          </Link>

          {LAUNCH_MAP_PHASES.map((p: any) => {
            const Icon = PHASE_ICONS[p.id] || Circle;
            const completed = (progress as any)[`phase${p.id}`];
            const accessible = isPhaseAccessible();

            // Correction des liens pour correspondre aux IDs 0-5
            const href = p.id === 3 ? '/launch-map/tech-packs' :
              p.id === 4 ? '/launch-map/sourcing' :
                `/launch-map/phase/${p.id}`;

            const isActive = (p.id === 3 && pathname === '/launch-map/tech-packs') ||
              (p.id === 4 && pathname === '/launch-map/sourcing') ||
              (activePhaseIndex === p.id);

            const shortTitle = p.id === 0 ? 'Identité' :
              p.id === 1 ? 'Stratégie' :
                p.id === 2 ? 'Mockup' :
                  p.id === 3 ? 'Tech Pack' :
                    p.id === 4 ? 'Sourcing' :
                      p.id === 5 ? 'Site' : p.title;

            return (
              <Link
                key={p.id}
                href={accessible ? href : '#'}
                onClick={(e) => !accessible && e.preventDefault()}
                className={cn(
                  'flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-2 px-1 py-2 lg:px-3 lg:py-2 rounded-lg text-[10px] lg:text-sm font-semibold transition-all duration-200 flex-shrink-0 relative',
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' : accessible ? 'text-muted-foreground hover:text-foreground hover:bg-muted' : 'text-muted-foreground/50 cursor-not-allowed pointer-events-none'
                )}
                title={p.subtitle}
              >
                <div className="relative">
                  <Icon className="w-4 h-4 lg:w-4 lg:h-4" />
                  {completed && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card flex items-center justify-center">
                      <CheckCircle2 className="w-full h-full text-white" />
                    </div>
                  )}
                </div>
                <span className="text-center lg:text-left leading-tight">{shortTitle}</span>
              </Link>
            );
          })}
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity lg:hidden" />
      </div>
    </nav>
  );
}
