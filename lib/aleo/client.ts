/**
 * Aleo Network Client Setup
 * Provides network connectivity and program execution capabilities
 */

import { AleoNetworkClient, Account, ProgramManager } from '@provablehq/sdk';

// Network configuration
// Note: The SDK appends the network name automatically, so we use the base URL
const TESTNET_URL = 'https://api.explorer.provable.com/v1';
const MAINNET_URL = 'https://api.explorer.provable.com/v1';

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

/**
 * Get a mapping value from a program
 * @param programId - The program ID (e.g., 'zklaim_foundation.aleo')
 * @param mappingName - The mapping name (e.g., 'user_count')
 * @param key - The key to lookup (e.g., '0u8')
 * @returns The mapping value or null if not found
 */
export async function getMappingValue(
  programId: string,
  mappingName: string,
  key: string
): Promise<string | null> {
  try {
    // Use the REST API to query the mapping directly
    const network = isMainnet ? 'mainnet' : 'testnet';
    const url = `${networkUrl}/${network}/program/${programId}/mapping/${mappingName}/${key}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Key not found in mapping
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const value = await response.text();
    // Remove quotes if present
    return value.replace(/^"|"$/g, '');
  } catch (error) {
    console.error(`Failed to get mapping value ${programId}/${mappingName}/${key}:`, error);
    return null;
  }
}

/**
 * Get the user count from the zklaim_foundation contract
 */
export async function getUserCount(): Promise<number> {
  const value = await getMappingValue('zklaim_foundation.aleo', 'user_count', '0u8');
  if (value) {
    // Parse the value (e.g., "1u64" -> 1)
    const match = value.match(/^(\d+)u\d+$/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return 0;
}

// Program to compute BHP256 hash of an address (same as on-chain)
const HASH_PROGRAM = `program hash_address.aleo;

function hash_addr:
    input r0 as address.public;
    hash.bhp256 r0 into r1 as field;
    output r1 as field.public;
`;

// LocalStorage key for persisting address hashes
const HASH_CACHE_KEY = 'zklaim_address_hashes';

/**
 * Get cached hashes from localStorage
 */
function getHashCache(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(HASH_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

/**
 * Save hash to localStorage cache
 */
function saveHashToCache(address: string, hash: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cache = getHashCache();
    cache[address] = hash;
    localStorage.setItem(HASH_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to save hash to cache:', e);
  }
}

/**
 * Compute the BHP256 hash of an address (same as on-chain)
 * This runs the hash computation locally using the Aleo SDK
 * Results are cached in localStorage to avoid recomputation on page reload
 * @param address - The Aleo address to hash
 * @returns The field hash as a string (e.g., "123...456field")
 */
export async function hashAddressBHP256(address: string): Promise<string> {
  // Check localStorage cache first (persists across page reloads)
  const cache = getHashCache();
  if (cache[address]) {
    console.log('🔐 Using cached hash for address');
    return cache[address];
  }

  try {
    const programManager = new ProgramManager();
    const account = new Account();
    programManager.setAccount(account);

    console.log('🔐 Computing BHP256 hash for address (first time, will be cached)...');
    // run(program, function_name, inputs, proveExecution, imports, keySearchParams, ...)
    // We don't need proof generation, just the output
    const response = await programManager.run(
      HASH_PROGRAM,
      'hash_addr',
      [address],
      false // proveExecution - we just want the result, not a proof
    );
    const outputs = response.getOutputs();
    const hash = outputs[0];

    console.log('✅ Hash computed and cached:', hash);

    // Cache the result in localStorage
    saveHashToCache(address, hash);

    return hash;
  } catch (error) {
    console.error('Failed to compute address hash:', error);
    throw error;
  }
}

/**
 * Check if a user is registered on-chain
 * Computes the BHP256 hash of the address and queries the registered_users mapping
 * @param address - The Aleo address to check
 * @returns true if registered, false otherwise
 */
export async function isUserRegistered(address: string): Promise<boolean> {
  try {
    // Compute the hash of the address (same as on-chain)
    const hash = await hashAddressBHP256(address);

    // Query the registered_users mapping
    const value = await getMappingValue('zklaim_foundation.aleo', 'registered_users', hash);

    return value === 'true';
  } catch (error) {
    console.error('Failed to check user registration:', error);
    return false;
  }
}
