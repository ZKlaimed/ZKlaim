# Wave 1: Foundation & Wallet Infrastructure

**Objective:** Development setup with real wallet connectivity, Aleo SDK integration, and first contract deployment from day one.

**Theme:** Vertical foundation - both frontend and blockchain tooling ready with a deployed contract

---

## Overview

Wave 1 establishes the complete development foundation AND deploys your first smart contract. Unlike traditional approaches that defer blockchain integration, we set up frontend, Aleo tooling, AND deploy a real contract immediately. This ensures the wallet adapter interface matches real Leo struct types and validates the full deployment pipeline from day one.

---

## Deliverables

### Layer: Contracts

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Leo CLI setup | `contracts/README.md` | Install and configure Leo development environment |
| Project structure | `contracts/` directory | Scaffold contract folders |
| Shared types | `contracts/types/` | Common type definitions matching frontend |
| **zklaim_foundation.aleo** | `contracts/zklaim_foundation/` | **First deployed contract** |
| Deployment script | `scripts/deploy-foundation.sh` | Testnet deployment |

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
├── zklaim_foundation/  # FIRST DEPLOYED CONTRACT
│   ├── src/
│   │   └── main.leo
│   ├── build/
│   ├── inputs/
│   └── program.json
├── attestation_registry/
├── oracle_bridge/
├── risk_pool/
├── policy_registry/
├── claims_engine/
└── governance/
```

#### Contract: zklaim_foundation.aleo

This is your first deployed contract. It handles protocol initialization and provides utility functions for testing the deployment pipeline.

```leo
// contracts/zklaim_foundation/src/main.leo
program zklaim_foundation.aleo {

    // =============================================
    // MAPPINGS (Public on-chain state)
    // =============================================

    // Protocol configuration
    mapping protocol_initialized: u8 => bool;
    mapping protocol_admin: u8 => address;
    mapping protocol_version: u8 => u32;

    // User registration (maps address hash to registration status)
    mapping registered_users: field => bool;
    mapping user_count: u8 => u64;

    // Simple key-value store for testing
    mapping test_storage: field => field;

    // =============================================
    // CONSTANTS
    // =============================================

    // Single key for global values (we use u8 key = 0 for singleton mappings)
    const GLOBAL_KEY: u8 = 0u8;

    // Protocol version (1.0.0 = 10000)
    const CURRENT_VERSION: u32 = 10000u32;

    // =============================================
    // STRUCTS
    // =============================================

    // Protocol info returned by queries
    struct ProtocolInfo {
        version: u32,
        is_initialized: bool,
    }

    // =============================================
    // ADMIN FUNCTIONS
    // =============================================

    // Initialize the protocol (can only be called once)
    transition initialize_protocol(admin: address) {
        return then finalize(admin);
    }

    finalize initialize_protocol(admin: address) {
        // Check not already initialized
        let already_init: bool = Mapping::get_or_use(protocol_initialized, GLOBAL_KEY, false);
        assert(!already_init);

        // Set initialized
        Mapping::set(protocol_initialized, GLOBAL_KEY, true);
        Mapping::set(protocol_admin, GLOBAL_KEY, admin);
        Mapping::set(protocol_version, GLOBAL_KEY, CURRENT_VERSION);
        Mapping::set(user_count, GLOBAL_KEY, 0u64);
    }

    // =============================================
    // USER FUNCTIONS
    // =============================================

    // Register a user (for testing wallet integration)
    transition register_user() {
        return then finalize(self.caller);
    }

    finalize register_user(caller: address) {
        // Hash the address to use as key
        let user_hash: field = BHP256::hash_to_field(caller);

        // Check not already registered
        let already_registered: bool = Mapping::get_or_use(registered_users, user_hash, false);
        assert(!already_registered);

        // Register user
        Mapping::set(registered_users, user_hash, true);

        // Increment user count
        let current_count: u64 = Mapping::get_or_use(user_count, GLOBAL_KEY, 0u64);
        Mapping::set(user_count, GLOBAL_KEY, current_count + 1u64);
    }

    // Check if caller is registered (returns proof)
    transition verify_registration() -> bool {
        return true then finalize(self.caller);
    }

    finalize verify_registration(caller: address) {
        let user_hash: field = BHP256::hash_to_field(caller);
        let is_registered: bool = Mapping::get_or_use(registered_users, user_hash, false);
        assert(is_registered);
    }

    // =============================================
    // UTILITY FUNCTIONS (for testing)
    // =============================================

    // Store a value (tests write operations)
    transition store_value(key: field, value: field) {
        return then finalize(key, value);
    }

    finalize store_value(key: field, value: field) {
        Mapping::set(test_storage, key, value);
    }

    // Simple ping function (tests basic transaction)
    transition ping() -> u32 {
        return CURRENT_VERSION;
    }

    // Echo function (tests input/output)
    transition echo(value: field) -> field {
        return value;
    }

    // Add two numbers (tests computation)
    transition add(a: u64, b: u64) -> u64 {
        return a + b;
    }
}
```

#### Contract Tests

```leo
// contracts/zklaim_foundation/tests/main_test.leo
@test
function test_ping() {
    let version: u32 = zklaim_foundation.leo/ping();
    assert_eq(version, 10000u32);
}

