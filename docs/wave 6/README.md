# Wave 6: Claims Engine

**Objective:** Complete the insurance loop with automated and manual claims processing.

**Theme:** Automated payouts - the promise of parametric insurance

**Depends on:** Wave 5

---

## Overview

Wave 6 completes the core insurance cycle. When oracles detect a covered event (flight delay, weather), the Claims Engine automatically processes claims and executes payouts. This is the culmination of Waves 2-5 working together.

By the end: Flight delayed → auto-claim triggered → payout to wallet.

---

## Deliverables

### Layer: Contracts

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| `claims_engine.aleo` | `contracts/claims_engine/src/main.leo` | Claims processing and payouts |
| Claims tests | `contracts/claims_engine/tests/` | Unit tests |
| Deployment script | `scripts/deploy-claims.sh` | Testnet deployment |

#### Contract: claims_engine.aleo

```leo
// contracts/claims_engine/src/main.leo
program claims_engine.aleo {

    // Import dependencies
    import policy_registry.aleo;
    import oracle_bridge.aleo;
    import risk_pool.aleo;

    // Records (private)
    record Claim {
        owner: address,
        claim_id: field,
        policy_id: field,
        claim_type: u8,
        amount: u64,
        status: u8,
        submitted_at: u64,
    }

    record Payout {
        owner: address,
        claim_id: field,
        policy_id: field,
        amount: u64,
        paid_at: u64,
    }

    // Mappings (public)
    mapping claims: field => ClaimPublicData;
    mapping policy_claims: field => u32;        // policy_id => claim count
    mapping claim_payouts: field => u64;        // claim_id => payout amount
    mapping processed_triggers: field => bool;  // trigger_hash => processed

    // Structs
    struct ClaimPublicData {
        claim_id: field,
        policy_id: field,
        claim_type: u8,
        claimed_amount: u64,
        approved_amount: u64,
        status: u8,
        submitted_at: u64,
        processed_at: u64,
    }

    struct TriggerData {
        policy_id: field,
        oracle_data_hash: field,
        trigger_value: u64,
        threshold: u64,
    }

    // Claim types
    const CLAIM_PARAMETRIC: u8 = 1u8;
    const CLAIM_TRADITIONAL: u8 = 2u8;

    // Claim status
    const STATUS_SUBMITTED: u8 = 1u8;
    const STATUS_VALIDATING: u8 = 2u8;
    const STATUS_APPROVED: u8 = 3u8;
    const STATUS_REJECTED: u8 = 4u8;
    const STATUS_PAID: u8 = 5u8;

    // === Parametric Claims (Automated) ===

    // Process a parametric claim triggered by oracle data
    // This is the core automation - oracle reports delay, claim auto-processes
    transition process_parametric_claim(
        claim_id: field,
        policy_id: field,
        oracle_data_type: u8,
        oracle_identifier_hash: field,
        trigger_value: u64,           // Actual value from oracle (e.g., 180 min delay)
        threshold: u64,               // Policy threshold (e.g., 120 min)
        coverage_amount: u64,
        pool_id: field,
        recipient: address
    ) -> (Claim, Payout) {
        // Verify trigger value exceeds threshold
        assert(trigger_value >= threshold);

        // Calculate payout based on tiered structure
        // For MVP: 100% of coverage if threshold exceeded
        let payout_amount: u64 = coverage_amount;

        // Create claim record
        let claim: Claim = Claim {
            owner: recipient,
            claim_id: claim_id,
            policy_id: policy_id,
            claim_type: CLAIM_PARAMETRIC,
            amount: payout_amount,
            status: STATUS_PAID,
            submitted_at: 0u64, // Set in finalize
        };

        // Create payout record
        let payout: Payout = Payout {
            owner: recipient,
            claim_id: claim_id,
            policy_id: policy_id,
            amount: payout_amount,
            paid_at: 0u64, // Set in finalize
        };

        // Compute trigger hash to prevent duplicate processing
        let trigger_hash: field = BHP256::hash_to_field(TriggerData {
            policy_id: policy_id,
            oracle_data_hash: oracle_identifier_hash,
            trigger_value: trigger_value,
            threshold: threshold,
        });

        return (claim, payout) then finalize(
            claim_id,
            policy_id,
            payout_amount,
            coverage_amount,
            pool_id,
            oracle_data_type,
            oracle_identifier_hash,
            trigger_value,
            threshold,
            trigger_hash
        );
    }

    finalize process_parametric_claim(
        claim_id: field,
        policy_id: field,
        payout_amount: u64,
        coverage_amount: u64,
        pool_id: field,
        oracle_data_type: u8,
        oracle_identifier_hash: field,
        trigger_value: u64,
        threshold: u64,
        trigger_hash: field
    ) {
        // Ensure this trigger hasn't been processed
        let already_processed: bool = Mapping::get_or_use(processed_triggers, trigger_hash, false);
        assert(!already_processed);

        // Verify oracle data exists and meets threshold
        // In production: cross-program call to oracle_bridge.aleo/verify_data

        // Create claim public data
        let current_time: u64 = block.height as u64;
        let claim_data: ClaimPublicData = ClaimPublicData {
            claim_id: claim_id,
            policy_id: policy_id,
            claim_type: CLAIM_PARAMETRIC,
            claimed_amount: payout_amount,
            approved_amount: payout_amount,
            status: STATUS_PAID,
            submitted_at: current_time,
            processed_at: current_time,
        };
        Mapping::set(claims, claim_id, claim_data);

        // Mark trigger as processed
        Mapping::set(processed_triggers, trigger_hash, true);

        // Update policy claim count
        let claim_count: u32 = Mapping::get_or_use(policy_claims, policy_id, 0u32);
        Mapping::set(policy_claims, policy_id, claim_count + 1u32);

        // Record payout
        Mapping::set(claim_payouts, claim_id, payout_amount);

        // Cross-program calls (in production):
        // policy_registry.aleo/mark_claimed(policy_id);
        // risk_pool.aleo/record_payout(pool_id, payout_amount);
    }

    // === Traditional Claims (Manual) ===

    // Submit a traditional claim (requires review)
    transition submit_traditional_claim(
        claim_id: field,
        policy_id: field,
        claimed_amount: u64,
        evidence_hash: field,
        description_hash: field
    ) -> Claim {
        let claim: Claim = Claim {
            owner: self.caller,
            claim_id: claim_id,
            policy_id: policy_id,
            claim_type: CLAIM_TRADITIONAL,
            amount: claimed_amount,
            status: STATUS_SUBMITTED,
            submitted_at: 0u64,
        };

        return claim then finalize(claim_id, policy_id, claimed_amount, evidence_hash);
    }

    finalize submit_traditional_claim(
        claim_id: field,
        policy_id: field,
        claimed_amount: u64,
        evidence_hash: field
    ) {
        let current_time: u64 = block.height as u64;

        let claim_data: ClaimPublicData = ClaimPublicData {
            claim_id: claim_id,
            policy_id: policy_id,
            claim_type: CLAIM_TRADITIONAL,
            claimed_amount: claimed_amount,
            approved_amount: 0u64,
            status: STATUS_SUBMITTED,
            submitted_at: current_time,
            processed_at: 0u64,
        };
        Mapping::set(claims, claim_id, claim_data);

        let claim_count: u32 = Mapping::get_or_use(policy_claims, policy_id, 0u32);
        Mapping::set(policy_claims, policy_id, claim_count + 1u32);
    }

    // Approve a traditional claim (called by adjuster/DAO)
    transition approve_claim(
        claim_id: field,
        approved_amount: u64
    ) {
        return then finalize(claim_id, approved_amount);
    }

    finalize approve_claim(claim_id: field, approved_amount: u64) {
        let claim_data: ClaimPublicData = Mapping::get(claims, claim_id);

        // Verify claim is in submitted or validating state
        assert(claim_data.status == STATUS_SUBMITTED || claim_data.status == STATUS_VALIDATING);

        // Verify approved amount doesn't exceed claimed
        assert(approved_amount <= claim_data.claimed_amount);

        let updated: ClaimPublicData = ClaimPublicData {
            claim_id: claim_data.claim_id,
            policy_id: claim_data.policy_id,
            claim_type: claim_data.claim_type,
            claimed_amount: claim_data.claimed_amount,
            approved_amount: approved_amount,
            status: STATUS_APPROVED,
            submitted_at: claim_data.submitted_at,
            processed_at: block.height as u64,
        };
        Mapping::set(claims, claim_id, updated);
    }

    // Reject a claim
    transition reject_claim(claim_id: field, reason_hash: field) {
        return then finalize(claim_id);
    }

    finalize reject_claim(claim_id: field) {
        let claim_data: ClaimPublicData = Mapping::get(claims, claim_id);

        let updated: ClaimPublicData = ClaimPublicData {
            claim_id: claim_data.claim_id,
            policy_id: claim_data.policy_id,
            claim_type: claim_data.claim_type,
            claimed_amount: claim_data.claimed_amount,
            approved_amount: 0u64,
            status: STATUS_REJECTED,
            submitted_at: claim_data.submitted_at,
            processed_at: block.height as u64,
        };
        Mapping::set(claims, claim_id, updated);
    }

    // Execute payout for approved claim
    transition execute_payout(
        claim_id: field,
        policy_id: field,
        amount: u64,
        pool_id: field,
        recipient: address
    ) -> Payout {
        let payout: Payout = Payout {
            owner: recipient,
            claim_id: claim_id,
            policy_id: policy_id,
            amount: amount,
            paid_at: 0u64,
        };

        return payout then finalize(claim_id, amount, pool_id);
    }

    finalize execute_payout(claim_id: field, amount: u64, pool_id: field) {
        let claim_data: ClaimPublicData = Mapping::get(claims, claim_id);

        // Verify claim is approved
        assert_eq(claim_data.status, STATUS_APPROVED);

        // Verify amount matches approved
        assert_eq(amount, claim_data.approved_amount);

        // Update to paid
        let updated: ClaimPublicData = ClaimPublicData {
            claim_id: claim_data.claim_id,
            policy_id: claim_data.policy_id,
            claim_type: claim_data.claim_type,
            claimed_amount: claim_data.claimed_amount,
            approved_amount: claim_data.approved_amount,
            status: STATUS_PAID,
            submitted_at: claim_data.submitted_at,
            processed_at: block.height as u64,
        };
        Mapping::set(claims, claim_id, updated);

        // Record payout
        Mapping::set(claim_payouts, claim_id, amount);

        // Cross-program: risk_pool.aleo/record_payout(pool_id, amount);
    }
}
```

