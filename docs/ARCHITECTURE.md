# ZK-Underwrite Architecture

## System Overview

ZK-Underwrite is a decentralized insurance protocol built on privacy-preserving principles. The architecture enables users to obtain coverage without revealing sensitive personal data by leveraging zero-knowledge proofs on the Aleo blockchain.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│                      (Next.js Web Application)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Policy    │  │   Claims    │  │  Dashboard  │  │   Admin     │    │
│  │  Purchase   │  │  Submission │  │   & Stats   │  │   Panel     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes                            │   │
│  │  • Policy management    • User authentication                    │   │
│  │  • Oracle data relay    • Attestation verification               │   │
│  │  • Analytics endpoints  • Admin operations                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    ZK Proof Engine (WASM)                        │   │
│  │  • Client-side proof generation                                  │   │
│  │  • Proof verification helpers                                    │   │
│  │  • Key management                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BLOCKCHAIN LAYER (Aleo)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ PolicyRegistry  │  │   RiskPool      │  │  ClaimsEngine   │         │
│  │    Program      │  │    Program      │  │    Program      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Attestation    │  │    Oracle       │  │   Governance    │         │
│  │    Registry     │  │    Bridge       │  │    Program      │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Chainlink  │  │   Weather   │  │   Flight    │  │  Attestor   │    │
│  │   Oracles   │  │    APIs     │  │    APIs     │  │  Services   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Frontend (Next.js)

The user-facing application handles:

- **Server-side rendering** for SEO and initial load performance
- **Client-side ZK proof generation** via WASM modules
- **Wallet integration** (Leo Wallet, Puzzle Wallet)
- **Real-time policy and claims status updates**

#### Key UI Modules

| Module | Purpose |
|--------|---------|
| PolicyWizard | Multi-step policy purchase flow |
| ClaimsForm | Claim submission and tracking |
| PoolDashboard | Liquidity provision interface |
| WalletConnect | Wallet connection management |
| ProofGenerator | ZK proof generation UI |
| AttestationUI | Data import and verification |

### 2. Backend (Next.js API Routes)

The backend layer provides:

- **RESTful API** for non-blockchain operations
- **WebSocket connections** for real-time updates
- **Oracle data aggregation** and relay
- **Off-chain data indexing** for fast queries

#### API Route Structure

```
/api/v1/
├── policies/       # Policy CRUD operations
├── claims/         # Claims management
├── pools/          # Pool interactions
├── oracles/        # Oracle data endpoints
├── attestations/   # Attestation verification
├── admin/          # Admin operations
└── webhooks/       # External service hooks
```

### 3. Blockchain Layer (Aleo)

Six Leo smart contracts form the protocol core:

| Contract | Responsibility |
|----------|---------------|
| `policy_registry.aleo` | Policy lifecycle management |
| `risk_pool.aleo` | Liquidity pool operations |
| `claims_engine.aleo` | Claim processing and payouts |
| `oracle_bridge.aleo` | External data relay |
| `attestation_registry.aleo` | Attestor management |
| `governance.aleo` | Protocol governance |

### 4. ZK Proof System

Uses Aleo's native Marlin proving system:

- **Custom circuits** for insurance-specific proofs
- **WASM compilation** for browser execution
- **Client-side generation** ensures data privacy

## Data Flow

### Policy Purchase Flow

```
1. User selects coverage type and parameters
2. User imports/connects attestation data
3. Client generates ZK proof of eligibility locally
4. Proof + premium payment submitted to blockchain
5. Policy NFT/record minted to user's wallet
6. User receives encrypted policy details
```

### Parametric Claims Flow

```
1. Oracle reports trigger event (flight delay, weather threshold)
2. User submits claim with policy ownership proof
3. Smart contract verifies:
   - Policy is valid and active
   - Event matches coverage terms
   - No prior claim for this event
4. Automatic payout to user's wallet
```

### Traditional Claims Flow

```
1. User submits claim with ZK proof of loss
2. If claim exceeds threshold, adjuster review triggered
3. User provides selective disclosure to adjuster only
4. Adjuster approves/denies with on-chain attestation
5. Approved claims paid automatically
```

