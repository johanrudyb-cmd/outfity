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

import { motion, AnimatePresence } from 'framer-motion';

export function UserAccountNav() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { data: userPlanData } = useSWR('/api/user/plan', fetcher);
    const user = session?.user;

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        await signOut({ callbackUrl: '/' });
    };

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
                    <div className="mt-1">
                        {isAdmin ? (
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#FF3B30] bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                                Admin
                            </span>
                        ) : (
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md border",
                                userPlanData?.plan === 'creator'
                                    ? "bg-black text-white border-black shadow-sm"
                                    : "bg-[#007AFF]/5 text-[#007AFF] border-[#007AFF]/10"
                            )}>
                                {userPlanData?.plan === 'creator' ? 'Créateur' : 'Starter'}
                            </span>
                        )}
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="absolute right-0 top-12 w-72 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-apple-lg z-50 overflow-hidden border border-black/5"
                    >
                        {/* User Info Header */}
                        <div className="p-6 bg-gradient-to-b from-gray-50/50 to-white border-b border-black/5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-black text-[#1D1D1F]/30 uppercase tracking-[0.2em]">Votre Compte</p>
                                {isAdmin ? (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FF3B30] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                        Admin
                                    </span>
                                ) : (
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border",
                                        userPlanData?.plan === 'creator'
                                            ? "bg-black text-white border-black shadow-sm"
                                            : "bg-[#007AFF]/5 text-[#007AFF] border-[#007AFF]/10"
                                    )}>
                                        Plan {userPlanData?.plan === 'creator' ? 'Créateur' : 'Starter'}
                                    </span>
                                )}
                            </div>
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
                        <div className="p-2 bg-gray-50/30">
                            <Link
                                href="/usage"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#1D1D1F]/60 hover:text-black group"
                            >
                                <Zap className="w-4 h-4 group-hover:text-[#007AFF] transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-widest">Mes Quotas</span>
                            </Link>
                            <Link
                                href="/settings"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[#1D1D1F]/60 hover:text-black group"
                            >
                                <Settings className="w-4 h-4 group-hover:text-[#007AFF] transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-widest">Paramètres</span>
                            </Link>

                            <div className="h-px bg-black/5 my-1 mx-2" />

                            <button
                                disabled={isLoggingOut}
                                onClick={handleSignOut}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-all text-red-500 w-full text-left active:scale-[0.98] disabled:opacity-50"
                            >
                                {isLoggingOut ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                                ) : (
                                    <LogOut className="w-4 h-4" />
                                )}
                                <span className="text-xs font-black uppercase tracking-[0.2em]">
                                    {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
