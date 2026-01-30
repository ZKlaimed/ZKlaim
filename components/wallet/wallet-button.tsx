'use client';

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useWalletModal } from '@demox-labs/aleo-wallet-adapter-reactui';
import { Wallet, LogOut, Copy, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WalletButtonProps {
  /** Additional className for the button */
  className?: string;
  /** Size variant for the button */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Whether this is used in mobile nav (full width) */
  fullWidth?: boolean;
}

/**
 * WalletButton Component
 * Handles wallet connection/disconnection with Aleo wallets.
 * Shows connect button when disconnected, address + dropdown when connected.
 */
export function WalletButton({ className, size = 'default', fullWidth = false }: WalletButtonProps) {
  const { publicKey, wallet, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);

  // Truncate address for display (e.g., "aleo1abc...xyz")
  const truncatedAddress = publicKey
    ? `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}`
    : null;

  // Copy address to clipboard
  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle connect button click - opens wallet modal
  const handleConnect = () => {
    setVisible(true);
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  // Not connected - show connect button
  if (!publicKey) {
    return (
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className={`gap-2 ${fullWidth ? 'w-full' : ''} ${className || ''}`}
        size={size}
      >
        <Wallet className="h-4 w-4" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  // Connected - show address with dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`gap-2 ${fullWidth ? 'w-full justify-between' : ''} ${className || ''}`}
          size={size}
        >
          <div className="flex items-center gap-2">
            {/* Wallet icon or logo */}
            {wallet?.adapter.icon ? (
              <img
                src={wallet.adapter.icon}
                alt={wallet.adapter.name}
                className="h-4 w-4 rounded-sm"
              />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            <span className="font-mono text-sm">{truncatedAddress}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Copy address option */}
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Address
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Disconnect option */}
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