## Privacy Model

### Data Classification

| Data Type | Storage Location | Visibility | Encryption |
|-----------|------------------|------------|------------|
| Raw user data | User's device only | User only | Local encryption |
| Attestation signatures | User's device | User + attestor | None needed |
| Proofs | Aleo blockchain | Public | N/A (no sensitive data) |
| Policy records | Aleo (encrypted) | Policy owner only | Aleo native encryption |
| Pool statistics | Aleo | Public | None |
| Oracle data | Aleo | Public | None |

### Threat Model

**Protected Against:**

- Insurer seeing raw user data
- Database breaches exposing user information
- Third parties correlating policies to identities
- Historical data used against policyholders

**Not Protected Against:**

- Malicious attestors providing false attestations
- Oracle manipulation (mitigated by multi-oracle design)
- User device compromise
- Sophisticated traffic analysis (partial mitigation via batching)

## Proof Architecture

### Proof Types

| Proof Type | Purpose | Private Inputs | Public Inputs | Output |
|------------|---------|----------------|---------------|--------|
| `EligibilityProof` | Prove user qualifies for coverage | Medical/driving records | Eligibility criteria hash | Boolean + risk tier |
| `PolicyOwnershipProof` | Prove ownership of policy | Policy record, user key | Policy commitment | Boolean |
| `ClaimEligibilityProof` | Prove claim meets terms | Policy details, event data | Event oracle data | Payout amount |
| `SelectiveDisclosureProof` | Reveal specific fields only | Full record | Fields to reveal | Revealed subset |
| `RangeProof` | Prove value in range | Actual value | Min/max bounds | Boolean |
| `SetMembershipProof` | Prove (non)membership in set | Item | Set commitment | Boolean |

### Proof Generation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT-SIDE PROOF GENERATION                      │
│                                                                          │
│  1. Load WASM proving module                                             │
│     └─> ~5MB download, cached after first load                          │
│                                                                          │
│  2. User provides private inputs                                         │
│     └─> Data never leaves browser                                        │
│                                                                          │
│  3. Fetch public inputs (oracle data, eligibility criteria)              │
│     └─> From API or directly from Aleo                                   │
│                                                                          │
│  4. Generate witness                                                     │
│     └─> Intermediate computation step                                    │
│                                                                          │
│  5. Compute proof                                                        │
│     └─> ~10-60 seconds depending on circuit complexity                   │
│                                                                          │
│  6. Return proof + public outputs                                        │
│     └─> Only this leaves the browser                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Integration Points

### Oracle Network

- **Primary:** Chainlink (when Aleo integration available)
- **Fallback:** Custom oracle network with multi-sig
- **Data Sources:** Weather APIs, Flight APIs, Financial data

### External Services

| Service | Purpose |
|---------|---------|
| Vercel | Hosting (frontend + API) |
| Supabase | Database hosting |
| Upstash | Redis hosting |
| AviationStack | Flight data API |
| OpenWeatherMap | Weather data API |
| Plaid | Financial attestation |

## Key Innovations

1. **Client-Side Proof Generation:** All sensitive data processing happens in user's browser via WASM. No server ever sees raw data.

2. **Encrypted Policy State:** Policy details encrypted with user's key. Even the protocol can't see coverage terms.

3. **Selective Disclosure:** Users can reveal specific data points to specific parties without full disclosure.

4. **Parametric Auto-Settlement:** Oracle-triggered claims bypass human intervention entirely.

5. **Attestation Marketplace:** Third-party attestors provide verified data sources.

## Security Considerations

### Smart Contract Security

- All contracts audited before mainnet deployment
- Multi-sig for admin functions
- Timelock for governance changes
- Circuit-breaker for emergency stops

### Data Security

- No sensitive data stored server-side
- Client-side encryption for local storage
- Secure key derivation from wallet signatures

### Oracle Security

- Multiple oracle sources for redundancy
- Outlier detection and filtering
- Economic incentives for honest reporting
