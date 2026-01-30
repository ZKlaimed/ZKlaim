# Wave 9: Blockchain Integration

**Objective:** Integrate frontend with Aleo blockchain and smart contracts.

**Track:** Integration (merges Track A + Track B)
**Depends on:** Wave 7 (Frontend) + Wave 8 (Contracts)

---

## Deliverables

### 1. Aleo SDK Setup

```bash
npm install @aleohq/sdk
```

| File | Purpose |
|------|---------|
| `lib/aleo/client.ts` | Aleo network client |
| `lib/aleo/programs.ts` | Program interaction helpers |
| `lib/aleo/transactions.ts` | Transaction building |
| `lib/aleo/records.ts` | Record parsing utilities |

### 2. Real Wallet Integration

| File | Purpose |
|------|---------|
| `lib/wallet/leo-wallet.ts` | Leo Wallet adapter |
| `lib/wallet/puzzle-wallet.ts` | Puzzle Wallet adapter |
| `lib/wallet/adapter.ts` | Unified wallet interface |

Update existing wallet components:
- `components/wallet/connect-button.tsx`
- `components/wallet/wallet-modal.tsx`
- `components/wallet/account-dropdown.tsx`

### 3. ZK Proof Generation

```
lib/proofs/
├── index.ts              # Proof generation orchestrator
├── eligibility.ts        # Eligibility proofs
├── ownership.ts          # Policy ownership proofs
├── claim.ts              # Claim proofs
└── wasm-loader.ts        # WASM module loader
```

```
components/proofs/
├── proof-generator.tsx   # Proof generation UI
├── proof-progress.tsx    # Generation progress
├── proof-status.tsx      # Proof status display
└── index.ts              # Barrel export
```

### 4. Transaction Flow

```
lib/transactions/
├── index.ts              # Transaction utilities
├── policy-purchase.ts    # Policy purchase tx
├── claim-submit.ts       # Claim submission tx
├── pool-deposit.ts       # Pool deposit tx
├── pool-withdraw.ts      # Pool withdrawal tx
└── helpers.ts            # Common helpers
```

```
components/transactions/
├── tx-modal.tsx          # Transaction confirmation modal
├── tx-status.tsx         # Transaction status tracker
├── tx-history.tsx        # Transaction history list
└── index.ts              # Barrel export
```

### 5. Blockchain Indexer

```bash
npm install bull ioredis
```

| File | Purpose |
|------|---------|
| `lib/indexer/index.ts` | Indexer orchestrator |
| `lib/indexer/policy-handler.ts` | Policy event handler |
| `lib/indexer/claim-handler.ts` | Claim event handler |
| `lib/indexer/pool-handler.ts` | Pool event handler |
| `pages/api/webhooks/aleo.ts` | Webhook endpoint |

---

## Aleo Client Setup

```typescript
// lib/aleo/client.ts
import { AleoNetworkClient, ProgramManager } from '@aleohq/sdk';

const TESTNET_URL = 'https://api.explorer.aleo.org/v1/testnet3';

export class AleoClient {
  private client: AleoNetworkClient;
  private programManager: ProgramManager;

  constructor() {
    this.client = new AleoNetworkClient(TESTNET_URL);
    this.programManager = new ProgramManager();
  }

  async getProgram(programId: string) {
    return await this.client.getProgram(programId);
  }

  async getTransaction(txId: string) {
    return await this.client.getTransaction(txId);
  }

  async getRecords(viewKey: string, programId: string) {
    return await this.client.getRecordsForProgram(viewKey, programId);
  }

  async submitTransaction(tx: string) {
    return await this.client.submitTransaction(tx);
  }
}

export const aleoClient = new AleoClient();
```

---

## Wallet Adapter Pattern

```typescript
// lib/wallet/adapter.ts
export interface WalletAdapter {
  name: string;
  icon: string;

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Account
  getAddress(): Promise<string>;
  getViewKey(): Promise<string>;

  // Signing
  signMessage(message: string): Promise<string>;
  signTransaction(tx: AleoTransaction): Promise<string>;

  // Records
  getRecords(programId: string): Promise<Record[]>;

  // Events
  on(event: WalletEvent, callback: Function): void;
  off(event: WalletEvent, callback: Function): void;
}

export type WalletEvent =
  | 'connect'
  | 'disconnect'
  | 'accountChange'
  | 'networkChange';
```

