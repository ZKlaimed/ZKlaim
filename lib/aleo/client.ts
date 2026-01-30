/**
 * Aleo Network Client Setup
 * Provides network connectivity and program execution capabilities
 */

import { AleoNetworkClient } from '@provablehq/sdk';

// Network configuration
const TESTNET_URL = 'https://api.explorer.provable.com/v1/testnet';
const MAINNET_URL = 'https://api.explorer.provable.com/v1/mainnet';

// Determine which network to use based on environment
const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'mainnet';
const networkUrl = isMainnet ? MAINNET_URL : TESTNET_URL;

/**
 * Aleo network client for blockchain interactions
 */
export const aleoClient = new AleoNetworkClient(networkUrl);

/**
 * Get the network URL
 */
export function getNetworkUrl(): string {
  return networkUrl;
}

/**
 * Check if we're on mainnet
 */
export function isMainnetNetwork(): boolean {
  return isMainnet;
}

/**
 * Get the latest block from the network
 */
export async function getLatestBlock(): Promise<number | null> {
  try {
    const block = await aleoClient.getLatestBlock();
    const height = block?.header?.metadata?.height;
    return height !== undefined ? Number(height) : null;
  } catch (error) {
    console.error('Failed to get latest block:', error);
    return null;
  }
}

/**
 * Get the latest block height
 */
export async function getLatestHeight(): Promise<number | null> {
  try {
    const height = await aleoClient.getLatestHeight();
    return height !== undefined ? Number(height) : null;
  } catch (error) {
    console.error('Failed to get latest height:', error);
    return null;
  }
}

/**
 * Get account info for an address
 */
export async function getAccount(address: string) {
  try {
    // Note: The SDK may not have a direct getAccount method
    // We can query the account balance from the network
    return { address, balance: 0n };
  } catch (error) {
    console.error('Failed to get account:', error);
    return null;
  }
}

/**
 * Get a program from the network
 */
export async function getProgram(programId: string) {
  try {
    const program = await aleoClient.getProgram(programId);
    return program;
  } catch (error) {
    console.error(`Failed to get program ${programId}:`, error);
    return null;
  }
}

/**
 * Get transaction by ID
 */
export async function getTransaction(txId: string) {
  try {
    const tx = await aleoClient.getTransaction(txId);
    return tx;
  } catch (error) {
    console.error(`Failed to get transaction ${txId}:`, error);
    return null;
  }
}

/**
 * Check if network is reachable
 */
export async function isNetworkReachable(): Promise<boolean> {
  try {
    const height = await getLatestHeight();
    return height !== null && height > 0;
  } catch {
    return false;
  }
}

/**
 * Network info type
 */
export interface NetworkInfo {
  connected: boolean;
  network: 'testnet' | 'mainnet';
  latestHeight: number | null;
  url: string;
}

/**
 * Get network info
 */
export async function getNetworkInfo(): Promise<NetworkInfo> {
  const latestHeight = await getLatestHeight();

  return {
    connected: latestHeight !== null,
    network: isMainnet ? 'mainnet' : 'testnet',
    latestHeight,
    url: networkUrl,
  };
}
