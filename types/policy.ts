/**
 * Policy Type Definitions
 * Types for insurance policies, coverage, and premiums
 */

import type { BaseModel } from './index';

/**
 * Supported coverage types
 */
export type CoverageType =
  | 'flight_delay'
  | 'weather_event'
  | 'auto_collision'
  | 'health_basic';

/**
 * Policy lifecycle states
 */
export type PolicyStatus =
  | 'draft'           // User is configuring policy
  | 'pending_proof'   // Awaiting ZK proof generation
  | 'pending_payment' // Proof submitted, awaiting premium
  | 'active'          // Policy is in force
  | 'expired'         // Policy term ended without claim
  | 'claimed'         // Claim was paid out
  | 'cancelled';      // User cancelled policy

/**
 * Main policy interface
 */
export interface Policy extends BaseModel {
  userId: string;
  walletAddress: string;
  coverageType: CoverageType;
  coverageAmount: number;       // Max payout in USDC
  premiumPaid: number;          // Premium amount in USDC
  status: PolicyStatus;
  startDate: Date;
  endDate: Date;
  proofHash: string;            // ZK proof commitment hash
  policyNftId?: string;         // On-chain NFT token ID
  coverageDetails: CoverageDetails;
}

/**
 * Union type for coverage-specific details
 */
export type CoverageDetails =
  | FlightCoverage
  | WeatherCoverage
  | AutoCoverage
  | HealthCoverage;

/**
 * Flight delay coverage parameters
 */
export interface FlightCoverage {
  type: 'flight_delay';
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  scheduledDeparture: Date;
  delayThresholdMinutes: number;
  payoutTiers: PayoutTier[];
}

/**
 * Weather event coverage parameters
 */
export interface WeatherCoverage {
  type: 'weather_event';
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  eventType: 'rainfall' | 'temperature' | 'wind_speed' | 'hurricane';
  threshold: number;
  thresholdUnit: string;
  payoutTiers: PayoutTier[];
}

/**
 * Auto collision coverage (Phase 2)
 */
export interface AutoCoverage {
  type: 'auto_collision';
  vehicleProofHash: string;     // ZK proof of vehicle ownership
  driverProofHash: string;      // ZK proof of driving record
  coverageLevel: 'basic' | 'standard' | 'premium';
  deductible: number;
}

/**
 * Health coverage (Phase 3)
 */
export interface HealthCoverage {
  type: 'health_basic';
  eligibilityProofHash: string; // ZK proof of eligibility
  coverageLevel: 'basic' | 'standard' | 'premium';
  deductible: number;
}

/**
 * Tiered payout structure for parametric insurance
 */
export interface PayoutTier {
  threshold: number;
  payoutPercentage: number;     // Percentage of coverage amount
  description: string;
}

/**
 * Premium quote from the protocol
 */
export interface PremiumQuote {
  basePremium: number;
  adjustments: PremiumAdjustment[];
  totalPremium: number;
  validUntil: Date;
  quoteId: string;
}

/**
 * Premium adjustment factors
 */
export interface PremiumAdjustment {
  factor: string;
  description: string;
  amount: number;               // Positive or negative adjustment
  percentage: number;           // Adjustment as percentage
}

/**
 * Policy creation request
 */
export interface CreatePolicyRequest {
  coverageType: CoverageType;
  coverageAmount: number;
  coverageDetails: Omit<CoverageDetails, 'type'>;
  walletAddress: string;
}

/**
 * Policy summary for list views
 */
export interface PolicySummary {
  id: string;
  coverageType: CoverageType;
  coverageAmount: number;
  status: PolicyStatus;
  startDate: Date;
  endDate: Date;
}
