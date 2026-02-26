import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    description: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon = AlertCircle, title, description, action, className }: EmptyStateProps) {
    return (
        <Card className={cn("border-2 border-dashed border-gray-100 bg-white/50 backdrop-blur-sm", className)}>
            <CardContent className="py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <Icon className="w-10 h-10 text-gray-200" />
                </div>
                {title && <h3 className="text-lg font-black uppercase text-black tracking-tight">{title}</h3>}
                <p className="text-xs font-bold text-gray-400 max-w-sm mx-auto">
                    {description}
                </p>
                {action && (
                    <div className="pt-4 flex justify-center">
                        {action}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
