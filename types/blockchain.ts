/**
 * Blockchain Type Definitions
 * Types for Aleo blockchain interactions
 */

/**
 * Transaction status
 */
export type TransactionStatus =
  | 'pending'     // Transaction submitted
  | 'confirmed'   // Transaction confirmed on-chain
  | 'failed'      // Transaction failed
  | 'rejected';   // Transaction rejected by network

/**
 * Aleo transaction
 */
export interface AleoTransaction {
  id: string;
  type: AleoTransactionType;
  status: TransactionStatus;
  programId: string;
  functionName: string;
  inputs: string[];
  outputs: string[];
  fee: number;
  blockHeight: number | null;
  timestamp: Date | null;
  errorMessage: string | null;
}

/**
 * Transaction types supported by ZKLAIM contracts
 */
export type AleoTransactionType =
  | 'create_policy'
  | 'cancel_policy'
  | 'submit_claim'
  | 'process_claim'
  | 'deposit_liquidity'
  | 'withdraw_liquidity'
  | 'submit_proof'
  | 'register_attestor'
  | 'submit_oracle_data';

/**
 * Aleo record (encrypted on-chain data)
 */
export interface AleoRecord {
  owner: string;
  data: Record<string, unknown>;
  nonce: string;
  programId: string;
}

/**
 * ZK proof data structure
 */
export interface ZkProof {
  proof: string;                // Serialized proof bytes
  publicInputs: string[];       // Public inputs to the circuit
  verifyingKey: string;         // Verifying key identifier
  programId: string;            // Leo program ID
  functionName: string;         // Function that generated proof
}

/**
 * Proof generation request
 */
export interface ProofGenerationRequest {
  programId: string;
  functionName: string;
  privateInputs: Record<string, unknown>;
  publicInputs: Record<string, unknown>;
}

/**
 * Proof generation result
 */
export interface ProofGenerationResult {
  proof: ZkProof;
  generationTime: number;       // Time in milliseconds
  success: boolean;
  error: string | null;
}

/**
 * Smart contract program metadata
 */
export interface ProgramMetadata {
  id: string;
  name: string;
  version: string;
  functions: ProgramFunction[];
  deployedAt: Date;
  deploymentTxId: string;
}

/**
 * Program function definition
 */
export interface ProgramFunction {
  name: string;
  inputs: FunctionInput[];
  outputs: FunctionOutput[];
  isPublic: boolean;
}

/**
 * Function input parameter
 */
export interface FunctionInput {
  name: string;
  type: string;
  visibility: 'private' | 'public' | 'constant';
}

/**
 * Function output
 */
export interface FunctionOutput {
  type: string;
  visibility: 'private' | 'public';
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  name: 'mainnet' | 'testnet' | 'devnet';
  rpcUrl: string;
  explorerUrl: string;
  chainId: string;
}

/**
 * Block information
 */
export interface BlockInfo {
  height: number;
  hash: string;
  previousHash: string;
  timestamp: Date;
  transactionCount: number;
}

/**
 * Gas/Fee estimation
 */
export interface FeeEstimate {
  baseFee: number;
  priorityFee: number;
  totalFee: number;
  estimatedTime: number;        // Estimated confirmation time in seconds
}