@test
function test_echo() {
    let input: field = 12345field;
    let output: field = zklaim_foundation.leo/echo(input);
    assert_eq(input, output);
}

@test
function test_add() {
    let result: u64 = zklaim_foundation.leo/add(100u64, 200u64);
    assert_eq(result, 300u64);
}
```

#### Deployment Script

```bash
#!/bin/bash
# scripts/deploy-foundation.sh

set -e

echo "Building zklaim_foundation..."
cd contracts/zklaim_foundation
leo build

echo "Running tests..."
leo test

echo "Deploying to testnet..."
leo deploy --network testnet

echo "Deployment complete!"
echo "Save the program ID for frontend configuration."
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
| **Foundation helpers** | `lib/aleo/foundation.ts` | **Contract interaction functions** |
| **Contract status UI** | `components/foundation/` | **Display protocol status** |

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

#### Foundation Contract Helpers

```typescript
// lib/aleo/foundation.ts
import { aleoClient, programManager } from './client';
import { WalletAdapter } from '@/lib/wallet/adapter';

// Contract program ID (update after deployment)
export const FOUNDATION_PROGRAM_ID = 'zklaim_foundation.aleo';
export const PROTOCOL_VERSION = 10000; // 1.0.0

/**
 * Ping the deployed contract to verify connectivity
 * This is a read-only operation that doesn't require a wallet
 */
export async function pingContract(): Promise<{
  success: boolean;
  version: number;
  error?: string;
}> {
  try {
    const result = await programManager.execute(
      FOUNDATION_PROGRAM_ID,
      'ping',
      []
    );
    return {
      success: true,
      version: parseInt(result.outputs[0].replace('u32', '')),
    };
  } catch (error) {
    return {
      success: false,
      version: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Register the connected user on-chain
 * Creates an on-chain record of the user's address
 */
export async function registerUser(
  wallet: WalletAdapter
): Promise<{ txId: string }> {
  const tx = await programManager.buildTransaction(
    FOUNDATION_PROGRAM_ID,
    'register_user',
    []
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return { txId: result.transactionId };
}

/**
 * Check if the connected user is registered
 */
export async function verifyUserRegistration(
  wallet: WalletAdapter
): Promise<boolean> {
  try {
    const tx = await programManager.buildTransaction(
      FOUNDATION_PROGRAM_ID,
      'verify_registration',
      []
    );

    const signedTx = await wallet.signTransaction(tx);
    await aleoClient.submitTransaction(signedTx);

    return true;
  } catch {
    return false;
  }
}

/**
 * Echo test - verify input/output works
 */
export async function echoTest(value: string): Promise<string> {
  const result = await programManager.execute(
    FOUNDATION_PROGRAM_ID,
    'echo',
    [`${value}field`]
  );
  return result.outputs[0];
}

/**
 * Add test - verify computation works
 */
export async function addTest(a: number, b: number): Promise<number> {
  const result = await programManager.execute(
    FOUNDATION_PROGRAM_ID,
    'add',
    [`${a}u64`, `${b}u64`]
  );
  return parseInt(result.outputs[0].replace('u64', ''));
}
```

#### Protocol Status Component

