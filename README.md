# ZKLAIM

**Privacy-Preserving Insurance on Aleo**

A decentralized insurance protocol that enables users to obtain coverage without revealing sensitive personal data. Using zero-knowledge proofs on the Aleo blockchain, users can prove eligibility for coverage (e.g., "I'm a non-smoker," "I have no at-fault accidents") without disclosing underlying records.

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

### Current Implementation

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework | 16.x (Pages Router) |
| React | UI library | 19.x |
| Tailwind CSS | Styling | 4.x |
| shadcn/ui | Component library | Latest |
| lucide-react | Icons | 0.563.x |

### Planned

| Technology | Purpose |
|------------|---------|
| Aleo | L1 blockchain |
| Leo | Smart contract language |
| snarkVM | ZK proving system |
| Prisma | Database ORM |
| PostgreSQL | Database |
| Redis | Caching/sessions |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

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
├── pages/              # Next.js pages
│   ├── _app.js         # App wrapper
│   ├── _document.js    # HTML document
│   ├── index.js        # Landing page
│   └── api/            # API routes
├── components/         # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities
│   └── utils.js        # Helper functions
├── styles/             # Stylesheets
│   └── globals.css     # Global styles + design tokens
├── docs/               # Documentation
└── public/             # Static assets
```

### Planned Smart Contracts

Six Leo programs for the Aleo blockchain:

| Program | Purpose |
|---------|---------|
| `policy_registry.aleo` | Manage policy lifecycle |
| `risk_pool.aleo` | Manage liquidity pools |
| `claims_engine.aleo` | Process claims |
| `oracle_bridge.aleo` | Relay external data |
| `attestation_registry.aleo` | Manage attestors |
| `governance.aleo` | Protocol governance |

## Documentation

- `CLAUDE.md` — Project guidelines and development instructions
- `docs/ARCHITECTURE.md` — System architecture (planned)
- `docs/SMART_CONTRACTS.md` — Leo contract documentation (planned)
- `docs/API_REFERENCE.md` — API endpoint specs (planned)

## Development Status

**Phase 1 (Current):** Foundation & Parametric Insurance
- Next.js framework initialized
- Tailwind CSS 4 configured
- shadcn/ui configured
- Basic project structure

**Upcoming:**
- Parametric insurance products (flight delay, weather events)
- Leo smart contract development
- Wallet integration
- ZK proof generation via WASM

## Roadmap

1. **Phase 1:** Parametric insurance (flight delay, weather)
2. **Phase 2:** Auto insurance with telematics
3. **Phase 3:** Health insurance (supplemental)
4. **Phase 4:** Full-stack insurance products

## License

MIT
