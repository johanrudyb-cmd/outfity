'use client';

import { useState, useEffect, useRef } from 'react';

interface LazySectionProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function LazySection({ children, fallback }: LazySectionProps) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '200px', // Commencer le chargement un peu avant que l'utilisateur n'arrive
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef}>
            {isVisible ? children : (fallback || <div className="h-[300px]" />)}
        </div>
    );
}
