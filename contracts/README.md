# ZKLAIM Smart Contracts

Leo smart contracts for the ZKLAIM protocol on Aleo.

## Directory Structure

```
contracts/
├── README.md
├── types/
│   └── common.leo          # Shared type definitions
├── zklaim_foundation/      # Wave 1: Foundation contract
├── attestation_registry/   # Wave 2: Attestation management
├── oracle_bridge/          # Wave 3: External data feeds
├── risk_pool/              # Wave 4: Liquidity pools
├── policy_registry/        # Wave 5: Policy management
├── claims_engine/          # Wave 6: Claims processing
└── governance/             # Wave 8: Protocol governance
```

## Prerequisites

1. Install Leo CLI:
```bash
curl -sSf https://install.leo.build/ | sh
```

2. Verify installation:
```bash
leo --version
```

## Building Contracts

```bash
cd contracts/zklaim_foundation
leo build
```

## Testing Contracts

```bash
cd contracts/zklaim_foundation
leo test
```

## Deploying to Testnet

```bash
cd contracts/zklaim_foundation
leo deploy --network testnet
```

Note: Deployment requires an Aleo account with testnet credits.

## Contract Overview

### zklaim_foundation.aleo (Wave 1)
- Protocol initialization
- User registration
- Utility functions for testing

### attestation_registry.aleo (Wave 2)
- Attestor registration
- Attestation creation and verification
- Revocation management

### oracle_bridge.aleo (Wave 3)
- Oracle authorization
- Data submission and verification
- Flight and weather data feeds

### risk_pool.aleo (Wave 4)
- Pool creation and management
- Deposit/withdraw with LP tokens
- Stats and utilization tracking

### policy_registry.aleo (Wave 5)
- Policy creation with ZK proofs
- Premium calculation
- Policy lifecycle management

### claims_engine.aleo (Wave 6)
- Parametric claims (automatic)
- Traditional claims (manual)
- Payout processing

### governance.aleo (Wave 8)
- Proposal creation
- Voting mechanism
- Parameter updates
