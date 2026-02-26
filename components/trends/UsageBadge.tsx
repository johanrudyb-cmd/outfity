'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import { isFreePlan } from '@/lib/plan-utils';

interface UsageBadgeProps {
    count: number | null;
    plan: string;
    limit?: number;
    className?: string;
}

export function UsageBadge({ count, plan, limit, className }: UsageBadgeProps) {
    const isFree = isFreePlan(plan);
    // Use passed limit, or fallback to config-based defaults (3 for free, 10 for others as safe default)
    const maxAnalyses = limit ?? (isFree ? 3 : 10);
    const safeCount = count ?? 0;
    const percent = Math.min((safeCount / maxAnalyses) * 100, 100);
    const remaining = Math.max(0, maxAnalyses - safeCount);

    if (maxAnalyses === -1) return null; // Unlimited

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-xl border border-black/[0.05] rounded-2xl shadow-apple-sm",
                className
            )}
        >
            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                <Target className="w-4 h-4 text-black" />
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">Analyses</span>
                    <span className="text-[10px] font-bold text-[#6e6e73]">{remaining} restantes</span>
                </div>

                {/* Apple Style Progress Bar */}
                <div className="w-32 h-1 bg-black/5 rounded-full mt-1.5 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                        className={cn(
                            "h-full rounded-full",
                            percent >= 100 ? "bg-[#FF3B30]" : "bg-black"
                        )}
                    />
                </div>
            </div>
        </motion.div>
    );
}
