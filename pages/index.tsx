import { Geist, Geist_Mono } from 'next/font/google';
import { RootLayout } from '@/components/layout';

// Load Geist fonts
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * Home Page
 * Landing page for ZKLAIM protocol
 */
export default function Home() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      <RootLayout>
        {/* Hero Section */}
        <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Privacy-Preserving Insurance
            <span className="block text-primary">on Aleo</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Get coverage without revealing sensitive data.
            Zero-knowledge proofs verify your eligibility while keeping your information private.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Coverage
            </a>
            <a
              href="#"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Learn More
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Data never leaves your device</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Cryptographic proofs</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Instant parametric payouts</span>
            </div>
          </div>
        </section>
      </RootLayout>
    </div>
  );
}
