'use client';

import { Header } from './header';
import { Footer } from './footer';

interface RootLayoutProps {
  children: React.ReactNode;
  /** Hide footer on certain pages like checkout */
  hideFooter?: boolean;
  /** Full-width mode (no max-width constraint) */
  fullWidth?: boolean;
}

/**
 * RootLayout Component
 * Application shell that wraps all pages with consistent header, footer, and layout
 */
export function RootLayout({
  children,
  hideFooter = false,
  fullWidth = false,
}: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      {/* Header */}
      <Header />

      {/* Main content area */}
      <main
        id="main-content"
        className={`flex-1 ${fullWidth ? '' : 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'}`}
      >
        {children}
      </main>

      {/* Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
}
