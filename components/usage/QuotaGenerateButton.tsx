'use client';

import { useQuota } from '@/lib/hooks/useQuota';
import { type QuotaFeatureKey } from '@/lib/quota-config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Flame, CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface QuotaGenerateButtonProps {
    featureKey: QuotaFeatureKey;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    title?: string;
    description?: string;
    buttonText?: string;
}

export function QuotaGenerateButton({
    featureKey,
    onClick,
    loading = false,
    disabled = false,
    title = "Assistant IA",
    description = "Générez automatiquement une proposition de contenu basée sur votre stratégie marketing.",
    buttonText = "Générer une proposition"
}: QuotaGenerateButtonProps) {
    const { data: session } = useSession();
    const user = session?.user as any;
    const isFree = user?.plan === 'free' || user?.plan === 'starter';
    const status = useQuota(featureKey);

    // Fallback states as loading
    if (!status) {
        return (
            <div className="rounded-xl border border-black/5 bg-black/5 p-4 animate-pulse h-[140px]" />
        );
    }

    const { isUnlimited, limit, used, remaining, isExhausted, isAlmostFinished } = status;
    const isButtonDisabled = disabled || isExhausted || loading;

    const getNextMonthDate = () => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        d.setDate(1);
        return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(d);
    };

    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-[400px]">
                        {description}
                    </p>
                </div>

                {/* Badge de quota */}
                <div className="shrink-0">
                    {isUnlimited ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">
                                Plan Créateur · Illimité
                            </span>
                        </div>
                    ) : isExhausted ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-600 rounded-full border border-red-500/20">
                            <Flame className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">
                                {limit} / {limit} utilisés ce mois
                            </span>
                        </div>
                    ) : (
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
                            isAlmostFinished ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-black/5 text-foreground border-black/10"
                        )}>
                            <span className="text-[10px] font-bold uppercase tracking-wide">
                                {used} / {limit} utilisés ce mois
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Button
                    type="button"
                    onClick={onClick}
                    disabled={isButtonDisabled}
                    className={cn(
                        "w-full sm:w-auto h-11 gap-2 self-start font-semibold transition-all shadow-sm",
                        isUnlimited ? "bg-primary text-primary-foreground hover:bg-primary/90" :
                            isExhausted ? "bg-black/5 text-muted-foreground line-through opacity-60" :
                                "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {buttonText} {(!isExhausted && !isUnlimited && limit > 0) && `✨ (${remaining} restant${remaining > 1 ? 's' : ''})`}
                </Button>

                {(!isUnlimited && remaining > 0 && remaining <= 2) && (
                    <div className="w-full sm:max-w-xs mt-1">
                        <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all"
                                style={{ width: `${(used / limit) * 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-medium text-amber-600 mt-1">
                            Il vous reste {remaining} génération{remaining > 1 ? 's' : ''} gratuite{remaining > 1 ? 's' : ''} ce mois.
                        </p>
                    </div>
                )}
            </div>

            {isExhausted && (
                <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Lock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                Quota mensuel atteint
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                                Débloquez les générations illimitées pour booster votre création de contenu.
                            </p>
                            <p className="text-[10px] text-blue-600/60 dark:text-blue-400/60 mt-1 uppercase tracking-wider font-semibold">
                                Renouvellement le {getNextMonthDate()}
                            </p>
                        </div>
                    </div>
                    <Link href="/auth/choose-plan" className="shrink-0 w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20">
                            Passer au plan Créateur →
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
