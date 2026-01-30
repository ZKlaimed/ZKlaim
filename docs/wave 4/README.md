# Wave 4: Risk Pool

**Objective:** Liquidity provision with full deposit/withdraw cycle and LP token mechanics.

**Theme:** DeFi infrastructure - real money in, real money out

**Depends on:** Wave 3

---

## Overview

Wave 4 introduces the financial backbone of the insurance protocol. The Risk Pool contract manages liquidity from providers, mints LP tokens for deposits, and processes withdrawals. By the end of this wave, users can deposit funds, receive LP tokens, view their position, and withdraw.

This is where real value flows through the system.

---

## Deliverables

### Layer: Contracts

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| `risk_pool.aleo` | `contracts/risk_pool/src/main.leo` | Liquidity pool management |
| Pool tests | `contracts/risk_pool/tests/` | Unit tests |
| Deployment script | `scripts/deploy-pool.sh` | Testnet deployment |

#### Contract: risk_pool.aleo

```leo
// contracts/risk_pool/src/main.leo
program risk_pool.aleo {

    // Records (private)
    record LPToken {
        owner: address,
        pool_id: field,
        amount: u64,
        deposited_at: u64,
    }

    record DepositReceipt {
        owner: address,
        pool_id: field,
        deposit_amount: u64,
        lp_tokens_minted: u64,
        timestamp: u64,
    }

    record WithdrawReceipt {
        owner: address,
        pool_id: field,
        lp_tokens_burned: u64,
        amount_withdrawn: u64,
        timestamp: u64,
    }

    // Mappings (public)
    mapping pools: field => PoolState;
    mapping pool_balances: field => u64;
    mapping lp_supply: field => u64;

    // Structs
    struct PoolState {
        id: field,
        name_hash: field,
        coverage_types: u8,        // Bitmask
        total_deposits: u64,
        total_withdrawals: u64,
        total_premiums: u64,
        total_payouts: u64,
        min_deposit: u64,
        max_utilization: u64,      // Basis points (8000 = 80%)
        is_active: bool,
        created_at: u64,
    }

    // Coverage types (bitmask)
    const COVERAGE_FLIGHT: u8 = 1u8;
    const COVERAGE_WEATHER: u8 = 2u8;

    // === Admin Functions ===

    // Create a new liquidity pool
    transition create_pool(
        pool_id: field,
        name_hash: field,
        coverage_types: u8,
        min_deposit: u64,
        max_utilization: u64
    ) {
        return then finalize(pool_id, name_hash, coverage_types, min_deposit, max_utilization);
    }

    finalize create_pool(
        pool_id: field,
        name_hash: field,
        coverage_types: u8,
        min_deposit: u64,
        max_utilization: u64
    ) {
        // Ensure pool doesn't exist
        let exists: bool = Mapping::contains(pools, pool_id);
        assert(!exists);

        let pool: PoolState = PoolState {
            id: pool_id,
            name_hash: name_hash,
            coverage_types: coverage_types,
            total_deposits: 0u64,
            total_withdrawals: 0u64,
            total_premiums: 0u64,
            total_payouts: 0u64,
            min_deposit: min_deposit,
            max_utilization: max_utilization,
            is_active: true,
            created_at: block.height as u64,
        };

        Mapping::set(pools, pool_id, pool);
        Mapping::set(pool_balances, pool_id, 0u64);
        Mapping::set(lp_supply, pool_id, 0u64);
    }

    // Pause/unpause pool
    transition set_pool_active(pool_id: field, is_active: bool) {
        return then finalize(pool_id, is_active);
    }

    finalize set_pool_active(pool_id: field, is_active: bool) {
        let pool: PoolState = Mapping::get(pools, pool_id);
        let updated: PoolState = PoolState {
            id: pool.id,
            name_hash: pool.name_hash,
            coverage_types: pool.coverage_types,
            total_deposits: pool.total_deposits,
            total_withdrawals: pool.total_withdrawals,
            total_premiums: pool.total_premiums,
            total_payouts: pool.total_payouts,
            min_deposit: pool.min_deposit,
            max_utilization: pool.max_utilization,
            is_active: is_active,
            created_at: pool.created_at,
        };
        Mapping::set(pools, pool_id, updated);
    }

    // === Liquidity Provider Functions ===

    // Deposit liquidity into pool
    transition deposit(
        pool_id: field,
        amount: u64
    ) -> (LPToken, DepositReceipt) {
        // In production: transfer tokens from caller

        // LP tokens calculated based on current ratio
        // Simplified: 1:1 for MVP, production uses share calculation
        let lp_tokens: u64 = amount;

        let lp_token: LPToken = LPToken {
            owner: self.caller,
            pool_id: pool_id,
            amount: lp_tokens,
            deposited_at: 0u64, // Set in finalize
        };

        let receipt: DepositReceipt = DepositReceipt {
            owner: self.caller,
            pool_id: pool_id,
            deposit_amount: amount,
            lp_tokens_minted: lp_tokens,
            timestamp: 0u64, // Set in finalize
        };

        return (lp_token, receipt) then finalize(pool_id, amount, lp_tokens);
    }

    finalize deposit(pool_id: field, amount: u64, lp_tokens: u64) {
        // Verify pool exists and is active
        let pool: PoolState = Mapping::get(pools, pool_id);
        assert(pool.is_active);
        assert(amount >= pool.min_deposit);

        // Update pool state
        let updated: PoolState = PoolState {
            id: pool.id,
            name_hash: pool.name_hash,
            coverage_types: pool.coverage_types,
            total_deposits: pool.total_deposits + amount,
            total_withdrawals: pool.total_withdrawals,
            total_premiums: pool.total_premiums,
            total_payouts: pool.total_payouts,
            min_deposit: pool.min_deposit,
            max_utilization: pool.max_utilization,
            is_active: pool.is_active,
            created_at: pool.created_at,
        };
        Mapping::set(pools, pool_id, updated);

        // Update balances
        let current_balance: u64 = Mapping::get(pool_balances, pool_id);
        Mapping::set(pool_balances, pool_id, current_balance + amount);

        // Update LP supply
        let current_supply: u64 = Mapping::get(lp_supply, pool_id);
        Mapping::set(lp_supply, pool_id, current_supply + lp_tokens);
    }

    // Withdraw liquidity from pool
    transition withdraw(
        lp_token: LPToken,
        amount_to_burn: u64
    ) -> (LPToken, WithdrawReceipt) {
        // Verify caller owns the LP token
        assert_eq(lp_token.owner, self.caller);
        assert(lp_token.amount >= amount_to_burn);

        // Calculate withdrawal amount (simplified 1:1)
        let withdrawal_amount: u64 = amount_to_burn;

        // Create remaining LP token (or burn completely)
        let remaining_lp: u64 = lp_token.amount - amount_to_burn;

        let new_lp_token: LPToken = LPToken {
            owner: self.caller,
            pool_id: lp_token.pool_id,
            amount: remaining_lp,
            deposited_at: lp_token.deposited_at,
        };

        let receipt: WithdrawReceipt = WithdrawReceipt {
            owner: self.caller,
            pool_id: lp_token.pool_id,
            lp_tokens_burned: amount_to_burn,
            amount_withdrawn: withdrawal_amount,
            timestamp: 0u64,
        };

        return (new_lp_token, receipt) then finalize(
            lp_token.pool_id, withdrawal_amount, amount_to_burn
        );
    }

    finalize withdraw(pool_id: field, amount: u64, lp_burned: u64) {
        // Verify pool has sufficient balance
        let balance: u64 = Mapping::get(pool_balances, pool_id);
        assert(balance >= amount);

        // Update pool state
        let pool: PoolState = Mapping::get(pools, pool_id);
        let updated: PoolState = PoolState {
            id: pool.id,
            name_hash: pool.name_hash,
            coverage_types: pool.coverage_types,
            total_deposits: pool.total_deposits,
            total_withdrawals: pool.total_withdrawals + amount,
            total_premiums: pool.total_premiums,
            total_payouts: pool.total_payouts,
            min_deposit: pool.min_deposit,
            max_utilization: pool.max_utilization,
            is_active: pool.is_active,
            created_at: pool.created_at,
        };
        Mapping::set(pools, pool_id, updated);

        // Update balances
        Mapping::set(pool_balances, pool_id, balance - amount);

        // Update LP supply
        let current_supply: u64 = Mapping::get(lp_supply, pool_id);
        Mapping::set(lp_supply, pool_id, current_supply - lp_burned);
    }

    // === Internal Functions (called by other contracts) ===

    // Record premium payment (from policy_registry)
    transition record_premium(pool_id: field, amount: u64) {
        return then finalize(pool_id, amount);
    }

    finalize record_premium(pool_id: field, amount: u64) {
        let pool: PoolState = Mapping::get(pools, pool_id);
        let updated: PoolState = PoolState {
            id: pool.id,
            name_hash: pool.name_hash,
            coverage_types: pool.coverage_types,
            total_deposits: pool.total_deposits,
            total_withdrawals: pool.total_withdrawals,
            total_premiums: pool.total_premiums + amount,
            total_payouts: pool.total_payouts,
            min_deposit: pool.min_deposit,
            max_utilization: pool.max_utilization,
            is_active: pool.is_active,
            created_at: pool.created_at,
        };
        Mapping::set(pools, pool_id, updated);

        let balance: u64 = Mapping::get(pool_balances, pool_id);
        Mapping::set(pool_balances, pool_id, balance + amount);
    }

    // Record claim payout (from claims_engine)
    transition record_payout(pool_id: field, amount: u64) {
        return then finalize(pool_id, amount);
    }

    finalize record_payout(pool_id: field, amount: u64) {
        let balance: u64 = Mapping::get(pool_balances, pool_id);
        assert(balance >= amount);

        let pool: PoolState = Mapping::get(pools, pool_id);
        let updated: PoolState = PoolState {
            id: pool.id,
            name_hash: pool.name_hash,
            coverage_types: pool.coverage_types,
            total_deposits: pool.total_deposits,
            total_withdrawals: pool.total_withdrawals,
            total_premiums: pool.total_premiums,
            total_payouts: pool.total_payouts + amount,
            min_deposit: pool.min_deposit,
            max_utilization: pool.max_utilization,
            is_active: pool.is_active,
            created_at: pool.created_at,
        };
        Mapping::set(pools, pool_id, updated);

        Mapping::set(pool_balances, pool_id, balance - amount);
    }
}
```

