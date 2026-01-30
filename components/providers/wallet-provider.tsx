'use client';

import { useMemo } from 'react';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import {
  DecryptPermission,
  WalletAdapterNetwork,
} from '@demox-labs/aleo-wallet-adapter-base';
import {
  LeoWalletAdapter,
  PuzzleWalletAdapter,
  FoxWalletAdapter,
  SoterWalletAdapter,
} from 'aleo-adapters';

// Import the wallet adapter UI styles
import '@demox-labs/aleo-wallet-adapter-reactui/dist/styles.css';

/**
 * AleoWalletProvider
 * Wraps the application with Aleo wallet connection context.
 * Supports Leo, Puzzle, Fox, and Soter wallets.
 */
export function AleoWalletProvider({ children }: { children: React.ReactNode }) {
  // Initialize wallet adapters - memoized to prevent recreation on every render
  const wallets = useMemo(() => [
    new LeoWalletAdapter({ appName: 'ZKLAIM' }),
    new PuzzleWalletAdapter({
      programIdPermissions: { [WalletAdapterNetwork.TestnetBeta]: [] },
      appName: 'ZKLAIM',
      appDescription: 'Privacy-preserving insurance on Aleo',
    }),
    new FoxWalletAdapter({ appName: 'ZKLAIM' }),
    new SoterWalletAdapter({ appName: 'ZKLAIM' }),
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
