'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Newspaper,
    Users,
    BarChart3,
    ArrowLeft,
    Menu,
    X,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAccountNav } from './UserAccountNav';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

interface AdminLayoutClientProps {
    children: React.ReactNode;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (!sidebarOpen) return;
        const timeout = window.setTimeout(() => setSidebarOpen(false), 0);
        return () => window.clearTimeout(timeout);
    }, [pathname, sidebarOpen]);

    const navItems = [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Partners', href: '/admin/partners', icon: Users },
        { label: 'Blog Feed', href: '/admin/blog', icon: Newspaper },
        { label: 'Database Users', href: '/admin/users', icon: Users },
        { label: 'Metrics IA', href: '/admin/metrics', icon: BarChart3 },
    ];

    return (
        <div className="flex h-[100dvh] bg-[#F5F5F7] overflow-hidden">
            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 bg-white border-r border-black/5 flex flex-col z-[70] transition-transform duration-300 lg:static lg:translate-x-0",
                sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="p-8 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-10">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                                <ShieldCheck className="text-white w-6 h-6" />
                            </div>
                            <span className="font-black text-2xl tracking-tighter italic">ADMIN</span>
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-black/5 rounded-xl">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="space-y-1 flex-1">
                        <p className="px-4 mb-4 text-[10px] font-black text-[#1D1D1F]/30 uppercase tracking-[0.2em]">Console Commands</p>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200",
                                        isActive
                                            ? "bg-[#007AFF]/10 text-[#007AFF]"
                                            : "text-[#6e6e73] hover:text-black hover:bg-black/5"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-8 border-t border-black/5">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-3 text-sm font-black text-[#6e6e73] hover:text-black transition-all hover:bg-black/5 rounded-2xl group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span>Return to App</span>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen relative">
                <header className="h-16 border-b border-black/5 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 hover:bg-black/5 rounded-xl"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#1D1D1F]/30 hidden sm:block">
                            System Monitoring / <span className="text-[#007AFF] uppercase">{pathname.split('/').pop() || 'Overview'}</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationsDropdown />
                        <UserAccountNav />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-[#F5F5F7]">
                    <div className="max-w-[1600px] mx-auto min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
