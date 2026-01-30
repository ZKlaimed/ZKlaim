'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Show icon only (no wordmark) */
  iconOnly?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

// Size mappings for the logo image (width x height in pixels)
const imageSizeMap = {
  sm: { width: 24, height: 24 },
  md: { width: 32, height: 32 },
  lg: { width: 48, height: 48 },
};

// Text size classes for the wordmark
const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-3xl',
};

/**
 * Logo Component
 * ZKLAIM brand mark using the official logo.jpeg
 * Displays the logo image with optional wordmark text
 */
export function Logo({ iconOnly = false, size = 'md', className }: LogoProps) {
  const { width, height } = imageSizeMap[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Logo image from /public/logo.jpeg */}
      <Image
        src="/logo.jpeg"
        alt="ZKLAIM Logo"
        width={width}
        height={height}
        className="rounded-md object-contain"
        priority
      />

      {/* Wordmark */}
      {!iconOnly && (
        <span
          className={cn(
            'font-bold tracking-tight text-foreground',
            textSizeClasses[size]
          )}
        >
          ZKlaim
        </span>
      )}

      {/* Screen reader text for icon-only variant */}
      {iconOnly && <span className="sr-only">ZKlaim</span>}
    </div>
  );
}
