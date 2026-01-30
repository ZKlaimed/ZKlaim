/**
 * Dashboard Page
 * Main interactive page for Wave 1 - shows protocol status and user registration
 */

import { useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useWalletModal } from '@demox-labs/aleo-wallet-adapter-reactui';
import { RootLayout } from '@/components/layout';
import { ProtocolStatus } from '@/components/foundation/protocol-status';
import { UserRegistration } from '@/components/foundation/user-registration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  Shield,
  Activity,
  Zap,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { publicKey, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);

  // Truncate address for display
  const truncatedAddress = publicKey
    ? `${publicKey.slice(0, 12)}...${publicKey.slice(-6)}`
    : null;

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <RootLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your ZKlaim protocol interactions
          </p>
        </div>

        {/* Not Connected State */}
        {!connected && (
          <Card className="mb-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h2 className="mb-2 text-xl font-semibold">Connect Your Wallet</h2>
              <p className="mb-6 text-center text-muted-foreground">
                Connect your wallet to interact with the ZKlaim protocol
              </p>
              <Button
                size="lg"
                onClick={() => setVisible(true)}
                disabled={connecting}
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Connected State */}
        {connected && publicKey && (
          <>
            {/* Wallet Info Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Connected Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                        {truncatedAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCopyAddress}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <a
                        href={`https://explorer.aleo.org/address/${publicKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                      <span className="mr-2 h-2 w-2 rounded-full bg-primary"></span>
                      Connected
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Row */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attestations</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Policies</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Claims</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pool Positions</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Main Content Grid - Always visible */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Protocol Status */}
          <ProtocolStatus />

          {/* User Registration */}
          <UserRegistration />
        </div>

        {/* Quick Actions - Only when connected */}
        {connected && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/coverage">
                <Card className="cursor-pointer transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <h3 className="font-semibold">Get Coverage</h3>
                      <p className="text-sm text-muted-foreground">
                        Purchase a new policy
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/pools">
                <Card className="cursor-pointer transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <h3 className="font-semibold">Provide Liquidity</h3>
                      <p className="text-sm text-muted-foreground">
                        Earn yield in risk pools
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/attestations">
                <Card className="cursor-pointer transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <h3 className="font-semibold">View Attestations</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your credentials
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
