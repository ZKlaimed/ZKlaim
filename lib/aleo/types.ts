/**
 * Aleo Types
 * Type definitions for Aleo blockchain interactions
 */

/**
 * Aleo record structure
 */
export interface AleoRecord {
  owner: string;
  data: Record<string, string>;
  nonce: string;
}

/**
 * Transaction status
 */
export type TransactionStatus = 'pending' | 'confirmed' | 'rejected';

/**
 * Transaction result
 */
export interface TransactionResult {
  transactionId: string;
  status: TransactionStatus;
  blockHeight?: number;
  error?: string;
  outputs?: string[];
}

/**
 * Program execution result
 */
export interface ExecutionResult {
  outputs: string[];
  proof?: string;
}

/**
 * Mapping value result
 */
export interface MappingValue {
  key: string;
  value: string | null;
}

/**
 * Parse a Leo field value
 */
export function parseField(value: string): string {
  // Remove 'field' suffix if present
  return value.replace(/field$/, '');
}

/**
 * Parse a Leo u64 value to bigint
 */
export function parseU64(value: string): bigint {
  // Remove 'u64' suffix and convert to bigint
  return BigInt(value.replace(/u64$/, ''));
}

/**
 * Parse a Leo u32 value to number
 */
export function parseU32(value: string): number {
  // Remove 'u32' suffix and convert to number
  return parseInt(value.replace(/u32$/, ''), 10);
}

/**
 * Parse a Leo u8 value to number
 */
export function parseU8(value: string): number {
  // Remove 'u8' suffix and convert to number
  return parseInt(value.replace(/u8$/, ''), 10);
}

/**
 * Parse a Leo boolean value
 */
export function parseBool(value: string): boolean {
  return value === 'true';
}

/**
 * Format a value as Leo field
 */
export function toField(value: string | bigint): string {
  return `${value}field`;
}

/**
 * Format a value as Leo u64
 */
export function toU64(value: number | bigint): string {
  return `${value}u64`;
}

/**
 * Format a value as Leo u32
 */
export function toU32(value: number): string {
  return `${value}u32`;
}

/**
 * Format a value as Leo u8
 */
export function toU8(value: number): string {
  return `${value}u8`;
}

/**
 * Format a value as Leo boolean
 */
export function toBool(value: boolean): string {
  return value ? 'true' : 'false';
}