```typescript
// components/foundation/protocol-status.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { pingContract, PROTOCOL_VERSION } from '@/lib/aleo/foundation';
import { CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';

interface ProtocolStatus {
  connected: boolean;
  version: number;
  latestBlock: number | null;
  error?: string;
}

export function ProtocolStatus() {
  const [status, setStatus] = useState<ProtocolStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function checkStatus() {
    setLoading(true);
    try {
      // Ping the deployed contract
      const contractResult = await pingContract();

      // Get latest block from testnet
      const blockResponse = await fetch('/api/aleo/health');
      const blockData = await blockResponse.json();

      setStatus({
        connected: contractResult.success,
        version: contractResult.version,
        latestBlock: blockData.latestBlock,
        error: contractResult.error,
      });
    } catch (error) {
      setStatus({
        connected: false,
        version: 0,
        latestBlock: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Protocol Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Protocol Status
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={checkStatus}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Contract</span>
          <Badge variant={status?.connected ? 'default' : 'destructive'}>
            {status?.connected ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Disconnected
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Version</span>
          <span className="font-mono text-sm">
            {status?.version ? `v${(status.version / 10000).toFixed(1)}` : 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Latest Block</span>
          <span className="font-mono text-sm">
            {status?.latestBlock?.toLocaleString() ?? 'N/A'}
          </span>
        </div>

        {status?.error && (
          <div className="text-sm text-destructive">
            Error: {status.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### User Registration Component

```typescript
// components/foundation/user-registration.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWalletStore } from '@/stores/wallet-store';
import { registerUser, verifyUserRegistration } from '@/lib/aleo/foundation';
import { UserPlus, CheckCircle, Loader2 } from 'lucide-react';

