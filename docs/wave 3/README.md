# Wave 3: Authentication & User Dashboard

**Objective:** Implement wallet authentication and dashboard shell.

**Track:** A (Frontend)
**Depends on:** Wave 2

---

## Deliverables

### 1. Authentication Setup

```bash
npm install next-auth @next-auth/prisma-adapter
```

| File | Purpose |
|------|---------|
| `pages/api/auth/[...nextauth].ts` | NextAuth.js API route |
| `lib/auth.ts` | Auth configuration & helpers |
| `hooks/use-auth.ts` | Authentication hook |
| `stores/auth-store.ts` | Auth state management |

### 2. Wallet Connection (Mock)

| File | Purpose |
|------|---------|
| `lib/wallet/index.ts` | Wallet interface & factory |
| `lib/wallet/mock-wallet.ts` | Mock wallet for development |
| `lib/wallet/types.ts` | Wallet type definitions |

### 3. Wallet Components

```
components/wallet/
├── connect-button.tsx    # Main connect wallet button
├── wallet-modal.tsx      # Wallet selection modal
├── account-dropdown.tsx  # Connected account menu
└── index.ts              # Barrel export
```

### 4. Additional shadcn Components

```bash
npx shadcn@latest add form select checkbox radio-group table data-table pagination
```

**Components:**
- `form` - Form handling with react-hook-form
- `select` - Dropdown selects
- `checkbox` - Checkbox inputs
- `radio-group` - Radio button groups
- `table` - Basic tables
- `data-table` - Advanced data tables
- `pagination` - Page navigation

### 5. Dashboard Shell

**Pages:**
| Page | Path | Purpose |
|------|------|---------|
| Dashboard Home | `pages/dashboard/index.tsx` | Overview & stats |
| Policies | `pages/dashboard/policies/index.tsx` | Policy list |
| Claims | `pages/dashboard/claims/index.tsx` | Claims list |
| Pools | `pages/dashboard/pools/index.tsx` | LP positions |

**Layout:**
| Component | Purpose |
|-----------|---------|
| `components/dashboard/layout.tsx` | Dashboard wrapper |
| `components/dashboard/sidebar.tsx` | Side navigation |
| `components/dashboard/header.tsx` | Dashboard header |

### 6. Dashboard Components

```
components/dashboard/
├── layout.tsx           # Dashboard layout wrapper
├── sidebar.tsx          # Side navigation
├── header.tsx           # Top bar with user info
├── stats-card.tsx       # Metric display card
├── activity-feed.tsx    # Recent activity list
├── quick-actions.tsx    # Action shortcuts
└── index.ts             # Barrel export
```

---

## Authentication Flow

### NextAuth Configuration
```typescript
// pages/api/auth/[...nextauth].ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Wallet',
      credentials: {
        address: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        // Verify wallet signature
        // Return user object or null
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => { ... },
    session: async ({ session, token }) => { ... },
  },
  pages: {
    signIn: '/connect',
  }
};
```

### Auth Store
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (address: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### Protected Routes
```typescript
// HOC for protected pages
export function withAuth<P>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/connect');
      }
    }, [isAuthenticated, isLoading]);

    if (isLoading) return <Loading />;
    if (!isAuthenticated) return null;

    return <Component {...props} />;
  };
}
```

---

## Mock Wallet Implementation

### Wallet Interface
```typescript
interface Wallet {
  connect(): Promise<string>;      // Returns address
  disconnect(): Promise<void>;
  signMessage(message: string): Promise<string>;
  getBalance(): Promise<number>;
  isConnected(): boolean;
}
```

### Mock Wallet
```typescript
class MockWallet implements Wallet {
  private address: string | null = null;

  async connect() {
    // Simulate connection delay
    await delay(1000);
    this.address = generateMockAddress();
    return this.address;
  }

  async getBalance() {
    return 1000; // Mock balance
  }
}
```

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│  Header (Logo, Search, Notifications, Account)      │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │           Main Content                   │
│          │                                          │
│ - Home   │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ - Policies│  │Stats    │ │Stats    │ │Stats    │   │
│ - Claims │  │Card     │ │Card     │ │Card     │   │
│ - Pools  │  └─────────┘ └─────────┘ └─────────┘   │
│          │                                          │
│ - Settings│  ┌────────────────────────────────────┐ │
│          │  │ Activity Feed / Quick Actions      │ │
│          │  └────────────────────────────────────┘ │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Dashboard Home Stats
- Active Policies
- Pending Claims
- Total Coverage
- Pool Positions

### Quick Actions
- Buy New Policy
- File a Claim
- Deposit to Pool
- View All Policies

---

## Testing Checklist

- [ ] Mock wallet connects/disconnects
- [ ] Session persists across page refreshes
- [ ] Protected routes redirect unauthenticated users
- [ ] Dashboard layout renders correctly
- [ ] Sidebar navigation works
- [ ] Stats cards display mock data
- [ ] Activity feed shows items
- [ ] Quick actions navigate correctly
- [ ] Mobile responsive dashboard
- [ ] Account dropdown shows address

---

## Commands

```bash
# Install dependencies
npm install next-auth @next-auth/prisma-adapter

# Install shadcn components
npx shadcn@latest add form select checkbox radio-group table data-table pagination

# Run dev server
npm run dev
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "next-auth": "^4.x",
    "@next-auth/prisma-adapter": "^1.x"
  }
}
```

---

## Exit Criteria

Wave 3 is complete when:
1. NextAuth.js configured with wallet credentials provider
2. Mock wallet connects and disconnects
3. Session persists across refreshes
4. Protected routes redirect properly
5. Dashboard shell with sidebar navigation
6. All dashboard pages render
7. Stats cards and activity feed working
8. 7 new shadcn components installed
