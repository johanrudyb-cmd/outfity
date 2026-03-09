'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    BarChart3,
    Fingerprint,
    Compass,
    Palette,
    ScanLine,
    Megaphone,
    Clock,
    FileText,
    Factory,
    Store,
    Calendar,
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Vue', href: '/launch-map', icon: BarChart3, exact: true },
    { label: 'Calendrier', href: '/launch-map/calendar', icon: Calendar },
    { label: 'Identité', href: '/launch-map/phase/0', icon: Fingerprint },
    { label: 'Stratégie', href: '/launch-map/phase/1', icon: Compass },
    { label: 'Mockup', href: '/launch-map/phase/2', icon: Palette },
    { label: 'Scanner', href: '/launch-map/phase/3', icon: ScanLine },
    { label: 'Scripts', href: '/launch-map/phase/4', icon: Megaphone },
    { label: 'Waitlist', href: '/launch-map/phase/5', icon: Clock },
    { label: 'Tech Pack', href: '/launch-map/tech-packs', icon: FileText },
    { label: 'Sourcing', href: '/launch-map/sourcing', icon: Factory },
    { label: 'Boutique', href: '/launch-map/phase/8', icon: Store },
];

export function LaunchMapMobileNav() {
    const pathname = usePathname();

    // Hide on formation pages
    if (pathname === '/launch-map/formation' || pathname.startsWith('/launch-map/formation/')) {
        return null;
    }

    const isActive = (item: typeof NAV_ITEMS[0]) => {
        if (item.exact) return pathname === item.href || pathname === '/launch-map/';
        return pathname === item.href || pathname.startsWith(item.href + '/');
    };

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-black/[0.06] safe-area-pb">
            <div className="flex overflow-x-auto no-scrollbar px-2 py-2 gap-1">
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 shrink-0 min-w-[58px]',
                                active
                                    ? 'bg-[#007AFF]/10 text-[#007AFF]'
                                    : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'
                            )}
                        >
                            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                            <span className={cn(
                                'text-[9px] font-bold uppercase tracking-tight leading-none whitespace-nowrap',
                                active ? 'text-[#007AFF]' : 'text-[#86868B]'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
