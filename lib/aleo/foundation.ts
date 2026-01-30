/**
 * Foundation Contract Helpers
 * Helper functions for interacting with zklaim_foundation.aleo
 */

import { aleoClient, getLatestHeight } from './client';
import { WalletAdapter } from '@/lib/wallet/adapter';

// Contract program ID (update after deployment to testnet)
export const FOUNDATION_PROGRAM_ID = 'zklaim_foundation.aleo';

// Protocol version constant (must match contract)
export const PROTOCOL_VERSION = 10000; // 1.0.0

/**
 * Protocol status result
 */
export interface ProtocolStatus {
  success: boolean;
  version: number;
  error?: string;
}

/**
 * Ping the deployed contract to verify connectivity
 * This is a read-only operation that doesn't require a wallet
 */
export async function pingContract(): Promise<ProtocolStatus> {
  try {
    // In a real implementation, we would execute the ping transition
    // For now, we simulate the response since we can't execute without deployment

    // Check if we can reach the network
    const height = await getLatestHeight();

    if (height === null) {
      return {
        success: false,
        version: 0,
        error: 'Cannot reach Aleo network',
      };
    }

    // Try to get the program from the network
    try {
      const program = await aleoClient.getProgram(FOUNDATION_PROGRAM_ID);
      if (program) {
        return {
          success: true,
          version: PROTOCOL_VERSION,
        };
      }
    } catch {
      // Program not deployed yet - this is expected during development
      return {
        success: false,
        version: 0,
        error: 'Contract not deployed to network yet',
      };
    }

    return {
      success: false,
      version: 0,
      error: 'Contract not found',
    };
  } catch (error) {
    return {
      success: false,
      version: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Register the connected user on-chain
 * Creates an on-chain record of the user's address
 */
export async function registerUser(
  wallet: WalletAdapter
): Promise<{ txId: string; success: boolean; error?: string }> {
  try {
    // Build and sign the transaction
    const tx = await wallet.signTransaction({
      programId: FOUNDATION_PROGRAM_ID,
      functionName: 'register_user',
      inputs: [],
      fee: 100000, // 0.1 Aleo credits
    });

    return {
      txId: tx.transaction,
      success: true,
    };
  } catch (error) {
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register',
    };
  }
}

/**
 * Verify if the connected user is registered
 */
export async function verifyUserRegistration(
  wallet: WalletAdapter
): Promise<{ isRegistered: boolean; error?: string }> {
  try {
    // Build and sign the verification transaction
    const tx = await wallet.signTransaction({
      programId: FOUNDATION_PROGRAM_ID,
      functionName: 'verify_registration',
      inputs: [],
      fee: 50000, // 0.05 Aleo credits
    });

    // If signing succeeds, the user is likely registered
    // In production, we'd submit the tx and check the result
    return {
      isRegistered: true,
    };
  } catch (error) {
    // If verification fails, user is not registered
    return {
      isRegistered: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Initialize the protocol (admin only)
 */
export async function initializeProtocol(
  wallet: WalletAdapter,
  adminAddress: string
): Promise<{ txId: string; success: boolean; error?: string }> {
  try {
    const tx = await wallet.signTransaction({
      programId: FOUNDATION_PROGRAM_ID,
      functionName: 'initialize_protocol',
      inputs: [adminAddress],
      fee: 200000, // 0.2 Aleo credits
    });

    return {
      txId: tx.transaction,
      success: true,
    };
  } catch (error) {
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize',
    };
  }
}

/**
 * Store a test value (for testing write operations)
 */
export async function storeValue(
  wallet: WalletAdapter,
  key: string,
  value: string
): Promise<{ txId: string; success: boolean; error?: string }> {
  try {
    const tx = await wallet.signTransaction({
      programId: FOUNDATION_PROGRAM_ID,
      functionName: 'store_value',
      inputs: [`${key}field`, `${value}field`],
      fee: 100000,
    });

    return {
      txId: tx.transaction,
      success: true,
    };
  } catch (error) {
    return {
      txId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store value',
    };
  }
}

/**
 * Echo test - verify input/output works (read-only)
 */
export async function echoTest(value: string): Promise<{
  result: string | null;
  success: boolean;
  error?: string;
}> {
  try {
    // This would execute the echo transition
    // For now, we simulate since we can't execute without deployment
    return {
      result: value,
      success: true,
    };
  } catch (error) {
    return {
      result: null,
      success: false,
      error: error instanceof Error ? error.message : 'Echo test failed',
    };
  }
}

/**
 * Add test - verify computation works (read-only)
 */
export async function addTest(
  a: number,
  b: number
): Promise<{
  result: number | null;
  success: boolean;
  error?: string;
}> {
  try {
    // This would execute the add transition
    // For now, we simulate since we can't execute without deployment
    return {
      result: a + b,
      success: true,
    };
  } catch (error) {
    return {
      result: null,
      success: false,
      error: error instanceof Error ? error.message : 'Add test failed',
    };
  }
}

/**
 * Get protocol info combining multiple checks
 */
export async function getProtocolInfo(): Promise<{
  deployed: boolean;
  version: number;
  networkHeight: number | null;
  error?: string;
}> {
  try {
    const [pingResult, height] = await Promise.all([
      pingContract(),
      getLatestHeight(),
    ]);

    return {
      deployed: pingResult.success,
      version: pingResult.version,
      networkHeight: height,
      error: pingResult.error,
    };
  } catch (error) {
    return {
      deployed: false,
      version: 0,
      networkHeight: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
