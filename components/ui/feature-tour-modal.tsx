'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Sparkles } from 'lucide-react';

interface FeatureTourModalProps {
    featureKey: string;
    title: string;
    description: React.ReactNode;
    icon?: React.ReactNode;
    bulletPoints?: string[];
    ctaText?: string;
    forceShow?: boolean;
}

export function FeatureTourModal({
    featureKey,
    title,
    description,
    icon = <Sparkles className="w-6 h-6 text-primary" />,
    bulletPoints = [],
    ctaText = "J'ai compris, commencer",
    forceShow = false,
}: FeatureTourModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storageKey = `tour_${featureKey}_seen`;
        if (forceShow) {
            setIsOpen(true);
        } else {
            const hasSeen = localStorage.getItem(storageKey);
            if (!hasSeen) {
                // Léger délai pour ne pas brusquer l'utilisateur dès le chargement de la page
                const timer = setTimeout(() => setIsOpen(true), 800);
                return () => clearTimeout(timer);
            }
        }
    }, [featureKey, forceShow]);

    const handleClose = () => {
        localStorage.setItem(`tour_${featureKey}_seen`, 'true');
        setIsOpen(false);
    };

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header décoratif */}
                        <div className="bg-gradient-to-br from-primary/5 via-background to-background p-8 pb-6 border-b border-border/30">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                                aria-label="Fermer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                {icon}
                            </div>

                            <h2 className="text-2xl font-bold tracking-tight mb-3">{title}</h2>
                            <div className="text-muted-foreground text-[15px] leading-relaxed">
                                {description}
                            </div>
                        </div>

                        <div className="p-8 pt-6">
                            {bulletPoints.length > 0 && (
                                <ul className="space-y-4 mb-8">
                                    {bulletPoints.map((point, index) => (
                                        <motion.li
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + (index * 0.1) }}
                                            key={index}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-primary text-[11px] font-bold">{index + 1}</span>
                                            </div>
                                            <span className="text-[14px] font-medium leading-normal">{point}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}

                            <Button
                                onClick={handleClose}
                                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                                size="lg"
                            >
                                {ctaText}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
