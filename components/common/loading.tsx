'use client';

import { Loader2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingProps {
  /** Loading variant */
  variant?: 'spinner' | 'skeleton' | 'proof';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading text (for screen readers and optionally visible) */
  label?: string;
  /** Show label visually */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Spinner size mappings
const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

// Text size mappings
const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

/**
 * Loading Component
 * Loading indicators for async operations
 * Supports spinner, skeleton, and ZK proof generation variants
 */
export function Loading({
  variant = 'spinner',
  size = 'md',
  label = 'Loading...',
  showLabel = false,
  className,
}: LoadingProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-2', className)} role="status" aria-busy="true">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'proof') {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6',
          className
        )}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        {/* Animated shield icon */}
        <div className="relative">
          <Shield className="h-12 w-12 animate-pulse text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        </div>

        {/* Progress text */}
        <div className="text-center">
          <p className="font-medium text-foreground">Generating Zero-Knowledge Proof</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This may take a moment. Your data never leaves your device.
          </p>
        </div>

        {/* Progress bar skeleton */}
        <div className="w-full max-w-xs">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Default spinner variant
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="status"
      aria-busy="true"
    >
      <Loader2 className={cn('animate-spin text-primary', spinnerSizes[size])} />
      {showLabel ? (
        <span className={cn('text-muted-foreground', textSizes[size])}>{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

/**
 * SkeletonCard Component
 * Pre-styled skeleton for card-like content
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card p-6', className)}
      role="status"
      aria-busy="true"
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
