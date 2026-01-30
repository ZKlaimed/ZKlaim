# Wave 1: Foundation & TypeScript Migration

**Objective:** Establish solid foundation with TypeScript, core UI components, and project structure.

**Track:** A (Frontend)

---

## Deliverables

### 1. TypeScript Setup

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript configuration |
| `next-env.d.ts` | Next.js type declarations |
| `types/index.ts` | Core type definitions & re-exports |
| `types/policy.ts` | Policy-related types |
| `types/claim.ts` | Claim-related types |
| `types/pool.ts` | Liquidity pool types |
| `types/user.ts` | User & wallet types |
| `types/blockchain.ts` | Aleo blockchain types |
| `types/oracle.ts` | Oracle data types |

### 2. shadcn/ui Components (Core)

```bash
npx shadcn@latest add button card badge avatar input label textarea
npx shadcn@latest add tabs dialog alert alert-dialog skeleton
npx shadcn@latest add dropdown-menu separator scroll-area tooltip
```

**Components to install:**
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

### 3. Project Structure

Create directories:
```
components/
├── layout/          # RootLayout, Header, Footer, MobileNav
├── common/          # Logo, Loading, ErrorBoundary
└── ui/              # shadcn/ui components (auto-generated)

hooks/               # Custom React hooks
stores/              # Zustand stores (placeholder)
lib/
├── constants.ts     # App-wide constants
└── config.ts        # Environment configuration
```

### 4. Layout Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `RootLayout` | `components/layout/root-layout.tsx` | App shell with header/footer |
| `Header` | `components/layout/header.tsx` | Top navigation bar |
| `Footer` | `components/layout/footer.tsx` | Site footer |
| `MobileNav` | `components/layout/mobile-nav.tsx` | Mobile navigation menu |

### 5. Common Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Logo` | `components/common/logo.tsx` | ZKLAIM logo |
| `Loading` | `components/common/loading.tsx` | Loading spinner/skeleton |
| `ErrorBoundary` | `components/common/error-boundary.tsx` | Error handling wrapper |

### 6. File Conversions

Convert existing JavaScript files to TypeScript:
- `pages/_app.js` → `pages/_app.tsx`
- `pages/_document.js` → `pages/_document.tsx`
- `pages/index.js` → `pages/index.tsx`
- `pages/api/hello.js` → `pages/api/hello.ts`
- `lib/utils.js` → `lib/utils.ts`

---

## Type Definitions Overview

### Core Types (`types/index.ts`)
```typescript
// API response wrapper
interface ApiResponse<T> { success, data, error, meta }

// Pagination
interface PaginationParams { page, pageSize, sortBy, sortOrder }

// Base model with timestamps
interface BaseModel { id, createdAt, updatedAt }

// Async operation status
type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'
```

### Policy Types (`types/policy.ts`)
```typescript
type CoverageType = 'flight_delay' | 'weather_event' | 'auto_collision' | 'health_basic'
type PolicyStatus = 'draft' | 'pending_proof' | 'active' | 'expired' | 'claimed'

interface Policy { id, userId, coverageType, coverageAmount, status, ... }
interface FlightCoverage { flightNumber, airports, delayThreshold, payoutTiers }
interface WeatherCoverage { location, eventType, threshold, payoutTiers }
interface PremiumQuote { basePremium, adjustments, totalPremium, validUntil }
```

### Claim Types (`types/claim.ts`)
```typescript
type ClaimStatus = 'submitted' | 'validating' | 'approved' | 'rejected' | 'paid'
type ClaimType = 'parametric' | 'traditional'

interface Claim { id, policyId, type, status, amount, evidence, ... }
interface OracleData { source, timestamp, data, signature }
```

### Pool Types (`types/pool.ts`)
```typescript
type PoolStatus = 'active' | 'paused' | 'deprecated'

interface Pool { id, name, coverageTypes, tvl, utilizationRate, ... }
interface PoolPosition { id, poolId, userId, depositAmount, lpTokens, ... }
interface PoolStats { tvl, apy, utilizationRate, totalPolicies, ... }
```

---

## Testing Checklist

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] All shadcn components render correctly
- [ ] `npm run lint` passes
- [ ] Path aliases work (`@/` imports)
- [ ] Layout components display properly
- [ ] Dark mode toggle works
- [ ] Mobile responsive layout

---

## Commands

```bash
# Install TypeScript
npm install --save-dev typescript @types/react @types/node @types/react-dom

# Install shadcn components
npx shadcn@latest add button card badge avatar input label textarea
npx shadcn@latest add tabs dialog alert alert-dialog skeleton
npx shadcn@latest add dropdown-menu separator scroll-area tooltip

# Verify build
npm run build
npm run lint
```

---

## Dependencies Added

```json
{
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
1. All files converted to TypeScript
2. No TypeScript compilation errors
3. All 16 shadcn components installed
4. Layout components (Header, Footer, RootLayout) working
5. Project structure matches specification
6. Lint passes with no errors
