# Wave 2: State Management & Landing Page

**Objective:** Implement state management and create compelling landing page.

**Track:** A (Frontend)
**Depends on:** Wave 1

---

## Deliverables

### 1. State Management Setup

```bash
npm install zustand @tanstack/react-query
```

| File | Purpose |
|------|---------|
| `stores/app-store.ts` | Global app state (theme, notifications) |
| `stores/wallet-store.ts` | Wallet connection state (mock) |
| `lib/query-client.ts` | React Query configuration |
| `hooks/use-app-store.ts` | App store hook |
| `hooks/use-wallet-store.ts` | Wallet store hook |

### 2. Additional shadcn Components

```bash
npx shadcn@latest add accordion carousel progress navigation-menu sheet sonner
```

**Components:**
- `accordion` - FAQ sections
- `carousel` - Feature showcases
- `progress` - Progress indicators
- `navigation-menu` - Desktop navigation
- `sheet` - Mobile side panels
- `sonner` - Toast notifications

### 3. Landing Page Redesign

**Page:** `pages/index.tsx`

**Sections:**
| Section | Component | Purpose |
|---------|-----------|---------|
| Hero | `components/landing/hero.tsx` | Main value proposition |
| Features | `components/landing/features.tsx` | Key benefits grid |
| How It Works | `components/landing/how-it-works.tsx` | 3-step process |
| Coverage Types | `components/landing/coverage-types.tsx` | Insurance products |
| Stats | `components/landing/stats.tsx` | Protocol statistics |
| CTA | `components/landing/cta.tsx` | Call to action |
| FAQ | `components/landing/faq.tsx` | Common questions |

### 4. Landing Components

```
components/landing/
├── hero.tsx              # Hero section with headline & CTA
├── features.tsx          # Feature cards grid
├── how-it-works.tsx      # Step-by-step process
├── coverage-types.tsx    # Coverage product cards
├── stats.tsx             # TVL, policies, etc.
├── cta.tsx               # Final call to action
├── faq.tsx               # Accordion FAQ
└── index.ts              # Barrel export
```

### 5. Static Pages

| Page | Path | Purpose |
|------|------|---------|
| About | `pages/about.tsx` | Company/protocol info |
| FAQ | `pages/faq.tsx` | Extended FAQ |
| Privacy | `pages/privacy.tsx` | Privacy policy |
| Terms | `pages/terms.tsx` | Terms of service |

---

## State Management Architecture

### App Store (`stores/app-store.ts`)
```typescript
interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: Theme) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;

  // UI State
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}
```

### Wallet Store (`stores/wallet-store.ts`)
```typescript
interface WalletState {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;

  // Balance (mock)
  balance: number;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
}
```

### React Query Setup (`lib/query-client.ts`)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 minute
      gcTime: 5 * 60 * 1000,     // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## Landing Page Content

### Hero Section
- **Headline:** "Insurance Without Surveillance"
- **Subheadline:** "Prove eligibility with zero-knowledge proofs. Your data never leaves your device."
- **CTA:** "Get Coverage" / "Learn More"
- **Visual:** Abstract ZK circuit illustration

### Features (4 cards)
1. **Privacy First** - Your data stays yours
2. **Instant Claims** - Parametric auto-payouts
3. **Decentralized** - No single point of failure
4. **Transparent** - On-chain verification

### How It Works (3 steps)
1. **Prove Eligibility** - Generate ZK proof locally
2. **Purchase Coverage** - Pay premium on-chain
3. **Get Paid** - Automatic claims via oracles

### Coverage Types (2 cards for MVP)
1. **Flight Delay** - Automatic payout for delays
2. **Weather Events** - Protection from natural disasters

### Stats (4 metrics)
- Total Value Locked
- Policies Issued
- Claims Paid
- Average APY

---

## Testing Checklist

- [ ] Landing page loads < 3 seconds
- [ ] Mobile responsive (375px, 768px, 1024px, 1440px)
- [ ] Lighthouse performance > 90
- [ ] All sections render correctly
- [ ] Theme toggle works (light/dark)
- [ ] Toast notifications display
- [ ] FAQ accordion expands/collapses
- [ ] Navigation links work
- [ ] Static pages load correctly

---

## Commands

```bash
# Install dependencies
npm install zustand @tanstack/react-query

# Install shadcn components
npx shadcn@latest add accordion carousel progress navigation-menu sheet sonner

# Run dev server
npm run dev

# Test build
npm run build
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "zustand": "^4.x",
    "@tanstack/react-query": "^5.x"
  }
}
```

---

## Exit Criteria

Wave 2 is complete when:
1. Zustand stores created and working
2. React Query configured
3. All 6 additional shadcn components installed
4. Landing page fully redesigned with all sections
5. Static pages (about, faq, privacy, terms) created
6. Responsive on all breakpoints
7. Lighthouse performance > 90
8. Theme toggle functional