### Layer: Frontend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Pool helpers | `lib/aleo/pool.ts` | Pool contract interactions |
| Pool list | `pages/pools/index.tsx` | Browse all pools |
| Pool detail | `pages/pools/[id].tsx` | Single pool view |
| Deposit modal | `components/pools/deposit-modal.tsx` | Deposit flow |
| Withdraw modal | `components/pools/withdraw-modal.tsx` | Withdraw flow |
| Position card | `components/pools/position-card.tsx` | LP position display |
| Pool stats API | `pages/api/v1/pools/[id]/stats.ts` | Pool statistics |

```bash
# Additional dependencies
npm install recharts
```

#### Pool Contract Helpers

```typescript
// lib/aleo/pool.ts
import { aleoClient, programManager } from './client';

export interface PoolState {
  id: string;
  nameHash: string;
  coverageTypes: number;
  totalDeposits: bigint;
  totalWithdrawals: bigint;
  totalPremiums: bigint;
  totalPayouts: bigint;
  minDeposit: bigint;
  maxUtilization: bigint;
  isActive: boolean;
  createdAt: bigint;
}

export interface LPToken {
  owner: string;
  poolId: string;
  amount: bigint;
  depositedAt: bigint;
}

export interface PoolStats {
  tvl: bigint;
  apy: number;
  utilizationRate: number;
  totalDepositors: number;
  totalPolicies: number;
}

// Fetch pool state from chain
export async function getPool(poolId: string): Promise<PoolState | null> {
  try {
    const data = await aleoClient.getProgramMapping(
      'risk_pool.aleo',
      'pools',
      poolId
    );
    return data ? parsePoolState(data) : null;
  } catch {
    return null;
  }
}

// Fetch pool balance
export async function getPoolBalance(poolId: string): Promise<bigint> {
  const data = await aleoClient.getProgramMapping(
    'risk_pool.aleo',
    'pool_balances',
    poolId
  );
  return data ? BigInt(data.replace('u64', '')) : BigInt(0);
}

// Fetch LP supply
export async function getLPSupply(poolId: string): Promise<bigint> {
  const data = await aleoClient.getProgramMapping(
    'risk_pool.aleo',
    'lp_supply',
    poolId
  );
  return data ? BigInt(data.replace('u64', '')) : BigInt(0);
}

// Deposit to pool
export async function deposit(
  wallet: WalletAdapter,
  poolId: string,
  amount: bigint
): Promise<{ txId: string; lpToken: LPToken }> {
  const tx = await programManager.buildTransaction(
    'risk_pool.aleo',
    'deposit',
    [poolId, `${amount}u64`]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  // Parse LP token from transaction outputs
  const lpToken = parseLPTokenFromTx(result);

  return {
    txId: result.transactionId,
    lpToken,
  };
}

// Withdraw from pool
export async function withdraw(
  wallet: WalletAdapter,
  lpToken: LPToken,
  amount: bigint
): Promise<{ txId: string; withdrawnAmount: bigint }> {
  const tx = await programManager.buildTransaction(
    'risk_pool.aleo',
    'withdraw',
    [serializeLPToken(lpToken), `${amount}u64`]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return {
    txId: result.transactionId,
    withdrawnAmount: amount, // Simplified 1:1
  };
}

// Get user's LP tokens
export async function getUserPositions(
  wallet: WalletAdapter
): Promise<LPToken[]> {
  const viewKey = await wallet.getViewKey();
  const records = await aleoClient.getRecordsForProgram(
    viewKey,
    'risk_pool.aleo'
  );

  return records
    .filter((r) => r.recordType === 'LPToken')
    .map(parseLPToken);
}

// Calculate pool stats
export function calculatePoolStats(
  pool: PoolState,
  balance: bigint,
  lpSupply: bigint
): PoolStats {
  const tvl = balance;

  // APY calculation (simplified)
  // In production: (total_premiums - total_payouts) / tvl * annualization_factor
  const netPremiums = pool.totalPremiums - pool.totalPayouts;
  const apy = tvl > 0 ? Number(netPremiums * BigInt(100)) / Number(tvl) : 0;

  // Utilization = (total_deposits - balance) / total_deposits
  const utilized = pool.totalDeposits - balance;
  const utilizationRate = pool.totalDeposits > 0
    ? Number(utilized * BigInt(10000)) / Number(pool.totalDeposits) / 100
    : 0;

  return {
    tvl,
    apy,
    utilizationRate,
    totalDepositors: 0, // Would need indexer for this
    totalPolicies: 0,
  };
}
```

