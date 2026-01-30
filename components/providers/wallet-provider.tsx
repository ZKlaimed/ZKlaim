'use client';

import { useMemo } from 'react';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import {
  DecryptPermission,
  WalletAdapterNetwork,
} from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';

// Import the wallet adapter UI styles
import '@demox-labs/aleo-wallet-adapter-reactui/dist/styles.css';

/**
 * AleoWalletProvider
 * Wraps the application with Aleo wallet connection context.
 * Currently supports Leo Wallet (most widely used Aleo wallet).
 * Additional wallets can be added as their adapters become available.
 */
export function AleoWalletProvider({ children }: { children: React.ReactNode }) {
  // Initialize wallet adapters - memoized to prevent recreation on every render
  // Leo Wallet is the primary Aleo wallet
  const wallets = useMemo(() => [
    new LeoWalletAdapter({ appName: 'ZKLAIM' }),
  ], []);

  return (
    <WalletProvider
      wallets={wallets}
      network={WalletAdapterNetwork.TestnetBeta}
      decryptPermission={DecryptPermission.UponRequest}
      autoConnect
    >
      <WalletModalProvider>{children}</WalletModalProvider>
    </WalletProvider>
  );
}