export function UserRegistration() {
  const { wallet, isConnected } = useWalletStore();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);

  async function handleRegister() {
    if (!wallet) return;

    setLoading(true);
    try {
      const result = await registerUser(wallet);
      setTxId(result.txId);
      // After tx confirms, user will be registered
      setIsRegistered(true);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckRegistration() {
    if (!wallet) return;

    setLoading(true);
    try {
      const registered = await verifyUserRegistration(wallet);
      setIsRegistered(registered);
    } catch {
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Connect your wallet to register
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          User Registration
        </CardTitle>
        <CardDescription>
          Register on-chain to use the ZKLAIM protocol
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          {isRegistered === null ? (
            <Badge variant="secondary">Unknown</Badge>
          ) : isRegistered ? (
            <Badge variant="default">
              <CheckCircle className="mr-1 h-3 w-3" />
              Registered
            </Badge>
          ) : (
            <Badge variant="outline">Not Registered</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCheckRegistration}
            disabled={loading}
          >
            Check Status
          </Button>

          {!isRegistered && (
            <Button onClick={handleRegister} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
                </>
              )}
            </Button>
          )}
        </div>

        {txId && (
          <div className="text-xs text-muted-foreground">
            Transaction: <code className="font-mono">{txId.slice(0, 16)}...</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Layer: Integration

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Wallet adapter interface | `lib/wallet/adapter.ts` | Unified interface for all wallets |
| Type definitions | `types/blockchain.ts` | Types matching Leo struct definitions |
| Aleo client | `lib/aleo/client.ts` | Network client initialization |
| **Contract calls** | `lib/aleo/foundation.ts` | **Real calls to deployed contract** |
| **Transaction signing** | Via wallet adapter | **Wallet signs transactions** |
| **On-chain verification** | `register_user`, `ping` | **Verify full round-trip works** |

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
│   ├── types/
│   │   └── common.leo
│   └── zklaim_foundation/     # FIRST DEPLOYED CONTRACT
│       ├── src/
│       │   └── main.leo
│       ├── build/
│       ├── inputs/
│       ├── tests/
│       │   └── main_test.leo
│       └── program.json
├── scripts/
│   └── deploy-foundation.sh   # Deployment script
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
│   ├── foundation/            # CONTRACT UI COMPONENTS
│   │   ├── protocol-status.tsx
│   │   └── user-registration.tsx
│   └── ui/                    # shadcn/ui (auto-generated)
├── lib/
│   ├── aleo/
│   │   ├── client.ts
│   │   ├── foundation.ts      # Contract helpers
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
5. **Contract builds** - `leo build` succeeds for zklaim_foundation
6. **Contract tests pass** - `leo test` runs all tests successfully
7. **Contract deployed** - Transaction confirmed on testnet
8. **Ping contract** - Frontend successfully calls `ping()` and gets version
9. **Register user** - Sign transaction, see confirmation, verify on-chain

### Manual Test Script

```bash
# === Contract Testing ===

# 1. Build the contract
cd contracts/zklaim_foundation
leo build
# Expected: Build successful

# 2. Run contract tests
leo test
# Expected: All tests pass
# ✓ test_ping
# ✓ test_echo
# ✓ test_add

# 3. Deploy to testnet
leo deploy --network testnet
# Expected: Deployment transaction confirmed
# Save the program ID!

# === Frontend Testing ===

# 4. Start dev server
npm run dev

# 5. Open http://localhost:3000
# 6. Verify "Protocol Status" card shows:
#    - Contract: Connected (green badge)
#    - Version: v1.0
#    - Latest Block: (block number)

# 7. Click "Connect Wallet"
# 8. Verify mock wallet connects
# 9. Verify address displays (aleo1mock...)
# 10. Verify balance displays (1000 ALEO)

# 11. Test user registration:
#     - Click "Check Status" (should show "Not Registered")
#     - Click "Register"
#     - Sign the transaction
#     - Wait for confirmation
#     - Status should update to "Registered"

# === API Testing ===

# 12. Test Aleo SDK (in browser console)
await fetch('/api/aleo/health').then(r => r.json())
# Should return { connected: true, latestBlock: ..., contractVersion: 10000 }

# 13. Test contract ping
await fetch('/api/aleo/ping').then(r => r.json())
# Should return { success: true, version: 10000 }
```

### E2E Test: Full Round-Trip

```
1. Contract compiles and tests pass
2. Contract deployed to testnet (tx confirmed)
3. Frontend loads and connects to contract
4. Protocol status shows "Connected"
5. Connect wallet
6. Register user (sign tx)
7. Transaction confirms
8. User status shows "Registered"
9. Refresh page - status persists (on-chain state)
```

---

## Commands

```bash
# === Leo / Contracts ===

# Install Leo CLI
curl -sSf https://install.leo.build/ | sh

# Verify Leo installation
leo --version

# Initialize the foundation contract
cd contracts
leo new zklaim_foundation
cd zklaim_foundation

# Build the contract
leo build

# Run contract tests
leo test

# Deploy to testnet (requires Aleo account with credits)
leo deploy --network testnet

# === Frontend ===

# Install TypeScript
npm install --save-dev typescript @types/react @types/node @types/react-dom

# Install Aleo SDK
npm install @aleohq/sdk

# Install shadcn components
npx shadcn@latest add button card badge avatar input label textarea
npx shadcn@latest add tabs dialog alert alert-dialog skeleton
npx shadcn@latest add dropdown-menu separator scroll-area tooltip

# Verify frontend build
npm run build
npm run lint

# Start development server
npm run dev
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
| **11** | **Contract builds** | `leo build` succeeds |
| **12** | **Contract tests pass** | `leo test` all green |
| **13** | **Contract deployed to testnet** | Transaction confirmed |
| **14** | **Frontend pings contract** | Protocol status shows "Connected" |
| **15** | **User registration works** | Full round-trip: sign tx → confirm → verified |

---

## Key Achievement

Wave 1 now delivers a **complete vertical slice**:

- ✅ Frontend foundation (TypeScript, shadcn, layout)
- ✅ Blockchain tooling (Leo CLI, Aleo SDK)
- ✅ **First deployed contract** (`zklaim_foundation.aleo`)
- ✅ **Real contract integration** (ping, register)
- ✅ **Full transaction flow** (sign → submit → confirm)

This means from Day 1, developers experience the entire development-to-deployment pipeline.

---

## Next Wave Preview

**Wave 2: Attestation Registry** will build on this foundation:
- Deploy `attestation_registry.aleo` contract (real business logic)
- Create attestation viewer component
- Attestation creation and verification
- Full integration test: request attestation → on-chain record → view in dashboard
- State management with Zustand and React Query
