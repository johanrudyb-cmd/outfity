import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      loading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // We separate motion props from standard button props to avoid type conflicts
    const {
      onDrag, onDragStart, onDragEnd, onDirectionLock, onPan, onPanStart, onPanEnd,
      ...buttonProps
    } = props as any;

    const baseStyles =
      'inline-flex items-center justify-center rounded-full font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      default:
        'bg-black text-white hover:bg-zinc-800',
      secondary:
        'bg-[#007AFF] text-white hover:bg-[#0056CC]',
      outline:
        'bg-white/80 backdrop-blur-sm text-[#1D1D1F] hover:bg-white border border-black/5 shadow-apple',
      ghost: 'hover:bg-black/5 text-[#1D1D1F] hover:text-[#007AFF]',
      destructive:
        'bg-[#FF3B30] text-white hover:bg-[#FF2D20]',
    };

    const sizes = {
      sm: 'h-9 min-h-[44px] sm:min-h-0 px-5 text-sm',
      md: 'h-11 min-h-[44px] px-6 text-base tracking-tight',
      lg: 'h-12 min-h-[44px] px-8 text-lg tracking-tight',
      icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
    };

    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...buttonProps}
      >
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mr-2"
            >
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
