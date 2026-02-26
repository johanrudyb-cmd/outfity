import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: ReactNode;
    className?: string;
}

export function SectionHeader({ title, description, icon: Icon, action, className }: SectionHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-start justify-between gap-4", className)}>
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    {Icon && <Icon className="w-7 h-7" />}
                    {title}
                </h1>
                {description && (
                    <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div className="shrink-0 flex items-center gap-3">
                    {action}
                </div>
            )}
        </div>
    );
}
