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
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Viral sur Tiktok', href: '/trends', icon: TrendingUp },
    { name: 'Launch Map', href: '/launch-map', icon: Map },
    { name: 'Compte', href: '/settings', icon: CircleUser },
];

interface MobileNavProps {
    onMenuClick?: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
    const pathname = usePathname();

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-black/5 px-2 pb-safe-area-inset-bottom">
            <div className="flex justify-around items-center h-16">
                {mobileLinks.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200",
                                isActive ? "text-[#007AFF] scale-110" : "text-[#1D1D1F]/40 hover:text-[#1D1D1F]/60"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                            <span className={cn(
                                "text-[8px] font-bold text-center leading-none transition-all",
                                isActive ? "opacity-100" : "opacity-70"
                            )}>
                                {link.name}
                            </span>
                        </Link>
                    );
                })}

                {/* Menu Button as 'Plus' to still allow access to sidebar if needed, but restored original 4 links first */}
                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center gap-1 w-full h-full text-[#1D1D1F]/40 hover:text-[#1D1D1F]/60 transition-all active:scale-90"
                >
                    <Menu className="w-5 h-5 stroke-[2px]" />
                    <span className="text-[8px] font-bold text-center leading-none opacity-70">Plus</span>
                </button>
            </div>
        </nav>
    );
}
