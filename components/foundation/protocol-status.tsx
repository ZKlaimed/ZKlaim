'use client';

/**
 * Protocol Status Component
 * Displays the connection status to the ZKLAIM protocol and Aleo network
 */

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  pingContract,
  getProtocolInfo,
  PROTOCOL_VERSION,
} from '@/lib/aleo/foundation';
import { CheckCircle, XCircle, RefreshCw, Zap, Wifi, WifiOff } from 'lucide-react';

/**
 * Protocol status data
 */
interface ProtocolStatusData {
  contractConnected: boolean;
  contractVersion: number;
  networkConnected: boolean;
  latestBlock: number | null;
  error?: string;
}

export function ProtocolStatus() {
  const [status, setStatus] = useState<ProtocolStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check protocol and network status
   */
  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const info = await getProtocolInfo();

      setStatus({
        contractConnected: info.deployed,
        contractVersion: info.version,
        networkConnected: info.networkHeight !== null,
        latestBlock: info.networkHeight,
        error: info.error,
      });
    } catch (error) {
      // Handle errors gracefully - don't crash the UI
      console.error('Protocol status check failed:', error);
      setStatus({
        contractConnected: false,
        contractVersion: 0,
        networkConnected: false,
        latestBlock: null,
        error: 'Unable to connect to network. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Loading state
  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Protocol Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format version number (10000 -> v1.0)
  const formatVersion = (version: number): string => {
    if (version === 0) return 'N/A';
    const major = Math.floor(version / 10000);
    const minor = Math.floor((version % 10000) / 100);
    return `v${major}.${minor}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Protocol Status
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={checkStatus}
          disabled={loading}
          title="Refresh status"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            {status?.networkConnected ? (
              <Wifi className="h-4 w-4 text-primary" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            Network
          </span>
          <Badge variant={status?.networkConnected ? 'default' : 'destructive'}>
            {status?.networkConnected ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Disconnected
              </>
            )}
          </Badge>
        </div>

        {/* Contract Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Contract</span>
          <Badge
            variant={
              status?.contractConnected
                ? 'default'
                : status?.networkConnected
                  ? 'secondary'
                  : 'outline'
            }
          >
            {status?.contractConnected ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Deployed
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Not Deployed
              </>
            )}
          </Badge>
        </div>

        {/* Version */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Version</span>
          <span className="font-mono text-sm">
            {formatVersion(status?.contractVersion ?? 0)}
          </span>
        </div>

        {/* Latest Block */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Latest Block</span>
          <span className="font-mono text-sm">
            {status?.latestBlock?.toLocaleString() ?? 'N/A'}
          </span>
        </div>

        {/* Error message if any */}
        {status?.error && !status.contractConnected && (
          <div className="rounded-md bg-muted p-2">
            <p className="text-xs text-muted-foreground">
              {status.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
