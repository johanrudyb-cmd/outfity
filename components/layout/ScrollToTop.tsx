'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    // On définit les routes publiques où le bouton doit apparaître
    const publicRoutes = [
        '/',
        '/blog',
        '/about',
        '/contact',
        '/legal',
        '/partners',
        '/academy',
        '/pricing',
        '/auth/signin',
        '/auth/signup',
        '/communaute'
    ];

    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || (route !== '/' && pathname.startsWith(route))
    );

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!isPublicRoute) return null;

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                'fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[90] p-3 md:p-4 rounded-full',
                'bg-white/80 backdrop-blur-md border border-black/5 shadow-apple-lg',
                'text-[#1D1D1F] transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-white',
                'flex items-center justify-center',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
            )}
            aria-label="Retour en haut"
        >
            <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
        </button>
    );
}
