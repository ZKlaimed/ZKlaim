# Wave 7: Liquidity Pools

**Objective:** Implement pool dashboard and liquidity provision.

**Track:** A (Frontend)
**Depends on:** Wave 6

---

## Deliverables

### 1. Charts Library

```bash
npm install recharts
```

### 2. Pool Pages (Public)

| Page | Path | Purpose |
|------|------|---------|
| Pool List | `pages/pools/index.tsx` | Browse all pools |
| Pool Detail | `pages/pools/[id].tsx` | Single pool view |

### 3. Pool Pages (Dashboard)

| Page | Path | Purpose |
|------|------|---------|
| My Positions | `pages/dashboard/pools/index.tsx` | User LP positions |
| Position Detail | `pages/dashboard/pools/[id].tsx` | Single position view |

### 4. Pool Components

```
components/pools/
├── pool-card.tsx          # Pool summary card
├── pool-detail.tsx        # Full pool view
├── pool-stats.tsx         # Key metrics display
├── pool-chart.tsx         # TVL/APY chart wrapper
├── deposit-form.tsx       # Deposit liquidity form
├── withdraw-form.tsx      # Withdraw liquidity form
├── position-card.tsx      # LP position card
├── lp-token-balance.tsx   # LP token display
├── yield-calculator.tsx   # Projected yield calc
├── risk-disclosure.tsx    # Risk warning modal
└── index.ts               # Barrel export
```

### 5. Chart Components

```
components/charts/
├── pool-tvl-chart.tsx     # Total Value Locked over time
├── pool-apy-chart.tsx     # APY history chart
├── utilization-chart.tsx  # Pool utilization gauge
├── position-chart.tsx     # Position value over time
└── index.ts               # Barrel export
```

### 6. Pool Hooks

| File | Purpose |
|------|---------|
| `hooks/use-pools.ts` | Fetch all pools |
| `hooks/use-pool.ts` | Fetch single pool |
| `hooks/use-pool-stats.ts` | Fetch pool statistics |
| `hooks/use-deposit.ts` | Deposit mutation |
| `hooks/use-withdraw.ts` | Withdraw mutation |
| `hooks/use-positions.ts` | Fetch user positions |
| `hooks/use-position.ts` | Fetch single position |

---

## Pool Data Model

```typescript
interface Pool {
  id: string;
  name: string;
  description: string;
  coverageTypes: CoverageType[];
  status: PoolStatus;

  // Financial metrics
  tvl: number;                    // Total Value Locked
  availableLiquidity: number;     // TVL - active coverage
  totalPremiums: number;          // All premiums collected
  totalPayouts: number;           // All claims paid

  // Performance
  apy: number;                    // Current APY
  apyHistory: APYDataPoint[];     // Historical APY
  utilizationRate: number;        // Active coverage / TVL

  // Constraints
  minDeposit: number;
  maxDeposit: number;
  maxUtilization: number;         // Risk limit

  // Stats
  totalDepositors: number;
  totalPolicies: number;

  createdAt: Date;
}

interface PoolPosition {
  id: string;
  poolId: string;
  pool: Pool;

  depositAmount: number;          // Original deposit
  currentValue: number;           // Current value with yield
  lpTokens: number;               // LP token balance

  shareOfPool: number;            // Percentage ownership
  earnedYield: number;            // Total yield earned
  pendingYield: number;           // Unclaimed yield

  depositedAt: Date;
  lastClaimAt: Date | null;
}
```

---

## Pool List View

