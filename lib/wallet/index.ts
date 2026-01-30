/**
 * Wallet Module Exports
 */

export * from './adapter';
export * from './mock-wallet';

import { WalletAdapter } from './adapter';
import { mockWallet } from './mock-wallet';

/**
 * Available wallets
 * In production, this would include real wallet adapters
 */
export const availableWallets: WalletAdapter[] = [
  mockWallet,
  // TODO: Add real wallets when available
  // new LeoWalletAdapter(),
  // new PuzzleWalletAdapter(),
];

/**
 * Get wallet by name
 */
export function getWalletByName(name: string): WalletAdapter | undefined {
  return availableWallets.find((w) => w.name === name);
}

/**
 * Get available (installed) wallets
 */
export function getAvailableWallets(): WalletAdapter[] {
  return availableWallets.filter((w) => w.isAvailable());
}
