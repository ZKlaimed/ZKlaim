# Wave 2: Attestation Registry

**Objective:** First business-logic contract deployment - real insurance attestations on-chain.

**Theme:** First domain-specific contract with real value

**Depends on:** Wave 1 (foundation contract already deployed)

---

## Overview

Wave 2 deploys the first **business-logic** contract (`attestation_registry.aleo`). Unlike the foundation contract from Wave 1 (which focused on pipeline validation), this contract implements real domain functionality: managing attestations that users will need for insurance eligibility.

By the end of this wave, you'll have completed a full attestation flow: request attestation → on-chain record → view in dashboard.

Building on Wave 1's foundation:
- ✅ Leo CLI and Aleo SDK already working
- ✅ Wallet adapter and transaction signing proven
- ✅ Basic contract interaction patterns established
- Now: **Real insurance domain logic**

---

## Deliverables

### Layer: Contracts

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| `attestation_registry.aleo` | `contracts/attestation_registry/src/main.leo` | First deployed contract |
| Contract tests | `contracts/attestation_registry/tests/` | Unit tests |
| Deployment script | `scripts/deploy-attestation.sh` | Testnet deployment |

#### Contract: attestation_registry.aleo

```leo
// contracts/attestation_registry/src/main.leo
program attestation_registry.aleo {

    // Records (private data)
    record Attestation {
        owner: address,
        attestor_id: field,
        subject_hash: field,
        attestation_type: u8,
        claims_hash: field,
        expires_at: u64,
    }

    // Mappings (public data)
    mapping attestors: field => AttestorInfo;
    mapping attestation_count: address => u32;
    mapping revoked_attestations: field => bool;

    // Structs
    struct AttestorInfo {
        address: address,
        name_hash: field,
        is_active: bool,
        created_at: u64,
    }

    // Attestation types
    const TYPE_IDENTITY: u8 = 1u8;
    const TYPE_CREDIT_SCORE: u8 = 2u8;
    const TYPE_DRIVING_RECORD: u8 = 3u8;
    const TYPE_HEALTH_STATUS: u8 = 4u8;

    // === Admin Functions ===

    // Register a new attestor (admin only)
    transition register_attestor(
        attestor_id: field,
        attestor_address: address,
        name_hash: field
    ) {
        // In production, add admin check
        return then finalize(attestor_id, attestor_address, name_hash);
    }

    finalize register_attestor(
        attestor_id: field,
        attestor_address: address,
        name_hash: field
    ) {
        let info: AttestorInfo = AttestorInfo {
            address: attestor_address,
            name_hash: name_hash,
            is_active: true,
            created_at: block.height as u64,
        };
        Mapping::set(attestors, attestor_id, info);
    }

    // Revoke an attestor
    transition revoke_attestor(attestor_id: field) {
        return then finalize(attestor_id);
    }

    finalize revoke_attestor(attestor_id: field) {
        let info: AttestorInfo = Mapping::get(attestors, attestor_id);
        let updated: AttestorInfo = AttestorInfo {
            address: info.address,
            name_hash: info.name_hash,
            is_active: false,
            created_at: info.created_at,
        };
        Mapping::set(attestors, attestor_id, updated);
    }

    // === Attestation Functions ===

    // Create a new attestation (private record)
    transition create_attestation(
        recipient: address,
        attestor_id: field,
        subject_hash: field,
        attestation_type: u8,
        claims_hash: field,
        expires_at: u64
    ) -> Attestation {
        // Create private attestation record
        let attestation: Attestation = Attestation {
            owner: recipient,
            attestor_id: attestor_id,
            subject_hash: subject_hash,
            attestation_type: attestation_type,
            claims_hash: claims_hash,
            expires_at: expires_at,
        };

        return attestation then finalize(recipient);
    }

    finalize create_attestation(recipient: address) {
        // Increment attestation count for user
        let current: u32 = Mapping::get_or_use(attestation_count, recipient, 0u32);
        Mapping::set(attestation_count, recipient, current + 1u32);
    }

    // Verify an attestation is valid (not revoked, not expired)
    transition verify_attestation(
        attestation: Attestation,
        current_time: u64
    ) -> bool {
        // Check expiration
        let not_expired: bool = attestation.expires_at > current_time;

        return not_expired then finalize(
            attestation.attestor_id,
            BHP256::hash_to_field(attestation)
        );
    }

    finalize verify_attestation(
        attestor_id: field,
        attestation_hash: field
    ) {
        // Check attestor is still active
        let info: AttestorInfo = Mapping::get(attestors, attestor_id);
        assert(info.is_active);

        // Check attestation not revoked
        let is_revoked: bool = Mapping::get_or_use(revoked_attestations, attestation_hash, false);
        assert(!is_revoked);
    }

    // Revoke a specific attestation
    transition revoke_attestation(attestation: Attestation) {
        let attestation_hash: field = BHP256::hash_to_field(attestation);
        return then finalize(attestation_hash);
    }

    finalize revoke_attestation(attestation_hash: field) {
        Mapping::set(revoked_attestations, attestation_hash, true);
    }
}
```