### Leo Wallet Integration
```typescript
// lib/wallet/leo-wallet.ts
import { LeoWallet } from '@demox-labs/aleo-wallet-adapter-leo';

export class LeoWalletAdapter implements WalletAdapter {
  private wallet: LeoWallet;

  constructor() {
    this.wallet = new LeoWallet();
  }

  async connect() {
    await this.wallet.connect();
  }

  async signTransaction(tx: AleoTransaction) {
    return await this.wallet.signTransaction(tx);
  }

  // ... implement other methods
}
```

---

## ZK Proof Generation

```typescript
// lib/proofs/eligibility.ts
import { snarkvm } from '@aleohq/wasm';

export interface EligibilityProofInput {
  attestationId: string;
  attestationType: string;
  claims: Record<string, unknown>;
  privateKey: string;
}

export interface EligibilityProof {
  proof: string;
  publicInputs: string[];
  proofHash: string;
}

export async function generateEligibilityProof(
  input: EligibilityProofInput
): Promise<EligibilityProof> {
  // Load WASM module
  await snarkvm.initSync();

  // Prepare inputs
  const programInputs = prepareInputs(input);

  // Generate proof (this takes 30-60 seconds)
  const proof = await snarkvm.prove(
    ELIGIBILITY_PROGRAM,
    'prove_eligibility',
    programInputs,
    input.privateKey
  );

  return {
    proof: proof.proof,
    publicInputs: proof.publicInputs,
    proofHash: hashProof(proof),
  };
}
```

### Proof Generation UI
```typescript
// components/proofs/proof-generator.tsx
export function ProofGenerator({
  input,
  onComplete,
  onError
}: ProofGeneratorProps) {
  const [status, setStatus] = useState<ProofStatus>('idle');
  const [progress, setProgress] = useState(0);

  const generateProof = async () => {
    setStatus('loading');

    try {
      // Proof generation runs in Web Worker
      const proof = await generateEligibilityProof(input, (p) => {
        setProgress(p);
      });

      setStatus('success');
      onComplete(proof);
    } catch (error) {
      setStatus('error');
      onError(error);
    }
  };

  return (
    <div className="space-y-4">
      <ProofProgress progress={progress} status={status} />

      {status === 'idle' && (
        <Button onClick={generateProof}>
          Generate Proof
        </Button>
      )}

      {status === 'success' && (
        <Alert variant="success">
          Proof generated successfully!
        </Alert>
      )}
    </div>
  );
}
```

---

## Transaction Flow

### Policy Purchase Transaction
```typescript
// lib/transactions/policy-purchase.ts
export async function createPolicyTransaction(
  wallet: WalletAdapter,
  params: PolicyPurchaseParams
): Promise<TransactionResult> {
  const { coverageType, amount, proof, poolId } = params;

  // Build transaction
  const tx = await programManager.buildTransaction(
    'policy_registry.aleo',
    'create_policy',
    [
      coverageType,
      amount,
      proof.publicInputs,
      poolId,
    ],
    // Private inputs
    [proof.proof],
  );

  // Sign with wallet
  const signedTx = await wallet.signTransaction(tx);

  // Submit to network
  const result = await aleoClient.submitTransaction(signedTx);

  return {
    txId: result.transactionId,
    status: 'pending',
  };
}
```

### Transaction Status Tracking
```typescript
// components/transactions/tx-status.tsx
export function TransactionStatus({ txId }: { txId: string }) {
  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', txId],
    queryFn: () => aleoClient.getTransaction(txId),
    refetchInterval: (data) =>
      data?.status === 'confirmed' ? false : 5000,
  });

  return (
    <div className="flex items-center gap-2">
      {tx?.status === 'pending' && (
        <>
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Transaction pending...</span>
        </>
      )}

      {tx?.status === 'confirmed' && (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Confirmed in block {tx.blockHeight}</span>
        </>
      )}

      {tx?.status === 'rejected' && (
        <>
          <XCircle className="h-4 w-4 text-red-500" />
          <span>Transaction failed: {tx.error}</span>
        </>
      )}
    </div>
  );
}
```

