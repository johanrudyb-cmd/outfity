import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    iconColor = 'text-white',
    iconBg = 'bg-[#007AFF]',
    children,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("space-y-4 mb-8 sm:mb-12", className)}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", iconBg)}>
                            <Icon className={cn("w-6 h-6", iconColor)} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] leading-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm sm:text-base text-[#1D1D1F]/60 mt-1 max-w-xl">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {children && (
                    <div className="flex items-center gap-3 shrink-0">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
