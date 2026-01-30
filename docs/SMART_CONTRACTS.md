# Smart Contracts Documentation

## Overview

ZK-Underwrite uses six Leo programs deployed on the Aleo blockchain. These contracts handle the core protocol logic including policy management, claims processing, liquidity pools, and governance.

## Program Summary

| Program | Purpose | Key Functions |
|---------|---------|---------------|
| `policy_registry.aleo` | Manage policy lifecycle | `create_policy`, `renew_policy`, `cancel_policy` |
| `risk_pool.aleo` | Manage liquidity pools | `deposit`, `withdraw`, `distribute_yield` |
| `claims_engine.aleo` | Process claims | `submit_claim`, `process_parametric`, `approve_claim` |
| `oracle_bridge.aleo` | Relay external data | `submit_oracle_data`, `verify_oracle` |
| `attestation_registry.aleo` | Manage attestors | `register_attestor`, `verify_attestation` |
| `governance.aleo` | Protocol governance | `propose`, `vote`, `execute` |

---

## 1. Policy Registry (`policy_registry.aleo`)

Manages the complete lifecycle of insurance policies.

### Records

#### Policy Record

```leo
record Policy {
    owner: address,           // Policy owner
    policy_id: field,         // Unique policy identifier
    coverage_type: u8,        // 0: flight, 1: weather, 2: auto, 3: health
    coverage_amount: u64,     // Coverage in smallest unit (cents)
    premium_paid: u64,        // Total premium paid
    deductible: u64,          // Deductible amount
    start_block: u32,         // Policy start block
    end_block: u32,           // Policy end block
    trigger_params: field,    // Hash of trigger parameters
    eligibility_proof: field, // Commitment to eligibility proof
    status: u8,               // 0: active, 1: claimed, 2: expired, 3: cancelled
    nullifier: field          // Prevents double-spending
}
```

### Mappings

| Mapping | Type | Purpose |
|---------|------|---------|
| `policy_exists` | `field => bool` | Track policy existence |
| `policies_by_type` | `u8 => u64` | Count policies per coverage type |
| `active_coverage` | `field => u64` | Active coverage per pool |

### Transitions

#### `create_policy`

Creates a new insurance policy.

```leo
transition create_policy(
    private coverage_type: u8,
    private coverage_amount: u64,
    private premium: u64,
    private deductible: u64,
    private duration_blocks: u32,
    private trigger_params: field,
    private eligibility_proof: field,
    public pool_id: field
) -> Policy
```

**Parameters:**
- `coverage_type`: Type of coverage (0-3)
- `coverage_amount`: Coverage amount in smallest unit
- `premium`: Premium amount to pay
- `deductible`: Deductible amount
- `duration_blocks`: Policy duration in blocks
- `trigger_params`: Hash of trigger parameters
- `eligibility_proof`: Commitment to eligibility proof
- `pool_id`: Pool to underwrite the policy

**Returns:** Policy record

#### `renew_policy`

Extends an existing policy.

```leo
transition renew_policy(
    private policy: Policy,
    private additional_premium: u64,
    private extension_blocks: u32
) -> Policy
```

#### `cancel_policy`

Cancels a policy with pro-rata refund.

```leo
transition cancel_policy(
    private policy: Policy
) -> (Policy, u64)
```

**Returns:** Cancelled policy and refund amount

#### `prove_ownership`

Generates proof of policy ownership without revealing details.

```leo
transition prove_ownership(
    private policy: Policy,
    public challenge: field
) -> field
```

---

## 2. Claims Engine (`claims_engine.aleo`)

Handles claim submission, verification, and payouts.

### Records

#### Claim Record

```leo
record Claim {
    owner: address,
    claim_id: field,
    policy_id: field,
    amount: u64,
    event_data_hash: field,
    status: u8,           // 0: pending, 1: approved, 2: denied, 3: paid
    submitted_at: u32,
    nullifier: field
}
```

#### Payout Record

```leo
record Payout {
    owner: address,
    amount: u64,
    claim_id: field,
    paid_at: u32
}
```

### Mappings

| Mapping | Type | Purpose |
|---------|------|---------|
| `policy_claims` | `field => field` | Track claims by policy |
| `claim_status` | `field => u8` | Claim status tracking |
| `oracle_data` | `field => OracleDataPoint` | Oracle data store |
| `authorized_oracles` | `address => bool` | Authorized oracle list |

### Transitions

#### `submit_oracle_data`

Submit oracle data (called by authorized oracles).

```leo
transition submit_oracle_data(
    public data_id: field,
    public data_type: u8,
    public value: u64,
    public source_hash: field,
    private signature: field
)
```

#### `process_parametric_claim`

Process automatic parametric claim.

```leo
transition process_parametric_claim(
    private policy: Policy,
    public oracle_data_id: field,
    public expected_trigger_value: u64
) -> (Claim, Payout)
```

**Process:**
1. Verifies policy ownership and status
2. Checks policy hasn't expired
3. Verifies oracle data meets trigger threshold
4. Creates claim and payout records automatically

#### `submit_traditional_claim`

Submit a traditional claim requiring review.

