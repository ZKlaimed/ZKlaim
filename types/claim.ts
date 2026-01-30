/**
 * Claim Type Definitions
 * Types for insurance claims and payouts
 */

import type { BaseModel } from './index';
import type { CoverageType } from './policy';

/**
 * Claim processing status
 */
export type ClaimStatus =
  | 'submitted'    // Claim submitted, awaiting validation
  | 'validating'   // Oracle data being fetched and verified
  | 'approved'     // Claim approved, pending payout
  | 'rejected'     // Claim rejected (conditions not met)
  | 'paid'         // Payout completed
  | 'disputed';    // Under dispute resolution

/**
 * Claim type (parametric vs traditional)
 */
export type ClaimType = 'parametric' | 'traditional';

/**
 * Main claim interface
 */
export interface Claim extends BaseModel {
  policyId: string;
  userId: string;
  type: ClaimType;
  status: ClaimStatus;
  claimAmount: number;          // Requested amount
  approvedAmount: number | null; // Approved payout amount
  coverageType: CoverageType;
  evidence: ClaimEvidence;
  oracleData: OracleDataSnapshot | null;
  statusHistory: ClaimStatusChange[];
  payoutTxHash: string | null;  // On-chain transaction hash
}

/**
 * Evidence submitted with claim
 */
export interface ClaimEvidence {
  description: string;
  submittedAt: Date;
  documents?: ClaimDocument[];
  oracleTriggerId?: string;     // For parametric claims
}

/**
 * Supporting document for traditional claims
 */
export interface ClaimDocument {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'other';
  url: string;                  // Encrypted storage URL
  uploadedAt: Date;
}

/**
 * Snapshot of oracle data at claim time
 */
export interface OracleDataSnapshot {
  source: string;               // Oracle provider name
  dataType: string;             // Type of data (flight, weather, etc.)
  timestamp: Date;
  rawData: Record<string, unknown>;
  signature: string;            // Oracle signature
  verified: boolean;
}

/**
 * Claim status change history entry
 */
export interface ClaimStatusChange {
  fromStatus: ClaimStatus | null;
  toStatus: ClaimStatus;
  changedAt: Date;
  reason: string;
  changedBy: 'system' | 'oracle' | 'admin' | 'user';
}

/**
 * Claim submission request
 */
export interface SubmitClaimRequest {
  policyId: string;
  description: string;
  documents?: File[];
}

/**
 * Parametric claim trigger (from oracle)
 */
export interface ParametricTrigger {
  policyId: string;
  oracleSource: string;
  eventType: string;
  eventData: Record<string, unknown>;
  triggeredAt: Date;
  signature: string;
}

/**
 * Claim summary for list views
 */
export interface ClaimSummary {
  id: string;
  policyId: string;
  status: ClaimStatus;
  claimAmount: number;
  approvedAmount: number | null;
  createdAt: Date;
  coverageType: CoverageType;
}

/**
 * Claim dispute
 */
export interface ClaimDispute {
  claimId: string;
  reason: string;
  submittedAt: Date;
  status: 'pending' | 'reviewing' | 'resolved';
  resolution?: string;
}
