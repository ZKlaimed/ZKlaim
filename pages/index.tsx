import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { RootLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Shield,
  Lock,
  Zap,
  ArrowRight,
  FileCheck,
  Activity
} from 'lucide-react';

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
        <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 top-0 -z-10 h-[310px] w-[310px] rounded-full bg-primary/20 blur-[100px]"></div>
          <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-accent/20 blur-[100px]"></div>

          <div className="animate-in fade-in zoom-in duration-700 slide-in-from-bottom-4">
            <span className="mb-4 inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-medium text-muted-foreground backdrop-blur-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-accent"></span>
              Live on Aleo Testnet
            </span>
            <h1 className="mt-4 max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Privacy-Preserving Insurance <br />
              <span className="text-primary">on Aleo</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Get coverage without revealing sensitive data.
              Zero-knowledge proofs verify your eligibility while keeping your information private.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-8 text-base">
                <Link href="/dashboard">
                  Get Coverage <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                <Link href="/docs">
                  Read Documentation
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto py-24">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why ZKLAIM?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built on the principles of privacy, automation, and trust.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle>Zero-Knowledge Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Your medical and personal data never leaves your device.
                  ZK proofs verify claims without revealing the underlying sensitive information.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle>Instant Parametric Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Smart contracts automatically trigger payouts when predefined conditions are met.
                  No manual claims processing or delays.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>Trustless & Verifiable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  All logic is executed on-chain. Policies are immutable, and claim verification
                  is mathematically proven correct.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="border-t bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Secure insurance in three simple steps.
              </p>
            </div>

            <div className="grid gap-12 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background border shadow-sm">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">1. Purchase Policy</h3>
                <p className="mt-3 text-muted-foreground">
                  Select a policy and pay the premium. Your policy token is minted privately to your address.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background border shadow-sm">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">2. Trigger Event</h3>
                <p className="mt-3 text-muted-foreground">
                  When an insurable event occurs (e.g., flight delay, medical diagnosis), oracles verify the data.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background border shadow-sm">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">3. Instant Payout</h3>
                <p className="mt-3 text-muted-foreground">
                  Generate a ZK proof of your claim. The contract verifies it and releases funds instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto py-24 text-center">
          <div className="rounded-3xl bg-primary/5 px-6 py-16 md:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to protect what matters?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Join the future of insurance. Private, fast, and fair.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">Launch App</Link>
              </Button>
            </div>
          </div>
        </section>
      </RootLayout>
    </div>
  );
}