```leo
transition submit_traditional_claim(
    private policy: Policy,
    private claim_amount: u64,
    private evidence_hash: field,
    public claim_type: u8
) -> Claim
```

#### `approve_claim`

Approve a pending claim (called by authorized adjuster).

```leo
transition approve_claim(
    private claim: Claim,
    private approved_amount: u64,
    public adjuster_attestation: field
) -> (Claim, Payout)
```

---

## 3. Risk Pool (`risk_pool.aleo`)

Manages liquidity pools for insurance underwriting.

### Records

#### LP Token Record

```leo
record LPToken {
    owner: address,
    pool_id: field,
    amount: u64,
    minted_at: u32
}
```

#### Deposit Receipt

```leo
record DepositReceipt {
    owner: address,
    pool_id: field,
    amount: u64,
    lp_tokens: u64,
    deposited_at: u32
}
```

### Structs

#### Pool Configuration

```leo
struct PoolConfig {
    pool_id: field,
    coverage_type: u8,
    min_deposit: u64,
    max_utilization: u64,  // basis points (e.g., 8000 = 80%)
    reserve_ratio: u64,    // basis points
    fee_rate: u64,         // basis points
    admin: address
}
```

#### Pool State

```leo
struct PoolState {
    total_deposits: u64,
    total_coverage: u64,
    total_premiums: u64,
    total_claims_paid: u64,
    last_yield_distribution: u32
}
```

### Transitions

#### `create_pool`

Initialize a new liquidity pool.

```leo
transition create_pool(
    public pool_id: field,
    public coverage_type: u8,
    public min_deposit: u64,
    public max_utilization: u64,
    public reserve_ratio: u64,
    public fee_rate: u64
)
```

#### `deposit`

Deposit liquidity into a pool.

```leo
transition deposit(
    public pool_id: field,
    public amount: u64
) -> (LPToken, DepositReceipt)
```

**Returns:** LP tokens representing pool share and deposit receipt

#### `withdraw`

Withdraw liquidity from a pool.

```leo
transition withdraw(
    private lp_token: LPToken
) -> u64
```

**Returns:** Withdrawal amount

#### `record_premium`

Record premium payment from policy (called by policy registry).

```leo
transition record_premium(
    public pool_id: field,
    public premium_amount: u64,
    public coverage_amount: u64
)
```

#### `record_claim_payout`

Record claim payout (called by claims engine).

```leo
transition record_claim_payout(
    public pool_id: field,
    public payout_amount: u64,
    public coverage_released: u64
)
```

---

## 4. Oracle Bridge (`oracle_bridge.aleo`)

Relays external data to the blockchain for parametric claims.

### Key Functions

- Aggregate data from multiple oracle sources
- Verify oracle signatures
- Store verified data on-chain
- Trigger parametric claim processing

### Oracle Data Types

| Type | Code | Description |
|------|------|-------------|
| Flight Status | `0` | Flight delay/cancellation data |
| Weather | `1` | Weather measurements |
| Financial | `2` | Price feeds, indices |

---

## 5. Attestation Registry (`attestation_registry.aleo`)

Manages trusted attestors who verify user eligibility data.

### Key Functions

- Register new attestation providers
- Verify attestation signatures
- Track attestor reputation
- Revoke compromised attestors

### Attestation Types

- DMV records (driving history)
- Medical records (health data)
- Financial records (credit, income)
- Employment verification

---

## 6. Governance (`governance.aleo`)

Protocol governance for parameter updates and upgrades.

### Key Functions

- Create proposals
- Vote on proposals
- Execute approved changes
- Manage protocol parameters

### Governable Parameters

- Pool configurations
- Fee rates
- Oracle authorizations
- Emergency procedures

---

## Deployment Instructions

### Prerequisites

1. Install Leo CLI:
```bash
curl -sSf https://raw.githubusercontent.com/AleoHQ/leo/master/install.sh | sh
```

2. Configure Aleo wallet

### Build Contracts

```bash
# Navigate to contracts directory
cd contracts/policy_registry

# Build the program
leo build

# Run tests
leo test
```

### Deploy to Testnet

```bash
# Deploy policy registry
leo deploy --network testnet

# Note the deployed program ID
```

### Deployment Order

1. `attestation_registry.aleo` - No dependencies
2. `oracle_bridge.aleo` - No dependencies
3. `risk_pool.aleo` - No dependencies
4. `policy_registry.aleo` - Depends on risk_pool
5. `claims_engine.aleo` - Depends on policy_registry, oracle_bridge, risk_pool
6. `governance.aleo` - Depends on all others

### Post-Deployment Setup

1. Initialize pools with `create_pool`
2. Register authorized oracles
3. Register attestation providers
4. Set governance parameters

---

## Security Considerations

### Access Control

- Admin functions protected by owner checks
- Oracle submission restricted to authorized addresses
- Claim approval requires adjuster authorization

### Preventing Attacks

- Nullifiers prevent double-spending
- Policy IDs are deterministic but unpredictable
- Oracle data requires multi-sig or threshold signatures

### Audit Requirements

All contracts should be audited for:
- Integer overflow/underflow
- Unauthorized access
- Logic errors in claim processing
- Privacy leaks in public functions