### Layer: Frontend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Contract helpers | `lib/aleo/attestation.ts` | Attestation contract interactions |
| Attestation viewer | `components/attestation/attestation-viewer.tsx` | Display attestations |
| Attestation import | `components/attestation/attestation-import.tsx` | Import existing attestations |
| Dashboard page | `pages/dashboard/index.tsx` | Main dashboard with attestations |
| State management | `stores/wallet-store.ts`, `stores/app-store.ts` | Zustand stores |

```bash
# Additional shadcn components
npx shadcn@latest add accordion carousel progress navigation-menu sheet sonner
```

#### Contract Helpers

```typescript
// lib/aleo/attestation.ts
import { aleoClient, programManager } from './client';

export interface AttestationRecord {
  owner: string;
  attestorId: string;
  subjectHash: string;
  attestationType: number;
  claimsHash: string;
  expiresAt: bigint;
}

// Attestation types matching Leo constants
export const ATTESTATION_TYPES = {
  IDENTITY: 1,
  CREDIT_SCORE: 2,
  DRIVING_RECORD: 3,
  HEALTH_STATUS: 4,
} as const;

export async function createAttestation(
  wallet: WalletAdapter,
  params: {
    attestorId: string;
    subjectHash: string;
    attestationType: number;
    claimsHash: string;
    expiresAt: bigint;
  }
): Promise<{ txId: string; attestation: AttestationRecord }> {
  const address = await wallet.getAddress();

  // Build transaction
  const tx = await programManager.buildTransaction(
    'attestation_registry.aleo',
    'create_attestation',
    [
      address,
      params.attestorId,
      params.subjectHash,
      `${params.attestationType}u8`,
      params.claimsHash,
      `${params.expiresAt}u64`,
    ]
  );

  // Sign and submit
  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return {
    txId: result.transactionId,
    attestation: {
      owner: address,
      ...params,
    },
  };
}

export async function getAttestations(
  wallet: WalletAdapter
): Promise<AttestationRecord[]> {
  const viewKey = await wallet.getViewKey();

  // Fetch records from chain
  const records = await aleoClient.getRecordsForProgram(
    viewKey,
    'attestation_registry.aleo'
  );

  return records.map(parseAttestationRecord);
}

export async function verifyAttestation(
  attestation: AttestationRecord
): Promise<boolean> {
  const currentTime = Math.floor(Date.now() / 1000);

  // Check expiration locally first
  if (attestation.expiresAt < BigInt(currentTime)) {
    return false;
  }

  // Verify on-chain
  try {
    await programManager.execute(
      'attestation_registry.aleo',
      'verify_attestation',
      [attestation, `${currentTime}u64`]
    );
    return true;
  } catch {
    return false;
  }
}

function parseAttestationRecord(record: AleoRecord): AttestationRecord {
  return {
    owner: record.owner,
    attestorId: parseField(record.data.attestor_id),
    subjectHash: parseField(record.data.subject_hash),
    attestationType: parseInt(record.data.attestation_type),
    claimsHash: parseField(record.data.claims_hash),
    expiresAt: BigInt(record.data.expires_at.replace('u64', '')),
  };
}
```

