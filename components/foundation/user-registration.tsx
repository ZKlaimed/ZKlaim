'use client';

/**
 * User Registration Component
 * Allows users to register on-chain with the ZKLAIM protocol
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWalletStore } from '@/stores/wallet-store';
import { registerUser, verifyUserRegistration } from '@/lib/aleo/foundation';
import { UserPlus, CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

/**
 * Registration status
 */
type RegistrationStatus = 'unknown' | 'checking' | 'registered' | 'not_registered' | 'registering' | 'error';

export function UserRegistration() {
  const { wallet, isConnected, address } = useWalletStore();
  const [status, setStatus] = useState<RegistrationStatus>('unknown');
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if user is registered
   */
  const handleCheckRegistration = useCallback(async () => {
    if (!wallet) return;

    setStatus('checking');
    setError(null);

    try {
      const result = await verifyUserRegistration(wallet);
      setStatus(result.isRegistered ? 'registered' : 'not_registered');
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to check registration');
    }
  }, [wallet]);

  /**
   * Register user on-chain
   */
  const handleRegister = useCallback(async () => {
    if (!wallet) return;

    setStatus('registering');
    setError(null);
    setTxId(null);

    try {
      const result = await registerUser(wallet);

      if (result.success) {
        setTxId(result.txId);
        setStatus('registered');
      } else {
        setStatus('error');
        setError(result.error ?? 'Registration failed');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }, [wallet]);

  // Not connected state
  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <UserPlus className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Connect your wallet to register with the ZKLAIM protocol
          </p>
        </CardContent>
      </Card>
    );
  }

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
          <Badge variant="default">
            <CheckCircle className="mr-1 h-3 w-3" />
            Registered
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          User Registration
        </CardTitle>
        <CardDescription>
          Register on-chain to use the ZKLAIM protocol
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Address */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Address</span>
          <span className="font-mono text-xs">
            {address ? `${address.slice(0, 10)}...${address.slice(-6)}` : 'N/A'}
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
            onClick={handleCheckRegistration}
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

        {/* Transaction ID */}
        {txId && (
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Transaction ID</span>
              <a
                href={`https://explorer.aleo.org/transaction/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <code className="mt-1 block truncate text-xs">
              {txId}
            </code>
          </div>
        )}

        {/* Error Message */}
        {error && status === 'error' && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
