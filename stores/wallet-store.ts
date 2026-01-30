/**
 * Wallet Store
 * Global state management for wallet connection using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WalletAdapter } from '@/lib/wallet/adapter';
import { mockWallet, getWalletByName, getAvailableWallets } from '@/lib/wallet';

/**
 * Wallet store state interface
 */
interface WalletState {
  // Connection state
  wallet: WalletAdapter | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  // Account info
  address: string | null;
  balance: bigint | null;

  // Persisted preferences
  lastWalletName: string | null;
  autoConnect: boolean;

  // Actions
  connect: (wallet?: WalletAdapter) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  setAutoConnect: (enabled: boolean) => void;
  clearError: () => void;
}

/**
 * Zustand wallet store with persistence
 */
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      wallet: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      address: null,
      balance: null,
      lastWalletName: null,
      autoConnect: false,

      /**
       * Connect to a wallet
       */
      connect: async (walletToConnect?: WalletAdapter) => {
        const { wallet: currentWallet, lastWalletName } = get();

        // Determine which wallet to connect
        let targetWallet = walletToConnect;

        if (!targetWallet) {
          // Try to use the last connected wallet
          if (lastWalletName) {
            targetWallet = getWalletByName(lastWalletName);
          }

          // Fall back to first available wallet
          if (!targetWallet) {
            const available = getAvailableWallets();
            if (available.length > 0) {
              targetWallet = available[0];
            }
          }
        }

        if (!targetWallet) {
          set({ error: 'No wallet available' });
          return;
        }

        // Don't reconnect if already connected to same wallet
        if (currentWallet === targetWallet && get().isConnected) {
          return;
        }

        set({ isConnecting: true, error: null });

        try {
          await targetWallet.connect();

          const address = await targetWallet.getAddress();
          const balance = await targetWallet.getBalance();

          set({
            wallet: targetWallet,
            isConnected: true,
            isConnecting: false,
            address,
            balance,
            lastWalletName: targetWallet.name,
            error: null,
          });

          // Set up event listeners
          targetWallet.on('disconnect', () => {
            set({
              isConnected: false,
              address: null,
              balance: null,
            });
          });

          targetWallet.on('accountChange', async () => {
            const newAddress = await targetWallet!.getAddress();
            const newBalance = await targetWallet!.getBalance();
            set({ address: newAddress, balance: newBalance });
          });
        } catch (error) {
          set({
            isConnecting: false,
            error: error instanceof Error ? error.message : 'Failed to connect',
          });
        }
      },

      /**
       * Disconnect from wallet
       */
      disconnect: async () => {
        const { wallet } = get();

        if (wallet) {
          try {
            await wallet.disconnect();
          } catch (error) {
            console.error('Error disconnecting wallet:', error);
          }
        }

        set({
          wallet: null,
          isConnected: false,
          address: null,
          balance: null,
          error: null,
        });
      },

      /**
       * Refresh balance
       */
      refreshBalance: async () => {
        const { wallet, isConnected } = get();

        if (!wallet || !isConnected) {
          return;
        }

        try {
          const balance = await wallet.getBalance();
          set({ balance });
        } catch (error) {
          console.error('Error refreshing balance:', error);
        }
      },

      /**
       * Enable/disable auto-connect
       */
      setAutoConnect: (enabled: boolean) => {
        set({ autoConnect: enabled });
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'zklaim-wallet',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields
      partialize: (state) => ({
        lastWalletName: state.lastWalletName,
        autoConnect: state.autoConnect,
      }),
    }
  )
);

/**
 * Hook for auto-connecting on mount
 */
export function useAutoConnect() {
  const { autoConnect, connect, isConnected, isConnecting } = useWalletStore();

  // Auto-connect on mount if enabled
  if (autoConnect && !isConnected && !isConnecting) {
    connect();
  }
}

/**
 * Format balance for display
 */
export function formatBalance(microcredits: bigint | null): string {
  if (microcredits === null) {
    return '0';
  }

  // Convert microcredits to credits (1 credit = 1,000,000 microcredits)
  const credits = Number(microcredits) / 1_000_000;

  if (credits >= 1_000_000) {
    return `${(credits / 1_000_000).toFixed(2)}M`;
  }
  if (credits >= 1_000) {
    return `${(credits / 1_000).toFixed(2)}K`;
  }
  return credits.toFixed(2);
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string | null): string {
  if (!address) {
    return '';
  }
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
