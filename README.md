# ZKlaim

**Privacy-Preserving Insurance on Aleo**

> **Note:** The smart contracts are fully functional and deployed to Aleo Testnet. The Akindo submission could not be updated after the initial demo submission, so it still references "demo mode" — but the on-chain integration is real and working. See [deployed contract on explorer](https://testnet.explorer.provable.com/transaction/at1u8j6lxc7wdjudwjuhl4u0wqv0gxua5xgl8p5w4vnx6wlwth8mvqq2j76jw).

A decentralized insurance protocol that enables users to obtain coverage without revealing sensitive personal data. Using zero-knowledge proofs on the Aleo blockchain, users can prove eligibility for coverage (e.g., "I'm a non-smoker," "I have no at-fault accidents") without disclosing underlying records.

Checkout the Live Deployed URL: https://z-klaim.vercel.app/

## Overview

ZKLAIM reimagines insurance for the privacy-conscious era:

- **For Users:** Get insurance without surrendering privacy. No data stored by insurers that can be breached, sold, or used against you.
- **For Insurers/Pools:** Reduced data liability, cryptographic proof of eligibility, automated claims via oracles.
- **For Regulators:** Selective disclosure capabilities for audits without mass surveillance.

## Features

- **Privacy-First Architecture** — User data never leaves their device. Only ZK proofs are shared.
- **Client-Side Proof Generation** — All ZK proofs generated in the browser via WASM.
- **Encrypted Policy State** — Policy details encrypted with user's key on-chain.
- **Parametric Claims** — Oracle-triggered payouts bypass human intervention.
- **Decentralized Risk Pools** — Community-governed liquidity pools.

## Tech Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework | 16.x (Pages Router) |
| React | UI library | 19.x |
| Tailwind CSS | Styling | 4.x |
| shadcn/ui | Component library | Latest |
| lucide-react | Icons | 0.563.x |

### Blockchain

| Technology | Purpose | Version |
|------------|---------|---------|
| Aleo | L1 blockchain | Testnet |
| Leo | Smart contract language | 3.4.0 |
| @provablehq/sdk | Aleo TypeScript SDK | 0.9.15 |
| Leo Wallet | Wallet integration | Latest |

### Planned

| Technology | Purpose |
|------------|---------|
| Prisma | Database ORM |
| PostgreSQL | Database |
| Redis | Caching/sessions |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Leo CLI 3.4.0+ (for contract development)
- Leo Wallet browser extension (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/zklaim.git
cd zklaim

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
zklaim/
├── contracts/              # Leo smart contracts
│   └── zklaim_foundation/  # Foundation contract (deployed)
├── pages/                  # Next.js pages
│   ├── _app.tsx            # App wrapper
│   ├── _document.tsx       # HTML document
│   ├── index.tsx           # Landing page
│   ├── dashboard/          # Dashboard page
│   └── api/                # API routes
├── components/             # React components
│   ├── foundation/         # Protocol components
│   ├── layout/             # Layout components
│   ├── providers/          # Context providers
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities
│   ├── aleo/               # Aleo SDK integration
│   └── utils.ts            # Helper functions
├── types/                  # TypeScript types
├── styles/                 # Stylesheets
├── docs/                   # Documentation
└── public/                 # Static assets
```

### Smart Contracts

| Program | Purpose | Status |
|---------|---------|--------|
| `zklaim_foundation.aleo` | User registration, protocol foundation | ✅ Deployed |
| `attestation_registry.aleo` | Manage attestors | Planned |
| `policy_registry.aleo` | Manage policy lifecycle | Planned |
| `risk_pool.aleo` | Manage liquidity pools | Planned |
| `claims_engine.aleo` | Process claims | Planned |
| `oracle_bridge.aleo` | Relay external data | Planned |
| `governance.aleo` | Protocol governance | Planned |

## Documentation

- `CLAUDE.md` — Project guidelines and development instructions
- `docs/wave 1/SUMMARY.md` — Wave 1 completion summary
- `docs/ARCHITECTURE.md` — System architecture (planned)
- `docs/SMART_CONTRACTS.md` — Leo contract documentation (planned)

## Development Status

### Wave 1: Foundation ✅ Complete

- Leo contract `zklaim_foundation.aleo` deployed to testnet
- Leo Wallet integration with transaction signing
- On-chain user registration with BHP256 hash verification
- Client-side registration verification via Aleo SDK
- Dashboard with protocol status and registration UI
- Full transaction flow: sign → submit → confirm → verify

**Deployed Contract:** [`zklaim_foundation.aleo`](https://testnet.explorer.provable.com/transaction/at1u8j6lxc7wdjudwjuhl4u0wqv0gxua5xgl8p5w4vnx6wlwth8mvqq2j76jw)

### Wave 2: Attestations (Next)

- Deploy `attestation_registry.aleo` contract
- Build attestation viewer component
- Implement attestation creation flow
- Add Zustand state management
- Integrate React Query for data fetching

## Roadmap

1. **Wave 1:** Foundation & Protocol Setup ✅
2. **Wave 2:** Attestation System (in progress)
3. **Wave 3:** Parametric Insurance (flight delay, weather)
4. **Wave 4:** Auto insurance with telematics
5. **Wave 5:** Health insurance (supplemental)
6. **Wave 6:** Full-stack insurance products

## License

MIT
