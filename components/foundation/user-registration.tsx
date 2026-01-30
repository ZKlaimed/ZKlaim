'use client';

/**
 * User Registration Component
 * Allows users to register on-chain with the ZKlaim protocol
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useWalletModal } from '@demox-labs/aleo-wallet-adapter-reactui';
import { FOUNDATION_PROGRAM_ID } from '@/lib/aleo/foundation';
import { config } from '@/lib/config';
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
  const { publicKey, connected, requestTransaction } = useWallet();
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

    if (!requestTransaction) {
      setError('Wallet does not support transactions. Please use Leo Wallet.');
      setStatus('error');
      return;
    }

    setStatus('registering');
    setError(null);
    setTxId(null);

    try {
      // Build the transaction request
      const txRequest = {
        address: publicKey,
        chainId: 'testnetbeta',
        transitions: [
          {
            program: FOUNDATION_PROGRAM_ID,
            functionName: 'register_user',
            inputs: [], // register_user takes no inputs
          },
        ],
        fee: 500000, // 0.5 credits in microcredits (async functions need more)
        feePrivate: false,
      };

      console.log('📤 Sending transaction request:', JSON.stringify(txRequest, null, 2));

      // Call the real register_user function on the deployed contract
      const result = await requestTransaction(txRequest);

      console.log('📥 Transaction result type:', typeof result);
      console.log('📥 Transaction result:', result);
      console.log('📥 Transaction result (stringified):', JSON.stringify(result, null, 2));

      // Extract transaction ID from result
      if (result) {
        // The result might be an object with transactionId or just a string
        let transactionId: string;
        if (typeof result === 'string') {
          transactionId = result;
        } else if (typeof result === 'object' && result !== null) {
          // Try common property names for transaction ID
          transactionId = (result as Record<string, unknown>).transactionId as string
            || (result as Record<string, unknown>).txId as string
            || (result as Record<string, unknown>).id as string
            || (result as Record<string, unknown>).transaction as string
            || JSON.stringify(result);
          console.log('📥 Extracted transaction ID:', transactionId);
        } else {
          transactionId = String(result);
        }

        setTxId(transactionId);
        setStatus('registered');
        console.log('✅ Registration successful! TX ID:', transactionId);
      } else {
        throw new Error('No transaction ID returned');
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err as object), 2));
      setStatus('error');
      setError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      );
    }
  }, [connected, publicKey, requestTransaction, setVisible]);

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

        {/* Transaction ID */}
        {txId && (
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Transaction ID</span>
              <a
                href={`${config.aleoExplorerUrl}/transaction/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <code className="mt-1 block truncate text-xs">{txId}</code>
          </div>
        )}

        {/* Error Message */}
        {error && status === 'error' && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Info box */}
        <div className="rounded-md bg-primary/10 p-3">
          <p className="text-xs text-primary">
            <strong>Note:</strong> Registration requires a small transaction fee (~0.1 credits).
            Make sure you have testnet credits in your wallet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