#### Pool List Page

```typescript
// pages/pools/index.tsx
import { RootLayout } from '@/components/layout/root-layout';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Droplets, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatPercent } from '@/lib/utils';

// Pool IDs are known at deployment time
const POOL_IDS = [
  { id: 'flight_pool_001field', name: 'Flight Delay Pool' },
  { id: 'weather_pool_001field', name: 'Weather Event Pool' },
];

export default function PoolsPage() {
  return (
    <RootLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Liquidity Pools</h1>
            <p className="text-muted-foreground">
              Provide liquidity to earn premiums from insurance policies
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {POOL_IDS.map((pool) => (
            <PoolCard key={pool.id} poolId={pool.id} name={pool.name} />
          ))}
        </div>
      </div>
    </RootLayout>
  );
}

function PoolCard({ poolId, name }: { poolId: string; name: string }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['pool-stats', poolId],
    queryFn: () => fetchPoolStats(poolId),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <CardTitle>{name}</CardTitle>
        </div>
        <Badge variant={stats?.isActive ? 'default' : 'secondary'}>
          {stats?.isActive ? 'Active' : 'Paused'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">TVL</p>
            <p className="text-2xl font-bold">
              {formatCurrency(stats?.tvl || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">APY</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPercent(stats?.apy || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Utilization</p>
            <p className="text-2xl font-bold">
              {formatPercent(stats?.utilizationRate || 0)}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Min deposit: {formatCurrency(stats?.minDeposit || 100)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/pools/${poolId}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          <Link href={`/pools/${poolId}?action=deposit`} className="flex-1">
            <Button className="w-full">Deposit</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Pool Detail Page with Deposit/Withdraw

```typescript
// pages/pools/[id].tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootLayout } from '@/components/layout/root-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletStore } from '@/stores/wallet-store';
import { deposit, withdraw, getPool, getPoolBalance, getUserPositions } from '@/lib/aleo/pool';
import { TransactionStatus } from '@/components/transactions/tx-status';
import { PoolChart } from '@/components/charts/pool-chart';
import { toast } from 'sonner';

