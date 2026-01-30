# ZK-Underwrite (ZKLAIM) - Project Guidelines

## Project Overview

ZK-Underwrite is a decentralized insurance protocol that enables users to obtain insurance coverage without revealing sensitive personal data. Using zero-knowledge proofs on the Aleo blockchain, users can prove eligibility for coverage (e.g., "I'm a non-smoker," "I have no at-fault accidents") without disclosing underlying records.

### Core Value Proposition

- **For Users:** Get insurance without surrendering privacy. No data stored by insurers that can be breached, sold, or used against you.
- **For Insurers/Pools:** Reduced data liability, cryptographic proof of eligibility, automated claims via oracles.
- **For Regulators:** Selective disclosure capabilities for audits without mass surveillance.

### Target Market Phases

1. **Phase 1 (Current):** Parametric insurance (flight delay, weather events)
2. **Phase 2:** Auto insurance with telematics integration
3. **Phase 3:** Health insurance (supplemental first)
4. **Phase 4:** Full-stack insurance products

## Current State

The project is in **early development** stage:

- Next.js 16 framework initialized with Pages Router
- Tailwind CSS 4 configured with design tokens
- shadcn/ui configured (New York style) but no components scaffolded
- React 19 with compiler enabled
- Basic project structure in place
- Comprehensive project specification exists (`ZKLAIM_PROJECT_SPEC.md`)

### What's Implemented

- Basic Next.js app structure
- Global styling with Tailwind 4
- Dark mode support via CSS variables
- Path aliasing (`@/` imports)
- ESLint configuration

### What's NOT Yet Implemented

- Smart contracts (Leo programs)
- Database integration (PostgreSQL, Prisma)
- Authentication (NextAuth.js)
- Blockchain integration (Aleo SDK)
- ZK proof generation (WASM modules)
- Component library (shadcn/ui components)
- State management (Zustand, React Query)

## Tech Stack

### Frontend (Current)

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework | 16.x (Pages Router) |
| React | UI library | 19.x |
| Tailwind CSS | Styling | 4.x |
| shadcn/ui | Component library | Configured |
| lucide-react | Icons | 0.563.x |

### Planned Additions

| Technology | Purpose |
|------------|---------|
| TypeScript | Type safety |
| React Query | Server state |
| Zustand | Client state |
| React Hook Form | Forms |
| Zod | Validation |
| Framer Motion | Animations |

### Backend (Planned)

| Technology | Purpose |
|------------|---------|
| Next.js API Routes | REST API |
| Prisma | ORM |
| PostgreSQL | Database |
| Redis | Caching, sessions |
| NextAuth.js | Authentication |
| Bull | Job queue |

### Blockchain (Planned)

| Technology | Purpose |
|------------|---------|
| Aleo | L1 blockchain |
| Leo | Smart contract language |
| snarkVM | ZK proving system |
| Aleo SDK | JavaScript integration |

## Project Structure

```
zklaim/
├── pages/                  # Next.js pages
│   ├── _app.js            # App wrapper
│   ├── _document.js       # HTML document
│   ├── index.js           # Landing page
│   └── api/               # API routes
├── components/            # React components (to be created)
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities
│   └── utils.js          # Helper functions (cn)
├── styles/               # Stylesheets
│   └── globals.css       # Global styles + design tokens
├── docs/                  # Documentation
├── public/               # Static assets
├── ZKLAIM_PROJECT_SPEC.md # Full project specification
├── components.json        # shadcn/ui config
├── next.config.mjs       # Next.js config
├── postcss.config.mjs    # PostCSS config
└── package.json          # Dependencies
```

### Planned Structure (Full Implementation)

```
zklaim/
├── apps/web/             # Next.js application
├── contracts/            # Leo smart contracts
│   ├── policy_registry/
│   ├── risk_pool/
│   ├── claims_engine/
│   ├── oracle_bridge/
│   ├── attestation_registry/
│   └── governance/
├── packages/
│   ├── sdk/              # TypeScript SDK
│   ├── types/            # Shared types
│   └── utils/            # Shared utilities
├── scripts/              # Deployment scripts
└── tests/                # Test suites
```

## Smart Contracts Overview

Six Leo programs are planned for the Aleo blockchain:

| Program | Purpose |
|---------|---------|
| `policy_registry.aleo` | Manage policy lifecycle |
| `risk_pool.aleo` | Manage liquidity pools |
| `claims_engine.aleo` | Process claims |
| `oracle_bridge.aleo` | Relay external data |
| `attestation_registry.aleo` | Manage attestors |
| `governance.aleo` | Protocol governance |

## Development Guidelines

### Code Style

- Use **TypeScript** for all new code (transition from JS)
- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Prefer **functional components** with hooks
- Use **shadcn/ui** components from the library
- Style with **Tailwind CSS** utility classes only
- Use **lucide-react** for all icons

### Component Creation

```bash
# Add shadcn/ui components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `PolicyCard.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-wallet.ts`)
- Utils: `kebab-case.ts` (e.g., `format-currency.ts`)
- Types: `kebab-case.ts` (e.g., `policy.ts`)

### Key Principles

1. **Privacy First:** User data never leaves their device. Only ZK proofs are shared.
2. **Client-Side Proofs:** All proof generation happens in the browser via WASM.
3. **Encrypted State:** Policy details are encrypted with user's key.
4. **Parametric Automation:** Oracle-triggered claims bypass human intervention.

## Common Commands

```bash
# Development
npm run dev          # Start dev server

# Linting
npm run lint         # Run ESLint

# Add shadcn components
npx shadcn@latest add [component-name]
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `ZKLAIM_PROJECT_SPEC.md` | Complete project specification |
| `docs/ARCHITECTURE.md` | System architecture details |
| `docs/SMART_CONTRACTS.md` | Leo contract documentation |
| `docs/API_REFERENCE.md` | API endpoint specs |
| `docs/DEVELOPMENT.md` | Developer guide |
| `docs/USER_FLOWS.md` | User journey documentation |

## Important Notes

- **DO NOT** commit sensitive data or environment variables
- **ALWAYS** consult the project spec for detailed requirements
- **USE** MCP tools (context7, firecrawl) for up-to-date documentation
- **PREFER** simple, readable code over clever solutions
- **TEST** after every meaningful change

## External Resources

- [Aleo Documentation](https://developer.aleo.org/)
- [Leo Language Guide](https://developer.aleo.org/leo/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