### Layer: Frontend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Claims helpers | `lib/aleo/claims.ts` | Claims contract interactions |
| Claims list | `pages/dashboard/claims/index.tsx` | User's claims |
| Claim detail | `pages/dashboard/claims/[id].tsx` | Single claim view |
| File claim | `pages/dashboard/claims/new.tsx` | Submit claim form |
| Parametric trigger | `components/claims/parametric-trigger.tsx` | Auto-trigger display |
| Payout status | `components/claims/payout-status.tsx` | Payout tracking |
| Claim timeline | `components/claims/claim-timeline.tsx` | Status progress |

#### Claims Contract Helpers

```typescript
// lib/aleo/claims.ts
import { aleoClient, programManager } from './client';
import { generateClaimId } from './utils';

export interface Claim {
  owner: string;
  claimId: string;
  policyId: string;
  claimType: number;
  amount: bigint;
  status: number;
  submittedAt: bigint;
}

export interface Payout {
  owner: string;
  claimId: string;
  policyId: string;
  amount: bigint;
  paidAt: bigint;
}

export const CLAIM_TYPES = {
  PARAMETRIC: 1,
  TRADITIONAL: 2,
} as const;

export const CLAIM_STATUS = {
  SUBMITTED: 1,
  VALIDATING: 2,
  APPROVED: 3,
  REJECTED: 4,
  PAID: 5,
} as const;

export const STATUS_LABELS: Record<number, string> = {
  [CLAIM_STATUS.SUBMITTED]: 'Submitted',
  [CLAIM_STATUS.VALIDATING]: 'Validating',
  [CLAIM_STATUS.APPROVED]: 'Approved',
  [CLAIM_STATUS.REJECTED]: 'Rejected',
  [CLAIM_STATUS.PAID]: 'Paid',
};

// Process parametric claim (called by backend oracle service)
export async function processParametricClaim(
  wallet: WalletAdapter,
  params: {
    policyId: string;
    oracleDataType: number;
    oracleIdentifierHash: string;
    triggerValue: bigint;
    threshold: bigint;
    coverageAmount: bigint;
    poolId: string;
    recipient: string;
  }
): Promise<{ txId: string; claim: Claim; payout: Payout }> {
  const claimId = await generateClaimId();

  const tx = await programManager.buildTransaction(
    'claims_engine.aleo',
    'process_parametric_claim',
    [
      claimId,
      params.policyId,
      `${params.oracleDataType}u8`,
      params.oracleIdentifierHash,
      `${params.triggerValue}u64`,
      `${params.threshold}u64`,
      `${params.coverageAmount}u64`,
      params.poolId,
      params.recipient,
    ]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return {
    txId: result.transactionId,
    claim: {
      owner: params.recipient,
      claimId,
      policyId: params.policyId,
      claimType: CLAIM_TYPES.PARAMETRIC,
      amount: params.coverageAmount,
      status: CLAIM_STATUS.PAID,
      submittedAt: BigInt(0),
    },
    payout: {
      owner: params.recipient,
      claimId,
      policyId: params.policyId,
      amount: params.coverageAmount,
      paidAt: BigInt(0),
    },
  };
}

// Submit traditional claim
export async function submitTraditionalClaim(
  wallet: WalletAdapter,
  params: {
    policyId: string;
    amount: bigint;
    evidenceHash: string;
    descriptionHash: string;
  }
): Promise<{ txId: string; claim: Claim }> {
  const claimId = await generateClaimId();

  const tx = await programManager.buildTransaction(
    'claims_engine.aleo',
    'submit_traditional_claim',
    [
      claimId,
      params.policyId,
      `${params.amount}u64`,
      params.evidenceHash,
      params.descriptionHash,
    ]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return {
    txId: result.transactionId,
    claim: {
      owner: await wallet.getAddress(),
      claimId,
      policyId: params.policyId,
      claimType: CLAIM_TYPES.TRADITIONAL,
      amount: params.amount,
      status: CLAIM_STATUS.SUBMITTED,
      submittedAt: BigInt(0),
    },
  };
}

// Get user's claims
export async function getUserClaims(wallet: WalletAdapter): Promise<Claim[]> {
  const viewKey = await wallet.getViewKey();
  const records = await aleoClient.getRecordsForProgram(
    viewKey,
    'claims_engine.aleo'
  );

  return records
    .filter((r) => r.recordType === 'Claim')
    .map(parseClaimRecord);
}

// Get user's payouts
export async function getUserPayouts(wallet: WalletAdapter): Promise<Payout[]> {
  const viewKey = await wallet.getViewKey();
  const records = await aleoClient.getRecordsForProgram(
    viewKey,
    'claims_engine.aleo'
  );

  return records
    .filter((r) => r.recordType === 'Payout')
    .map(parsePayoutRecord);
}

// Get claim public data
export async function getClaimPublicData(claimId: string) {
  try {
    const data = await aleoClient.getProgramMapping(
      'claims_engine.aleo',
      'claims',
      claimId
    );
    return data ? parseClaimPublicData(data) : null;
  } catch {
    return null;
  }
}
```

