import { cn } from '@/lib/utils';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel?: string;
    actionHref?: string;
    onClick?: () => void;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    actionLabel,
    actionHref,
    onClick,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 px-6 text-center bg-white rounded-3xl border border-dashed border-[#E5E5EA] transition-all hover:bg-[#F2F2F7]/30",
            className
        )}>
            <div className="w-16 h-16 rounded-2xl bg-[#F2F2F7] flex items-center justify-center mb-4 text-[#86868B]">
                <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mb-2">{title}</h3>
            <p className="text-sm text-[#86868B] max-w-xs mb-6">
                {description}
            </p>

            {actionHref ? (
                <Link href={actionHref}>
                    <Button className="bg-[#007AFF] hover:bg-[#0056CC] rounded-full px-6 font-semibold gap-2 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all border-none">
                        <Plus className="w-4 h-4" />
                        {actionLabel}
                    </Button>
                </Link>
            ) : onClick ? (
                <Button
                    onClick={onClick}
                    className="bg-[#007AFF] hover:bg-[#0056CC] rounded-full px-6 font-semibold gap-2 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all border-none"
                >
                    <Plus className="w-4 h-4" />
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    );
}
