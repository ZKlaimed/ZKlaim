'use client';

/**
 * User Registration Component
 * Allows users to register on-chain with the ZKlaim protocol
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useWalletModal } from '@demox-labs/aleo-wallet-adapter-reactui';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  Wallet,
} from 'lucide-react';

/**
 * Registration status
 */
type RegistrationStatus =
  | 'unknown'
  | 'checking'
  | 'registered'
  | 'not_registered'
  | 'registering'
  | 'error';

export function UserRegistration() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [status, setStatus] = useState<RegistrationStatus>('unknown');
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Register user on-chain by calling the contract
   */
  const handleRegister = useCallback(async () => {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setStatus('registering');
    setError(null);
    setTxId(null);

    try {
      // Note: The contract must be deployed to testnet before this will work
      // For now, simulate the registration process

      // In production, this would call:
      // const result = await requestTransaction?.({...transaction});

      // Simulate a transaction for demo purposes
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate a mock transaction ID
      const mockTxId = `at1${Array.from({ length: 62 }, () =>
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('')}`;

      setTxId(mockTxId);
      setStatus('registered');

      // Show success message
      setError(null);
    } catch (err) {
      console.error('Registration error:', err);
      setStatus('error');
      setError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      );
    }
  }, [connected, publicKey, setVisible]);

  /**
   * Simulate checking registration status
   * In production, this would query the contract's registered_users mapping
   */
  const handleCheckStatus = useCallback(async () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    setStatus('checking');
    setError(null);

    try {
      // Simulate checking - in production, query the contract
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For now, we'll show as not registered since we can't query yet
      setStatus('not_registered');
    } catch (err) {
      setStatus('error');
      setError('Failed to check registration status');
    }
  }, [connected, setVisible]);

  // Get status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'unknown':
        return <Badge variant="secondary">Unknown</Badge>;
      case 'checking':
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Checking...
          </Badge>
        );
      case 'registered':
        return (
          <Badge variant="secondary" className="text-amber-600 dark:text-amber-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Registered (Simulated)
          </Badge>
        );
      case 'not_registered':
        return <Badge variant="outline">Not Registered</Badge>;
      case 'registering':
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Registering...
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const isLoading = status === 'checking' || status === 'registering';

  // Not connected state
  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            User Registration
          </CardTitle>
          <CardDescription>
            Register on-chain to use the ZKlaim protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Wallet className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="mb-4 text-center text-muted-foreground">
            Connect your wallet to register
          </p>
          <Button onClick={() => setVisible(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          User Registration
        </CardTitle>
        <CardDescription>
          Register on-chain to use the ZKlaim protocol
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Address */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Address</span>
          <span className="font-mono text-xs">
            {publicKey ? `${publicKey.slice(0, 10)}...${publicKey.slice(-6)}` : 'N/A'}
          </span>
        </div>

        {/* Registration Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          {getStatusBadge()}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCheckStatus}
            disabled={isLoading}
            className="flex-1"
          >
            {status === 'checking' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Status'
            )}
          </Button>

          {status !== 'registered' && (
            <Button
              onClick={handleRegister}
              disabled={isLoading}
              className="flex-1"
            >
              {status === 'registering' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
                </>
              )}
            </Button>
          )}
        </div>

        {/* Transaction ID (Simulated) */}
        {txId && (
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Transaction ID</span>
              <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400 border-amber-500/50">
                Simulated
              </Badge>
            </div>
            <code className="mt-1 block truncate text-xs">{txId}</code>
            <p className="mt-2 text-xs text-muted-foreground italic">
              This is a simulated transaction. The contract is not yet deployed to testnet.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && status === 'error' && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Demo mode notice */}
        <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            <strong>Demo Mode:</strong> The zklaim_foundation contract is not yet deployed to testnet.
            Registration is simulated for demonstration purposes.
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-md bg-blue-500/10 p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <strong>Note:</strong> Once deployed, registration will require a small transaction fee.
            Make sure you have testnet credits in your wallet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