#### Auto-Trigger Backend Service

```typescript
// lib/claims/auto-trigger.ts
import { getOracleData, DATA_TYPES } from '@/lib/aleo/oracle';
import { getUserPolicies, POLICY_STATUS } from '@/lib/aleo/policy';
import { processParametricClaim } from '@/lib/aleo/claims';
import { getOracleWallet } from '@/lib/wallet/oracle-wallet';

export interface TriggerResult {
  policyId: string;
  triggered: boolean;
  claimId?: string;
  txId?: string;
  reason?: string;
}

// Check all active flight policies for triggers
export async function checkFlightTriggers(): Promise<TriggerResult[]> {
  const results: TriggerResult[] = [];
  const oracleWallet = getOracleWallet();

  // Get all policies with flight coverage
  // In production: this would come from an indexer
  const policies = await getActiveFlightPolicies();

  for (const policy of policies) {
    const identifier = `${policy.flightNumber}_${policy.flightDate}`;

    // Get oracle data
    const oracleData = await getOracleData(DATA_TYPES.FLIGHT, identifier);

    if (!oracleData) {
      results.push({
        policyId: policy.policyId,
        triggered: false,
        reason: 'No oracle data available',
      });
      continue;
    }

    // Check if threshold exceeded
    const delayMinutes = oracleData.value;
    const threshold = BigInt(policy.delayThreshold);

    if (delayMinutes >= threshold) {
      try {
        // Process parametric claim
        const { txId, claim } = await processParametricClaim(oracleWallet, {
          policyId: policy.policyId,
          oracleDataType: DATA_TYPES.FLIGHT,
          oracleIdentifierHash: oracleData.identifierHash,
          triggerValue: delayMinutes,
          threshold,
          coverageAmount: policy.coverageAmount,
          poolId: policy.poolId,
          recipient: policy.owner,
        });

        results.push({
          policyId: policy.policyId,
          triggered: true,
          claimId: claim.claimId,
          txId,
        });

        console.log(`Auto-claim triggered for policy ${policy.policyId}: ${delayMinutes}min delay >= ${threshold}min threshold`);
      } catch (error) {
        results.push({
          policyId: policy.policyId,
          triggered: false,
          reason: `Claim processing failed: ${error}`,
        });
      }
    } else {
      results.push({
        policyId: policy.policyId,
        triggered: false,
        reason: `Delay ${delayMinutes}min below threshold ${threshold}min`,
      });
    }
  }

  return results;
}

// Cron handler for auto-triggers
export async function runAutoTriggerJob() {
  console.log('Running auto-trigger job...');

  const flightResults = await checkFlightTriggers();
  const weatherResults = await checkWeatherTriggers();

  const triggered = [...flightResults, ...weatherResults].filter((r) => r.triggered);

  console.log(`Auto-trigger job complete. ${triggered.length} claims processed.`);

  return { flightResults, weatherResults };
}
```

