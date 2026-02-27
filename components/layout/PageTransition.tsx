import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div className={cn('w-full flex-1 flex flex-col', className)}>
      {children}
    </div>
  );
}