#### Attestation Viewer Component

```typescript
// components/attestation/attestation-viewer.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletStore } from '@/stores/wallet-store';
import { getAttestations, ATTESTATION_TYPES, AttestationRecord } from '@/lib/aleo/attestation';
import { Shield, Clock, CheckCircle, XCircle } from 'lucide-react';

const TYPE_LABELS: Record<number, string> = {
  [ATTESTATION_TYPES.IDENTITY]: 'Identity',
  [ATTESTATION_TYPES.CREDIT_SCORE]: 'Credit Score',
  [ATTESTATION_TYPES.DRIVING_RECORD]: 'Driving Record',
  [ATTESTATION_TYPES.HEALTH_STATUS]: 'Health Status',
};

export function AttestationViewer() {
  const { wallet, isConnected } = useWalletStore();
  const [attestations, setAttestations] = useState<AttestationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAttestations() {
      if (!isConnected || !wallet) {
        setLoading(false);
        return;
      }

      try {
        const records = await getAttestations(wallet);
        setAttestations(records);
      } catch (err) {
        setError('Failed to fetch attestations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAttestations();
  }, [wallet, isConnected]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Connect your wallet to view attestations
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (attestations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No attestations found. Import or request one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {attestations.map((attestation, index) => (
        <AttestationCard key={index} attestation={attestation} />
      ))}
    </div>
  );
}

function AttestationCard({ attestation }: { attestation: AttestationRecord }) {
  const isExpired = attestation.expiresAt < BigInt(Math.floor(Date.now() / 1000));
  const expirationDate = new Date(Number(attestation.expiresAt) * 1000);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">
            {TYPE_LABELS[attestation.attestationType] || 'Unknown'}
          </CardTitle>
        </div>
        <Badge variant={isExpired ? 'destructive' : 'default'}>
          {isExpired ? (
            <>
              <XCircle className="mr-1 h-3 w-3" />
              Expired
            </>
          ) : (
            <>
              <CheckCircle className="mr-1 h-3 w-3" />
              Valid
            </>
          )}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {isExpired ? 'Expired' : 'Expires'}: {expirationDate.toLocaleDateString()}
            </span>
          </div>
          <div className="font-mono text-xs text-muted-foreground truncate">
            ID: {attestation.subjectHash.slice(0, 16)}...
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Dashboard Page

```typescript
// pages/dashboard/index.tsx
import { RootLayout } from '@/components/layout/root-layout';
import { DashboardLayout } from '@/components/dashboard/layout';
import { AttestationViewer } from '@/components/attestation/attestation-viewer';
import { AttestationImport } from '@/components/attestation/attestation-import';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Shield, FileText, Droplets } from 'lucide-react';

