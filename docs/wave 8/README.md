# Wave 8: Smart Contracts (Leo Programs)

**Objective:** Develop and test all six Leo smart contracts for the Aleo blockchain.

**Track:** B (Contracts) - Can run in parallel with Waves 1-7
**Depends on:** None (independent track)

---

## Prerequisites

```bash
# Install Leo CLI
curl -sSf https://install.leo.build/ | sh

# Verify installation
leo --version
```

---

## Contract Architecture

```
contracts/
├── attestation_registry/     # Identity attestations
│   ├── src/main.leo
│   ├── program.json
│   └── README.md
├── oracle_bridge/            # External data relay
│   ├── src/main.leo
│   ├── program.json
│   └── README.md
├── risk_pool/                # Liquidity management
│   ├── src/main.leo
│   ├── program.json
│   └── README.md
├── policy_registry/          # Policy lifecycle
│   ├── src/main.leo
│   ├── program.json
│   └── README.md
├── claims_engine/            # Claims processing
│   ├── src/main.leo
│   ├── program.json
│   └── README.md
└── governance/               # Protocol governance
    ├── src/main.leo
    ├── program.json
    └── README.md
```

---

## Dependency Order

```
Layer 0 (No Dependencies):
├── attestation_registry.aleo
├── oracle_bridge.aleo
└── risk_pool.aleo

Layer 1 (Depends on Layer 0):
└── policy_registry.aleo
    └── imports: risk_pool.aleo

Layer 2 (Depends on Layer 1):
└── claims_engine.aleo
    └── imports: policy_registry.aleo, oracle_bridge.aleo, risk_pool.aleo

Layer 3 (Depends on All):
└── governance.aleo
    └── imports: all above
```

---

## Contract 1: attestation_registry.aleo

**Purpose:** Manage attestors and verify user attestations for ZK proofs.

### Records
```leo
record Attestation {
    owner: address,
    attestor_id: field,
    subject_hash: field,
    attestation_type: u8,
    claims_hash: field,
    expires_at: u64,
    signature: group,
}
```

### Mappings
```leo
mapping attestors: field => AttestorInfo;
mapping revoked_attestations: field => bool;
```

### Functions
| Function | Visibility | Purpose |
|----------|------------|---------|
| `register_attestor` | public | Register new attestor (admin only) |
| `revoke_attestor` | public | Revoke attestor privileges |
| `create_attestation` | private | Create new attestation record |
| `verify_attestation` | public | Verify attestation validity |
| `revoke_attestation` | public | Revoke specific attestation |

---

## Contract 2: oracle_bridge.aleo

**Purpose:** Relay and verify external data (flight status, weather events).

### Records
```leo
record OracleSubmission {
    owner: address,
    oracle_id: field,
    data_type: u8,
    identifier_hash: field,
    data_hash: field,
    timestamp: u64,
    signature: group,
}
```

### Mappings
```leo
mapping authorized_oracles: field => OracleInfo;
mapping oracle_data: field => DataRecord;  // identifier_hash => latest data
```

### Functions
| Function | Visibility | Purpose |
|----------|------------|---------|
| `authorize_oracle` | public | Authorize oracle provider (admin) |
| `revoke_oracle` | public | Revoke oracle authorization |
| `submit_data` | public | Submit oracle data |
| `verify_data` | public | Verify data authenticity |
| `get_latest_data` | public | Retrieve latest data for identifier |

### Oracle Data Types
```leo
// data_type values
const FLIGHT_STATUS: u8 = 1u8;
const WEATHER_EVENT: u8 = 2u8;
const PRICE_FEED: u8 = 3u8;
```

---

## Contract 3: risk_pool.aleo

**Purpose:** Manage liquidity pools, deposits, withdrawals, and LP tokens.

### Records
```leo
record LPToken {
    owner: address,
    pool_id: field,
    amount: u64,
    deposited_at: u64,
}

record DepositReceipt {
    owner: address,
    pool_id: field,
    deposit_amount: u64,
    lp_tokens_minted: u64,
    timestamp: u64,
}
```

### Mappings
```leo
mapping pools: field => PoolState;
mapping pool_balances: field => u64;  // pool_id => total liquidity
mapping user_positions: field => u64;  // hash(pool_id, user) => lp tokens
```

### Functions
| Function | Visibility | Purpose |
|----------|------------|---------|
| `create_pool` | public | Create new liquidity pool (admin) |
| `deposit` | public | Deposit liquidity, receive LP tokens |
| `withdraw` | public | Burn LP tokens, receive liquidity |
| `record_premium` | public | Record premium payment (from policy) |
| `record_claim_payout` | public | Record claim payout (from claims) |
| `get_pool_stats` | public | Get current pool statistics |

### Pool State
```leo
struct PoolState {
    id: field,
    total_deposits: u64,
    total_withdrawals: u64,
    total_premiums: u64,
    total_payouts: u64,
    lp_token_supply: u64,
    is_active: bool,
}
```

---

## Contract 4: policy_registry.aleo

**Purpose:** Manage policy lifecycle from creation to expiration.

### Records
```leo
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
```

### Mappings
```leo
mapping policies: field => PolicyPublicData;
mapping user_policy_count: address => u32;
mapping pool_policy_count: field => u32;
```

### Functions
| Function | Visibility | Purpose |
|----------|------------|---------|
| `create_policy` | public | Create new policy with ZK proof |
| `renew_policy` | public | Renew existing policy |
| `cancel_policy` | public | Cancel policy (partial refund) |
| `expire_policy` | public | Mark policy as expired |
| `prove_ownership` | private | Generate ownership proof |
| `transfer_policy` | private | Transfer policy to new owner |