---

## Blockchain Indexer

```typescript
// lib/indexer/index.ts
import Queue from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const indexerQueue = new Queue('aleo-indexer', {
  redis: process.env.REDIS_URL,
});

// Process blockchain events
indexerQueue.process(async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case 'policy_created':
      await handlePolicyCreated(data);
      break;
    case 'claim_submitted':
      await handleClaimSubmitted(data);
      break;
    case 'pool_deposit':
      await handlePoolDeposit(data);
      break;
  }
});
```

### Webhook Handler
```typescript
// pages/api/webhooks/aleo.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { event, data, signature } = req.body;

  // Verify webhook signature
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Queue event for processing
  await indexerQueue.add(event, data);

  res.status(200).json({ received: true });
}
```

---

## Record Parsing

```typescript
// lib/aleo/records.ts
export interface PolicyRecord {
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

export function parsePolicy(record: AleoRecord): PolicyRecord {
  return {
    owner: record.owner,
    policyId: parseField(record.data.policy_id),
    coverageType: parseInt(record.data.coverage_type),
    coverageAmount: BigInt(record.data.coverage_amount),
    premiumAmount: BigInt(record.data.premium_amount),
    effectiveDate: BigInt(record.data.effective_date),
    expirationDate: BigInt(record.data.expiration_date),
    poolId: parseField(record.data.pool_id),
    proofHash: parseField(record.data.proof_hash),
    status: parseInt(record.data.status),
  };
}

export function parseField(field: string): string {
  // Remove 'field' suffix and convert to hex
  return field.replace('field', '');
}
```

---

## Integration Points

### Replace Mock Wallet
```typescript
// Before (mock)
const wallet = new MockWallet();

// After (real)
const wallet = detectWallet(); // Returns Leo or Puzzle adapter
await wallet.connect();
const address = await wallet.getAddress();
```

### Replace Mock Proof
```typescript
// Before (mock)
const proof = { hash: 'mock-proof', data: {} };

// After (real)
const proof = await generateEligibilityProof({
  attestationId,
  claims,
  privateKey: await wallet.getPrivateKey(),
});
```

### Replace Mock Transactions
```typescript
// Before (mock)
await api.post('/policies', data);

// After (real)
const tx = await createPolicyTransaction(wallet, data);
await waitForConfirmation(tx.txId);
```

---

## Testing Checklist

- [ ] Wallet connects to Aleo testnet
- [ ] Address and balance display correctly
- [ ] Proof generation completes (30-60s)
- [ ] Progress indicator updates
- [ ] Transaction builds correctly
- [ ] Transaction submits to network
- [ ] Transaction confirmation tracked
- [ ] Records parsed correctly
- [ ] Policy appears after confirmation
- [ ] Claim submission works
- [ ] Pool deposit/withdraw work
- [ ] Indexer processes events
- [ ] Error handling for network issues

---

## Commands

```bash
# Install dependencies
npm install @aleohq/sdk bull ioredis

# Run dev server
npm run dev

# Start Redis (for indexer)
redis-server

# Start indexer worker
npm run indexer
```

---

## Environment Variables

```env
# Aleo Network
ALEO_NETWORK_URL=https://api.explorer.aleo.org/v1/testnet3
ALEO_PRIVATE_KEY=your-deployer-private-key

# Redis (for indexer)
REDIS_URL=redis://localhost:6379

# Webhook
WEBHOOK_SECRET=your-webhook-secret
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "@aleohq/sdk": "^0.x",
    "bull": "^4.x",
    "ioredis": "^5.x"
  }
}
```

---

## Exit Criteria

Wave 9 is complete when:
1. Aleo SDK integrated
2. Real wallet connection working (Leo/Puzzle)
3. ZK proof generation in browser (30-60s)
4. Transactions submit to testnet
5. Transaction confirmation tracking
6. Records parse correctly
7. Policies/claims/pools work end-to-end
8. Indexer processes blockchain events
9. All mock services replaced with real
10. Error handling for network failures