export default function DashboardPage() {
  return (
    <RootLayout>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatsCard
              title="Attestations"
              value="2"
              icon={<Shield className="h-4 w-4" />}
            />
            <StatsCard
              title="Active Policies"
              value="0"
              icon={<FileText className="h-4 w-4" />}
              subtitle="Coming in Wave 5"
            />
            <StatsCard
              title="Pool Positions"
              value="0"
              icon={<Droplets className="h-4 w-4" />}
              subtitle="Coming in Wave 4"
            />
            <StatsCard
              title="Total Coverage"
              value="$0"
              subtitle="Coming soon"
            />
          </div>

          {/* Attestations Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Attestations</h2>
              <AttestationImport>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Import Attestation
                </Button>
              </AttestationImport>
            </div>
            <AttestationViewer />
          </div>
        </div>
      </DashboardLayout>
    </RootLayout>
  );
}

function StatsCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Layer: Integration

| Deliverable | Purpose |
|-------------|---------|
| Real contract calls | Frontend calls deployed contract |
| Transaction submission | Wallet signs, network processes |
| Record parsing | Decrypt and display attestations |
| Transaction status | Track pending → confirmed |

#### Transaction Status Component

```typescript
// components/transactions/tx-status.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { aleoClient } from '@/lib/aleo/client';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TxStatusProps {
  txId: string;
  onConfirmed?: () => void;
}

export function TransactionStatus({ txId, onConfirmed }: TxStatusProps) {
  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', txId],
    queryFn: () => aleoClient.getTransaction(txId),
    refetchInterval: (data) => {
      if (data?.status === 'confirmed') {
        onConfirmed?.();
        return false;
      }
      return 5000; // Poll every 5 seconds
    },
  });

  if (isLoading || !tx) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Checking status...</span>
      </div>
    );
  }

  if (tx.status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Transaction pending...</span>
      </div>
    );
  }

  if (tx.status === 'confirmed') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Confirmed in block {tx.blockHeight}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-destructive">
      <XCircle className="h-4 w-4" />
      <span>Failed: {tx.error}</span>
    </div>
  );
}
```

---

## Testable Outcomes

Wave 2 is testable when you can complete this end-to-end flow:

### E2E Test: Request Attestation → On-Chain → View in Dashboard

```
1. Connect wallet
2. Navigate to /dashboard
3. Click "Import Attestation" (or use test attestor)
4. Fill in attestation details
5. Sign transaction with wallet
6. Wait for confirmation (track tx status)
7. See attestation appear in dashboard
8. Verify attestation shows correct type and expiration
```

### Contract Tests

```bash
cd contracts/attestation_registry
leo test

# Expected output:
# Running 4 tests...
# ✓ test_register_attestor
# ✓ test_create_attestation
# ✓ test_verify_attestation
# ✓ test_revoke_attestation
# All tests passed!
```

### Integration Test Script

```typescript
// tests/integration/attestation.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestWallet, waitForTx } from './helpers';
import { createAttestation, getAttestations, verifyAttestation } from '@/lib/aleo/attestation';

describe('Attestation Integration', () => {
  let wallet: TestWallet;

  beforeAll(async () => {
    wallet = await createTestWallet();
  });

  it('creates and retrieves attestation', async () => {
    // Create attestation
    const { txId, attestation } = await createAttestation(wallet, {
      attestorId: 'test_attestor_001field',
      subjectHash: 'subject_hash_123field',
      attestationType: 1, // IDENTITY
      claimsHash: 'claims_hash_456field',
      expiresAt: BigInt(Date.now() / 1000 + 86400 * 365), // 1 year
    });

    // Wait for confirmation
    await waitForTx(txId);

    // Fetch attestations
    const attestations = await getAttestations(wallet);

    // Verify
    expect(attestations.length).toBeGreaterThan(0);
    expect(attestations[0].attestationType).toBe(1);
  });

  it('verifies valid attestation', async () => {
    const attestations = await getAttestations(wallet);
    const isValid = await verifyAttestation(attestations[0]);
    expect(isValid).toBe(true);
  });
});
```

---

## Commands

```bash
# Install new dependencies
npm install zustand @tanstack/react-query

# Install shadcn components
npx shadcn@latest add accordion carousel progress navigation-menu sheet sonner

# Build and test contract
cd contracts/attestation_registry
leo build
leo test

# Deploy to testnet
leo deploy --network testnet

# Run frontend
npm run dev
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "zustand": "^4.x",
    "@tanstack/react-query": "^5.x"
  }
}
```

---

## Exit Criteria

Wave 2 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | Contract compiles | `leo build` succeeds |
| 2 | Contract tests pass | `leo test` all green |
| 3 | Contract deployed to testnet | Transaction confirmed |
| 4 | Frontend calls contract | createAttestation returns txId |
| 5 | Transaction submits | Visible on Aleo explorer |
| 6 | Records parse correctly | getAttestations returns data |
| 7 | Dashboard displays attestations | UI shows attestation cards |
| 8 | E2E flow works | Full round-trip completes |
| 9 | Zustand stores working | Wallet state persists |
| 10 | React Query configured | Data fetching works |

---

## Next Wave Preview

**Wave 3: Oracle Bridge** will add external data feeds:
- Deploy `oracle_bridge.aleo` contract
- Integrate flight data API (AviationStack)
- Integrate weather data API (OpenWeatherMap)
- Oracle status dashboard
- Test: Oracle submits flight delay → data visible on-chain and in UI
