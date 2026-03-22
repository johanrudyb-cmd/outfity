'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface StrategyUpdateNotification {
    id: string;
    brandId: string;
    brandName: string;
    updateDate: string;
    source: string;
}

export function StrategyUpdateBanner() {
    const [updates, setUpdates] = useState<StrategyUpdateNotification[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const dismissedIds = localStorage.getItem('dismissedStrategyUpdates');
            return new Set(dismissedIds ? JSON.parse(dismissedIds) : []);
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        // Récupérer les mises à jour récentes depuis l'API
        fetch('/api/strategies/recent-updates')
            .then(res => res.json())
            .then(data => {
                if (data.updates) {
                    setUpdates(data.updates);
                }
            })
            .catch(console.error);
    }, []);

    const handleDismiss = (updateId: string) => {
        const newDismissed = new Set(dismissed);
        newDismissed.add(updateId);
        setDismissed(newDismissed);
        localStorage.setItem('dismissedStrategyUpdates', JSON.stringify([...newDismissed]));
    };

    const visibleUpdates = updates.filter(u => !dismissed.has(u.id));

    if (visibleUpdates.length === 0) return null;

    return (
        <div className="space-y-3 mb-6">
            {visibleUpdates.map((update) => (
                <Card key={update.id} className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent animate-in fade-in slide-in-from-top-2 duration-500">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 animate-pulse">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-bold text-sm text-[#1D1D1F]">
                                        ✨ Stratégie mise à jour automatiquement
                                    </h3>
                                    <button
                                        onClick={() => handleDismiss(update.id)}
                                        className="shrink-0 w-6 h-6 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                                        aria-label="Fermer"
                                    >
                                        <X className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
                                <p className="text-sm text-[#6e6e73] mb-3">
                                    Votre stratégie pour <strong className="text-[#1D1D1F]">{update.brandName}</strong> a été enrichie avec les dernières actualités :
                                    <span className="italic"> "{update.source}"</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <Link href={`/brands/${update.brandId}`}>
                                        <Button size="sm" className="h-8 text-xs gap-1.5">
                                            <ExternalLink className="w-3 h-3" />
                                            Voir les changements
                                        </Button>
                                    </Link>
                                    <span className="text-xs text-muted-foreground">
                                        Mis à jour {new Date(update.updateDate).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
