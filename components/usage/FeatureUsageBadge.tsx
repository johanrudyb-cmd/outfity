'use client';

import { useQuota } from '@/lib/hooks/useQuota';
import { type QuotaFeatureKey } from '@/lib/quota-config';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertCircle } from 'lucide-react';
import { useSurplusModal } from './SurplusModalContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FeatureUsageBadgeProps {
    featureKey: QuotaFeatureKey;
    showLabel?: boolean;
    className?: string;
    isFree?: boolean;
}

export function FeatureUsageBadge({ featureKey, showLabel = true, className, isFree: isFreeProp }: FeatureUsageBadgeProps) {
    const status = useQuota(featureKey);
    const openSurplusModal = useSurplusModal();
    const router = useRouter();
    const { data: session } = useSession();

    const user = session?.user as any;
    const isFreeUser = user?.plan === 'free' || user?.plan === 'starter';
    const isFree = isFreeProp !== undefined ? isFreeProp : isFreeUser;

    if (!status || status.isUnlimited) return null;

    const { remaining, limit, used, isAlmostFinished, isExhausted } = status;
    const percent = Math.min(100, Math.max(0, (remaining / limit) * 100));

    const handleClick = () => {
        if (isFree) {
            router.push('/auth/choose-plan');
        } else {
            openSurplusModal();
        }
    };

    return (
        <div className={cn("inline-flex flex-col gap-1.5", className)}>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/5 rounded-full border border-black/5">
                    <Zap className={cn("w-3 h-3", isExhausted ? "text-red-500" : remaining <= 2 ? "text-amber-500" : "text-primary")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">
                        {isExhausted ? "Quota épuisé" : `${remaining} utilisations restantes`}
                    </span>
                </div>

                {(isAlmostFinished || isExhausted) && (
                    <button
                        onClick={handleClick}
                        className={cn(
                            "text-[9px] font-black uppercase tracking-widest underline underline-offset-2",
                            isExhausted ? "text-red-600 hover:text-red-700 font-black" : "text-amber-600 hover:text-amber-700"
                        )}
                    >
                        {isFree ? "Passer Créateur" : "Recharger"}
                    </button>
                )}
            </div>

            <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={cn(
                        "h-full rounded-full transition-colors duration-500",
                        isExhausted ? "bg-red-500" : percent <= 20 ? "bg-amber-500" : "bg-primary"
                    )}
                />
            </div>
        </div>
    );
}
