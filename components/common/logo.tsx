'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  /** Show icon only (no wordmark) */
  iconOnly?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

// Size mappings for the logo
const sizeClasses = {
  sm: 'h-6',   // 24px
  md: 'h-8',   // 32px (default)
  lg: 'h-12', // 48px
};

const iconSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-3xl',
};

/**
 * Logo Component
 * ZKLAIM brand mark with shield icon and wordmark
 * Conveys privacy, security, and zero-knowledge technology
 */
export function Logo({ iconOnly = false, size = 'md', className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Shield icon with ZK */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
          iconSizeClasses[size]
        )}
      >
        {/* Shield shape */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cn('absolute', iconSizeClasses[size])}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        {/* ZK text overlay */}
        <span
          className={cn(
            'relative z-10 font-bold text-background',
            size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[10px]' : 'text-sm'
          )}
        >
          ZK
        </span>
      </div>

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className={cn(
            'font-bold tracking-tight text-foreground',
            textSizeClasses[size]
          )}
        >
          ZKLAIM
        </span>
      )}

      {/* Screen reader text for icon-only variant */}
      {iconOnly && <span className="sr-only">ZKLAIM</span>}
    </div>
  );
}