#### Claim Timeline Component

```typescript
// components/claims/claim-timeline.tsx
import { Check, Clock, AlertCircle, XCircle, DollarSign } from 'lucide-react';
import { CLAIM_STATUS, STATUS_LABELS } from '@/lib/aleo/claims';
import { cn } from '@/lib/utils';

interface TimelineStep {
  status: number;
  label: string;
  timestamp?: bigint;
  completed: boolean;
  current: boolean;
}

interface ClaimTimelineProps {
  currentStatus: number;
  submittedAt?: bigint;
  processedAt?: bigint;
  paidAt?: bigint;
}

export function ClaimTimeline({
  currentStatus,
  submittedAt,
  processedAt,
  paidAt,
}: ClaimTimelineProps) {
  const steps: TimelineStep[] = [
    {
      status: CLAIM_STATUS.SUBMITTED,
      label: 'Submitted',
      timestamp: submittedAt,
      completed: currentStatus >= CLAIM_STATUS.SUBMITTED,
      current: currentStatus === CLAIM_STATUS.SUBMITTED,
    },
    {
      status: CLAIM_STATUS.VALIDATING,
      label: 'Validating',
      completed: currentStatus >= CLAIM_STATUS.VALIDATING && currentStatus !== CLAIM_STATUS.REJECTED,
      current: currentStatus === CLAIM_STATUS.VALIDATING,
    },
    {
      status: CLAIM_STATUS.APPROVED,
      label: 'Approved',
      timestamp: processedAt,
      completed: currentStatus >= CLAIM_STATUS.APPROVED && currentStatus !== CLAIM_STATUS.REJECTED,
      current: currentStatus === CLAIM_STATUS.APPROVED,
    },
    {
      status: CLAIM_STATUS.PAID,
      label: 'Paid',
      timestamp: paidAt,
      completed: currentStatus === CLAIM_STATUS.PAID,
      current: currentStatus === CLAIM_STATUS.PAID,
    },
  ];

  const isRejected = currentStatus === CLAIM_STATUS.REJECTED;

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const Icon = getStepIcon(step, isRejected);

        return (
          <div key={step.status} className="flex gap-4">
            {/* Icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2',
                  step.completed && !isRejected
                    ? 'border-green-600 bg-green-600 text-white'
                    : step.current
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isRejected && index >= 2
                    ? 'border-muted bg-muted text-muted-foreground'
                    : 'border-muted bg-background'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-8 w-0.5',
                    step.completed && !isRejected ? 'bg-green-600' : 'bg-muted'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <p
                className={cn(
                  'font-medium',
                  step.completed && !isRejected
                    ? 'text-green-600'
                    : step.current
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-sm text-muted-foreground">
                  {formatTimestamp(step.timestamp)}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Rejected state */}
      {isRejected && (
        <div className="flex gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-destructive bg-destructive text-destructive-foreground">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-destructive">Rejected</p>
            {processedAt && (
              <p className="text-sm text-muted-foreground">
                {formatTimestamp(processedAt)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getStepIcon(step: TimelineStep, isRejected: boolean) {
  if (step.completed && !isRejected) return Check;
  if (step.status === CLAIM_STATUS.PAID) return DollarSign;
  if (step.current) return Clock;
  return Clock;
}

function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}
```

