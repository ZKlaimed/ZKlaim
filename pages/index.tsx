import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { RootLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Lock,
  Zap,
  ArrowRight,
  FileCheck,
  Activity
} from 'lucide-react';

// MagicUI animated components
import { GridPattern } from '@/components/ui/grid-pattern';
import { BlurFade } from '@/components/ui/blur-fade';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { MagicCard } from '@/components/ui/magic-card';

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
 * Feature card data for the Features section
 * Each card displays a key benefit of the ZKLAIM protocol
 */
const features = [
  {
    icon: Lock,
    title: 'Zero-Knowledge Privacy',
    description:
      'Your medical and personal data never leaves your device. ZK proofs verify claims without revealing the underlying sensitive information.',
  },
  {
    icon: Zap,
    title: 'Instant Parametric Payouts',
    description:
      'Smart contracts automatically trigger payouts when predefined conditions are met. No manual claims processing or delays.',
  },
  {
    icon: Shield,
    title: 'Trustless & Verifiable',
    description:
      'All logic is executed on-chain. Policies are immutable, and claim verification is mathematically proven correct.',
  },
];

/**
 * Step data for the How It Works section
 * Describes the user journey from policy purchase to payout
 */
const steps = [
  {
    icon: FileCheck,
    title: '1. Purchase Policy',
    description:
      'Select a policy and pay the premium. Your policy token is minted privately to your address.',
  },
  {
    icon: Activity,
    title: '2. Trigger Event',
    description:
      'When an insurable event occurs (e.g., flight delay, medical diagnosis), oracles verify the data.',
  },
  {
    icon: Zap,
    title: '3. Instant Payout',
    description:
      'Generate a ZK proof of your claim. The contract verifies it and releases funds instantly.',
  },
];

/**
 * Home Page
 * Landing page for ZKLAIM protocol featuring animated components
 */
export default function Home() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      <RootLayout>
        {/* Hero Section */}
        <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">
          {/* Background: GridPattern with highlighted squares */}
          <GridPattern
            width={40}
            height={40}
            x={-1}
            y={-1}
            strokeDasharray="0"
            squares={[
              [4, 4], [5, 1], [8, 2], [6, 6], [10, 5], [13, 3],
              [2, 8], [7, 9], [15, 7], [12, 10], [3, 12], [9, 11],
              [16, 4], [14, 8], [1, 5], [11, 2], [17, 9], [4, 10],
            ]}
            className="absolute inset-0 -z-10 h-full w-full fill-primary/[0.03] stroke-white/[0.05] dark:fill-primary/[0.08] dark:stroke-white/[0.08] [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
          />

          {/* Gradient blobs for visual depth */}
          <div className="absolute left-1/4 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-primary/30 blur-[120px]"></div>
          <div className="absolute right-1/4 bottom-1/4 -z-10 h-[350px] w-[350px] rounded-full bg-accent/25 blur-[100px]"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[150px]"></div>

          {/* Hero content with staggered BlurFade animations */}
          <BlurFade delay={0.1} direction="up">
            <span className="mb-4 inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-medium text-muted-foreground backdrop-blur-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-accent"></span>
              Live on Aleo Testnet
            </span>
          </BlurFade>

          <BlurFade delay={0.2} direction="up">
            <h1 className="mt-4 max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Privacy-Preserving Insurance <br />
              <span className="text-primary">on Aleo</span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.3} direction="up">
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Get coverage without revealing sensitive data.
              Zero-knowledge proofs verify your eligibility while keeping your information private.
            </p>
          </BlurFade>

          <BlurFade delay={0.4} direction="up">
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {/* Primary CTA: ShimmerButton for visual emphasis */}
              <ShimmerButton
                className="h-12 px-8 text-base font-medium"
                shimmerColor="hsl(var(--primary))"
                background="hsl(var(--primary))"
              >
                <Link href="/dashboard" className="flex items-center">
                  Get Coverage <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </ShimmerButton>

              {/* Secondary CTA: Standard outline button */}
              <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                <Link href="/docs">
                  Read Documentation
                </Link>
              </Button>
            </div>
          </BlurFade>
        </section>

        {/* Features Section */}
        <section className="container mx-auto py-24">
          <BlurFade delay={0.1} inView>
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why ZKlaim?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Built on the principles of privacy, automation, and trust.
              </p>
            </div>
          </BlurFade>

          {/* Feature cards with MagicCard spotlight effect */}
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <BlurFade key={feature.title} delay={0.2 + index * 0.1} inView>
                <MagicCard
                  className="h-full rounded-xl border border-border/50"
                  gradientColor="hsl(var(--primary) / 0.15)"
                  gradientFrom="hsl(var(--primary))"
                  gradientTo="hsl(var(--accent))"
                >
                  <div className="p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-3 text-base text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </MagicCard>
              </BlurFade>
            ))}
          </div>
        </section>

        {/* How it Works Section */}
        <section className="border-t bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <BlurFade delay={0.1} inView>
              <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Secure insurance in three simple steps.
                </p>
              </div>
            </BlurFade>

            {/* Steps with staggered BlurFade entrance */}
            <div className="grid gap-12 md:grid-cols-3">
              {steps.map((step, index) => (
                <BlurFade key={step.title} delay={0.2 + index * 0.15} inView>
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background border shadow-sm">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="mt-3 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto py-24 text-center">
          <BlurFade delay={0.1} inView>
            <div className="rounded-3xl bg-primary/5 px-6 py-16 md:px-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to protect what matters?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Join the future of insurance. Private, fast, and fair.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                {/* ShimmerButton for CTA emphasis */}
                <ShimmerButton
                  className="h-11 px-8 text-base font-medium"
                  shimmerColor="hsl(var(--primary))"
                  background="hsl(var(--primary))"
                >
                  <Link href="/dashboard">Launch App</Link>
                </ShimmerButton>
              </div>
            </div>
          </BlurFade>
        </section>
      </RootLayout>
    </div>
  );
}
