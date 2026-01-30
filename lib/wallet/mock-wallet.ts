/**
 * Mock Wallet
 * Development wallet for testing without a real wallet extension
 */

import {
  BaseWalletAdapter,
  SignedTransaction,
  UnsignedTransaction,
} from './adapter';

/**
 * Generate a random hex string
 */
function generateRandomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Simulate network delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock wallet for development and testing
 */
export class MockWallet extends BaseWalletAdapter {
  name = 'Mock Wallet';
  icon = '/icons/mock-wallet.svg';

  private address: string | null = null;
  private viewKey: string | null = null;
  private connected = false;
  private balance = BigInt(1_000_000_000_000); // 1000 Aleo credits (in microcredits)

  // Transaction counter for generating unique tx IDs
  private txCounter = 0;

  isAvailable(): boolean {
    // Mock wallet is always available in development
    return process.env.NODE_ENV === 'development' || true;
  }

  async connect(): Promise<void> {
    // Simulate connection delay
    await delay(800);

    // Generate mock address (aleo1...)
    this.address = 'aleo1' + generateRandomHex(58);
    this.viewKey = 'AViewKey1' + generateRandomHex(50);
    this.connected = true;

    // Emit connect event
    this.emit('connect');
  }

  async disconnect(): Promise<void> {
    await delay(200);

    this.address = null;
    this.viewKey = null;
    this.connected = false;

    // Emit disconnect event
    this.emit('disconnect');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getAddress(): Promise<string> {
    if (!this.connected || !this.address) {
      throw new Error('Wallet not connected');
    }
    return this.address;
  }

  async getViewKey(): Promise<string> {
    if (!this.connected || !this.viewKey) {
      throw new Error('Wallet not connected');
    }
    return this.viewKey;
  }

  async getBalance(): Promise<bigint> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }
    return this.balance;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    await delay(500);

    // Generate mock signature
    const messageHash = generateRandomHex(64);
    return `sign1${messageHash}`;
  }

  async signTransaction(tx: UnsignedTransaction): Promise<SignedTransaction> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    await delay(1000);

    // Generate mock transaction and signature
    this.txCounter++;
    const txId = `at1${generateRandomHex(62)}`;
    const signature = `sign1${generateRandomHex(64)}`;

    return {
      transaction: txId,
      signature,
    };
  }

  // Mock-specific methods for testing

  /**
   * Set the mock balance (for testing)
   */
  setBalance(balance: bigint): void {
    this.balance = balance;
  }

  /**
   * Simulate balance change (e.g., after a transaction)
   */
  adjustBalance(amount: bigint): void {
    this.balance += amount;
    if (this.balance < 0n) {
      this.balance = 0n;
    }
  }
}

/**
 * Singleton mock wallet instance
 */
export const mockWallet = new MockWallet();