```
┌─────────────────────────────────────────────────────────────────┐
│  Liquidity Pools                              [Filter] [Sort]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Flight Delay Pool                                       │   │
│  │  ─────────────────────────────────────────────────────── │   │
│  │  TVL: $2.4M        APY: 12.5%       Utilization: 45%    │   │
│  │                                                          │   │
│  │  Coverage: Flight Delay                                  │   │
│  │  Min Deposit: $100                                       │   │
│  │                                                          │   │
│  │  [View Pool]                         [Deposit]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Weather Event Pool                                      │   │
│  │  ─────────────────────────────────────────────────────── │   │
│  │  TVL: $1.8M        APY: 15.2%       Utilization: 38%    │   │
│  │                                                          │   │
│  │  Coverage: Hurricane, Tornado, Flood                     │   │
│  │  Min Deposit: $500                                       │   │
│  │                                                          │   │
│  │  [View Pool]                         [Deposit]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pool Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Pools                                                │
│                                                                  │
│  Flight Delay Pool                              Status: Active   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │   $2.4M   │  │   12.5%   │  │    45%    │  │   1,234   │   │
│  │    TVL    │  │    APY    │  │   Util.   │  │ Policies  │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    TVL History Chart                     │   │
│  │                         ___                              │   │
│  │                    ___/    \___                          │   │
│  │              ___/              \                         │   │
│  │         ___/                                             │   │
│  │    ___/                                                  │   │
│  │   Jan    Feb    Mar    Apr    May    Jun                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │   Deposit            │  │   Pool Information            │   │
│  │   ────────────────   │  │   ──────────────────────────  │   │
│  │   Amount: [_____]    │  │   Coverage: Flight Delay      │   │
│  │                      │  │   Min Deposit: $100           │   │
│  │   Est. APY: 12.5%    │  │   Max Utilization: 80%       │   │
│  │   Est. Yield: $125   │  │   Depositors: 456            │   │
│  │                      │  │                               │   │
│  │   [Deposit]          │  │   Risk Level: Medium          │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deposit/Withdraw Forms

### Deposit Form
```typescript
const depositFormSchema = z.object({
  poolId: z.string(),
  amount: z.number()
    .positive('Amount must be positive')
    .min(pool.minDeposit, `Minimum deposit is ${pool.minDeposit}`),
  acknowledgeRisks: z.boolean()
    .refine(val => val === true, 'You must acknowledge the risks'),
});
```

### Withdraw Form
```typescript
const withdrawFormSchema = z.object({
  positionId: z.string(),
  amount: z.number()
    .positive('Amount must be positive')
    .max(position.currentValue, 'Cannot withdraw more than balance'),
  withdrawAll: z.boolean().optional(),
});
```

---

## Charts Configuration

### TVL Chart
```typescript
const TVLChart = ({ data }: { data: TVLDataPoint[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Area
        type="monotone"
        dataKey="tvl"
        stroke="#8884d8"
        fill="url(#tvlGradient)"
      />
    </AreaChart>
  </ResponsiveContainer>
);
```

### Utilization Gauge
```typescript
const UtilizationGauge = ({ utilization }: { utilization: number }) => (
  <ResponsiveContainer width="100%" height={200}>
    <RadialBarChart
      innerRadius="60%"
      outerRadius="100%"
      data={[{ value: utilization * 100 }]}
    >
      <RadialBar dataKey="value" fill={getUtilizationColor(utilization)} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
        {(utilization * 100).toFixed(1)}%
      </text>
    </RadialBarChart>
  </ResponsiveContainer>
);
```

---

## Risk Disclosure

```typescript
const RISK_DISCLOSURE = `
## Liquidity Provider Risks

By depositing into this pool, you acknowledge:

1. **Smart Contract Risk**: Funds are held in smart contracts that may have bugs.

2. **Utilization Risk**: If claims exceed pool capacity, payouts may be delayed.

3. **Market Risk**: APY varies based on premium volume and claim frequency.

4. **Impermanent Loss**: Unlike AMMs, IL is not a factor, but claim payouts
   reduce pool value.

5. **Lock-up Period**: Withdrawals may be delayed during high utilization.

This is not financial advice. Only deposit what you can afford to lose.
`;
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/pools` | GET | List all pools |
| `/api/v1/pools/[id]` | GET | Get pool details |
| `/api/v1/pools/[id]/stats` | GET | Get pool statistics |
| `/api/v1/pools/[id]/history` | GET | Get historical data |
| `/api/v1/pools/[id]/deposit` | POST | Deposit to pool |
| `/api/v1/pools/[id]/withdraw` | POST | Withdraw from pool |
| `/api/v1/pools/positions` | GET | Get user positions |
| `/api/v1/pools/positions/[id]` | GET | Get position detail |

---

## Testing Checklist

- [ ] Pool list displays all pools
- [ ] Pool cards show correct stats
- [ ] Pool detail page loads
- [ ] TVL chart renders with data
- [ ] APY chart renders with data
- [ ] Utilization gauge displays
- [ ] Deposit form validates
- [ ] Deposit creates position
- [ ] Position appears in dashboard
- [ ] Withdraw form validates
- [ ] Withdraw updates position
- [ ] Risk disclosure modal shows
- [ ] Yield calculator works
- [ ] Mobile responsive

---

## Commands

```bash
# Install dependencies
npm install recharts

# Run dev server
npm run dev
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "recharts": "^2.x"
  }
}
```

---

## Exit Criteria

Wave 7 is complete when:
1. Recharts installed and working
2. Public pool list page
3. Pool detail page with stats
4. TVL, APY, and utilization charts
5. Deposit flow working
6. Withdraw flow working
7. User positions dashboard
8. Position detail view
9. Yield calculator component
10. Risk disclosure modal
11. All responsive on mobile
