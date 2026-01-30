/**
 * Wallet Adapter Interface
 * Unified interface for all Aleo wallets (Leo Wallet, Puzzle, etc.)
 */

/**
 * Wallet events
 */
export type WalletEvent = 'connect' | 'disconnect' | 'accountChange';

/**
 * Event callback type
 */
export type WalletEventCallback = () => void;

/**
 * Transaction to sign
 */
export interface UnsignedTransaction {
  programId: string;
  functionName: string;
  inputs: string[];
  fee?: number;
}

/**
 * Signed transaction
 */
export interface SignedTransaction {
  transaction: string;
  signature: string;
}

/**
 * Wallet adapter interface
 * All wallet implementations must conform to this interface
 */
export interface WalletAdapter {
  /** Wallet name for display */
  name: string;

  /** Wallet icon URL */
  icon: string;

  /** Whether the wallet is installed/available */
  isAvailable(): boolean;

  // Connection
  /** Connect to the wallet */
  connect(): Promise<void>;

  /** Disconnect from the wallet */
  disconnect(): Promise<void>;

  /** Check if currently connected */
  isConnected(): boolean;

  // Account
  /** Get the connected address */
  getAddress(): Promise<string>;

  /** Get the view key (for decrypting records) */
  getViewKey(): Promise<string>;

  /** Get the account balance in microcredits */
  getBalance(): Promise<bigint>;

  // Signing
  /** Sign an arbitrary message */
  signMessage(message: string): Promise<string>;

  /** Sign a transaction */
  signTransaction(tx: UnsignedTransaction): Promise<SignedTransaction>;

  // Events
  /** Subscribe to wallet events */
  on(event: WalletEvent, callback: WalletEventCallback): void;

  /** Unsubscribe from wallet events */
  off(event: WalletEvent, callback: WalletEventCallback): void;
}

/**
 * Base wallet adapter class with common event handling
 */
export abstract class BaseWalletAdapter implements WalletAdapter {
  abstract name: string;
  abstract icon: string;

  protected listeners: Map<WalletEvent, Set<WalletEventCallback>> = new Map();

  abstract isAvailable(): boolean;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;
  abstract getAddress(): Promise<string>;
  abstract getViewKey(): Promise<string>;
  abstract getBalance(): Promise<bigint>;
  abstract signMessage(message: string): Promise<string>;
  abstract signTransaction(tx: UnsignedTransaction): Promise<SignedTransaction>;

  on(event: WalletEvent, callback: WalletEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: WalletEvent, callback: WalletEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  protected emit(event: WalletEvent): void {
    this.listeners.get(event)?.forEach((callback) => callback());
  }
}
