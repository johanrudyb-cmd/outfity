'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    TrendingUp,
    Map,
    Menu,
    CircleUser
} from 'lucide-react';

const mobileLinks = [
    { name: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Viral', href: '/trends', icon: TrendingUp },
    { name: 'Marque', href: '/launch-map', icon: Map },
    { name: 'Compte', href: '/settings', icon: CircleUser },
];

interface MobileNavProps {
    onMenuClick?: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
    const pathname = usePathname();

    return (
        // Only show on mobile — tablets use the compact sidebar (md:hidden)
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/92 backdrop-blur-xl border-t border-black/[0.06]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex justify-around items-center h-[60px]">
                {mobileLinks.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 active:scale-90 active:opacity-70",
                                isActive ? "text-[#007AFF]" : "text-[#1D1D1F]/40"
                            )}
                        >
                            <Icon className={cn("w-6 h-6 transition-transform duration-200", isActive ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
                            <span className={cn(
                                "text-[9px] font-black text-center leading-none uppercase tracking-tight transition-all",
                                isActive ? "opacity-100" : "opacity-50"
                            )}>
                                {link.name}
                            </span>
                        </Link>
                    );
                })}

                {/* Burger → opens drawer for less-frequent items */}
                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-[#1D1D1F]/40 active:scale-90 active:opacity-70 transition-all duration-200"
                >
                    <Menu className="w-6 h-6 stroke-[1.8px]" />
                    <span className="text-[9px] font-black text-center leading-none opacity-50 uppercase tracking-tight">Plus</span>
                </button>
            </div>
        </nav>
    );
}
