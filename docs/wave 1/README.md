# Wave 1: Foundation & Wallet Infrastructure

**Objective:** Development setup with real wallet connectivity and Aleo SDK integration from day one.

**Theme:** Vertical foundation - both frontend and blockchain tooling ready

---

## Overview

Wave 1 establishes the complete development foundation. Unlike traditional approaches that defer blockchain integration, we set up both frontend AND Aleo tooling immediately. This ensures the wallet adapter interface matches real Leo struct types.

---

## Deliverables

### Layer: Contracts

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Leo CLI setup | `contracts/README.md` | Install and configure Leo development environment |
| Project structure | `contracts/` directory | Scaffold contract folders |
| Shared types | `contracts/types/` | Common type definitions matching frontend |

```bash
# Install Leo CLI
curl -sSf https://install.leo.build/ | sh

# Verify installation
leo --version

# Create contracts directory structure
contracts/
├── README.md
├── types/
│   └── common.leo      # Shared types (PolicyStatus, CoverageType, etc.)
├── attestation_registry/
├── oracle_bridge/
├── risk_pool/
├── policy_registry/
├── claims_engine/
└── governance/
```

### Layer: Frontend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| TypeScript setup | `tsconfig.json`, `next-env.d.ts` | Full TypeScript configuration |
| Core types | `types/*.ts` | Type definitions matching Leo structs |
| shadcn/ui (core) | `components/ui/` | 16 core components |
| Layout components | `components/layout/` | RootLayout, Header, Footer, MobileNav |
| Common components | `components/common/` | Logo, Loading, ErrorBoundary |
| Mock wallet | `lib/wallet/mock-wallet.ts` | Development wallet for testing |
| Aleo SDK setup | `lib/aleo/` | SDK initialization and helpers |

#### TypeScript Types (matching Leo structs)

```typescript
// types/blockchain.ts - Must match Leo types exactly
export type CoverageType = 'flight_delay' | 'weather_event' | 'auto_collision' | 'health_basic';
export type PolicyStatus = 'active' | 'expired' | 'cancelled' | 'claimed';

// These map to Leo u8 values:
// COVERAGE_FLIGHT_DELAY: u8 = 1u8
// COVERAGE_WEATHER_EVENT: u8 = 2u8
export const COVERAGE_TYPE_MAP = {
  flight_delay: 1,
  weather_event: 2,
  auto_collision: 3,
  health_basic: 4,
} as const;
```

#### shadcn/ui Components

```bash
npx shadcn@latest add button card badge avatar input label textarea
npx shadcn@latest add tabs dialog alert alert-dialog skeleton
npx shadcn@latest add dropdown-menu separator scroll-area tooltip
```

**Components (16 total):**
- `button` - Primary action component
- `card` - Content containers
- `badge` - Status indicators
- `avatar` - User avatars
- `input` - Form inputs
- `label` - Form labels
- `textarea` - Multi-line inputs
- `tabs` - Tab navigation
- `dialog` - Modal dialogs
- `alert` - Inline alerts
- `alert-dialog` - Confirmation dialogs
- `skeleton` - Loading states
- `dropdown-menu` - Action menus
- `separator` - Visual dividers
- `scroll-area` - Scrollable containers
- `tooltip` - Hover tooltips

### Layer: Integration

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Wallet adapter interface | `lib/wallet/adapter.ts` | Unified interface for all wallets |
| Type definitions | `types/blockchain.ts` | Types matching Leo struct definitions |
| Aleo client | `lib/aleo/client.ts` | Network client initialization |

#### Wallet Adapter Interface

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
  getBalance(): Promise<bigint>;

  // Signing
  signMessage(message: string): Promise<string>;

  // Events
  on(event: WalletEvent, callback: () => void): void;
  off(event: WalletEvent, callback: () => void): void;
}

export type WalletEvent = 'connect' | 'disconnect' | 'accountChange';
```

#### Mock Wallet (for development)

```typescript
// lib/wallet/mock-wallet.ts
export class MockWallet implements WalletAdapter {
  name = 'Mock Wallet';
  icon = '/icons/mock-wallet.svg';

