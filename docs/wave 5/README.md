# Wave 5: Policy Registry

**Objective:** Core insurance flow with ZK proofs - the heart of the protocol.

**Theme:** Privacy-preserving insurance purchase

**Depends on:** Wave 4

---

## Overview

Wave 5 implements the core insurance purchase flow. Users select coverage, configure parameters, generate ZK proofs to prove eligibility (without revealing data), and purchase policies on-chain. This is where the privacy-preserving magic happens.

By the end: Select coverage → generate proof → pay premium → policy on-chain.

---

## Deliverables

### Layer: Contracts

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| `policy_registry.aleo` | `contracts/policy_registry/src/main.leo` | Policy lifecycle management |
| Policy tests | `contracts/policy_registry/tests/` | Unit tests |
| Deployment script | `scripts/deploy-policy.sh` | Testnet deployment |

#### Contract: policy_registry.aleo

```leo
// contracts/policy_registry/src/main.leo
program policy_registry.aleo {

    // Import risk_pool for premium recording
    import risk_pool.aleo;

    // Records (private)
    record Policy {
        owner: address,
        policy_id: field,
        coverage_type: u8,
        coverage_amount: u64,
        premium_amount: u64,
        effective_date: u64,
        expiration_date: u64,
        pool_id: field,
        proof_hash: field,
        status: u8,
    }

    record PolicyOwnershipProof {
        owner: address,
        policy_id: field,
        commitment: field,
    }

    // Mappings (public)
    mapping policies: field => PolicyPublicData;
    mapping user_policy_count: address => u32;
    mapping pool_policy_count: field => u32;
    mapping active_coverage: field => u64;  // pool_id => total active coverage

    // Structs
    struct PolicyPublicData {
        policy_id: field,
        coverage_type: u8,
        coverage_amount: u64,
        premium_amount: u64,
        pool_id: field,
        effective_date: u64,
        expiration_date: u64,
        status: u8,
        created_at: u64,
    }

    struct CoverageParams {
        coverage_type: u8,
        coverage_amount: u64,
        duration_days: u32,
        deductible: u64,
    }

    // Coverage types
    const COVERAGE_FLIGHT_DELAY: u8 = 1u8;
    const COVERAGE_WEATHER_EVENT: u8 = 2u8;

    // Policy status
    const STATUS_ACTIVE: u8 = 1u8;
    const STATUS_EXPIRED: u8 = 2u8;
    const STATUS_CANCELLED: u8 = 3u8;
    const STATUS_CLAIMED: u8 = 4u8;

    // === Policy Creation ===

    // Create a new policy with ZK proof of eligibility
    transition create_policy(
        policy_id: field,
        coverage_type: u8,
        coverage_amount: u64,
        premium_amount: u64,
        effective_date: u64,
        duration_days: u32,
        pool_id: field,
        proof_hash: field,           // Hash of ZK eligibility proof
        attestation_commitment: field // Commitment to attestation used
    ) -> Policy {
        // Calculate expiration
        let expiration_date: u64 = effective_date + (duration_days as u64) * 86400u64;

        // Create private policy record
        let policy: Policy = Policy {
            owner: self.caller,
            policy_id: policy_id,
            coverage_type: coverage_type,
            coverage_amount: coverage_amount,
            premium_amount: premium_amount,
            effective_date: effective_date,
            expiration_date: expiration_date,
            pool_id: pool_id,
            proof_hash: proof_hash,
            status: STATUS_ACTIVE,
        };

        return policy then finalize(
            policy_id,
            coverage_type,
            coverage_amount,
            premium_amount,
            pool_id,
            effective_date,
            expiration_date,
            self.caller
        );
    }

    finalize create_policy(
        policy_id: field,
        coverage_type: u8,
        coverage_amount: u64,
        premium_amount: u64,
        pool_id: field,
        effective_date: u64,
        expiration_date: u64,
        owner: address
    ) {
        // Ensure policy doesn't already exist
        let exists: bool = Mapping::contains(policies, policy_id);
        assert(!exists);

        // Create public policy data
        let public_data: PolicyPublicData = PolicyPublicData {
            policy_id: policy_id,
            coverage_type: coverage_type,
            coverage_amount: coverage_amount,
            premium_amount: premium_amount,
            pool_id: pool_id,
            effective_date: effective_date,
            expiration_date: expiration_date,
            status: STATUS_ACTIVE,
            created_at: block.height as u64,
        };
        Mapping::set(policies, policy_id, public_data);

        // Update user policy count
        let user_count: u32 = Mapping::get_or_use(user_policy_count, owner, 0u32);
        Mapping::set(user_policy_count, owner, user_count + 1u32);

        // Update pool policy count
        let pool_count: u32 = Mapping::get_or_use(pool_policy_count, pool_id, 0u32);
        Mapping::set(pool_policy_count, pool_id, pool_count + 1u32);

        // Update active coverage for pool
        let current_coverage: u64 = Mapping::get_or_use(active_coverage, pool_id, 0u64);
        Mapping::set(active_coverage, pool_id, current_coverage + coverage_amount);

        // Record premium to pool (cross-program call)
        // In production: risk_pool.aleo/record_premium(pool_id, premium_amount);
    }

    // === Policy Management ===

    // Renew an existing policy
    transition renew_policy(
        policy: Policy,
        new_premium_amount: u64,
        additional_days: u32
    ) -> Policy {
        // Verify ownership
        assert_eq(policy.owner, self.caller);

        // Verify policy is active or expired (can renew)
        assert(policy.status == STATUS_ACTIVE || policy.status == STATUS_EXPIRED);

        // Calculate new expiration
        let new_expiration: u64 = policy.expiration_date + (additional_days as u64) * 86400u64;

        // Create renewed policy
        let renewed: Policy = Policy {
            owner: self.caller,
            policy_id: policy.policy_id,
            coverage_type: policy.coverage_type,
            coverage_amount: policy.coverage_amount,
            premium_amount: new_premium_amount,
            effective_date: policy.effective_date,
            expiration_date: new_expiration,
            pool_id: policy.pool_id,
            proof_hash: policy.proof_hash,
            status: STATUS_ACTIVE,
        };

        return renewed then finalize(policy.policy_id, new_expiration, new_premium_amount, policy.pool_id);
    }

    finalize renew_policy(
        policy_id: field,
        new_expiration: u64,
        premium_amount: u64,
        pool_id: field
    ) {
        let data: PolicyPublicData = Mapping::get(policies, policy_id);
        let updated: PolicyPublicData = PolicyPublicData {
            policy_id: data.policy_id,
            coverage_type: data.coverage_type,
            coverage_amount: data.coverage_amount,
            premium_amount: premium_amount,
            pool_id: data.pool_id,
            effective_date: data.effective_date,
            expiration_date: new_expiration,
            status: STATUS_ACTIVE,
            created_at: data.created_at,
        };
        Mapping::set(policies, policy_id, updated);
    }

    // Cancel a policy (partial refund calculated off-chain)
    transition cancel_policy(policy: Policy) -> field {
        // Verify ownership
        assert_eq(policy.owner, self.caller);

        // Verify policy is active
        assert_eq(policy.status, STATUS_ACTIVE);

        return policy.policy_id then finalize(policy.policy_id, policy.pool_id, policy.coverage_amount);
    }

    finalize cancel_policy(policy_id: field, pool_id: field, coverage_amount: u64) {
        let data: PolicyPublicData = Mapping::get(policies, policy_id);
        let updated: PolicyPublicData = PolicyPublicData {
            policy_id: data.policy_id,
            coverage_type: data.coverage_type,
            coverage_amount: data.coverage_amount,
            premium_amount: data.premium_amount,
            pool_id: data.pool_id,
            effective_date: data.effective_date,
            expiration_date: data.expiration_date,
            status: STATUS_CANCELLED,
            created_at: data.created_at,
        };
        Mapping::set(policies, policy_id, updated);

        // Reduce active coverage
        let current_coverage: u64 = Mapping::get(active_coverage, pool_id);
        Mapping::set(active_coverage, pool_id, current_coverage - coverage_amount);
    }

    // Expire a policy (called by keeper or anyone after expiration)
    transition expire_policy(policy_id: field) {
        return then finalize(policy_id);
    }

    finalize expire_policy(policy_id: field) {
        let data: PolicyPublicData = Mapping::get(policies, policy_id);

        // Verify policy is past expiration
        assert(block.height as u64 > data.expiration_date);

        // Only active policies can expire
        assert_eq(data.status, STATUS_ACTIVE);

        let updated: PolicyPublicData = PolicyPublicData {
            policy_id: data.policy_id,
            coverage_type: data.coverage_type,
            coverage_amount: data.coverage_amount,
            premium_amount: data.premium_amount,
            pool_id: data.pool_id,
            effective_date: data.effective_date,
            expiration_date: data.expiration_date,
            status: STATUS_EXPIRED,
            created_at: data.created_at,
        };
        Mapping::set(policies, policy_id, updated);

        // Reduce active coverage
        let current_coverage: u64 = Mapping::get(active_coverage, data.pool_id);
        Mapping::set(active_coverage, data.pool_id, current_coverage - data.coverage_amount);
    }

    // === Privacy Features ===

    // Generate ownership proof without revealing policy details
    transition prove_ownership(policy: Policy) -> PolicyOwnershipProof {
        assert_eq(policy.owner, self.caller);

        let commitment: field = BHP256::hash_to_field(policy);

        return PolicyOwnershipProof {
            owner: self.caller,
            policy_id: policy.policy_id,
            commitment: commitment,
        };
    }

    // Mark policy as claimed (called by claims_engine)
    transition mark_claimed(policy_id: field) {
        return then finalize(policy_id);
    }

    finalize mark_claimed(policy_id: field) {
        let data: PolicyPublicData = Mapping::get(policies, policy_id);

        // Verify policy is active
        assert_eq(data.status, STATUS_ACTIVE);

        let updated: PolicyPublicData = PolicyPublicData {
            policy_id: data.policy_id,
            coverage_type: data.coverage_type,
            coverage_amount: data.coverage_amount,
            premium_amount: data.premium_amount,
            pool_id: data.pool_id,
            effective_date: data.effective_date,
            expiration_date: data.expiration_date,
            status: STATUS_CLAIMED,
            created_at: data.created_at,
        };
        Mapping::set(policies, policy_id, updated);

        // Reduce active coverage
        let current_coverage: u64 = Mapping::get(active_coverage, data.pool_id);
        Mapping::set(active_coverage, data.pool_id, current_coverage - data.coverage_amount);
    }
}
```

