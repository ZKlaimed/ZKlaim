/**
 * User Type Definitions
 * Types for users, wallets, and authentication
 */

import type { BaseModel } from './index';

/**
 * User account status
 */
export type UserStatus = 'active' | 'suspended' | 'pending_verification';

/**
 * Wallet connection status
 */
export type WalletStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

/**
 * Supported wallet types
 */
export type WalletType = 'leo_wallet' | 'puzzle_wallet' | 'soter_wallet';

/**
 * Main user interface
 */
export interface User extends BaseModel {
  walletAddress: string;
  status: UserStatus;
  email?: string;               // Optional email for notifications
  preferences: UserPreferences;
  stats: UserStats;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'GBP';
  notifications: NotificationPreferences;
  language: string;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  policyExpiry: boolean;
  claimUpdates: boolean;
  poolUpdates: boolean;
  marketing: boolean;
}

/**
 * User statistics
 */
export interface UserStats {
  totalPolicies: number;
  activePolicies: number;
  totalClaims: number;
  totalClaimsPaid: number;
  totalPremiumsPaid: number;
  poolPositions: number;
  totalDeposited: number;
  totalYieldEarned: number;
  memberSince: Date;
}

/**
 * Wallet connection state
 */
export interface WalletConnection {
  status: WalletStatus;
  walletType: WalletType | null;
  address: string | null;
  balance: WalletBalance | null;
  error: string | null;
}

/**
 * Wallet balances
 */
export interface WalletBalance {
  aleo: number;                 // Native ALEO tokens
  usdc: number;                 // USDC stablecoin
  lpTokens: LpTokenBalance[];   // LP token balances
}

/**
 * LP token balance for a specific pool
 */
export interface LpTokenBalance {
  poolId: string;
  poolName: string;
  amount: number;
  valueUsd: number;
}

/**
 * Authentication session
 */
export interface AuthSession {
  userId: string;
  walletAddress: string;
  walletType: WalletType;
  signedAt: Date;
  expiresAt: Date;
  signature: string;
}

/**
 * Wallet sign message request
 */
export interface SignMessageRequest {
  message: string;
  address: string;
}

/**
 * Wallet sign message result
 */
export interface SignMessageResult {
  signature: string;
  publicKey: string;
}

/**
 * User profile summary
 */
export interface UserProfile {
  address: string;
  memberSince: Date;
  activePolicies: number;
  totalClaimed: number;
  trustScore?: number;          // Optional reputation score
}

/**
 * Attestation for user eligibility proofs
 */
export interface UserAttestation {
  id: string;
  userId: string;
  attestationType: string;      // e.g., 'non_smoker', 'safe_driver'
  attestorId: string;
  proofHash: string;
  issuedAt: Date;
  expiresAt: Date;
  status: 'valid' | 'expired' | 'revoked';
}