  private address: string | null = null;
  private connected = false;

  async connect() {
    await delay(1000); // Simulate network
    this.address = 'aleo1mock' + generateRandomHex(58);
    this.connected = true;
  }

  async getBalance() {
    return BigInt(1_000_000_000); // 1000 Aleo (mock)
  }

  // ... implement other methods
}
```

#### Aleo SDK Setup

```typescript
// lib/aleo/client.ts
import { AleoNetworkClient } from '@aleohq/sdk';

const TESTNET_URL = 'https://api.explorer.aleo.org/v1/testnet3';

export const aleoClient = new AleoNetworkClient(TESTNET_URL);

export async function getLatestBlock() {
  return await aleoClient.getLatestBlock();
}

export async function getAccountBalance(address: string) {
  return await aleoClient.getAccount(address);
}
```

---

## Project Structure

```
zklaim/
├── contracts/                 # Leo smart contracts
│   ├── README.md
│   └── types/
│       └── common.leo
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx
├── components/
│   ├── layout/
│   │   ├── root-layout.tsx
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── mobile-nav.tsx
│   ├── common/
│   │   ├── logo.tsx
│   │   ├── loading.tsx
│   │   └── error-boundary.tsx
│   └── ui/                    # shadcn/ui (auto-generated)
├── lib/
│   ├── aleo/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── wallet/
│   │   ├── adapter.ts
│   │   ├── mock-wallet.ts
│   │   └── index.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── config.ts
├── types/
│   ├── index.ts
│   ├── blockchain.ts
│   ├── policy.ts
│   ├── claim.ts
│   ├── pool.ts
│   ├── user.ts
│   └── oracle.ts
└── styles/
    └── globals.css
```

---

## Testable Outcomes

Wave 1 is testable when you can:

1. **Connect mock wallet** - Click "Connect Wallet" button, see connection flow
2. **Display address/balance** - After connection, see mock Aleo address and balance
3. **Ping testnet** - Verify Aleo SDK can fetch latest block from testnet
4. **Leo CLI works** - Run `leo --version` successfully

### Manual Test Script

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:3000
# 3. Click "Connect Wallet"
# 4. Verify mock wallet connects
# 5. Verify address displays (aleo1mock...)
# 6. Verify balance displays (1000 ALEO)

# 7. Test Aleo SDK (in browser console)
# await fetch('/api/aleo/health').then(r => r.json())
# Should return { connected: true, latestBlock: ... }

# 8. Test Leo CLI
leo --version
# Should output version number
```

---

## Commands

```bash
# Install TypeScript
npm install --save-dev typescript @types/react @types/node @types/react-dom

# Install Aleo SDK
npm install @aleohq/sdk

# Install shadcn components
npx shadcn@latest add button card badge avatar input label textarea
npx shadcn@latest add tabs dialog alert alert-dialog skeleton
npx shadcn@latest add dropdown-menu separator scroll-area tooltip

# Install Leo CLI
curl -sSf https://install.leo.build/ | sh

# Verify build
npm run build
npm run lint
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "@aleohq/sdk": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/react": "^19.x",
    "@types/react-dom": "^19.x",
    "@types/node": "^20.x"
  }
}
```

---

## Exit Criteria

Wave 1 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | TypeScript compiles | `npm run build` succeeds |
| 2 | 16 shadcn components installed | All render correctly |
| 3 | Layout components working | Header, Footer, RootLayout display |
| 4 | Mock wallet connects | Click connect, see address |
| 5 | Balance displays | Mock balance shows after connect |
| 6 | Aleo SDK pings testnet | `/api/aleo/health` returns latest block |
| 7 | Leo CLI installed | `leo --version` works |
| 8 | Project structure matches spec | All directories exist |
| 9 | Types match Leo structs | CoverageType, PolicyStatus defined |
| 10 | Lint passes | `npm run lint` no errors |

---

## Next Wave Preview

**Wave 2: Attestation Registry** will build on this foundation:
- Deploy first real contract (`attestation_registry.aleo`)
- Create attestation viewer component
- First real contract call from frontend
- Full integration test: request attestation → on-chain record → view in dashboard