### Policy Status
```leo
const STATUS_ACTIVE: u8 = 1u8;
const STATUS_EXPIRED: u8 = 2u8;
const STATUS_CANCELLED: u8 = 3u8;
const STATUS_CLAIMED: u8 = 4u8;
```

---

## Contract 5: claims_engine.aleo

**Purpose:** Process parametric and traditional claims.

### Records
```leo
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
    amount: u64,
    paid_at: u64,
}
```

### Mappings
```leo
mapping claims: field => ClaimPublicData;
mapping policy_claims: field => u32;  // policy_id => claim count
```

### Functions
| Function | Visibility | Purpose |
|----------|------------|---------|
| `process_parametric_claim` | public | Auto-process with oracle data |
| `submit_traditional_claim` | public | Submit manual claim |
| `approve_claim` | public | Approve claim (adjuster/oracle) |
| `reject_claim` | public | Reject claim with reason |
| `execute_payout` | public | Execute approved payout |
| `appeal_claim` | public | Appeal rejected claim |

### Claim Types
```leo
const CLAIM_PARAMETRIC: u8 = 1u8;
const CLAIM_TRADITIONAL: u8 = 2u8;
```

---

## Contract 6: governance.aleo

**Purpose:** Protocol governance and parameter updates.

### Records
```leo
record VoteToken {
    owner: address,
    proposal_id: field,
    vote_power: u64,
}

record Proposal {
    owner: address,
    proposal_id: field,
    proposal_type: u8,
    target_contract: field,
    call_data: field,
    votes_for: u64,
    votes_against: u64,
    deadline: u64,
}
```

### Mappings
```leo
mapping proposals: field => ProposalData;
mapping parameters: field => u64;  // param_name_hash => value
mapping has_voted: field => bool;   // hash(proposal, voter) => voted
```

### Functions
| Function | Visibility | Purpose |
|----------|------------|---------|
| `create_proposal` | public | Create governance proposal |
| `vote` | public | Cast vote on proposal |
| `execute_proposal` | public | Execute passed proposal |
| `cancel_proposal` | public | Cancel proposal (proposer only) |
| `update_parameter` | public | Update protocol parameter |
| `emergency_pause` | public | Emergency pause (multisig) |

---

## Development Scripts

### Build All Contracts
```bash
#!/bin/bash
# scripts/build-contracts.sh

set -e

CONTRACTS=(
  "attestation_registry"
  "oracle_bridge"
  "risk_pool"
  "policy_registry"
  "claims_engine"
  "governance"
)

for contract in "${CONTRACTS[@]}"; do
  echo "Building $contract..."
  cd "contracts/$contract"
  leo build
  cd ../..
done

echo "All contracts built successfully!"
```

### Test All Contracts
```bash
#!/bin/bash
# scripts/test-contracts.sh

set -e

CONTRACTS=(
  "attestation_registry"
  "oracle_bridge"
  "risk_pool"
  "policy_registry"
  "claims_engine"
  "governance"
)

for contract in "${CONTRACTS[@]}"; do
  echo "Testing $contract..."
  cd "contracts/$contract"
  leo test
  cd ../..
done

echo "All tests passed!"
```

### Deploy to Testnet
```bash
#!/bin/bash
# scripts/deploy-testnet.sh

set -e

# Load environment
source .env

# Deploy in dependency order
leo deploy attestation_registry --network testnet
leo deploy oracle_bridge --network testnet
leo deploy risk_pool --network testnet
leo deploy policy_registry --network testnet
leo deploy claims_engine --network testnet
leo deploy governance --network testnet

echo "All contracts deployed to testnet!"
```

---

## Testing Strategy

### Unit Tests (per contract)
```leo
// tests/policy_registry_test.leo

@test
function test_create_policy() {
    let policy = create_policy(
        coverage_type: 1u8,
        coverage_amount: 10000u64,
        premium_amount: 500u64,
        // ...
    );

    assert_eq(policy.status, STATUS_ACTIVE);
    assert_eq(policy.coverage_amount, 10000u64);
}

@test
function test_cannot_claim_expired_policy() {
    // Create expired policy
    // Attempt claim
    // Assert failure
}
```

### Integration Tests
1. Create pool → deposit → create policy → file claim → payout
2. Register attestor → create attestation → use in policy
3. Submit oracle data → trigger parametric claim → auto-approve

---

## Security Considerations

### Access Control
- Admin functions protected by address checks
- Multi-sig for critical operations (pause, upgrades)

### Overflow Protection
- All arithmetic uses checked operations
- Balance validations before transfers

### Replay Protection
- Unique identifiers for all operations
- Timestamp bounds on time-sensitive operations

### Privacy
- Policy details in private records
- Only hashes stored in public mappings

---

## Testing Checklist

- [ ] All contracts compile with `leo build`
- [ ] Unit tests pass with `leo test`
- [ ] Integration tests pass on local network
- [ ] Deploy to Aleo testnet
- [ ] Verify contract interactions work
- [ ] Test edge cases (overflow, expired, unauthorized)
- [ ] Security review completed
- [ ] Gas/fee estimation documented

---

## Commands

```bash
# Initialize new contract
leo new contract_name

# Build single contract
cd contracts/risk_pool && leo build

# Run tests
leo test

# Deploy to testnet
leo deploy --network testnet

# Build all
./scripts/build-contracts.sh

# Test all
./scripts/test-contracts.sh
```

---

## Exit Criteria

Wave 8 is complete when:
1. All 6 contracts compile without errors
2. All unit tests pass
3. Integration tests pass on local network
4. Contracts deployed to Aleo testnet
5. Documentation complete for each contract
6. Security review checklist passed
7. Scripts working (build, test, deploy)
