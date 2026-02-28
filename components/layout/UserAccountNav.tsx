'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
    LayoutDashboard,
    ShieldCheck,
    Users,
    LogOut,
    ChevronRight,
    ArrowLeftRight,
    Settings,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import useSWR from 'swr';
import { getIsAdmin } from '@/lib/auth-helpers';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function UserAccountNav() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { data: userPlanData } = useSWR('/api/user/plan', fetcher);
    const user = session?.user;

    // We check admin from session or hardcoded logic consistent with Sidebar
    const isAdmin = user?.email && (
        ['contact@outfity.fr', 'johanrudy.b@gmail.com', 'johanrudyb@gmail.com'].includes(user.email) ||
        user.email.endsWith('@biangory.com')
    );

    const isAffiliate = userPlanData?.affiliate?.status === 'ACTIVE';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!user) return null;

    const firstName = user.name?.split(' ')[0] || 'U';
    const initial = firstName.charAt(0).toUpperCase();

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-black/5 transition-all active:scale-95"
            >
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-[#007AFF] to-[#0056CC] text-white font-black text-xs">
                        {initial}
                    </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start pr-2">
                    <span className="text-xs font-black text-[#1D1D1F] uppercase tracking-tight leading-none">
                        {user.name?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-bold text-[#1D1D1F]/40 leading-none mt-1">
                        {isAdmin ? 'Administrateur' : userPlanData?.plan?.name || 'Membre'}
                    </span>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-72 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-apple-lg z-50 overflow-hidden border border-black/5 animate-in fade-in zoom-in duration-200">
                    {/* User Info Header */}
                    <div className="p-6 bg-gradient-to-b from-gray-50/50 to-white border-b border-black/5">
                        <p className="text-xs font-black text-[#1D1D1F]/30 uppercase tracking-[0.2em] mb-4">Votre Compte</p>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                <AvatarFallback className="bg-black text-white font-black text-lg">
                                    {initial}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-[#1D1D1F] truncate leading-none mb-1">{user.name}</p>
                                <p className="text-[10px] font-bold text-[#1D1D1F]/40 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="p-2 border-t border-black/5 bg-gray-50/30">
                        <Link
                            href="/usage"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#1D1D1F]/60 hover:text-black"
                        >
                            <Zap className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Mes Quotas</span>
                        </Link>
                        <Link
                            href="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#1D1D1F]/60 hover:text-black"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Paramètres</span>
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-all text-red-500 w-full text-left mt-1"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Déconnexion</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