### Layer: Frontend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Policy helpers | `lib/aleo/policy.ts` | Policy contract interactions |
| Proof generator | `lib/proofs/eligibility.ts` | Client-side ZK proof generation |
| Policy wizard | `components/policy/wizard/` | 6-step purchase flow |
| Premium calculator | `components/policy/premium-calculator.tsx` | Price estimation |
| Policy list | `pages/dashboard/policies/index.tsx` | User's policies |
| Policy detail | `pages/dashboard/policies/[id].tsx` | Single policy view |

```bash
# Additional shadcn components
npx shadcn@latest add stepper calendar popover command slider
```

#### Policy Contract Helpers

```typescript
// lib/aleo/policy.ts
import { aleoClient, programManager } from './client';
import { generatePolicyId, hashField } from './utils';

export interface Policy {
  owner: string;
  policyId: string;
  coverageType: number;
  coverageAmount: bigint;
  premiumAmount: bigint;
  effectiveDate: bigint;
  expirationDate: bigint;
  poolId: string;
  proofHash: string;
  status: number;
}

export const COVERAGE_TYPES = {
  FLIGHT_DELAY: 1,
  WEATHER_EVENT: 2,
} as const;

export const POLICY_STATUS = {
  ACTIVE: 1,
  EXPIRED: 2,
  CANCELLED: 3,
  CLAIMED: 4,
} as const;

export const STATUS_LABELS: Record<number, string> = {
  [POLICY_STATUS.ACTIVE]: 'Active',
  [POLICY_STATUS.EXPIRED]: 'Expired',
  [POLICY_STATUS.CANCELLED]: 'Cancelled',
  [POLICY_STATUS.CLAIMED]: 'Claimed',
};

// Create a new policy
export async function createPolicy(
  wallet: WalletAdapter,
  params: {
    coverageType: number;
    coverageAmount: bigint;
    premiumAmount: bigint;
    durationDays: number;
    poolId: string;
    proofHash: string;
    attestationCommitment: string;
  }
): Promise<{ txId: string; policy: Policy }> {
  const address = await wallet.getAddress();
  const policyId = await generatePolicyId();
  const effectiveDate = BigInt(Math.floor(Date.now() / 1000));
  const expirationDate = effectiveDate + BigInt(params.durationDays * 86400);

  const tx = await programManager.buildTransaction(
    'policy_registry.aleo',
    'create_policy',
    [
      policyId,
      `${params.coverageType}u8`,
      `${params.coverageAmount}u64`,
      `${params.premiumAmount}u64`,
      `${effectiveDate}u64`,
      `${params.durationDays}u32`,
      params.poolId,
      params.proofHash,
      params.attestationCommitment,
    ]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return {
    txId: result.transactionId,
    policy: {
      owner: address,
      policyId,
      coverageType: params.coverageType,
      coverageAmount: params.coverageAmount,
      premiumAmount: params.premiumAmount,
      effectiveDate,
      expirationDate,
      poolId: params.poolId,
      proofHash: params.proofHash,
      status: POLICY_STATUS.ACTIVE,
    },
  };
}

// Get user's policies
export async function getUserPolicies(
  wallet: WalletAdapter
): Promise<Policy[]> {
  const viewKey = await wallet.getViewKey();
  const records = await aleoClient.getRecordsForProgram(
    viewKey,
    'policy_registry.aleo'
  );

  return records
    .filter((r) => r.recordType === 'Policy')
    .map(parsePolicyRecord);
}

// Get policy public data
export async function getPolicyPublicData(
  policyId: string
): Promise<PolicyPublicData | null> {
  try {
    const data = await aleoClient.getProgramMapping(
      'policy_registry.aleo',
      'policies',
      policyId
    );
    return data ? parsePolicyPublicData(data) : null;
  } catch {
    return null;
  }
}

// Renew policy
export async function renewPolicy(
  wallet: WalletAdapter,
  policy: Policy,
  newPremium: bigint,
  additionalDays: number
): Promise<{ txId: string }> {
  const tx = await programManager.buildTransaction(
    'policy_registry.aleo',
    'renew_policy',
    [serializePolicy(policy), `${newPremium}u64`, `${additionalDays}u32`]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return { txId: result.transactionId };
}

// Cancel policy
export async function cancelPolicy(
  wallet: WalletAdapter,
  policy: Policy
): Promise<{ txId: string }> {
  const tx = await programManager.buildTransaction(
    'policy_registry.aleo',
    'cancel_policy',
    [serializePolicy(policy)]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return { txId: result.transactionId };
}
```