export default function PoolDetailPage() {
  const router = useRouter();
  const { id: poolId, action } = router.query;
  const { wallet, isConnected } = useWalletStore();
  const queryClient = useQueryClient();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const { data: pool, isLoading: poolLoading } = useQuery({
    queryKey: ['pool', poolId],
    queryFn: () => getPool(poolId as string),
    enabled: !!poolId,
  });

  const { data: positions } = useQuery({
    queryKey: ['positions', wallet?.address],
    queryFn: () => getUserPositions(wallet!),
    enabled: !!wallet && isConnected,
  });

  const userPosition = positions?.find((p) => p.poolId === poolId);

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error('Wallet not connected');
      const amount = BigInt(parseFloat(depositAmount) * 1_000_000); // Convert to microunits
      const result = await deposit(wallet, poolId as string, amount);
      setPendingTxId(result.txId);
      return result;
    },
    onSuccess: () => {
      toast.success('Deposit submitted');
      setDepositAmount('');
    },
    onError: (error) => {
      toast.error(`Deposit failed: ${error.message}`);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!wallet || !userPosition) throw new Error('No position');
      const amount = BigInt(parseFloat(withdrawAmount) * 1_000_000);
      const result = await withdraw(wallet, userPosition, amount);
      setPendingTxId(result.txId);
      return result;
    },
    onSuccess: () => {
      toast.success('Withdrawal submitted');
      setWithdrawAmount('');
    },
    onError: (error) => {
      toast.error(`Withdrawal failed: ${error.message}`);
    },
  });

  const handleTxConfirmed = () => {
    setPendingTxId(null);
    queryClient.invalidateQueries({ queryKey: ['pool', poolId] });
    queryClient.invalidateQueries({ queryKey: ['positions'] });
  };

  if (poolLoading) {
    return (
      <RootLayout>
        <div className="container py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout>
      <div className="container py-8 space-y-8">
        {/* Pool Header */}
        <div>
          <Button variant="ghost" onClick={() => router.back()}>
            ← Back to Pools
          </Button>
          <h1 className="text-3xl font-bold mt-4">{pool?.nameHash || 'Pool'}</h1>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Value Locked" value={formatCurrency(pool?.tvl)} />
          <StatCard label="APY" value={`${pool?.apy.toFixed(2)}%`} variant="success" />
          <StatCard label="Utilization" value={`${pool?.utilizationRate.toFixed(1)}%`} />
          <StatCard label="Your Position" value={formatCurrency(userPosition?.amount)} />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>TVL History</CardTitle>
          </CardHeader>
          <CardContent>
            <PoolChart poolId={poolId as string} />
          </CardContent>
        </Card>

        {/* Deposit/Withdraw Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue={action === 'withdraw' ? 'withdraw' : 'deposit'}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-4">
                {!isConnected ? (
                  <Alert>
                    <AlertDescription>
                      Connect your wallet to deposit
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Amount (ALEO)</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Min deposit: {formatCurrency(pool?.minDeposit)}
                      </p>
                    </div>

                    {pendingTxId && (
                      <TransactionStatus
                        txId={pendingTxId}
                        onConfirmed={handleTxConfirmed}
                      />
                    )}

                    <Button
                      className="w-full"
                      onClick={() => depositMutation.mutate()}
                      disabled={depositMutation.isPending || !depositAmount}
                    >
                      {depositMutation.isPending ? 'Depositing...' : 'Deposit'}
                    </Button>
                  </>
                )}
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4">
                {!isConnected ? (
                  <Alert>
                    <AlertDescription>
                      Connect your wallet to withdraw
                    </AlertDescription>
                  </Alert>
                ) : !userPosition ? (
                  <Alert>
                    <AlertDescription>
                      You don't have a position in this pool
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount (LP Tokens)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Available: {formatCurrency(userPosition.amount)}
                      </p>
                    </div>

                    {pendingTxId && (
                      <TransactionStatus
                        txId={pendingTxId}
                        onConfirmed={handleTxConfirmed}
                      />
                    )}

                    <Button
                      className="w-full"
                      onClick={() => withdrawMutation.mutate()}
                      disabled={withdrawMutation.isPending || !withdrawAmount}
                    >
                      {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </RootLayout>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: 'success';
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${variant === 'success' ? 'text-green-600' : ''}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
```

#### Position Card Component

```typescript
// components/pools/position-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Droplets, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { LPToken } from '@/lib/aleo/pool';

interface PositionCardProps {
  position: LPToken;
  poolName: string;
  currentValue: bigint;
  earnedYield: bigint;
  apy: number;
}

export function PositionCard({
  position,
  poolName,
  currentValue,
  earnedYield,
  apy,
}: PositionCardProps) {
  const isPositive = earnedYield > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{poolName}</CardTitle>
        </div>
        <Badge variant="outline" className="text-green-600">
          <TrendingUp className="mr-1 h-3 w-3" />
          {formatPercent(apy)} APY
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Value</p>
            <p className="text-2xl font-bold">{formatCurrency(currentValue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Earned Yield</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {formatCurrency(earnedYield)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/pools/${position.poolId}?action=deposit`} className="flex-1">
            <Button variant="outline" className="w-full">
              Deposit More
            </Button>
          </Link>
          <Link href={`/pools/${position.poolId}?action=withdraw`} className="flex-1">
            <Button variant="secondary" className="w-full">
              Withdraw
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          LP Tokens: {position.amount.toString()}
        </p>
      </CardContent>
    </Card>
  );
}
```

### Layer: Integration

| Deliverable | Purpose |
|-------------|---------|
| Real deposits | Funds flow to contract |
| LP token minting | Receive tokens on deposit |
| Real withdrawals | Burn tokens, receive funds |
| Balance updates | UI reflects chain state |

---

## Testable Outcomes

Wave 4 is testable when you can complete this flow:

### E2E Test: Deposit → Receive LP Tokens → View Position → Withdraw

```
1. Connect wallet
2. Navigate to /pools
3. Click "Deposit" on Flight Delay Pool
4. Enter amount (e.g., 100 ALEO)
5. Confirm transaction
6. Wait for confirmation
7. See LP tokens in wallet
8. Navigate to /dashboard/pools
9. See position card with current value
10. Click "Withdraw"
11. Enter withdrawal amount
12. Confirm transaction
13. See funds returned to wallet
```

### Contract Tests

```bash
cd contracts/risk_pool
leo test

# Expected:
# ✓ test_create_pool
# ✓ test_deposit
# ✓ test_withdraw
# ✓ test_record_premium
# ✓ test_record_payout
# All tests passed!
```

### Integration Test

```typescript
// tests/integration/pool.test.ts
import { describe, it, expect } from 'vitest';
import { deposit, withdraw, getPool, getUserPositions } from '@/lib/aleo/pool';
import { createTestWallet, waitForTx } from './helpers';

describe('Pool Integration', () => {
  const poolId = 'flight_pool_001field';
  let wallet: TestWallet;

  beforeAll(async () => {
    wallet = await createTestWallet();
  });

  it('deposits and receives LP tokens', async () => {
    const { txId, lpToken } = await deposit(wallet, poolId, BigInt(100_000_000));
    await waitForTx(txId);

    expect(lpToken.amount).toBeGreaterThan(0);
    expect(lpToken.poolId).toBe(poolId);
  });

  it('shows position in dashboard', async () => {
    const positions = await getUserPositions(wallet);
    const position = positions.find((p) => p.poolId === poolId);

    expect(position).toBeDefined();
    expect(position?.amount).toBeGreaterThan(0);
  });

  it('withdraws and burns LP tokens', async () => {
    const positions = await getUserPositions(wallet);
    const position = positions.find((p) => p.poolId === poolId)!;

    const { txId, withdrawnAmount } = await withdraw(
      wallet,
      position,
      position.amount
    );
    await waitForTx(txId);

    expect(withdrawnAmount).toBe(position.amount);
  });
});
```

---

## Commands

```bash
# Build and test contract
cd contracts/risk_pool
leo build
leo test

# Deploy to testnet
leo deploy --network testnet

# Install chart library
npm install recharts

# Run frontend
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

Wave 4 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | Contract compiles | `leo build` succeeds |
| 2 | Contract tests pass | `leo test` all green |
| 3 | Contract deployed | Transaction confirmed |
| 4 | Pool list shows pools | UI renders pool cards |
| 5 | Deposit works | LP tokens received |
| 6 | Withdraw works | Funds returned |
| 7 | Position displays | Dashboard shows position |
| 8 | TVL updates | Balance reflects deposits |
| 9 | Charts render | TVL history visible |
| 10 | Full cycle completes | Deposit → view → withdraw |

---

## Next Wave Preview

**Wave 5: Policy Registry** will add core insurance functionality:
- Deploy `policy_registry.aleo` contract
- 6-step policy purchase wizard
- ZK proof generation (client-side)
- Premium calculator
- Test: Select coverage → generate proof → pay premium → policy on-chain
