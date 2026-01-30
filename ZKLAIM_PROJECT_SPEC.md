# ZK-Underwrite: Private Insurance Protocol

## Project Specification Document v1.0

**Purpose:** This document provides complete context for AI-assisted development of the ZK-Underwrite protocol. It contains all necessary information for understanding the project vision, technical architecture, implementation requirements, and success criteria.

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Technical Architecture](#4-technical-architecture)
5. [Tech Stack](#5-tech-stack)
6. [Project Structure](#6-project-structure)
7. [Core Features & User Flows](#7-core-features--user-flows)
8. [Smart Contracts (Leo/Aleo)](#8-smart-contracts-leoaleo)
9. [Backend API Design](#9-backend-api-design)
10. [Database Schema](#10-database-schema)
11. [Frontend Components](#11-frontend-components)
12. [External Integrations](#12-external-integrations)
13. [Security Requirements](#13-security-requirements)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment & DevOps](#15-deployment--devops)
16. [Development Phases](#16-development-phases)
17. [Success Criteria](#17-success-criteria)
18. [Constraints & Considerations](#18-constraints--considerations)
19. [Glossary](#19-glossary)
20. [Appendices](#20-appendices)

---

# 1. EXECUTIVE SUMMARY

## 1.1 What We're Building

ZK-Underwrite is a decentralized insurance protocol that enables users to obtain insurance coverage without revealing sensitive personal data. Using zero-knowledge proofs on the Aleo blockchain, users can prove eligibility for coverage (e.g., "I'm a non-smoker," "I have no at-fault accidents") without disclosing underlying records.

## 1.2 Core Value Proposition

- **For Users:** Get insurance without surrendering privacy. No data stored by insurers that can be breached, sold, or used against you.
- **For Insurers/Pools:** Reduced data liability, cryptographic proof of eligibility, automated claims via oracles.
- **For Regulators:** Selective disclosure capabilities for audits without mass surveillance.

## 1.3 Target Market

- Initial: Parametric insurance (flight delay, weather events) — simplest to implement
- Phase 2: Auto insurance with telematics integration
- Phase 3: Health insurance (supplemental first)
- Phase 4: Full-stack insurance products

## 1.4 Key Differentiators

1. First ZK-based insurance protocol
2. Client-side proof generation (data never leaves user's device)
3. Hybrid architecture supporting both crypto-native and traditional insurance models
4. Regulatory compliance through selective disclosure

---

# 2. PROBLEM STATEMENT

## 2.1 Current Insurance Industry Pain Points

### Privacy Violations
- Insurance applications require extensive personal data disclosure
- Health insurers collect: medical history, genetic information, lifestyle data
- Auto insurers collect: driving records, GPS tracking, behavioral data
- This data is stored indefinitely and frequently breached or sold

### Data Breach Statistics
- Healthcare sector: 700+ breaches annually, 50M+ records exposed
- Insurance companies are prime targets due to data richness
- Average breach cost: $10.9M for healthcare sector

### Adversarial Relationship
- Users lie on applications to protect privacy (estimated 10-15% of applications)
- Insurers use data asymmetry against policyholders
- Claims often denied based on retrospective data analysis

### Exclusion
- Privacy-conscious individuals avoid insurance entirely
- Underbanked populations lack documentation for traditional underwriting
- Cross-border insurance complicated by data sovereignty laws

## 2.2 Why Blockchain + ZK?

| Problem | ZK Solution |
|---------|-------------|
| Data exposure during underwriting | Prove eligibility without revealing data |
| Centralized data storage | User retains data locally; only proofs on-chain |
| Claims fraud | Cryptographic proofs of loss events |
| Slow claims processing | Parametric auto-execution via oracles |
| Regulatory compliance | Selective disclosure to authorized parties |
| Trust in insurers | Transparent, auditable smart contracts |

---

# 3. SOLUTION OVERVIEW

## 3.1 High-Level Architecture

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

## 3.2 Data Flow

### Policy Purchase Flow
```
1. User selects coverage type and parameters
2. User imports/connects attestation data (e.g., medical records, driving history)
3. Client generates ZK proof of eligibility locally
4. Proof + premium payment submitted to blockchain
5. Policy NFT/record minted to user's wallet
6. User receives encrypted policy details (only they can decrypt)
```

### Claims Flow (Parametric)
```
1. Oracle reports trigger event (flight delay, weather threshold)
2. User submits claim with policy ownership proof
3. Smart contract verifies:
   - Policy is valid and active
   - Event matches coverage terms
   - No prior claim for this event
4. Automatic payout to user's wallet
```

### Claims Flow (Traditional)
```
1. User submits claim with ZK proof of loss
2. If claim exceeds threshold, adjuster review triggered
3. User provides selective disclosure to adjuster only
4. Adjuster approves/denies with on-chain attestation
5. Approved claims paid automatically
```

## 3.3 Key Innovations

1. **Client-Side Proof Generation:** All sensitive data processing happens in user's browser via WASM. No server ever sees raw data.

2. **Encrypted Policy State:** Policy details encrypted with user's key. Even the protocol can't see coverage terms.

3. **Selective Disclosure:** Users can reveal specific data points to specific parties (regulators, adjusters) without full disclosure.

4. **Parametric Auto-Settlement:** Oracle-triggered claims bypass human intervention entirely.

5. **Attestation Marketplace:** Third-party attestors can provide verified data sources (hospitals, DMVs, employers).

---

# 4. TECHNICAL ARCHITECTURE

## 4.1 System Components

### 4.1.1 Frontend (Next.js)
- Server-side rendering for SEO and initial load performance
- Client-side ZK proof generation via WASM modules
- Wallet integration (Leo Wallet, Puzzle Wallet)
- Real-time policy and claims status updates

### 4.1.2 Backend (Next.js API Routes + External Services)
- RESTful API for non-blockchain operations
- WebSocket connections for real-time updates
- Oracle data aggregation and relay
- Off-chain data indexing for fast queries

### 4.1.3 Blockchain (Aleo)
- Leo smart contracts for core protocol logic
- Private state for policy details
- Public state for pool statistics and governance
- Record-based ownership model

### 4.1.4 ZK Proof System
- Aleo's native proving system (Marlin)
- Custom circuits for insurance-specific proofs
- WASM compilation for browser execution

### 4.1.5 Oracle Network
- Primary: Chainlink (when Aleo integration available)
- Fallback: Custom oracle network with multi-sig
- Data sources: Weather APIs, Flight APIs, Financial data

## 4.2 Detailed Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS APPLICATION                             │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                            PAGES / APP ROUTER                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │ │
│  │  │    /     │ │ /policies│ │ /claims  │ │ /pools   │ │  /admin  │    │ │
│  │  │  Landing │ │  Browse  │ │  Submit  │ │  Provide │ │  Manage  │    │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                              COMPONENTS                                 │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │ │
│  │  │  PolicyWizard   │  │  ClaimsForm     │  │  PoolDashboard  │        │ │
│  │  │  - Coverage     │  │  - Event proof  │  │  - TVL display  │        │ │
│  │  │  - Attestation  │  │  - Documents    │  │  - APY calc     │        │ │
│  │  │  - Premium calc │  │  - Status track │  │  - Stake/unstake│        │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │ │
│  │  │  WalletConnect  │  │  ProofGenerator │  │  AttestationUI  │        │ │
│  │  │  - Leo Wallet   │  │  - WASM runtime │  │  - Data import  │        │ │
│  │  │  - Puzzle       │  │  - Progress UI  │  │  - Source verify│        │ │
│  │  │  - Transaction  │  │  - Error handle │  │  - Privacy meter│        │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                               HOOKS                                     │ │
│  │  useWallet | usePolicy | useClaim | useProof | useOracle | usePool    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                            STATE MANAGEMENT                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │   Zustand    │  │  React Query │  │    Jotai     │                 │ │
│  │  │  - Wallet    │  │  - API cache │  │  - UI state  │                 │ │
│  │  │  - User prefs│  │  - Mutations │  │  - Forms     │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                            API ROUTES                                   │ │
│  │  /api/policies    /api/claims    /api/oracles    /api/attestations    │ │
│  │  /api/pools       /api/admin     /api/analytics  /api/webhooks        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │    PostgreSQL   │ │      Redis      │ │      Aleo       │
          │   - User data   │ │   - Sessions    │ │   - Contracts   │
          │   - Off-chain   │ │   - Cache       │ │   - State       │
          │   - Analytics   │ │   - Pub/sub     │ │   - Proofs      │
          └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 4.3 Proof Architecture

### Proof Types

| Proof Type | Purpose | Inputs (Private) | Inputs (Public) | Output |
|------------|---------|------------------|-----------------|--------|
| `EligibilityProof` | Prove user qualifies for coverage | Medical/driving records, attestation | Eligibility criteria hash | Boolean + risk tier |
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

## 4.4 Privacy Model

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

---

# 5. TECH STACK

## 5.1 Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework with SSR/SSG | 14.x (App Router) |
| TypeScript | Type safety | 5.x |
| Tailwind CSS | Styling | 3.x |
| shadcn/ui | Component library | Latest |
| Framer Motion | Animations | 10.x |
| React Query | Server state management | 5.x |
| Zustand | Client state management | 4.x |
| React Hook Form | Form handling | 7.x |
| Zod | Schema validation | 3.x |

## 5.2 Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js API Routes | REST API | 14.x |
| Prisma | ORM | 5.x |
| PostgreSQL | Primary database | 15.x |
| Redis | Caching, sessions, pub/sub | 7.x |
| Bull | Job queue | 4.x |
| NextAuth.js | Authentication | 4.x |

## 5.3 Blockchain

| Technology | Purpose | Version |
|------------|---------|---------|
| Aleo | L1 blockchain | Latest testnet |
| Leo | Smart contract language | 1.x |
| snarkVM | ZK proving system | Latest |
| Aleo SDK | JavaScript integration | Latest |
| Leo Wallet | Primary wallet | Latest |

## 5.4 External Services

| Service | Purpose |
|---------|---------|
| Vercel | Hosting (frontend + API) |
| Supabase | Database hosting |
| Upstash | Redis hosting |
| Chainlink | Oracle network |
| AviationStack | Flight data API |
| OpenWeatherMap | Weather data API |
| Plaid | Financial attestation |

## 5.5 Development Tools

| Tool | Purpose |
|------|---------|
| pnpm | Package manager |
| ESLint | Linting |
| Prettier | Formatting |
| Husky | Git hooks |
| Vitest | Unit testing |
| Playwright | E2E testing |
| Docker | Local development |

---

# 6. PROJECT STRUCTURE

```
zk-underwrite/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-preview.yml
│   │   └── deploy-production.yml
│   └── CODEOWNERS
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── apps/
│   └── web/                          # Next.js application
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   └── register/
│       │   ├── (dashboard)/
│       │   │   ├── policies/
│       │   │   │   ├── [id]/
│       │   │   │   ├── new/
│       │   │   │   └── page.tsx
│       │   │   ├── claims/
│       │   │   │   ├── [id]/
│       │   │   │   ├── new/
│       │   │   │   └── page.tsx
│       │   │   ├── pools/
│       │   │   │   ├── [id]/
│       │   │   │   └── page.tsx
│       │   │   └── settings/
│       │   ├── (marketing)/
│       │   │   ├── page.tsx           # Landing page
│       │   │   ├── about/
│       │   │   ├── how-it-works/
│       │   │   └── pricing/
│       │   ├── api/
│       │   │   ├── policies/
│       │   │   │   ├── route.ts
│       │   │   │   └── [id]/route.ts
│       │   │   ├── claims/
│       │   │   ├── oracles/
│       │   │   ├── attestations/
│       │   │   ├── pools/
│       │   │   ├── admin/
│       │   │   └── webhooks/
│       │   ├── layout.tsx
│       │   ├── error.tsx
│       │   ├── loading.tsx
│       │   └── not-found.tsx
│       ├── components/
│       │   ├── ui/                    # shadcn/ui components
│       │   ├── forms/
│       │   │   ├── policy-wizard/
│       │   │   ├── claims-form/
│       │   │   └── attestation-upload/
│       │   ├── dashboard/
│       │   │   ├── policy-card.tsx
│       │   │   ├── claims-list.tsx
│       │   │   └── pool-stats.tsx
│       │   ├── proof/
│       │   │   ├── proof-generator.tsx
│       │   │   ├── proof-progress.tsx
│       │   │   └── proof-result.tsx
│       │   ├── wallet/
│       │   │   ├── connect-button.tsx
│       │   │   ├── wallet-modal.tsx
│       │   │   └── transaction-status.tsx
│       │   └── shared/
│       │       ├── header.tsx
│       │       ├── footer.tsx
│       │       ├── sidebar.tsx
│       │       └── loading-states.tsx
│       ├── hooks/
│       │   ├── use-wallet.ts
│       │   ├── use-policy.ts
│       │   ├── use-claim.ts
│       │   ├── use-proof.ts
│       │   ├── use-oracle.ts
│       │   └── use-pool.ts
│       ├── lib/
│       │   ├── aleo/
│       │   │   ├── client.ts
│       │   │   ├── programs.ts
│       │   │   └── utils.ts
│       │   ├── proof/
│       │   │   ├── wasm-loader.ts
│       │   │   ├── circuits/
│       │   │   └── generators/
│       │   ├── oracles/
│       │   │   ├── flight.ts
│       │   │   ├── weather.ts
│       │   │   └── aggregator.ts
│       │   ├── attestations/
│       │   │   ├── verifier.ts
│       │   │   └── parsers/
│       │   ├── db.ts
│       │   ├── redis.ts
│       │   ├── auth.ts
│       │   └── utils.ts
│       ├── stores/
│       │   ├── wallet-store.ts
│       │   ├── policy-store.ts
│       │   └── ui-store.ts
│       ├── types/
│       │   ├── policy.ts
│       │   ├── claim.ts
│       │   ├── proof.ts
│       │   ├── oracle.ts
│       │   └── attestation.ts
│       ├── styles/
│       │   └── globals.css
│       ├── public/
│       │   ├── wasm/                  # Compiled WASM proving modules
│       │   └── images/
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── package.json
├── contracts/                         # Leo smart contracts
│   ├── policy_registry/
│   │   ├── src/
│   │   │   └── main.leo
│   │   ├── inputs/
│   │   ├── outputs/
│   │   └── program.json
│   ├── risk_pool/
│   │   ├── src/
│   │   │   └── main.leo
│   │   └── program.json
│   ├── claims_engine/
│   │   ├── src/
│   │   │   └── main.leo
│   │   └── program.json
│   ├── oracle_bridge/
│   │   ├── src/
│   │   │   └── main.leo
│   │   └── program.json
│   ├── attestation_registry/
│   │   ├── src/
│   │   │   └── main.leo
│   │   └── program.json
│   └── governance/
│       ├── src/
│       │   └── main.leo
│       └── program.json
├── packages/
│   ├── sdk/                           # TypeScript SDK for protocol
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── policy.ts
│   │   │   ├── claims.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/                         # Shared TypeScript types
│   │   ├── src/
│   │   └── package.json
│   └── utils/                         # Shared utilities
│       ├── src/
│       └── package.json
├── scripts/
│   ├── deploy-contracts.ts
│   ├── setup-oracles.ts
│   ├── seed-testnet.ts
│   └── generate-test-data.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── smart-contracts.md
│   └── user-guide.md
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   └── Dockerfile.worker
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

# 7. CORE FEATURES & USER FLOWS

## 7.1 Feature: Policy Purchase

### User Story
As a user, I want to purchase an insurance policy without revealing my personal data, so that I can have coverage while maintaining privacy.

### Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: SELECT COVERAGE TYPE                                            │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Flight     │  │   Weather    │  │    Auto      │                  │
│  │   Delay      │  │   Parametric │  │  Insurance   │                  │
│  │  [Select]    │  │  [Select]    │  │  [Coming]    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: CONFIGURE COVERAGE                                              │
│                                                                          │
│  Coverage Amount: [________] USD                                         │
│  Duration: [1 Month ▼]                                                   │
│  Trigger Threshold: [3 hours delay ▼]                                    │
│                                                                          │
│  Estimated Premium: $12.50                                               │
│                                                                          │
│  [Continue →]                                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: PROVIDE ATTESTATION (if required)                               │
│                                                                          │
│  For Flight Delay Insurance:                                             │
│  • No attestation required (parametric)                                  │
│                                                                          │
│  For Auto Insurance:                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Upload DMV Record Attestation                                   │   │
│  │  [Choose File] or [Connect to DMV Partner]                       │   │
│  │                                                                   │   │
│  │  Privacy Meter: ████████░░ 80%                                   │   │
│  │  "Only proving: no at-fault accidents in 5 years"                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: GENERATE PROOF                                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Generating Zero-Knowledge Proof...                              │   │
│  │                                                                   │   │
│  │  [████████████████░░░░░░░░] 65%                                  │   │
│  │                                                                   │   │
│  │  ✓ Loading proving circuit                                       │   │
│  │  ✓ Computing witness                                             │   │
│  │  ◐ Generating proof (~30 seconds remaining)                      │   │
│  │  ○ Finalizing                                                    │   │
│  │                                                                   │   │
│  │  ℹ️ Your data never leaves this device                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: REVIEW & CONFIRM                                                │
│                                                                          │
│  Policy Summary:                                                         │
│  ──────────────────────────────                                         │
│  Type: Flight Delay Insurance                                            │
│  Coverage: $500 per qualifying delay                                     │
│  Trigger: 3+ hour delay                                                  │
│  Duration: 1 month                                                       │
│  Premium: $12.50                                                         │
│                                                                          │
│  What's being shared on-chain:                                           │
│  • Eligibility proof (✓ verified, no personal data)                     │
│  • Coverage parameters (encrypted, only you can read)                    │
│  • Premium payment                                                       │
│                                                                          │
│  [← Back]                              [Connect Wallet & Purchase →]     │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: TRANSACTION                                                     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Leo Wallet                                                      │   │
│  │                                                                   │   │
│  │  Confirm Transaction                                             │   │
│  │  ─────────────────────                                           │   │
│  │  Program: zk_underwrite_policy_v1.aleo                           │   │
│  │  Function: purchase_policy                                       │   │
│  │  Fee: ~0.005 ALEO                                                │   │
│  │  Amount: 12.50 USDC                                              │   │
│  │                                                                   │   │
│  │  [Reject]                                      [Approve]         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: SUCCESS                                                         │
│                                                                          │
│            ✓ Policy Purchased Successfully!                             │
│                                                                          │
│  Your policy is now active. You can view it in your dashboard.          │
│                                                                          │
│  Policy ID: pol_7x8k2m...                                               │
│  Transaction: aleo1qx7...                                               │
│                                                                          │
│  [View Policy]              [Purchase Another]                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technical Implementation

```typescript
// hooks/use-policy-purchase.ts

interface PolicyPurchaseParams {
  coverageType: CoverageType;
  coverageAmount: bigint;
  duration: number; // in blocks
  triggerParams: TriggerParams;
  attestation?: AttestationData;
}

interface UsePolicyPurchaseReturn {
  // State
  step: PurchaseStep;
  isGeneratingProof: boolean;
  proofProgress: number;
  isPurchasing: boolean;
  error: Error | null;
  
  // Actions
  setStep: (step: PurchaseStep) => void;
  generateProof: (params: PolicyPurchaseParams) => Promise<Proof>;
  purchasePolicy: (proof: Proof, params: PolicyPurchaseParams) => Promise<Policy>;
  reset: () => void;
}

export function usePolicyPurchase(): UsePolicyPurchaseReturn {
  const { wallet, signTransaction } = useWallet();
  const { generateEligibilityProof } = useProof();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<PurchaseStep>('select-coverage');
  const [proofProgress, setProofProgress] = useState(0);
  
  const generateProofMutation = useMutation({
    mutationFn: async (params: PolicyPurchaseParams) => {
      setProofProgress(0);
      
      // Load WASM module
      const wasmModule = await loadProvingModule(params.coverageType);
      setProofProgress(20);
      
      // Prepare inputs
      const privateInputs = preparePrivateInputs(params);
      const publicInputs = await fetchPublicInputs(params);
      setProofProgress(40);
      
      // Generate proof with progress updates
      const proof = await wasmModule.generateProof(
        privateInputs,
        publicInputs,
        (progress: number) => setProofProgress(40 + progress * 0.5)
      );
      
      setProofProgress(100);
      return proof;
    }
  });
  
  const purchaseMutation = useMutation({
    mutationFn: async ({ proof, params }: { proof: Proof; params: PolicyPurchaseParams }) => {
      // Build transaction
      const tx = await buildPolicyTransaction(proof, params);
      
      // Sign with wallet
      const signedTx = await signTransaction(tx);
      
      // Submit to Aleo
      const result = await submitTransaction(signedTx);
      
      // Wait for confirmation
      const policy = await waitForPolicyCreation(result.txId);
      
      return policy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    }
  });
  
  return {
    step,
    isGeneratingProof: generateProofMutation.isPending,
    proofProgress,
    isPurchasing: purchaseMutation.isPending,
    error: generateProofMutation.error || purchaseMutation.error,
    setStep,
    generateProof: generateProofMutation.mutateAsync,
    purchasePolicy: (proof, params) => purchaseMutation.mutateAsync({ proof, params }),
    reset: () => {
      setStep('select-coverage');
      setProofProgress(0);
      generateProofMutation.reset();
      purchaseMutation.reset();
    }
  };
}
```

## 7.2 Feature: Claim Submission (Parametric)

### User Story
As a policyholder, I want my claim to be automatically processed when a trigger event occurs, so that I receive my payout without manual intervention.

### Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AUTOMATIC TRIGGER (No user action needed)                               │
│                                                                          │
│  Oracle Network detects:                                                 │
│  • Flight AA123 delayed 4 hours                                          │
│  • Weather station reports >6 inches rainfall                            │
│                                                                          │
│  System automatically:                                                   │
│  1. Queries all active policies matching criteria                        │
│  2. Verifies oracle data signature                                       │
│  3. Executes claim payouts                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ USER NOTIFICATION                                                        │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🎉 Claim Payout Received!                                       │   │
│  │                                                                   │   │
│  │  Your flight delay policy triggered automatically.               │   │
│  │                                                                   │   │
│  │  Event: Flight AA123 delayed 4h 23m                              │   │
│  │  Payout: $500 USDC                                               │   │
│  │  Transaction: aleo1xyz...                                        │   │
│  │                                                                   │   │
│  │  [View Details]                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Manual Claim Flow (for non-parametric)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: INITIATE CLAIM                                                  │
│                                                                          │
│  Select Policy:                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Auto Insurance - pol_8k2m4n...                                  │   │
│  │  Coverage: Collision, $50k max                                   │   │
│  │  Status: Active                                                  │   │
│  │  [Select]                                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Describe Incident:                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Date: [01/15/2025]                                              │   │
│  │  Type: [Collision ▼]                                             │   │
│  │  Description: [____________________________________]              │   │
│  │  Estimated Damage: [$_______]                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: PROVIDE EVIDENCE (with ZK proof)                                │
│                                                                          │
│  Upload Evidence:                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [+ Police Report]                                               │   │
│  │  [+ Repair Estimate]                                             │   │
│  │  [+ Photos]                                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Privacy Options:                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ☑ Prove incident date matches policy period                     │   │
│  │  ☑ Prove repair estimate within coverage                         │   │
│  │  ☐ Reveal full police report (only if required)                  │   │
│  │                                                                   │   │
│  │  ℹ️ Default: Only ZK proofs shared. Full docs available          │   │
│  │     for adjuster review if claim disputed.                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: GENERATE CLAIM PROOF                                            │
│                                                                          │
│  Generating proof of claim validity...                                   │
│  [████████████████████████████████] 100%                                │
│                                                                          │
│  Proof includes:                                                         │
│  ✓ Policy ownership verified                                            │
│  ✓ Incident date within policy period                                   │
│  ✓ Damage estimate within coverage limits                               │
│  ✓ No duplicate claim for this incident                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: SUBMIT & TRACK                                                  │
│                                                                          │
│  Claim Submitted Successfully!                                           │
│                                                                          │
│  Claim ID: clm_9x2k4...                                                 │
│  Status: Under Review                                                    │
│                                                                          │
│  Timeline:                                                               │
│  ✓ Submitted - Jan 15, 2025 3:42 PM                                     │
│  ◐ Automated Review - In Progress                                       │
│  ○ Payout Processing                                                    │
│  ○ Complete                                                             │
│                                                                          │
│  Estimated Resolution: 24-48 hours                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## 7.3 Feature: Liquidity Pool Provision

### User Story
As an investor, I want to provide liquidity to insurance pools to earn yield, while understanding the risk/reward tradeoff.

### Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ POOL DASHBOARD                                                          │
│                                                                          │
│  Available Pools:                                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Pool             │ TVL      │ APY    │ Risk   │ Utilization │     │ │
│  │──────────────────┼──────────┼────────┼────────┼─────────────│─────│ │
│  │ Flight Delay     │ $2.4M    │ 8.2%   │ Low    │ 34%         │[→] │ │
│  │ Weather (US)     │ $890K    │ 12.1%  │ Medium │ 45%         │[→] │ │
│  │ Auto (CA)        │ $5.1M    │ 6.8%   │ Medium │ 62%         │[→] │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Your Positions:                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Flight Delay Pool                                                  │ │
│  │ Deposited: $10,000 USDC                                            │ │
│  │ Current Value: $10,234 USDC (+2.34%)                               │ │
│  │ Earnings: $234 (30 days)                                           │ │
│  │ [Withdraw] [Add More]                                              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ POOL DETAIL: Flight Delay                                               │
│                                                                          │
│  Pool Statistics:                                                        │
│  ───────────────                                                        │
│  Total Value Locked: $2,400,000                                          │
│  Active Policies: 1,247                                                  │
│  Total Coverage: $8,200,000                                              │
│  Historical Loss Ratio: 42%                                              │
│  30-Day APY: 8.2%                                                        │
│                                                                          │
│  Risk Metrics:                                                           │
│  ─────────────                                                          │
│  Max Payout Event: $820,000 (10% of coverage)                           │
│  Reserve Ratio: 2.9x                                                    │
│  Confidence Level: 99.5%                                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Deposit Amount: [________] USDC                                 │   │
│  │                                                                   │   │
│  │  You will receive: _____ zkUND-FLIGHT LP tokens                  │   │
│  │                                                                   │   │
│  │  ⚠️ Risk Disclosure: You may lose up to 100% of deposited funds  │   │
│  │     in extreme loss scenarios.                                   │   │
│  │                                                                   │   │
│  │  [Deposit]                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 8. SMART CONTRACTS (LEO/ALEO)

## 8.1 Program Overview

| Program | Purpose | Key Functions |
|---------|---------|---------------|
| `policy_registry.aleo` | Manage policy lifecycle | `create_policy`, `renew_policy`, `cancel_policy` |
| `risk_pool.aleo` | Manage liquidity pools | `deposit`, `withdraw`, `distribute_yield` |
| `claims_engine.aleo` | Process claims | `submit_claim`, `process_parametric`, `approve_claim` |
| `oracle_bridge.aleo` | Relay external data | `submit_oracle_data`, `verify_oracle` |
| `attestation_registry.aleo` | Manage attestors | `register_attestor`, `verify_attestation` |
| `governance.aleo` | Protocol governance | `propose`, `vote`, `execute` |

## 8.2 Policy Registry Program

```leo
// contracts/policy_registry/src/main.leo

program policy_registry.aleo {
    // ═══════════════════════════════════════════════════════════════════
    // RECORDS
    // ═══════════════════════════════════════════════════════════════════
    
    // Private policy record - only owner can view full details
    record Policy {
        owner: address,
        policy_id: field,
        coverage_type: u8,           // 0: flight, 1: weather, 2: auto, 3: health
        coverage_amount: u64,        // in smallest unit (e.g., cents)
        premium_paid: u64,
        deductible: u64,
        start_block: u32,
        end_block: u32,
        trigger_params: field,       // hash of trigger parameters
        eligibility_proof: field,    // commitment to eligibility proof
        status: u8,                  // 0: active, 1: claimed, 2: expired, 3: cancelled
        nullifier: field             // prevents double-spending
    }
    
    // Policy metadata (public, for pool statistics)
    struct PolicyMeta {
        coverage_type: u8,
        coverage_amount: u64,
        start_block: u32,
        end_block: u32,
        pool_id: field
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MAPPINGS
    // ═══════════════════════════════════════════════════════════════════
    
    // Track policy existence (for duplicate prevention)
    mapping policy_exists: field => bool;
    
    // Track total policies per coverage type
    mapping policies_by_type: u8 => u64;
    
    // Track active coverage per pool
    mapping active_coverage: field => u64;
    
    // ═══════════════════════════════════════════════════════════════════
    // TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════
    
    // Create a new policy
    transition create_policy(
        private coverage_type: u8,
        private coverage_amount: u64,
        private premium: u64,
        private deductible: u64,
        private duration_blocks: u32,
        private trigger_params: field,
        private eligibility_proof: field,
        public pool_id: field
    ) -> Policy {
        // Validate coverage type
        assert(coverage_type <= 3u8);
        
        // Validate amounts
        assert(coverage_amount > 0u64);
        assert(premium > 0u64);
        
        // Generate unique policy ID
        let policy_id: field = BHP256::hash_to_field(
            PolicyIdInput {
                owner: self.caller,
                coverage_type: coverage_type,
                timestamp: block.height,
                random: ChaCha::rand_field()
            }
        );
        
        // Generate nullifier for double-spend prevention
        let nullifier: field = BHP256::hash_to_field(
            NullifierInput {
                policy_id: policy_id,
                owner: self.caller
            }
        );
        
        // Calculate end block
        let end_block: u32 = block.height + duration_blocks;
        
        // Create policy record
        return Policy {
            owner: self.caller,
            policy_id: policy_id,
            coverage_type: coverage_type,
            coverage_amount: coverage_amount,
            premium_paid: premium,
            deductible: deductible,
            start_block: block.height,
            end_block: end_block,
            trigger_params: trigger_params,
            eligibility_proof: eligibility_proof,
            status: 0u8,
            nullifier: nullifier
        } then finalize(policy_id, coverage_type, coverage_amount, pool_id);
    }
    
    finalize create_policy(
        policy_id: field,
        coverage_type: u8,
        coverage_amount: u64,
        pool_id: field
    ) {
        // Ensure policy doesn't already exist
        let exists: bool = Mapping::get_or_use(policy_exists, policy_id, false);
        assert(!exists);
        
        // Mark policy as existing
        Mapping::set(policy_exists, policy_id, true);
        
        // Increment policy count for type
        let current_count: u64 = Mapping::get_or_use(policies_by_type, coverage_type, 0u64);
        Mapping::set(policies_by_type, coverage_type, current_count + 1u64);
        
        // Update active coverage for pool
        let current_coverage: u64 = Mapping::get_or_use(active_coverage, pool_id, 0u64);
        Mapping::set(active_coverage, pool_id, current_coverage + coverage_amount);
    }
    
    // Renew an existing policy
    transition renew_policy(
        private policy: Policy,
        private additional_premium: u64,
        private extension_blocks: u32
    ) -> Policy {
        // Verify ownership
        assert_eq(policy.owner, self.caller);
        
        // Verify policy is active or about to expire
        assert(policy.status == 0u8);
        
        // Calculate new end block
        let new_end_block: u32 = policy.end_block + extension_blocks;
        
        // Create renewed policy
        return Policy {
            owner: policy.owner,
            policy_id: policy.policy_id,
            coverage_type: policy.coverage_type,
            coverage_amount: policy.coverage_amount,
            premium_paid: policy.premium_paid + additional_premium,
            deductible: policy.deductible,
            start_block: policy.start_block,
            end_block: new_end_block,
            trigger_params: policy.trigger_params,
            eligibility_proof: policy.eligibility_proof,
            status: 0u8,
            nullifier: policy.nullifier
        };
    }
    
    // Cancel a policy (partial refund based on remaining time)
    transition cancel_policy(
        private policy: Policy
    ) -> (Policy, u64) {
        // Verify ownership
        assert_eq(policy.owner, self.caller);
        
        // Verify policy is active
        assert(policy.status == 0u8);
        
        // Calculate refund (pro-rata based on remaining blocks)
        let total_blocks: u32 = policy.end_block - policy.start_block;
        let elapsed_blocks: u32 = block.height - policy.start_block;
        let remaining_blocks: u32 = total_blocks - elapsed_blocks;
        
        let refund: u64 = (policy.premium_paid * (remaining_blocks as u64)) / (total_blocks as u64);
        
        // Mark policy as cancelled
        let cancelled_policy: Policy = Policy {
            owner: policy.owner,
            policy_id: policy.policy_id,
            coverage_type: policy.coverage_type,
            coverage_amount: policy.coverage_amount,
            premium_paid: policy.premium_paid,
            deductible: policy.deductible,
            start_block: policy.start_block,
            end_block: policy.end_block,
            trigger_params: policy.trigger_params,
            eligibility_proof: policy.eligibility_proof,
            status: 3u8, // cancelled
            nullifier: policy.nullifier
        };
        
        return (cancelled_policy, refund) then finalize(
            policy.policy_id,
            policy.coverage_type,
            policy.coverage_amount
        );
    }
    
    finalize cancel_policy(
        policy_id: field,
        coverage_type: u8,
        coverage_amount: u64
    ) {
        // Decrement policy count
        let current_count: u64 = Mapping::get(policies_by_type, coverage_type);
        Mapping::set(policies_by_type, coverage_type, current_count - 1u64);
    }
    
    // Prove policy ownership without revealing details
    transition prove_ownership(
        private policy: Policy,
        public challenge: field
    ) -> field {
        // Verify caller owns the policy
        assert_eq(policy.owner, self.caller);
        
        // Generate ownership proof
        let proof: field = BHP256::hash_to_field(
            OwnershipProofInput {
                policy_id: policy.policy_id,
                owner: policy.owner,
                challenge: challenge
            }
        );
        
        return proof;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // HELPER STRUCTS
    // ═══════════════════════════════════════════════════════════════════
    
    struct PolicyIdInput {
        owner: address,
        coverage_type: u8,
        timestamp: u32,
        random: field
    }
    
    struct NullifierInput {
        policy_id: field,
        owner: address
    }
    
    struct OwnershipProofInput {
        policy_id: field,
        owner: address,
        challenge: field
    }
}
```

## 8.3 Claims Engine Program

```leo
// contracts/claims_engine/src/main.leo

program claims_engine.aleo {
    // Import policy registry
    import policy_registry.aleo;
    
    // ═══════════════════════════════════════════════════════════════════
    // RECORDS
    // ═══════════════════════════════════════════════════════════════════
    
    record Claim {
        owner: address,
        claim_id: field,
        policy_id: field,
        amount: u64,
        event_data_hash: field,
        status: u8,              // 0: pending, 1: approved, 2: denied, 3: paid
        submitted_at: u32,
        nullifier: field
    }
    
    record Payout {
        owner: address,
        amount: u64,
        claim_id: field,
        paid_at: u32
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MAPPINGS
    // ═══════════════════════════════════════════════════════════════════
    
    // Track claims by policy (prevent duplicates)
    mapping policy_claims: field => field;  // policy_id => claim_id
    
    // Track claim status
    mapping claim_status: field => u8;
    
    // Oracle data store
    mapping oracle_data: field => OracleDataPoint;
    
    // Authorized oracles
    mapping authorized_oracles: address => bool;
    
    // ═══════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════
    
    struct OracleDataPoint {
        data_type: u8,          // 0: flight, 1: weather, 2: financial
        value: u64,
        timestamp: u32,
        source_hash: field,
        signature: field
    }
    
    struct FlightDelayData {
        flight_hash: field,     // hash of flight number + date
        delay_minutes: u32,
        status: u8,             // 0: on-time, 1: delayed, 2: cancelled
        timestamp: u32
    }
    
    struct WeatherData {
        location_hash: field,
        measurement_type: u8,   // 0: rainfall, 1: temperature, 2: wind
        value: u64,             // scaled integer
        timestamp: u32
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════
    
    // Submit oracle data (called by authorized oracles)
    transition submit_oracle_data(
        public data_id: field,
        public data_type: u8,
        public value: u64,
        public source_hash: field,
        private signature: field
    ) {
        return then finalize(
            self.caller,
            data_id,
            data_type,
            value,
            source_hash,
            signature
        );
    }
    
    finalize submit_oracle_data(
        oracle: address,
        data_id: field,
        data_type: u8,
        value: u64,
        source_hash: field,
        signature: field
    ) {
        // Verify oracle is authorized
        let is_authorized: bool = Mapping::get_or_use(authorized_oracles, oracle, false);
        assert(is_authorized);
        
        // Store oracle data
        let data_point: OracleDataPoint = OracleDataPoint {
            data_type: data_type,
            value: value,
            timestamp: block.height,
            source_hash: source_hash,
            signature: signature
        };
        
        Mapping::set(oracle_data, data_id, data_point);
    }
    
    // Process parametric claim (automatic, oracle-triggered)
    transition process_parametric_claim(
        private policy: policy_registry.aleo/Policy,
        public oracle_data_id: field,
        public expected_trigger_value: u64
    ) -> (Claim, Payout) {
        // Verify policy ownership
        assert_eq(policy.owner, self.caller);
        
        // Verify policy is active
        assert(policy.status == 0u8);
        
        // Verify policy hasn't expired
        assert(block.height <= policy.end_block);
        
        // Generate claim ID
        let claim_id: field = BHP256::hash_to_field(
            ClaimIdInput {
                policy_id: policy.policy_id,
                oracle_data_id: oracle_data_id,
                timestamp: block.height
            }
        );
        
        // Create claim record
        let claim: Claim = Claim {
            owner: self.caller,
            claim_id: claim_id,
            policy_id: policy.policy_id,
            amount: policy.coverage_amount,
            event_data_hash: oracle_data_id,
            status: 3u8, // paid (parametric is automatic)
            submitted_at: block.height,
            nullifier: BHP256::hash_to_field(claim_id)
        };
        
        // Create payout record
        let payout: Payout = Payout {
            owner: self.caller,
            amount: policy.coverage_amount,
            claim_id: claim_id,
            paid_at: block.height
        };
        
        return (claim, payout) then finalize(
            policy.policy_id,
            claim_id,
            oracle_data_id,
            expected_trigger_value,
            policy.coverage_amount
        );
    }
    
    finalize process_parametric_claim(
        policy_id: field,
        claim_id: field,
        oracle_data_id: field,
        expected_trigger_value: u64,
        payout_amount: u64
    ) {
        // Verify no existing claim for this policy
        let existing_claim: field = Mapping::get_or_use(policy_claims, policy_id, 0field);
        assert_eq(existing_claim, 0field);
        
        // Get oracle data
        let data: OracleDataPoint = Mapping::get(oracle_data, oracle_data_id);
        
        // Verify trigger condition met (e.g., delay >= threshold)
        assert(data.value >= expected_trigger_value);
        
        // Record claim
        Mapping::set(policy_claims, policy_id, claim_id);
        Mapping::set(claim_status, claim_id, 3u8); // paid
    }
    
    // Submit traditional claim (requires review)
    transition submit_traditional_claim(
        private policy: policy_registry.aleo/Policy,
        private claim_amount: u64,
        private evidence_hash: field,
        public claim_type: u8
    ) -> Claim {
        // Verify policy ownership
        assert_eq(policy.owner, self.caller);
        
        // Verify policy is active
        assert(policy.status == 0u8);
        
        // Verify claim amount doesn't exceed coverage
        assert(claim_amount <= policy.coverage_amount);
        
        // Generate claim ID
        let claim_id: field = BHP256::hash_to_field(
            ClaimIdInput {
                policy_id: policy.policy_id,
                oracle_data_id: evidence_hash,
                timestamp: block.height
            }
        );
        
        // Create pending claim
        let claim: Claim = Claim {
            owner: self.caller,
            claim_id: claim_id,
            policy_id: policy.policy_id,
            amount: claim_amount,
            event_data_hash: evidence_hash,
            status: 0u8, // pending
            submitted_at: block.height,
            nullifier: BHP256::hash_to_field(claim_id)
        };
        
        return claim then finalize(policy.policy_id, claim_id);
    }
    
    finalize submit_traditional_claim(
        policy_id: field,
        claim_id: field
    ) {
        // Verify no existing claim for this policy
        let existing_claim: field = Mapping::get_or_use(policy_claims, policy_id, 0field);
        assert_eq(existing_claim, 0field);
        
        // Record pending claim
        Mapping::set(policy_claims, policy_id, claim_id);
        Mapping::set(claim_status, claim_id, 0u8); // pending
    }
    
    // Approve claim (called by authorized adjuster)
    transition approve_claim(
        private claim: Claim,
        private approved_amount: u64,
        public adjuster_attestation: field
    ) -> (Claim, Payout) {
        // Verify claim is pending
        assert(claim.status == 0u8);
        
        // Verify approved amount doesn't exceed claim amount
        assert(approved_amount <= claim.amount);
        
        // Update claim status
        let approved_claim: Claim = Claim {
            owner: claim.owner,
            claim_id: claim.claim_id,
            policy_id: claim.policy_id,
            amount: approved_amount,
            event_data_hash: claim.event_data_hash,
            status: 3u8, // paid
            submitted_at: claim.submitted_at,
            nullifier: claim.nullifier
        };
        
        // Create payout
        let payout: Payout = Payout {
            owner: claim.owner,
            amount: approved_amount,
            claim_id: claim.claim_id,
            paid_at: block.height
        };
        
        return (approved_claim, payout) then finalize(
            claim.claim_id,
            adjuster_attestation
        );
    }
    
    finalize approve_claim(
        claim_id: field,
        adjuster_attestation: field
    ) {
        // Verify claim exists and is pending
        let current_status: u8 = Mapping::get(claim_status, claim_id);
        assert_eq(current_status, 0u8);
        
        // Update status to paid
        Mapping::set(claim_status, claim_id, 3u8);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // HELPER STRUCTS
    // ═══════════════════════════════════════════════════════════════════
    
    struct ClaimIdInput {
        policy_id: field,
        oracle_data_id: field,
        timestamp: u32
    }
}
```

## 8.4 Risk Pool Program

```leo
// contracts/risk_pool/src/main.leo

program risk_pool.aleo {
    // ═══════════════════════════════════════════════════════════════════
    // RECORDS
    // ═══════════════════════════════════════════════════════════════════
    
    // LP token representing pool share
    record LPToken {
        owner: address,
        pool_id: field,
        amount: u64,
        minted_at: u32
    }
    
    // Deposit receipt
    record DepositReceipt {
        owner: address,
        pool_id: field,
        amount: u64,
        lp_tokens: u64,
        deposited_at: u32
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MAPPINGS
    // ═══════════════════════════════════════════════════════════════════
    
    // Pool configuration
    mapping pool_config: field => PoolConfig;
    
    // Pool state
    mapping pool_state: field => PoolState;
    
    // Total LP tokens per pool
    mapping total_lp_supply: field => u64;
    
    // ═══════════════════════════════════════════════════════════════════
    // STRUCTS
    // ═══════════════════════════════════════════════════════════════════
    
    struct PoolConfig {
        pool_id: field,
        coverage_type: u8,
        min_deposit: u64,
        max_utilization: u64,      // basis points (e.g., 8000 = 80%)
        reserve_ratio: u64,        // basis points
        fee_rate: u64,             // basis points
        admin: address
    }
    
    struct PoolState {
        total_deposits: u64,
        total_coverage: u64,
        total_premiums: u64,
        total_claims_paid: u64,
        last_yield_distribution: u32
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════
    
    // Initialize a new pool
    transition create_pool(
        public pool_id: field,
        public coverage_type: u8,
        public min_deposit: u64,
        public max_utilization: u64,
        public reserve_ratio: u64,
        public fee_rate: u64
    ) {
        return then finalize(
            pool_id,
            coverage_type,
            min_deposit,
            max_utilization,
            reserve_ratio,
            fee_rate,
            self.caller
        );
    }
    
    finalize create_pool(
        pool_id: field,
        coverage_type: u8,
        min_deposit: u64,
        max_utilization: u64,
        reserve_ratio: u64,
        fee_rate: u64,
        admin: address
    ) {
        // Verify pool doesn't exist
        let exists: bool = Mapping::contains(pool_config, pool_id);
        assert(!exists);
        
        // Create pool config
        let config: PoolConfig = PoolConfig {
            pool_id: pool_id,
            coverage_type: coverage_type,
            min_deposit: min_deposit,
            max_utilization: max_utilization,
            reserve_ratio: reserve_ratio,
            fee_rate: fee_rate,
            admin: admin
        };
        
        // Create initial pool state
        let state: PoolState = PoolState {
            total_deposits: 0u64,
            total_coverage: 0u64,
            total_premiums: 0u64,
            total_claims_paid: 0u64,
            last_yield_distribution: block.height
        };
        
        Mapping::set(pool_config, pool_id, config);
        Mapping::set(pool_state, pool_id, state);
        Mapping::set(total_lp_supply, pool_id, 0u64);
    }
    
    // Deposit liquidity into pool
    transition deposit(
        public pool_id: field,
        public amount: u64
    ) -> (LPToken, DepositReceipt) {
        // LP tokens to mint will be calculated in finalize
        // For now, use 1:1 ratio as placeholder
        let lp_amount: u64 = amount;
        
        let lp_token: LPToken = LPToken {
            owner: self.caller,
            pool_id: pool_id,
            amount: lp_amount,
            minted_at: block.height
        };
        
        let receipt: DepositReceipt = DepositReceipt {
            owner: self.caller,
            pool_id: pool_id,
            amount: amount,
            lp_tokens: lp_amount,
            deposited_at: block.height
        };
        
        return (lp_token, receipt) then finalize(pool_id, amount, lp_amount);
    }
    
    finalize deposit(
        pool_id: field,
        amount: u64,
        lp_amount: u64
    ) {
        // Get current pool state
        let state: PoolState = Mapping::get(pool_state, pool_id);
        let config: PoolConfig = Mapping::get(pool_config, pool_id);
        
        // Verify minimum deposit
        assert(amount >= config.min_deposit);
        
        // Update pool state
        let new_state: PoolState = PoolState {
            total_deposits: state.total_deposits + amount,
            total_coverage: state.total_coverage,
            total_premiums: state.total_premiums,
            total_claims_paid: state.total_claims_paid,
            last_yield_distribution: state.last_yield_distribution
        };
        
        Mapping::set(pool_state, pool_id, new_state);
        
        // Update LP supply
        let current_supply: u64 = Mapping::get_or_use(total_lp_supply, pool_id, 0u64);
        Mapping::set(total_lp_supply, pool_id, current_supply + lp_amount);
    }
    
    // Withdraw liquidity from pool
    transition withdraw(
        private lp_token: LPToken
    ) -> u64 {
        // Verify ownership
        assert_eq(lp_token.owner, self.caller);
        
        // Calculate withdrawal amount (will be determined in finalize)
        // For now, use 1:1 ratio
        let withdraw_amount: u64 = lp_token.amount;
        
        return withdraw_amount then finalize(
            lp_token.pool_id,
            lp_token.amount,
            withdraw_amount
        );
    }
    
    finalize withdraw(
        pool_id: field,
        lp_amount: u64,
        withdraw_amount: u64
    ) {
        // Get current pool state
        let state: PoolState = Mapping::get(pool_state, pool_id);
        let config: PoolConfig = Mapping::get(pool_config, pool_id);
        
        // Verify sufficient liquidity
        let available: u64 = state.total_deposits - 
            ((state.total_coverage * config.reserve_ratio) / 10000u64);
        assert(withdraw_amount <= available);
        
        // Update pool state
        let new_state: PoolState = PoolState {
            total_deposits: state.total_deposits - withdraw_amount,
            total_coverage: state.total_coverage,
            total_premiums: state.total_premiums,
            total_claims_paid: state.total_claims_paid,
            last_yield_distribution: state.last_yield_distribution
        };
        
        Mapping::set(pool_state, pool_id, new_state);
        
        // Update LP supply
        let current_supply: u64 = Mapping::get(total_lp_supply, pool_id);
        Mapping::set(total_lp_supply, pool_id, current_supply - lp_amount);
    }
    
    // Record premium payment (called by policy registry)
    transition record_premium(
        public pool_id: field,
        public premium_amount: u64,
        public coverage_amount: u64
    ) {
        return then finalize(pool_id, premium_amount, coverage_amount);
    }
    
    finalize record_premium(
        pool_id: field,
        premium_amount: u64,
        coverage_amount: u64
    ) {
        let state: PoolState = Mapping::get(pool_state, pool_id);
        let config: PoolConfig = Mapping::get(pool_config, pool_id);
        
        // Verify utilization won't exceed max
        let new_coverage: u64 = state.total_coverage + coverage_amount;
        let utilization: u64 = (new_coverage * 10000u64) / state.total_deposits;
        assert(utilization <= config.max_utilization);
        
        // Update state
        let new_state: PoolState = PoolState {
            total_deposits: state.total_deposits + premium_amount,
            total_coverage: new_coverage,
            total_premiums: state.total_premiums + premium_amount,
            total_claims_paid: state.total_claims_paid,
            last_yield_distribution: state.last_yield_distribution
        };
        
        Mapping::set(pool_state, pool_id, new_state);
    }
    
    // Record claim payout (called by claims engine)
    transition record_claim_payout(
        public pool_id: field,
        public payout_amount: u64,
        public coverage_released: u64
    ) {
        return then finalize(pool_id, payout_amount, coverage_released);
    }
    
    finalize record_claim_payout(
        pool_id: field,
        payout_amount: u64,
        coverage_released: u64
    ) {
        let state: PoolState = Mapping::get(pool_state, pool_id);
        
        // Update state
        let new_state: PoolState = PoolState {
            total_deposits: state.total_deposits - payout_amount,
            total_coverage: state.total_coverage - coverage_released,
            total_premiums: state.total_premiums,
            total_claims_paid: state.total_claims_paid + payout_amount,
            last_yield_distribution: state.last_yield_distribution
        };
        
        Mapping::set(pool_state, pool_id, new_state);
    }
}
```

---

# 9. BACKEND API DESIGN

## 9.1 API Overview

Base URL: `/api/v1`

### Authentication
- JWT tokens via NextAuth.js
- Wallet signature verification for sensitive operations
- Rate limiting per user/IP

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

## 9.2 Endpoints

### Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/policies` | List user's policies |
| GET | `/policies/:id` | Get policy details |
| POST | `/policies` | Create new policy |
| POST | `/policies/:id/renew` | Renew policy |
| POST | `/policies/:id/cancel` | Cancel policy |
| GET | `/policies/:id/proof` | Get policy ownership proof |

### Claims

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/claims` | List user's claims |
| GET | `/claims/:id` | Get claim details |
| POST | `/claims` | Submit new claim |
| POST | `/claims/:id/evidence` | Upload claim evidence |
| GET | `/claims/:id/status` | Get claim status |

### Pools

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pools` | List all pools |
| GET | `/pools/:id` | Get pool details |
| GET | `/pools/:id/stats` | Get pool statistics |
| POST | `/pools/:id/deposit` | Deposit to pool |
| POST | `/pools/:id/withdraw` | Withdraw from pool |
| GET | `/pools/:id/positions` | Get user's positions |

### Oracles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oracles/flight/:flightNumber` | Get flight status |
| GET | `/oracles/weather/:location` | Get weather data |
| GET | `/oracles/data/:id` | Get oracle data point |
| POST | `/oracles/subscribe` | Subscribe to updates |

### Attestations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attestations/providers` | List attestation providers |
| POST | `/attestations/verify` | Verify attestation |
| POST | `/attestations/request` | Request new attestation |

## 9.3 Detailed Endpoint Specifications

### POST /api/v1/policies

Create a new insurance policy.

**Request Body:**
```typescript
interface CreatePolicyRequest {
  coverageType: 'flight' | 'weather' | 'auto' | 'health';
  coverageAmount: string; // BigInt as string
  durationBlocks: number;
  triggerParams: {
    // Flight delay
    flightNumber?: string;
    flightDate?: string;
    delayThresholdMinutes?: number;
    
    // Weather
    location?: { lat: number; lng: number };
    measurementType?: 'rainfall' | 'temperature' | 'wind';
    threshold?: number;
    
    // Auto/Health - additional params
  };
  eligibilityProof?: {
    proof: string; // Base64 encoded
    publicInputs: string[];
  };
  poolId: string;
}
```

**Response:**
```typescript
interface CreatePolicyResponse {
  policyId: string;
  transactionId: string;
  status: 'pending' | 'confirmed';
  estimatedConfirmation: number; // blocks
  policy: {
    id: string;
    coverageType: string;
    coverageAmount: string;
    startBlock: number;
    endBlock: number;
    premium: string;
    status: string;
  };
}
```

### POST /api/v1/claims

Submit a new claim.

**Request Body:**
```typescript
interface SubmitClaimRequest {
  policyId: string;
  claimType: 'parametric' | 'traditional';
  
  // For parametric claims
  oracleDataId?: string;
  
  // For traditional claims
  claimAmount?: string;
  evidenceHash?: string;
  description?: string;
  
  // Proof of policy ownership
  ownershipProof: {
    proof: string;
    challenge: string;
  };
}
```

**Response:**
```typescript
interface SubmitClaimResponse {
  claimId: string;
  transactionId?: string; // For parametric (immediate)
  status: 'pending' | 'processing' | 'paid';
  
  // For parametric
  payoutAmount?: string;
  payoutTxId?: string;
  
  // For traditional
  estimatedReviewTime?: number; // hours
  requiredDocuments?: string[];
}
```

---

# 10. DATABASE SCHEMA

## 10.1 Overview

Using PostgreSQL with Prisma ORM. The database stores:
- User profiles and preferences
- Off-chain policy metadata (for fast queries)
- Claims history and status
- Oracle data cache
- Analytics and metrics

**Note:** Sensitive policy details remain on Aleo. The database only stores non-sensitive metadata and indexes.

## 10.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ═══════════════════════════════════════════════════════════════════════════
// USER & AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

model User {
  id            String    @id @default(cuid())
  walletAddress String    @unique
  email         String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  policies      Policy[]
  claims        Claim[]
  poolPositions PoolPosition[]
  notifications Notification[]
  preferences   UserPreference?
  
  @@index([walletAddress])
}

model UserPreference {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])
  
  emailNotifications  Boolean  @default(true)
  pushNotifications   Boolean  @default(true)
  claimAlerts         Boolean  @default(true)
  poolUpdates         Boolean  @default(true)
  
  preferredCurrency   String   @default("USD")
  timezone            String   @default("UTC")
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

// ═══════════════════════════════════════════════════════════════════════════
// POLICIES
// ═══════════════════════════════════════════════════════════════════════════

enum CoverageType {
  FLIGHT_DELAY
  WEATHER_PARAMETRIC
  AUTO
  HEALTH
}

enum PolicyStatus {
  PENDING
  ACTIVE
  CLAIMED
  EXPIRED
  CANCELLED
}

model Policy {
  id                String       @id @default(cuid())
  aleoId            String       @unique // On-chain policy ID
  userId            String
  user              User         @relation(fields: [userId], references: [id])
  
  coverageType      CoverageType
  coverageAmount    BigInt
  premium           BigInt
  deductible        BigInt       @default(0)
  
  startBlock        Int
  endBlock          Int
  startDate         DateTime
  endDate           DateTime
  
  poolId            String
  pool              Pool         @relation(fields: [poolId], references: [id])
  
  status            PolicyStatus @default(PENDING)
  
  // Trigger parameters (non-sensitive)
  triggerParams     Json
  
  // Transaction references
  createTxId        String?
  cancelTxId        String?
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  // Relations
  claims            Claim[]
  
  @@index([userId])
  @@index([poolId])
  @@index([status])
  @@index([coverageType])
  @@index([endDate])
}

// ═══════════════════════════════════════════════════════════════════════════
// CLAIMS
// ═══════════════════════════════════════════════════════════════════════════

enum ClaimType {
  PARAMETRIC
  TRADITIONAL
}

enum ClaimStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  DENIED
  PAID
}

model Claim {
  id              String      @id @default(cuid())
  aleoId          String?     @unique // On-chain claim ID (if exists)
  policyId        String
  policy          Policy      @relation(fields: [policyId], references: [id])
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  
  claimType       ClaimType
  claimAmount     BigInt
  approvedAmount  BigInt?
  
  status          ClaimStatus @default(PENDING)
  
  // Event data
  eventDataHash   String?
  oracleDataId    String?
  oracleData      OracleData? @relation(fields: [oracleDataId], references: [id])
  
  // Traditional claim data
  description     String?
  evidenceHashes  String[]
  
  // Review data
  reviewerId      String?
  reviewNotes     String?
  reviewedAt      DateTime?
  
  // Transaction references
  submitTxId      String?
  payoutTxId      String?
  
  paidAt          DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([policyId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

// ═══════════════════════════════════════════════════════════════════════════
// RISK POOLS
// ═══════════════════════════════════════════════════════════════════════════

model Pool {
  id              String       @id @default(cuid())
  aleoId          String       @unique // On-chain pool ID
  name            String
  description     String?
  
  coverageType    CoverageType
  
  // Configuration
  minDeposit      BigInt
  maxUtilization  Int          // basis points
  reserveRatio    Int          // basis points
  feeRate         Int          // basis points
  
  // Current state (synced from chain)
  totalDeposits   BigInt       @default(0)
  totalCoverage   BigInt       @default(0)
  totalPremiums   BigInt       @default(0)
  totalClaimsPaid BigInt       @default(0)
  
  // Calculated metrics
  currentApy      Float        @default(0)
  utilizationRate Float        @default(0)
  
  isActive        Boolean      @default(true)
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  lastSyncedAt    DateTime?
  
  // Relations
  policies        Policy[]
  positions       PoolPosition[]
  snapshots       PoolSnapshot[]
  
  @@index([coverageType])
  @@index([isActive])
}

model PoolPosition {
  id              String   @id @default(cuid())
  poolId          String
  pool            Pool     @relation(fields: [poolId], references: [id])
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  depositAmount   BigInt
  lpTokenAmount   BigInt
  currentValue    BigInt
  
  depositTxId     String?
  depositedAt     DateTime
  
  withdrawTxId    String?
  withdrawnAt     DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([poolId, userId])
  @@index([poolId])
  @@index([userId])
}

model PoolSnapshot {
  id              String   @id @default(cuid())
  poolId          String
  pool            Pool     @relation(fields: [poolId], references: [id])
  
  totalDeposits   BigInt
  totalCoverage   BigInt
  utilizationRate Float
  apy             Float
  
  blockHeight     Int
  timestamp       DateTime
  
  createdAt       DateTime @default(now())
  
  @@index([poolId, timestamp])
}

// ═══════════════════════════════════════════════════════════════════════════
// ORACLE DATA
// ═══════════════════════════════════════════════════════════════════════════

enum OracleDataType {
  FLIGHT_STATUS
  WEATHER
  FINANCIAL
}

model OracleData {
  id              String         @id @default(cuid())
  aleoId          String?        @unique // On-chain data ID
  
  dataType        OracleDataType
  source          String
  
  // Raw data
  rawData         Json
  
  // Parsed fields
  value           BigInt
  timestamp       DateTime
  
  // Verification
  sourceHash      String
  signature       String?
  verified        Boolean        @default(false)
  
  createdAt       DateTime       @default(now())
  
  // Relations
  claims          Claim[]
  
  @@index([dataType])
  @@index([timestamp])
}

// Flight-specific oracle data
model FlightData {
  id              String   @id @default(cuid())
  flightNumber    String
  flightDate      DateTime
  
  scheduledDeparture DateTime
  actualDeparture    DateTime?
  
  delayMinutes    Int      @default(0)
  status          String   // scheduled, delayed, cancelled, landed
  
  source          String
  fetchedAt       DateTime @default(now())
  
  @@unique([flightNumber, flightDate])
  @@index([flightNumber])
  @@index([flightDate])
}

// Weather-specific oracle data
model WeatherData {
  id              String   @id @default(cuid())
  locationHash    String
  latitude        Float
  longitude       Float
  
  measurementType String   // rainfall, temperature, wind
  value           Float
  unit            String
  
  measuredAt      DateTime
  source          String
  fetchedAt       DateTime @default(now())
  
  @@index([locationHash, measurementType, measuredAt])
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTESTATIONS
// ═══════════════════════════════════════════════════════════════════════════

model AttestationProvider {
  id              String   @id @default(cuid())
  name            String
  description     String?
  type            String   // dmv, medical, financial
  
  publicKey       String   @unique
  endpoint        String?
  
  isActive        Boolean  @default(true)
  trustScore      Float    @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  attestations    Attestation[]
}

model Attestation {
  id              String              @id @default(cuid())
  providerId      String
  provider        AttestationProvider @relation(fields: [providerId], references: [id])
  
  subjectHash     String              // Hash of subject identifier
  attestationType String
  
  dataHash        String
  signature       String
  
  issuedAt        DateTime
  expiresAt       DateTime?
  revokedAt       DateTime?
  
  createdAt       DateTime            @default(now())
  
  @@index([providerId])
  @@index([subjectHash])
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

enum NotificationType {
  POLICY_CREATED
  POLICY_EXPIRING
  POLICY_EXPIRED
  CLAIM_SUBMITTED
  CLAIM_APPROVED
  CLAIM_DENIED
  CLAIM_PAID
  POOL_DEPOSIT
  POOL_WITHDRAWAL
  SYSTEM
}

model Notification {
  id              String           @id @default(cuid())
  userId          String
  user            User             @relation(fields: [userId], references: [id])
  
  type            NotificationType
  title           String
  message         String
  data            Json?
  
  read            Boolean          @default(false)
  readAt          DateTime?
  
  createdAt       DateTime         @default(now())
  
  @@index([userId, read])
  @@index([createdAt])
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

model ProtocolMetrics {
  id                  String   @id @default(cuid())
  
  totalPolicies       Int
  activePolicies      Int
  totalCoverage       BigInt
  totalPremiums       BigInt
  totalClaimsPaid     BigInt
  
  totalValueLocked    BigInt
  uniqueUsers         Int
  
  timestamp           DateTime
  blockHeight         Int
  
  createdAt           DateTime @default(now())
  
  @@index([timestamp])
}
```

---

# 11. FRONTEND COMPONENTS

## 11.1 Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   ├── WalletButton
│   │   └── UserMenu
│   ├── Sidebar (dashboard)
│   │   ├── NavLinks
│   │   └── PoolStats
│   └── Footer
│
├── Pages
│   ├── Landing
│   │   ├── Hero
│   │   ├── Features
│   │   ├── HowItWorks
│   │   ├── Pools Overview
│   │   └── CTA
│   │
│   ├── Policies
│   │   ├── PolicyList
│   │   │   └── PolicyCard
│   │   ├── PolicyDetail
│   │   │   ├── CoverageInfo
│   │   │   ├── ClaimHistory
│   │   │   └── Actions
│   │   └── NewPolicy
│   │       └── PolicyWizard
│   │           ├── CoverageSelector
│   │           ├── ConfigForm
│   │           ├── AttestationUpload
│   │           ├── ProofGenerator
│   │           ├── ReviewConfirm
│   │           └── TransactionStatus
│   │
│   ├── Claims
│   │   ├── ClaimsList
│   │   │   └── ClaimCard
│   │   ├── ClaimDetail
│   │   │   ├── StatusTimeline
│   │   │   ├── EvidenceViewer
│   │   │   └── PayoutInfo
│   │   └── NewClaim
│   │       └── ClaimForm
│   │           ├── PolicySelector
│   │           ├── EventDetails
│   │           ├── EvidenceUpload
│   │           └── ProofGenerator
│   │
│   ├── Pools
│   │   ├── PoolsList
│   │   │   └── PoolCard
│   │   ├── PoolDetail
│   │   │   ├── PoolStats
│   │   │   ├── PerformanceChart
│   │   │   ├── RiskMetrics
│   │   │   └── DepositWithdraw
│   │   └── Positions
│   │       └── PositionCard
│   │
│   └── Settings
│       ├── ProfileSettings
│       ├── NotificationSettings
│       └── WalletSettings
│
└── Shared Components
    ├── UI (shadcn/ui)
    ├── ProofProgress
    ├── TransactionStatus
    ├── WalletModal
    ├── PrivacyMeter
    ├── AmountInput
    ├── DateRangePicker
    └── LoadingStates
```

## 11.2 Key Component Specifications

### PolicyWizard Component

```typescript
// components/forms/policy-wizard/PolicyWizard.tsx

interface PolicyWizardProps {
  initialCoverageType?: CoverageType;
  onComplete: (policy: Policy) => void;
  onCancel: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  validation: (data: WizardData) => boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'coverage',
    title: 'Select Coverage',
    description: 'Choose the type of insurance coverage',
    component: CoverageSelector,
    validation: (data) => !!data.coverageType,
  },
  {
    id: 'configure',
    title: 'Configure Policy',
    description: 'Set coverage amount, duration, and trigger conditions',
    component: PolicyConfigForm,
    validation: (data) => data.coverageAmount > 0 && data.duration > 0,
  },
  {
    id: 'attestation',
    title: 'Provide Attestation',
    description: 'Upload or connect verification documents',
    component: AttestationUpload,
    validation: (data) => data.attestationRequired ? !!data.attestation : true,
  },
  {
    id: 'proof',
    title: 'Generate Proof',
    description: 'Create zero-knowledge proof of eligibility',
    component: ProofGenerator,
    validation: (data) => !!data.proof,
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Review policy details and confirm purchase',
    component: ReviewConfirm,
    validation: () => true,
  },
];

export function PolicyWizard({ 
  initialCoverageType, 
  onComplete, 
  onCancel 
}: PolicyWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    coverageType: initialCoverageType,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { purchasePolicy } = usePolicyPurchase();
  
  const updateData = useCallback((updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  }, []);
  
  const goNext = useCallback(() => {
    const step = WIZARD_STEPS[currentStep];
    if (step.validation(wizardData)) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  }, [currentStep, wizardData]);
  
  const goBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const policy = await purchasePolicy(wizardData);
      onComplete(policy);
    } catch (error) {
      console.error('Policy purchase failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const CurrentStepComponent = WIZARD_STEPS[currentStep].component;
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <WizardProgress 
        steps={WIZARD_STEPS} 
        currentStep={currentStep} 
      />
      
      {/* Step content */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{WIZARD_STEPS[currentStep].title}</CardTitle>
          <CardDescription>
            {WIZARD_STEPS[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            data={wizardData}
            updateData={updateData}
            onNext={goNext}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? onCancel : goBack}
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          {currentStep === WIZARD_STEPS.length - 1 ? (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Purchase Policy'}
            </Button>
          ) : (
            <Button 
              onClick={goNext}
              disabled={!WIZARD_STEPS[currentStep].validation(wizardData)}
            >
              Continue
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
```

### ProofGenerator Component

```typescript
// components/proof/ProofGenerator.tsx

interface ProofGeneratorProps {
  proofType: ProofType;
  privateInputs: Record<string, unknown>;
  publicInputs: Record<string, unknown>;
  onProofGenerated: (proof: Proof) => void;
  onError: (error: Error) => void;
}

interface ProofState {
  status: 'idle' | 'loading' | 'proving' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  error?: Error;
}

export function ProofGenerator({
  proofType,
  privateInputs,
  publicInputs,
  onProofGenerated,
  onError,
}: ProofGeneratorProps) {
  const [state, setState] = useState<ProofState>({
    status: 'idle',
    progress: 0,
    currentStep: '',
  });
  
  const workerRef = useRef<Worker | null>(null);
  
  useEffect(() => {
    // Initialize Web Worker for proof generation
    workerRef.current = new Worker(
      new URL('@/lib/proof/worker.ts', import.meta.url)
    );
    
    workerRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'progress':
          setState(prev => ({
            ...prev,
            progress: payload.progress,
            currentStep: payload.step,
          }));
          break;
          
        case 'complete':
          setState(prev => ({ ...prev, status: 'complete', progress: 100 }));
          onProofGenerated(payload.proof);
          break;
          
        case 'error':
          setState(prev => ({ 
            ...prev, 
            status: 'error', 
            error: new Error(payload.message) 
          }));
          onError(new Error(payload.message));
          break;
      }
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, [onProofGenerated, onError]);
  
  const startProofGeneration = useCallback(async () => {
    setState({ status: 'loading', progress: 0, currentStep: 'Initializing...' });
    
    // Load WASM module
    setState(prev => ({ ...prev, currentStep: 'Loading proving circuit...' }));
    
    workerRef.current?.postMessage({
      type: 'generate',
      payload: {
        proofType,
        privateInputs,
        publicInputs,
      },
    });
    
    setState(prev => ({ ...prev, status: 'proving' }));
  }, [proofType, privateInputs, publicInputs]);
  
  return (
    <div className="space-y-6">
      {/* Privacy notice */}
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Your data stays private</AlertTitle>
        <AlertDescription>
          All proof generation happens locally in your browser. 
          Your personal data never leaves this device.
        </AlertDescription>
      </Alert>
      
      {/* Progress display */}
      {state.status !== 'idle' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>{state.currentStep}</span>
            <span>{Math.round(state.progress)}%</span>
          </div>
          <Progress value={state.progress} className="h-2" />
          
          {/* Step checklist */}
          <div className="space-y-2 text-sm">
            <StepIndicator 
              done={state.progress >= 20} 
              active={state.progress < 20}
              label="Loading proving circuit"
            />
            <StepIndicator 
              done={state.progress >= 40} 
              active={state.progress >= 20 && state.progress < 40}
              label="Computing witness"
            />
            <StepIndicator 
              done={state.progress >= 90} 
              active={state.progress >= 40 && state.progress < 90}
              label="Generating proof"
            />
            <StepIndicator 
              done={state.progress >= 100} 
              active={state.progress >= 90 && state.progress < 100}
              label="Finalizing"
            />
          </div>
        </div>
      )}
      
      {/* Error display */}
      {state.status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Proof generation failed</AlertTitle>
          <AlertDescription>
            {state.error?.message || 'An unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Action button */}
      {state.status === 'idle' && (
        <Button onClick={startProofGeneration} className="w-full">
          Generate Zero-Knowledge Proof
        </Button>
      )}
      
      {state.status === 'complete' && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span>Proof generated successfully</span>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ 
  done, 
  active, 
  label 
}: { 
  done: boolean; 
  active: boolean; 
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : active ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={cn(
        done && 'text-green-600',
        active && 'text-primary font-medium',
        !done && !active && 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  );
}
```

---

# 12. EXTERNAL INTEGRATIONS

## 12.1 Oracle Integrations

### Flight Data (AviationStack)

```typescript
// lib/oracles/flight.ts

interface FlightStatus {
  flightNumber: string;
  flightDate: string;
  airline: string;
  departure: {
    airport: string;
    scheduled: string;
    actual?: string;
    delay?: number;
  };
  arrival: {
    airport: string;
    scheduled: string;
    actual?: string;
    delay?: number;
  };
  status: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'diverted';
}

export async function getFlightStatus(
  flightNumber: string,
  date: string
): Promise<FlightStatus> {
  const response = await fetch(
    `https://api.aviationstack.com/v1/flights?` +
    `access_key=${process.env.AVIATIONSTACK_API_KEY}&` +
    `flight_iata=${flightNumber}&` +
    `flight_date=${date}`
  );
  
  const data = await response.json();
  
  if (!data.data?.[0]) {
    throw new Error('Flight not found');
  }
  
  const flight = data.data[0];
  
  return {
    flightNumber: flight.flight.iata,
    flightDate: date,
    airline: flight.airline.name,
    departure: {
      airport: flight.departure.airport,
      scheduled: flight.departure.scheduled,
      actual: flight.departure.actual,
      delay: flight.departure.delay,
    },
    arrival: {
      airport: flight.arrival.airport,
      scheduled: flight.arrival.scheduled,
      actual: flight.arrival.actual,
      delay: flight.arrival.delay,
    },
    status: mapFlightStatus(flight.flight_status),
  };
}

export function calculateDelayMinutes(flight: FlightStatus): number {
  if (!flight.departure.actual || !flight.departure.scheduled) {
    return 0;
  }
  
  const scheduled = new Date(flight.departure.scheduled).getTime();
  const actual = new Date(flight.departure.actual).getTime();
  
  return Math.max(0, Math.floor((actual - scheduled) / (1000 * 60)));
}
```

### Weather Data (OpenWeatherMap)

```typescript
// lib/oracles/weather.ts

interface WeatherReading {
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  timestamp: string;
  measurements: {
    temperature: number; // Celsius
    rainfall: number;    // mm in last hour
    windSpeed: number;   // m/s
    humidity: number;    // percentage
  };
}

export async function getWeatherData(
  lat: number,
  lng: number
): Promise<WeatherReading> {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?` +
    `lat=${lat}&lon=${lng}&` +
    `appid=${process.env.OPENWEATHER_API_KEY}&` +
    `units=metric`
  );
  
  const data = await response.json();
  
  return {
    location: {
      lat,
      lng,
      name: data.name,
    },
    timestamp: new Date().toISOString(),
    measurements: {
      temperature: data.main.temp,
      rainfall: data.rain?.['1h'] || 0,
      windSpeed: data.wind.speed,
      humidity: data.main.humidity,
    },
  };
}

export async function getHistoricalWeather(
  lat: number,
  lng: number,
  startDate: Date,
  endDate: Date
): Promise<WeatherReading[]> {
  // OpenWeatherMap historical data requires paid plan
  // Implementation depends on subscription level
}
```

## 12.2 Wallet Integration

### Leo Wallet Adapter

```typescript
// lib/aleo/wallet.ts

import { 
  LeoWalletAdapter,
  PuzzleWalletAdapter,
} from '@demox-labs/aleo-wallet-adapter';

export interface WalletState {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  publicKey: string | null;
  adapter: WalletAdapter | null;
}

export interface WalletActions {
  connect: (adapterName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (transaction: Transaction) => Promise<SignedTransaction>;
  requestRecords: (programId: string) => Promise<Record[]>;
}

const SUPPORTED_WALLETS = [
  new LeoWalletAdapter({ appName: 'ZK-Underwrite' }),
  new PuzzleWalletAdapter({ appName: 'ZK-Underwrite' }),
];

export function useWallet(): WalletState & WalletActions {
  const [state, setState] = useState<WalletState>({
    connected: false,
    connecting: false,
    address: null,
    publicKey: null,
    adapter: null,
  });
  
  const connect = useCallback(async (adapterName: string) => {
    const adapter = SUPPORTED_WALLETS.find(w => w.name === adapterName);
    if (!adapter) throw new Error('Wallet not supported');
    
    setState(prev => ({ ...prev, connecting: true }));
    
    try {
      await adapter.connect();
      
      setState({
        connected: true,
        connecting: false,
        address: adapter.publicKey?.toString() || null,
        publicKey: adapter.publicKey?.toString() || null,
        adapter,
      });
    } catch (error) {
      setState(prev => ({ ...prev, connecting: false }));
      throw error;
    }
  }, []);
  
  const disconnect = useCallback(async () => {
    if (state.adapter) {
      await state.adapter.disconnect();
    }
    setState({
      connected: false,
      connecting: false,
      address: null,
      publicKey: null,
      adapter: null,
    });
  }, [state.adapter]);
  
  const signMessage = useCallback(async (message: string) => {
    if (!state.adapter) throw new Error('Wallet not connected');
    return state.adapter.signMessage(new TextEncoder().encode(message));
  }, [state.adapter]);
  
  const signTransaction = useCallback(async (transaction: Transaction) => {
    if (!state.adapter) throw new Error('Wallet not connected');
    return state.adapter.signTransaction(transaction);
  }, [state.adapter]);
  
  const requestRecords = useCallback(async (programId: string) => {
    if (!state.adapter) throw new Error('Wallet not connected');
    return state.adapter.requestRecords(programId);
  }, [state.adapter]);
  
  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    signTransaction,
    requestRecords,
  };
}
```

## 12.3 Attestation Providers

### Provider Interface

```typescript
// lib/attestations/types.ts

export interface AttestationProvider {
  id: string;
  name: string;
  type: AttestationType;
  
  // Check if provider supports requested attestation
  supports(attestationType: string): boolean;
  
  // Initialize connection (OAuth, API key, etc.)
  connect(credentials?: unknown): Promise<void>;
  
  // Request attestation
  requestAttestation(params: AttestationRequest): Promise<Attestation>;
  
  // Verify existing attestation
  verifyAttestation(attestation: Attestation): Promise<boolean>;
}

export interface AttestationRequest {
  type: string;
  subjectId: string;
  fields: string[];
  validityPeriod?: number; // seconds
}

export interface Attestation {
  id: string;
  providerId: string;
  type: string;
  subjectHash: string;
  dataHash: string;
  signature: string;
  issuedAt: Date;
  expiresAt?: Date;
  merkleRoot?: string;
  proof?: string[];
}
```

---

# 13. SECURITY REQUIREMENTS

## 13.1 Smart Contract Security

### Audit Requirements
- [ ] External audit by reputable firm (e.g., Trail of Bits, OpenZeppelin)
- [ ] Formal verification of critical functions
- [ ] Fuzz testing of all public functions
- [ ] Invariant testing

### Security Patterns
- [ ] Reentrancy guards where applicable
- [ ] Integer overflow protection (Leo handles natively)
- [ ] Access control for admin functions
- [ ] Rate limiting for sensitive operations
- [ ] Pausability for emergency stops

### Key Risks to Mitigate
1. **Policy double-spend:** Nullifier system prevents reuse
2. **Claim duplication:** One claim per policy per event
3. **Pool insolvency:** Reserve ratio and utilization limits
4. **Oracle manipulation:** Multi-source verification

## 13.2 Application Security

### Authentication & Authorization
- [ ] Wallet-based authentication (signature verification)
- [ ] JWT tokens with appropriate expiry
- [ ] Role-based access control
- [ ] Session management with Redis

### Data Protection
- [ ] No sensitive data stored in database
- [ ] Client-side encryption for local storage
- [ ] HTTPS everywhere
- [ ] CORS properly configured
- [ ] CSP headers

### Input Validation
- [ ] Zod schemas for all API inputs
- [ ] Rate limiting on all endpoints
- [ ] Request size limits
- [ ] SQL injection prevention (Prisma parameterized queries)

### Infrastructure Security
- [ ] Environment variables for secrets
- [ ] Secrets management (e.g., Vault, AWS Secrets Manager)
- [ ] Regular dependency updates
- [ ] Container security scanning

## 13.3 Privacy Requirements

### Data Minimization
- [ ] Only collect necessary off-chain data
- [ ] No PII in logs
- [ ] Automatic data expiration

### Proof Privacy
- [ ] All proofs generated client-side
- [ ] No raw data transmitted to servers
- [ ] Proof verification doesn't leak information

### Compliance
- [ ] GDPR considerations for EU users
- [ ] CCPA considerations for CA users
- [ ] Data export capability
- [ ] Right to deletion

---

# 14. TESTING STRATEGY

## 14.1 Unit Testing

### Smart Contracts (Leo)

```bash
# Test structure
contracts/
├── policy_registry/
│   └── tests/
│       ├── create_policy_test.leo
│       ├── renew_policy_test.leo
│       └── cancel_policy_test.leo
├── claims_engine/
│   └── tests/
│       ├── parametric_claim_test.leo
│       └── traditional_claim_test.leo
└── risk_pool/
    └── tests/
        ├── deposit_test.leo
        └── withdraw_test.leo
```

### Frontend (Vitest)

```typescript
// Example test: hooks/use-policy.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePolicy } from './use-policy';

describe('usePolicy', () => {
  it('should fetch policy by ID', async () => {
    const mockPolicy = {
      id: 'pol_123',
      coverageType: 'FLIGHT_DELAY',
      coverageAmount: '50000',
      status: 'ACTIVE',
    };
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockPolicy }),
    } as Response);
    
    const { result } = renderHook(() => usePolicy('pol_123'));
    
    await waitFor(() => {
      expect(result.current.data).toEqual(mockPolicy);
    });
  });
  
  it('should handle errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);
    
    const { result } = renderHook(() => usePolicy('invalid_id'));
    
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

## 14.2 Integration Testing

### API Integration Tests

```typescript
// tests/integration/policies.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from '../utils/test-client';

describe('Policies API', () => {
  let client: TestClient;
  let testUser: TestUser;
  
  beforeAll(async () => {
    client = await createTestClient();
    testUser = await client.createTestUser();
  });
  
  afterAll(async () => {
    await client.cleanup();
  });
  
  describe('POST /api/v1/policies', () => {
    it('should create a flight delay policy', async () => {
      const response = await client.post('/api/v1/policies', {
        coverageType: 'flight',
        coverageAmount: '50000',
        durationBlocks: 100000,
        triggerParams: {
          flightNumber: 'AA123',
          flightDate: '2025-02-15',
          delayThresholdMinutes: 180,
        },
        poolId: 'pool_flight_main',
      }, { auth: testUser.token });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.policyId).toBeDefined();
    });
    
    it('should reject invalid coverage type', async () => {
      const response = await client.post('/api/v1/policies', {
        coverageType: 'invalid',
        // ...
      }, { auth: testUser.token });
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_COVERAGE_TYPE');
    });
  });
});
```

## 14.3 End-to-End Testing

### Playwright E2E Tests

```typescript
// tests/e2e/policy-purchase.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Policy Purchase Flow', () => {
  test('should complete flight delay policy purchase', async ({ page }) => {
    // Connect wallet (mock)
    await page.goto('/');
    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="wallet-leo"]');
    
    // Navigate to new policy
    await page.click('[data-testid="nav-policies"]');
    await page.click('[data-testid="new-policy"]');
    
    // Step 1: Select coverage
    await page.click('[data-testid="coverage-flight"]');
    await page.click('[data-testid="continue"]');
    
    // Step 2: Configure
    await page.fill('[data-testid="coverage-amount"]', '500');
    await page.selectOption('[data-testid="duration"]', '1-month');
    await page.fill('[data-testid="flight-number"]', 'AA123');
    await page.fill('[data-testid="flight-date"]', '2025-02-15');
    await page.click('[data-testid="continue"]');
    
    // Step 3: Attestation (skip for parametric)
    await page.click('[data-testid="continue"]');
    
    // Step 4: Generate proof
    await page.click('[data-testid="generate-proof"]');
    await expect(page.locator('[data-testid="proof-complete"]'))
      .toBeVisible({ timeout: 60000 });
    await page.click('[data-testid="continue"]');
    
    // Step 5: Review and confirm
    await expect(page.locator('[data-testid="premium-amount"]'))
      .toContainText('$12.50');
    await page.click('[data-testid="purchase-policy"]');
    
    // Wait for wallet confirmation (mock)
    await page.click('[data-testid="mock-wallet-confirm"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]'))
      .toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="policy-id"]'))
      .toBeVisible();
  });
});
```

## 14.4 Test Coverage Requirements

| Component | Minimum Coverage |
|-----------|------------------|
| Smart Contracts | 100% |
| API Routes | 90% |
| Hooks | 85% |
| Components | 80% |
| Utils | 90% |

---

# 15. DEPLOYMENT & DEVOPS

## 15.1 Environment Configuration

```bash
# .env.example

# Application
NEXT_PUBLIC_APP_URL=https://zkunderwrite.com
NEXT_PUBLIC_APP_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/zkunderwrite
DIRECT_URL=postgresql://user:pass@host:5432/zkunderwrite

# Redis
REDIS_URL=redis://user:pass@host:6379

# Aleo
ALEO_NETWORK=testnet3
ALEO_PRIVATE_KEY=
ALEO_RPC_URL=https://api.explorer.aleo.org/v1

# Oracles
AVIATIONSTACK_API_KEY=
OPENWEATHER_API_KEY=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://zkunderwrite.com

# External Services
VERCEL_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## 15.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit --coverage
      - uses: codecov/codecov-action@v3

  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Leo
        run: |
          curl -sSL https://raw.githubusercontent.com/AleoHQ/leo/main/install.sh | sh
      - name: Run Leo tests
        run: |
          cd contracts
          for dir in */; do
            cd "$dir"
            leo test
            cd ..
          done

  test-e2e:
    runs-on: ubuntu-latest
    needs: [lint, test-unit]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      - name: Run E2E tests
        run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: [lint, test-unit, test-contracts]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: apps/web/.next/
```

## 15.3 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRODUCTION ARCHITECTURE                         │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         VERCEL (Frontend + API)                  │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │   Edge       │  │   Serverless │  │   Static     │           │   │
│  │  │   Functions  │  │   Functions  │  │   Assets     │           │   │
│  │  │   (Auth)     │  │   (API)      │  │   (CDN)      │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                        │
│              ┌─────────────────┼─────────────────┐                     │
│              │                 │                 │                     │
│              ▼                 ▼                 ▼                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐       │
│  │    Supabase      │ │     Upstash      │ │      Aleo        │       │
│  │   (PostgreSQL)   │ │     (Redis)      │ │    (Testnet)     │       │
│  │                   │ │                   │ │                  │       │
│  │  • User data     │ │  • Sessions      │ │  • Contracts     │       │
│  │  • Policies      │ │  • Cache         │ │  • State         │       │
│  │  • Analytics     │ │  • Rate limits   │ │  • Proofs        │       │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       EXTERNAL SERVICES                          │   │
│  │                                                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │ AviationStack│  │ OpenWeather  │  │   Sentry     │           │   │
│  │  │ (Flights)    │  │ (Weather)    │  │  (Monitoring)│           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 16. DEVELOPMENT PHASES

## Phase 1: Foundation (Weeks 1-4)

### Goals
- Project setup and infrastructure
- Core smart contracts (basic versions)
- Basic frontend structure
- Wallet integration

### Deliverables
- [ ] Monorepo setup with Turborepo
- [ ] Next.js app with basic routing
- [ ] Tailwind + shadcn/ui configuration
- [ ] Database schema and Prisma setup
- [ ] `policy_registry.aleo` basic implementation
- [ ] `risk_pool.aleo` basic implementation
- [ ] Leo Wallet integration
- [ ] Basic authentication flow

### Success Criteria
- Can connect wallet and view balance
- Can deploy contracts to Aleo testnet
- Database migrations run successfully
- Basic pages render correctly

## Phase 2: Core Features (Weeks 5-8)

### Goals
- Complete policy purchase flow
- Parametric claims implementation
- Oracle integration
- Proof generation

### Deliverables
- [ ] PolicyWizard component complete
- [ ] ProofGenerator with WASM
- [ ] Flight data oracle integration
- [ ] Weather data oracle integration
- [ ] `claims_engine.aleo` parametric functions
- [ ] Pool deposit/withdrawal UI
- [ ] Policy dashboard

### Success Criteria
- Can purchase flight delay policy end-to-end
- Proof generation completes in <60 seconds
- Oracle data fetches and verifies correctly
- Pool TVL updates correctly

## Phase 3: Polish & Testing (Weeks 9-12)

### Goals
- Traditional claims flow
- Comprehensive testing
- Performance optimization
- Security hardening

### Deliverables
- [ ] Traditional claims submission UI
- [ ] Claims review/adjuster interface
- [ ] Unit test coverage >85%
- [ ] E2E test suite complete
- [ ] Smart contract tests complete
- [ ] Performance optimization pass
- [ ] Security audit preparation

### Success Criteria
- All tests passing
- Lighthouse score >90
- No critical security issues
- Documentation complete

## Phase 4: Launch Preparation (Weeks 13-16)

### Goals
- Testnet launch
- Community testing
- Bug fixes
- Mainnet preparation

### Deliverables
- [ ] Testnet deployment
- [ ] Bug bounty program
- [ ] User documentation
- [ ] Admin dashboard
- [ ] Monitoring and alerting
- [ ] Smart contract audit complete
- [ ] Mainnet deployment scripts

### Success Criteria
- 100+ testnet users
- No P0/P1 bugs
- Audit findings addressed
- Community feedback incorporated

---

# 17. SUCCESS CRITERIA

## 17.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load (LCP) | <2.5s | Lighthouse |
| Time to Interactive | <3.5s | Lighthouse |
| Proof Generation Time | <60s | Client timing |
| API Response Time (p95) | <200ms | Vercel Analytics |
| Smart Contract Gas | Optimize | Aleo profiler |
| Uptime | 99.9% | Status page |
| Test Coverage | >85% | Codecov |

## 17.2 Product Metrics

| Metric | Target (3 months) | Target (6 months) |
|--------|-------------------|-------------------|
| Total Policies | 500 | 2,000 |
| Total Value Locked | $100K | $1M |
| Active Users | 200 | 1,000 |
| Claims Processed | 50 | 300 |
| Claim Success Rate | >95% | >98% |
| Average Premium | $25 | $50 |

## 17.3 Quality Gates

### Before Testnet Launch
- [ ] All smart contracts audited
- [ ] Test coverage >85%
- [ ] No P0/P1 bugs
- [ ] Security checklist complete
- [ ] Documentation complete

### Before Mainnet Launch
- [ ] 30 days on testnet without critical issues
- [ ] External security audit passed
- [ ] Bug bounty program run
- [ ] Regulatory review (if applicable)
- [ ] Insurance/risk assessment

---

# 18. CONSTRAINTS & CONSIDERATIONS

## 18.1 Technical Constraints

### Aleo Limitations
- **Block time:** ~15 seconds (affects UX for confirmations)
- **Proof size:** Large proofs may impact mobile performance
- **Wallet ecosystem:** Limited wallet options currently
- **Tooling maturity:** Leo/snarkVM still evolving

### Frontend Constraints
- **WASM performance:** Proof generation CPU-intensive
- **Mobile:** May not be feasible for complex proofs
- **Bundle size:** WASM modules add significant size

### Oracle Constraints
- **Data freshness:** Flight data has inherent delays
- **API costs:** High-volume oracle data can be expensive
- **Reliability:** Single oracle = single point of failure

## 18.2 Business Constraints

### Regulatory
- Insurance is heavily regulated industry
- May need licenses in certain jurisdictions
- KYC/AML requirements for larger policies

### Market
- Crypto-native audience initially
- Trust in new protocol takes time
- Competition from traditional insurtech

### Financial
- Bootstrap liquidity challenge
- Claims reserves must be maintained
- Actuarial pricing complexity

## 18.3 Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Smart contract bug | Audit, bug bounty, gradual TVL increase |
| Oracle manipulation | Multi-source verification, dispute mechanism |
| Pool insolvency | Conservative utilization limits, reinsurance |
| Regulatory action | Legal review, jurisdiction selection |
| Low adoption | Focus on niche (parametric), iterate |

---

# 19. GLOSSARY

| Term | Definition |
|------|------------|
| **Aleo** | Privacy-focused L1 blockchain using zero-knowledge proofs |
| **Attestation** | Signed statement from trusted third party verifying data |
| **Coverage** | Maximum amount insurer will pay for a claim |
| **Deductible** | Amount policyholder pays before insurance kicks in |
| **Leo** | Programming language for Aleo smart contracts |
| **LP Token** | Liquidity provider token representing pool share |
| **Nullifier** | Unique value preventing double-spending of records |
| **Oracle** | Service providing external data to blockchain |
| **Parametric Insurance** | Insurance that pays based on trigger events, not actual loss |
| **Premium** | Amount paid for insurance coverage |
| **Proof** | Cryptographic evidence of statement truth without revealing data |
| **Record** | Private state in Aleo owned by specific address |
| **Risk Pool** | Aggregated capital from multiple LPs for underwriting |
| **Selective Disclosure** | Revealing only specific data fields to specific parties |
| **snarkVM** | Zero-knowledge proof system used by Aleo |
| **TVL** | Total Value Locked - capital in DeFi protocol |
| **Underwriting** | Process of evaluating risk for insurance |
| **WASM** | WebAssembly - binary format for browser execution |
| **Zero-Knowledge Proof** | Proof of knowledge without revealing the knowledge itself |

---

# 20. APPENDICES

## Appendix A: API Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INVALID_COVERAGE_TYPE` | 400 | Coverage type not supported |
| `INSUFFICIENT_BALANCE` | 400 | Wallet balance too low |
| `POOL_UTILIZATION_EXCEEDED` | 400 | Pool at max capacity |
| `POLICY_NOT_ACTIVE` | 400 | Policy not in active status |
| `CLAIM_ALREADY_EXISTS` | 400 | Duplicate claim attempt |
| `PROOF_INVALID` | 400 | ZK proof verification failed |
| `ORACLE_ERROR` | 502 | Oracle data unavailable |
| `BLOCKCHAIN_ERROR` | 502 | Aleo transaction failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Appendix B: Event Types for Oracle Integration

### Flight Events
```typescript
interface FlightEvent {
  type: 'DELAY' | 'CANCELLATION' | 'DIVERSION';
  flightNumber: string;
  flightDate: string;
  delayMinutes?: number;
  reason?: string;
  timestamp: string;
  source: string;
  signature: string;
}
```

### Weather Events
```typescript
interface WeatherEvent {
  type: 'RAINFALL' | 'TEMPERATURE' | 'WIND' | 'HURRICANE';
  locationHash: string;
  value: number;
  unit: string;
  threshold: number;
  exceeded: boolean;
  timestamp: string;
  source: string;
  signature: string;
}
```

## Appendix C: Proof Circuit Specifications

### EligibilityProof Circuit

**Inputs:**
- Private: User data (health records, driving history, etc.)
- Private: Attestation signature from provider
- Public: Eligibility criteria hash
- Public: Current block height

**Constraints:**
1. Attestation signature valid
2. Data meets eligibility criteria
3. Attestation not expired

**Outputs:**
- Boolean: eligible
- u8: risk tier (0-4)
- field: commitment to eligibility proof

**Estimated Constraints:** ~50,000
**Proving Time:** ~30 seconds (client-side)

### ClaimEligibilityProof Circuit

**Inputs:**
- Private: Policy record
- Private: Event evidence
- Public: Oracle data commitment
- Public: Policy commitment

**Constraints:**
1. Policy ownership verified
2. Policy active at event time
3. Event matches trigger parameters
4. No prior claim for event

**Outputs:**
- Boolean: claim valid
- u64: payout amount

**Estimated Constraints:** ~30,000
**Proving Time:** ~20 seconds (client-side)

---

## Document Metadata

| Property | Value |
|----------|-------|
| Version | 1.0 |
| Last Updated | January 2025 |
| Author | ZK-Underwrite Team |
| Status | Draft |

---

**END OF DOCUMENT**