#### ZK Proof Generator

```typescript
// lib/proofs/eligibility.ts
import { snarkvm } from '@aleohq/wasm';

export interface EligibilityProofInput {
  attestationId: string;
  attestationType: number;
  claims: Record<string, unknown>;
  coverageType: number;
  coverageAmount: bigint;
}

export interface EligibilityProof {
  proof: string;
  publicInputs: string[];
  proofHash: string;
  commitment: string;
}

// Generate eligibility proof in the browser
export async function generateEligibilityProof(
  input: EligibilityProofInput,
  onProgress?: (progress: number) => void
): Promise<EligibilityProof> {
  onProgress?.(0);

  // Initialize WASM module
  await snarkvm.initSync();
  onProgress?.(10);

  // Prepare private inputs
  const privateInputs = {
    attestation_id: input.attestationId,
    attestation_type: input.attestationType,
    claims_hash: hashClaims(input.claims),
    coverage_type: input.coverageType,
    coverage_amount: input.coverageAmount.toString(),
  };

  onProgress?.(20);

  // Generate proof (this is the slow part - 30-60 seconds)
  const proof = await snarkvm.prove(
    ELIGIBILITY_PROVER_KEY,
    'prove_eligibility',
    privateInputs,
    (p: number) => onProgress?.(20 + p * 0.7) // 20-90%
  );

  onProgress?.(90);

  // Compute hashes
  const proofHash = await hashField(proof.proof);
  const commitment = await hashField(JSON.stringify({
    attestationId: input.attestationId,
    coverageType: input.coverageType,
  }));

  onProgress?.(100);

  return {
    proof: proof.proof,
    publicInputs: proof.publicInputs,
    proofHash,
    commitment,
  };
}

// Run proof generation in Web Worker for better UX
export function generateProofInWorker(
  input: EligibilityProofInput,
  onProgress?: (progress: number) => void
): Promise<EligibilityProof> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./proof-worker.ts', import.meta.url)
    );

    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        onProgress?.(e.data.progress);
      } else if (e.data.type === 'complete') {
        resolve(e.data.proof);
        worker.terminate();
      } else if (e.data.type === 'error') {
        reject(new Error(e.data.error));
        worker.terminate();
      }
    };

    worker.postMessage({ type: 'generate', input });
  });
}
```

