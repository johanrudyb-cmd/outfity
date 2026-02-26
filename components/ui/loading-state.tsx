import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
    title?: string;
    description?: string;
    className?: string;
    icon?: ReactNode;
}

export function LoadingState({ title = "Chargement en cours...", description, className, icon }: LoadingStateProps) {
    return (
        <div className={cn("flex items-center justify-center min-h-[300px] w-full animate-in fade-in duration-500", className)}>
            <div className="flex flex-col items-center gap-4 text-center p-6">
                {icon ? icon : (
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin" />
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest animate-pulse">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-xs font-bold text-gray-500 mt-2">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
