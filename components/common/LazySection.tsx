'use client';

import { useState, useEffect, useRef } from 'react';

interface LazySectionProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    id?: string;
}

export function LazySection({ children, fallback, id }: LazySectionProps) {
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
        <div ref={containerRef} id={id}>
            {isVisible ? children : (fallback || <div className="h-[300px]" />)}
        </div>
    );
}