#### Policy Wizard (6 Steps)

```typescript
// components/policy/wizard/index.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StepCoverage } from './step-coverage';
import { StepConfigure } from './step-configure';
import { StepAttestation } from './step-attestation';
import { StepProof } from './step-proof';
import { StepReview } from './step-review';
import { StepConfirm } from './step-confirm';
import { usePolicyWizardStore } from '@/stores/policy-wizard-store';

const STEPS = [
  { id: 1, label: 'Coverage', component: StepCoverage },
  { id: 2, label: 'Configure', component: StepConfigure },
  { id: 3, label: 'Attestation', component: StepAttestation },
  { id: 4, label: 'Proof', component: StepProof },
  { id: 5, label: 'Review', component: StepReview },
  { id: 6, label: 'Confirm', component: StepConfirm },
];

export function PolicyWizard() {
  const router = useRouter();
  const { currentStep, setStep, reset } = usePolicyWizardStore();

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const handleComplete = (policyId: string) => {
    reset();
    router.push(`/dashboard/policies/${policyId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentStep} of {STEPS.length}</span>
          <span>{STEPS[currentStep - 1].label}</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`flex flex-col items-center ${
              step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step.id < currentStep
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step.id === currentStep
                  ? 'border-primary'
                  : 'border-muted'
              }`}
            >
              {step.id < currentStep ? '✓' : step.id}
            </div>
            <span className="text-xs mt-1 hidden md:block">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          <CurrentStepComponent
            onNext={handleNext}
            onPrev={handlePrev}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Step 1: Coverage Selection