#### Parametric Trigger Display

```typescript
// components/claims/parametric-trigger.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plane, Cloud, Zap, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ParametricTriggerProps {
  type: 'flight' | 'weather';
  threshold: number;
  actualValue: number;
  triggered: boolean;
  payoutAmount?: bigint;
  details: {
    flightNumber?: string;
    location?: string;
    eventType?: string;
  };
}

export function ParametricTrigger({
  type,
  threshold,
  actualValue,
  triggered,
  payoutAmount,
  details,
}: ParametricTriggerProps) {
  const Icon = type === 'flight' ? Plane : Cloud;
  const thresholdLabel = type === 'flight' ? 'min delay' : 'severity';

  return (
    <Card className={triggered ? 'border-green-600' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Parametric Trigger</CardTitle>
        </div>
        <Badge variant={triggered ? 'default' : 'secondary'}>
          {triggered ? (
            <>
              <Zap className="mr-1 h-3 w-3" />
              Triggered
            </>
          ) : (
            'Not Triggered'
          )}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Threshold vs Actual */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Threshold</p>
            <p className="text-xl font-bold">
              {threshold} {thresholdLabel}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actual</p>
            <p className={`text-xl font-bold ${actualValue >= threshold ? 'text-green-600' : ''}`}>
              {actualValue} {thresholdLabel}
            </p>
          </div>
        </div>

        {/* Progress bar showing threshold */}
        <div className="relative h-4 rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute h-full ${triggered ? 'bg-green-600' : 'bg-primary'}`}
            style={{ width: `${Math.min((actualValue / threshold) * 100, 100)}%` }}
          />
          <div
            className="absolute h-full w-0.5 bg-destructive"
            style={{ left: `${Math.min((threshold / Math.max(actualValue, threshold)) * 100, 100)}%` }}
          />
        </div>

        {/* Details */}
        <div className="text-sm text-muted-foreground">
          {type === 'flight' && details.flightNumber && (
            <p>Flight: {details.flightNumber}</p>
          )}
          {type === 'weather' && details.location && (
            <p>Location: {details.location}</p>
          )}
        </div>

        {/* Payout */}
        {triggered && payoutAmount && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Automatic payout of {formatCurrency(payoutAmount)} processed
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

### Layer: Integration

| Deliverable | Purpose |
|-------------|---------|
| Oracle triggers claim | Oracle data auto-processes claims |
| Payout executes | Funds transferred from pool |
| Pool balance updates | Pool TVL decreases by payout |
| Real-time notifications | User notified of payout |

---

## Testable Outcomes

Wave 6 is testable with this end-to-end flow:

### E2E Test: Flight Delayed → Auto-Claim → Payout to Wallet

```
1. Setup: Have active flight delay policy (from Wave 5)
2. Oracle submits flight data with delay >= threshold (Wave 3)
3. Auto-trigger service detects trigger condition
4. Parametric claim processed automatically
5. Payout record created
6. Pool balance reduced
7. User receives notification
8. Claim appears in /dashboard/claims with "Paid" status
9. Payout visible in wallet balance
```

### Contract Tests

```bash
cd contracts/claims_engine
leo test

# Expected:
# ✓ test_process_parametric_claim
# ✓ test_submit_traditional_claim
# ✓ test_approve_claim
# ✓ test_reject_claim
# ✓ test_execute_payout
# ✓ test_duplicate_trigger_prevention
# All tests passed!
```

### Integration Test

```typescript
// tests/integration/claims.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { processParametricClaim, getUserClaims, getUserPayouts } from '@/lib/aleo/claims';
import { submitOracleData, DATA_TYPES } from '@/lib/aleo/oracle';
import { createPolicy } from '@/lib/aleo/policy';
import { createTestWallet, waitForTx } from './helpers';

describe('Claims Integration', () => {
  let wallet: TestWallet;
  let policyId: string;

  beforeAll(async () => {
    wallet = await createTestWallet();

    // Create a test policy
    const result = await createPolicy(wallet, {
      coverageType: 1,
      coverageAmount: BigInt(1000_000_000),
      premiumAmount: BigInt(50_000_000),
      durationDays: 7,
      poolId: 'flight_pool_001field',
      proofHash: 'test_proof_hash',
      attestationCommitment: 'test_commitment',
    });
    await waitForTx(result.txId);
    policyId = result.policy.policyId;
  });

  it('processes parametric claim when oracle threshold met', async () => {
    // Submit oracle data with delay
    const oracleTxId = await submitOracleData(wallet, {
      oracleId: 'test_oracle_001field',
      dataType: DATA_TYPES.FLIGHT,
      identifier: 'UA1234_2024-06-01',
      data: { delay: 180 },
      value: BigInt(180), // 180 minutes delay
    });
    await waitForTx(oracleTxId);

    // Process parametric claim
    const { txId, claim, payout } = await processParametricClaim(wallet, {
      policyId,
      oracleDataType: DATA_TYPES.FLIGHT,
      oracleIdentifierHash: 'UA1234_2024-06-01_hash',
      triggerValue: BigInt(180),
      threshold: BigInt(120),
      coverageAmount: BigInt(1000_000_000),
      poolId: 'flight_pool_001field',
      recipient: await wallet.getAddress(),
    });
    await waitForTx(txId);

    expect(claim.status).toBe(5); // PAID
    expect(payout.amount).toBe(BigInt(1000_000_000));
  });

  it('claim and payout appear in user records', async () => {
    const claims = await getUserClaims(wallet);
    const payouts = await getUserPayouts(wallet);

    expect(claims.length).toBeGreaterThan(0);
    expect(payouts.length).toBeGreaterThan(0);
    expect(claims[0].claimType).toBe(1); // PARAMETRIC
  });
});
```

---

## Commands

```bash
# Build and test contract
cd contracts/claims_engine
leo build
leo test

# Deploy to testnet
leo deploy --network testnet

# Run auto-trigger job (development)
npm run trigger:check

# Run frontend
npm run dev
```

---

## Exit Criteria

Wave 6 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | Contract compiles | `leo build` succeeds |
| 2 | Contract tests pass | `leo test` all green |
| 3 | Contract deployed | Transaction confirmed |
| 4 | Parametric claim works | Auto-process completes |
| 5 | Traditional claim works | Submit and approve flow |
| 6 | Payout executes | Funds transferred |
| 7 | Claims list displays | UI shows claims |
| 8 | Claim timeline works | Progress visible |
| 9 | Auto-trigger service works | Backend processes claims |
| 10 | Full E2E flow | Delay → auto-claim → payout |

---

## Next Wave Preview

**Wave 7: Database & Indexer** will add the off-chain data layer:
- PostgreSQL with Prisma
- Blockchain event indexer
- Redis cache for performance
- Full API routes
- Real-time WebSocket updates
