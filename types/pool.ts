/**
 * Pool Type Definitions
 * Types for liquidity pools and LP positions
 */

import type { BaseModel } from './index';
import type { CoverageType } from './policy';

/**
 * Pool operational status
 */
export type PoolStatus = 'active' | 'paused' | 'deprecated';

/**
 * Risk level classification
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Liquidity pool interface
 */
export interface Pool extends BaseModel {
  name: string;
  description: string;
  coverageTypes: CoverageType[];
  status: PoolStatus;
  riskLevel: RiskLevel;
  tvl: number;                  // Total Value Locked in USDC
  utilizationRate: number;      // Percentage of capital backing policies
  minDeposit: number;           // Minimum deposit in USDC
  maxDeposit: number | null;    // Maximum deposit (null = unlimited)
  lockPeriodDays: number;       // Withdrawal lock period
  performanceFee: number;       // Protocol fee percentage
  contractAddress: string;      // On-chain pool contract
}

/**
 * User's position in a pool
 */
export interface PoolPosition extends BaseModel {
  poolId: string;
  userId: string;
  walletAddress: string;
  depositAmount: number;        // Original deposit in USDC
  lpTokens: number;             // LP tokens received
  currentValue: number;         // Current value of position
  earnedYield: number;          // Total yield earned
  depositDate: Date;
  unlockDate: Date;             // When withdrawal becomes available
  status: 'active' | 'withdrawing' | 'withdrawn';
}

/**
 * Pool statistics and metrics
 */
export interface PoolStats {
  tvl: number;
  tvlChange24h: number;         // Percentage change
  apy: number;                  // Annual Percentage Yield
  apyHistory: ApyDataPoint[];
  utilizationRate: number;
  totalPolicies: number;
  activeClaims: number;
  totalPayouts: number;
  totalPremiums: number;
  lpCount: number;              // Number of liquidity providers
}

/**
 * APY historical data point
 */
export interface ApyDataPoint {
  timestamp: Date;
  apy: number;
}

/**
 * Deposit request
 */
export interface DepositRequest {
  poolId: string;
  amount: number;
  walletAddress: string;
}

/**
 * Deposit result
 */
export interface DepositResult {
  positionId: string;
  lpTokensReceived: number;
  transactionHash: string;
  unlockDate: Date;
}

/**
 * Withdrawal request
 */
export interface WithdrawRequest {
  positionId: string;
  lpTokenAmount: number;        // Amount of LP tokens to redeem
  walletAddress: string;
}

/**
 * Withdrawal result
 */
export interface WithdrawResult {
  amountReceived: number;       // USDC received
  yieldClaimed: number;         // Yield portion
  transactionHash: string;
}

/**
 * Pool summary for list views
 */
export interface PoolSummary {
  id: string;
  name: string;
  tvl: number;
  apy: number;
  riskLevel: RiskLevel;
  coverageTypes: CoverageType[];
  status: PoolStatus;
}

/**
 * LP rewards distribution
 */
export interface RewardsDistribution {
  poolId: string;
  totalRewards: number;
  rewardsPerLpToken: number;
  distributedAt: Date;
  transactionHash: string;
}