```typescript
// components/policy/wizard/step-coverage.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePolicyWizardStore } from '@/stores/policy-wizard-store';
import { Plane, Cloud, Check } from 'lucide-react';
import { COVERAGE_TYPES } from '@/lib/aleo/policy';

interface StepProps {
  onNext: () => void;
  onPrev: () => void;
}

const COVERAGE_OPTIONS = [
  {
    type: COVERAGE_TYPES.FLIGHT_DELAY,
    title: 'Flight Delay',
    description: 'Automatic payout when your flight is delayed beyond threshold',
    icon: Plane,
    features: ['No claim filing needed', 'Payout within minutes', 'Coverage up to $10,000'],
  },
  {
    type: COVERAGE_TYPES.WEATHER_EVENT,
    title: 'Weather Event',
    description: 'Protection against hurricanes, tornadoes, floods, and extreme weather',
    icon: Cloud,
    features: ['Oracle-verified events', 'Multiple event types', 'Location-based coverage'],
  },
];

export function StepCoverage({ onNext }: StepProps) {
  const { coverageType, setCoverageType } = usePolicyWizardStore();

  const handleSelect = (type: number) => {
    setCoverageType(type);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Coverage Type</h2>
        <p className="text-muted-foreground">
          Choose the type of insurance coverage you need
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {COVERAGE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = coverageType === option.type;

          return (
            <Card
              key={option.type}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : 'hover:border-primary/50'
              }`}
              onClick={() => handleSelect(option.type)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  {isSelected && (
                    <div className="rounded-full bg-primary p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <CardTitle>{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {option.description}
                </p>
                <ul className="text-sm space-y-1">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!coverageType}>
          Continue
        </Button>
      </div>
    </div>
  );
}
```

#### Step 4: ZK Proof Generation

```typescript
// components/policy/wizard/step-proof.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePolicyWizardStore } from '@/stores/policy-wizard-store';
import { generateProofInWorker } from '@/lib/proofs/eligibility';
import { Shield, Lock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface StepProps {
  onNext: () => void;
  onPrev: () => void;
}

export function StepProof({ onNext, onPrev }: StepProps) {
  const {
    coverageType,
    coverageAmount,
    selectedAttestation,
    setProofData,
    proofStatus,
    setProofStatus,
  } = usePolicyWizardStore();

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateProof = async () => {
    if (!selectedAttestation) {
      setError('No attestation selected');
      return;
    }

    setProofStatus('generating');
    setError(null);
    setProgress(0);

    try {
      const proof = await generateProofInWorker(
        {
          attestationId: selectedAttestation.id,
          attestationType: selectedAttestation.type,
          claims: selectedAttestation.claims,
          coverageType,
          coverageAmount,
        },
        setProgress
      );

      setProofData(proof);
      setProofStatus('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proof generation failed');
      setProofStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Generate Eligibility Proof</h2>
        <p className="text-muted-foreground">
          Create a zero-knowledge proof to verify your eligibility without revealing personal data
        </p>
      </div>

      {/* Explanation */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Privacy Protected</AlertTitle>
        <AlertDescription>
          The proof is generated entirely on your device. Your personal data never leaves your browser.
        </AlertDescription>
      </Alert>

      {/* Proof Generation UI */}
      <div className="rounded-lg border p-6 space-y-4">
        {proofStatus === 'idle' && (
          <>
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground">
                  This process takes 30-60 seconds
                </p>
              </div>
            </div>
            <Button onClick={handleGenerateProof} className="w-full">
              Generate Proof
            </Button>
          </>
        )}

        {proofStatus === 'generating' && (
          <>
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div>
                <h3 className="font-semibold">Generating Proof...</h3>
                <p className="text-sm text-muted-foreground">
                  Please keep this tab open
                </p>
              </div>
            </div>
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              {progress < 20 && 'Initializing...'}
              {progress >= 20 && progress < 90 && 'Computing proof...'}
              {progress >= 90 && 'Finalizing...'}
            </p>
          </>
        )}

        {proofStatus === 'complete' && (
          <>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-600">Proof Generated</h3>
                <p className="text-sm text-muted-foreground">
                  Your eligibility has been verified
                </p>
              </div>
            </div>
            <div className="rounded bg-muted p-3 font-mono text-xs break-all">
              Proof Hash: {usePolicyWizardStore.getState().proofData?.proofHash.slice(0, 32)}...
            </div>
          </>
        )}

        {proofStatus === 'error' && (
          <>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Generation Failed</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <Button onClick={handleGenerateProof} variant="outline" className="w-full">
              Try Again
            </Button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={onNext} disabled={proofStatus !== 'complete'}>
          Continue
        </Button>
      </div>
    </div>
  );
}
```

#### Premium Calculator

```typescript
// components/policy/premium-calculator.tsx
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { COVERAGE_TYPES } from '@/lib/aleo/policy';

interface PremiumCalculatorProps {
  coverageType: number;
  coverageAmount: bigint;
  durationDays: number;
  riskFactors?: {
    airline?: string;
    location?: string;
  };
}

interface PremiumBreakdown {
  basePremium: bigint;
  coverageMultiplier: bigint;
  durationMultiplier: bigint;
  riskAdjustment: bigint;
  platformFee: bigint;
  totalPremium: bigint;
}

export function PremiumCalculator({
  coverageType,
  coverageAmount,
  durationDays,
  riskFactors,
}: PremiumCalculatorProps) {
  const breakdown = useMemo<PremiumBreakdown>(() => {
    // Base premium: 2% of coverage for flight, 3% for weather
    const baseRate = coverageType === COVERAGE_TYPES.FLIGHT_DELAY ? 0.02 : 0.03;
    const basePremium = BigInt(Math.floor(Number(coverageAmount) * baseRate));

    // Coverage multiplier: higher coverage = slightly higher rate
    const coverageMultiplier = coverageAmount > BigInt(5000_000_000)
      ? basePremium / BigInt(20) // +5%
      : BigInt(0);

    // Duration multiplier: longer coverage = more premium
    const durationMultiplier = BigInt(Math.floor(Number(basePremium) * (durationDays / 365)));

    // Risk adjustment based on factors
    let riskAdjustment = BigInt(0);
    if (riskFactors?.airline) {
      // High-risk airlines: +10%
      const highRiskAirlines = ['NK', 'F9', 'G4'];
      if (highRiskAirlines.includes(riskFactors.airline.slice(0, 2))) {
        riskAdjustment += basePremium / BigInt(10);
      }
    }

    // Platform fee: 1%
    const subtotal = basePremium + coverageMultiplier + durationMultiplier + riskAdjustment;
    const platformFee = subtotal / BigInt(100);

    const totalPremium = subtotal + platformFee;

    return {
      basePremium,
      coverageMultiplier,
      durationMultiplier,
      riskAdjustment,
      platformFee,
      totalPremium,
    };
  }, [coverageType, coverageAmount, durationDays, riskFactors]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Premium Estimate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base Premium</span>
          <span>{formatCurrency(breakdown.basePremium)}</span>
        </div>

        {breakdown.coverageMultiplier > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Coverage Adjustment</span>
            <span>+{formatCurrency(breakdown.coverageMultiplier)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Duration ({durationDays} days)</span>
          <span>+{formatCurrency(breakdown.durationMultiplier)}</span>
        </div>

        {breakdown.riskAdjustment > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Risk Adjustment</span>
            <span>+{formatCurrency(breakdown.riskAdjustment)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Platform Fee (1%)</span>
          <span>+{formatCurrency(breakdown.platformFee)}</span>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Total Premium</span>
          <span className="text-lg">{formatCurrency(breakdown.totalPremium)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Layer: Integration

| Deliverable | Purpose |
|-------------|---------|
| Client-side ZK proof | Proof generated in browser |
| Contract submission | Policy created on-chain |
| Premium payment | Funds flow to pool |
| Policy record | Private record to user |

---

## Testable Outcomes

Wave 5 is testable with this end-to-end flow:

### E2E Test: Select Coverage → Generate Proof → Pay Premium → Policy On-Chain

```
1. Connect wallet
2. Navigate to /dashboard/policies/new
3. Step 1: Select "Flight Delay" coverage
4. Step 2: Configure flight (UA1234, 2024-06-15, $1000 coverage)
5. Step 3: Select attestation (from Wave 2)
6. Step 4: Generate ZK proof (~30-60 seconds)
7. Step 5: Review all details, accept terms
8. Step 6: Confirm and sign transaction
9. Wait for confirmation
10. See policy in /dashboard/policies
11. Verify policy details on-chain
```

### Contract Tests

```bash
cd contracts/policy_registry
leo test

# Expected:
# ✓ test_create_policy
# ✓ test_renew_policy
# ✓ test_cancel_policy
# ✓ test_expire_policy
# ✓ test_prove_ownership
# All tests passed!
```

### Integration Test

```typescript
// tests/integration/policy.test.ts
import { describe, it, expect } from 'vitest';
import { createPolicy, getUserPolicies, getPolicyPublicData } from '@/lib/aleo/policy';
import { generateProofInWorker } from '@/lib/proofs/eligibility';
import { createTestWallet, waitForTx } from './helpers';

describe('Policy Integration', () => {
  let wallet: TestWallet;

  beforeAll(async () => {
    wallet = await createTestWallet();
  });

  it('creates policy with ZK proof', async () => {
    // Generate proof
    const proof = await generateProofInWorker({
      attestationId: 'test_attestation_001field',
      attestationType: 1,
      claims: { eligible: true },
      coverageType: 1,
      coverageAmount: BigInt(1000_000_000),
    });

    // Create policy
    const { txId, policy } = await createPolicy(wallet, {
      coverageType: 1,
      coverageAmount: BigInt(1000_000_000),
      premiumAmount: BigInt(50_000_000),
      durationDays: 1,
      poolId: 'flight_pool_001field',
      proofHash: proof.proofHash,
      attestationCommitment: proof.commitment,
    });

    await waitForTx(txId);

    expect(policy.status).toBe(1); // ACTIVE
  });

  it('policy appears in user list', async () => {
    const policies = await getUserPolicies(wallet);
    expect(policies.length).toBeGreaterThan(0);
  });

  it('policy public data is on-chain', async () => {
    const policies = await getUserPolicies(wallet);
    const publicData = await getPolicyPublicData(policies[0].policyId);

    expect(publicData).not.toBeNull();
    expect(publicData?.status).toBe(1);
  });
});
```

---

## Commands

```bash
# Build and test contract
cd contracts/policy_registry
leo build
leo test

# Deploy to testnet
leo deploy --network testnet

# Install shadcn components
npx shadcn@latest add stepper calendar popover command slider

# Run frontend
npm run dev
```

---

## Exit Criteria

Wave 5 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | Contract compiles | `leo build` succeeds |
| 2 | Contract tests pass | `leo test` all green |
| 3 | Contract deployed | Transaction confirmed |
| 4 | Proof generator works | Proof completes in browser |
| 5 | Wizard completes 6 steps | All steps navigate |
| 6 | Premium calculator updates | Real-time estimates |
| 7 | Policy creates on-chain | Transaction confirms |
| 8 | Policy appears in dashboard | UI shows policy |
| 9 | Policy detail page works | All info displays |
| 10 | Full E2E flow completes | End-to-end success |

---

## Next Wave Preview

**Wave 6: Claims Engine** will add the payout mechanism:
- Deploy `claims_engine.aleo` contract
- Parametric claim auto-trigger from oracles
- Traditional claim submission
- Payout execution
- Test: Flight delayed → auto-claim → payout to wallet
