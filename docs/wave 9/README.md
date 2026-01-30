# Wave 9: Polish & Security

**Objective:** Production-quality testnet release with comprehensive testing and security hardening.

**Theme:** Ready for real users

**Depends on:** Wave 8

---

## Overview

Wave 9 is about hardening everything built in Waves 1-8. We add comprehensive tests, security reviews, error handling, loading states, mobile optimization, and accessibility. By the end, the protocol is ready for public testnet users.

---

## Deliverables

### Layer: Contracts

| Deliverable | Purpose |
|-------------|---------|
| Security hardening | Audit checklist, access controls |
| Comprehensive tests | Edge cases, fuzz testing |
| Gas optimization | Reduce transaction costs |
| Documentation | NatSpec comments, README |

#### Security Checklist

```markdown
# Contract Security Checklist

## Access Control
- [ ] Admin functions protected by address checks
- [ ] Multi-sig for critical operations (pause, upgrades)
- [ ] Role-based access where appropriate

## Input Validation
- [ ] All inputs validated before use
- [ ] Bounds checking on numeric values
- [ ] String/field length limits

## Arithmetic Safety
- [ ] Overflow protection on all math
- [ ] Balance checks before transfers
- [ ] Division by zero protection

## State Management
- [ ] Reentrancy protection (Aleo handles this)
- [ ] State consistency across mappings
- [ ] Proper initialization

## Privacy
- [ ] Sensitive data in records, not mappings
- [ ] Only hashes in public state
- [ ] No information leakage

## Time/Block Handling
- [ ] Timestamp bounds validation
- [ ] Block height used consistently
- [ ] Expiration checks correct

## Cross-Program Calls
- [ ] Verify called programs
- [ ] Handle failures gracefully
- [ ] State consistency on partial failure
```

#### Comprehensive Test Suite

```leo
// contracts/policy_registry/tests/comprehensive_test.leo

// === Edge Cases ===

@test
function test_create_policy_at_max_coverage() {
    let result = create_policy(
        coverage_type: 1u8,
        coverage_amount: 18446744073709551615u64, // Max u64
        // ...
    );
    // Should succeed or fail gracefully
}

@test
function test_create_policy_at_min_coverage() {
    let result = create_policy(
        coverage_type: 1u8,
        coverage_amount: 1u64,
        // ...
    );
    assert(result.coverage_amount == 1u64);
}

@test
function test_cannot_claim_inactive_policy() {
    // Create and cancel policy
    let policy = create_policy(...);
    cancel_policy(policy);

    // Attempt claim should fail
    // assert_fails(process_claim(...));
}

@test
function test_cannot_double_claim() {
    let policy = create_policy(...);
    let claim1 = process_claim(policy, ...);

    // Second claim should fail
    // assert_fails(process_claim(policy, ...));
}

// === Boundary Tests ===

@test
function test_expiration_boundary() {
    // Create policy expiring at exact block
    let policy = create_policy(
        expiration_date: current_block_height,
        // ...
    );

    // Claim at exact expiration should succeed
    let claim = process_claim(policy, ...);
    assert(claim.status == STATUS_PAID);

    // Claim after expiration should fail (separate test)
}

@test
function test_threshold_boundary() {
    // Oracle value exactly at threshold
    let oracle_value = 120u64; // Threshold
    let result = process_parametric_claim(
        trigger_value: oracle_value,
        threshold: 120u64,
        // ...
    );
    assert(result.status == STATUS_PAID);
}

// === Stress Tests ===

@test
function test_many_policies_same_pool() {
    // Create 100 policies in same pool
    for i in 0..100 {
        create_policy(pool_id: test_pool, ...);
    }

    // Verify pool state correct
    let pool = get_pool(test_pool);
    assert(pool.active_policies == 100);
}
```

### Layer: Frontend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Landing redesign | `pages/index.tsx`, `components/landing/` | Polish homepage |
| Error boundaries | `components/common/error-boundary.tsx` | Graceful error handling |
| Loading states | All pages | Skeleton loaders everywhere |
| Notifications | `lib/notifications/`, `components/notifications/` | Toast system |
| Mobile audit | All components | Responsive fixes |
| A11y audit | All components | WCAG 2.1 AA compliance |

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/user-event playwright @axe-core/playwright
```

#### Error Boundary

```typescript
// components/common/error-boundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We encountered an unexpected error. This has been reported to our team.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.href = '/'}>
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Global Loading States

```typescript
// components/common/page-loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export function PolicyListLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

export function PoolListLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-64" />
      ))}
    </div>
  );
}
```

#### Notification System

```typescript
// components/notifications/toast-provider.tsx
'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
      expand
      richColors
    />
  );
}

// lib/notifications/toast.ts
import { toast } from 'sonner';

export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },

  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },

  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },

  txPending: (txId: string) => {
    toast.loading('Transaction pending', {
      description: `TX: ${txId.slice(0, 8)}...`,
      id: txId,
    });
  },

  txConfirmed: (txId: string) => {
    toast.success('Transaction confirmed', {
      description: `TX: ${txId.slice(0, 8)}...`,
      id: txId,
    });
  },

  txFailed: (txId: string, error: string) => {
    toast.error('Transaction failed', {
      description: error,
      id: txId,
    });
  },
};
```

#### Accessibility Improvements

```typescript
// components/ui/skip-link.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:border focus:rounded"
    >
      Skip to main content
    </a>
  );
}

// components/common/loading.tsx - Accessible loading
export function Loading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Accessible form labels
export function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </Label>
      {cloneElement(children as React.ReactElement, { id, 'aria-describedby': error ? `${id}-error` : undefined })}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Layer: Integration

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| E2E test suite | `tests/e2e/` | Playwright tests |
| Integration tests | `tests/integration/` | API and contract tests |
| Load testing | `tests/load/` | Performance under stress |
| Security testing | Manual + automated | Penetration testing |
| Sentry setup | `sentry.*.config.ts` | Error monitoring |

#### E2E Test Suite

```typescript
// tests/e2e/policy-purchase.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Policy Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('completes full purchase flow', async ({ page }) => {
    // Connect wallet
    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="mock-wallet"]');
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();

    // Navigate to new policy
    await page.goto('/dashboard/policies/new');

    // Step 1: Coverage
    await page.click('[data-testid="coverage-flight-delay"]');
    await page.click('[data-testid="next-step"]');

    // Step 2: Configure
    await page.fill('[data-testid="flight-number"]', 'UA1234');
    await page.fill('[data-testid="coverage-amount"]', '1000');
    await page.click('[data-testid="next-step"]');

    // Step 3: Attestation
    await page.click('[data-testid="attestation-0"]');
    await page.click('[data-testid="next-step"]');

    // Step 4: Proof
    await page.click('[data-testid="generate-proof"]');
    await expect(page.locator('[data-testid="proof-complete"]')).toBeVisible({ timeout: 90000 });
    await page.click('[data-testid="next-step"]');

    // Step 5: Review
    await page.click('[data-testid="accept-terms"]');
    await page.click('[data-testid="next-step"]');

    // Step 6: Confirm
    await page.click('[data-testid="confirm-purchase"]');
    await expect(page.locator('[data-testid="tx-confirmed"]')).toBeVisible({ timeout: 30000 });

    // Verify redirect
    await expect(page).toHaveURL(/\/dashboard\/policies\/[a-z0-9]+/);
  });

  test('handles validation errors gracefully', async ({ page }) => {
    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="mock-wallet"]');

    await page.goto('/dashboard/policies/new');

    // Try to proceed without selection
    await page.click('[data-testid="next-step"]');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Select coverage');
  });

  test('passes accessibility audit', async ({ page }) => {
    await page.goto('/dashboard/policies/new');

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

#### Integration Tests

```typescript
// tests/integration/full-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnvironment, cleanupTestEnvironment } from './helpers';

describe('Full Insurance Flow Integration', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = await createTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment(env);
  });

  it('completes full insurance lifecycle', async () => {
    const { wallet, oracleService } = env;

    // 1. Deposit to pool
    const { txId: depositTxId, lpToken } = await deposit(
      wallet,
      'flight_pool_001field',
      BigInt(10000_000_000)
    );
    await waitForTx(depositTxId);
    expect(lpToken.amount).toBeGreaterThan(0);

    // 2. Create policy
    const proof = await generateEligibilityProof({
      attestationId: env.testAttestation.id,
      attestationType: 1,
      claims: { eligible: true },
      coverageType: 1,
      coverageAmount: BigInt(1000_000_000),
    });

    const { txId: policyTxId, policy } = await createPolicy(wallet, {
      coverageType: 1,
      coverageAmount: BigInt(1000_000_000),
      premiumAmount: BigInt(50_000_000),
      durationDays: 7,
      poolId: 'flight_pool_001field',
      proofHash: proof.proofHash,
      attestationCommitment: proof.commitment,
    });
    await waitForTx(policyTxId);
    expect(policy.status).toBe(1); // ACTIVE

    // 3. Oracle submits delay
    await oracleService.submitFlightData('UA1234', '2024-06-01');

    // 4. Auto-trigger processes claim
    const triggerResults = await checkFlightTriggers();
    const triggered = triggerResults.find((r) => r.policyId === policy.policyId);
    expect(triggered?.triggered).toBe(true);

    // 5. Verify payout
    const payouts = await getUserPayouts(wallet);
    const payout = payouts.find((p) => p.policyId === policy.policyId);
    expect(payout).toBeDefined();
    expect(payout?.amount).toBe(BigInt(1000_000_000));

    // 6. Withdraw from pool
    const { txId: withdrawTxId } = await withdraw(wallet, lpToken, lpToken.amount);
    await waitForTx(withdrawTxId);

    // Success!
    console.log('Full lifecycle completed successfully');
  });
});
```

#### Load Testing

```typescript
// tests/load/api-load.test.ts
import { test } from '@playwright/test';

// Run with: npx playwright test tests/load --workers=10
test.describe('API Load Testing', () => {
  test('handles concurrent policy queries', async ({ request }) => {
    const requests = Array.from({ length: 100 }, () =>
      request.get('/api/v1/policies', {
        headers: { Authorization: 'Bearer test-token' },
      })
    );

    const results = await Promise.all(requests);

    const successful = results.filter((r) => r.ok());
    expect(successful.length).toBeGreaterThan(95); // 95% success rate

    const times = results.map((r) => r.headers()['x-response-time']);
    const avgTime = times.reduce((a, b) => a + parseInt(b), 0) / times.length;
    expect(avgTime).toBeLessThan(500); // Under 500ms average
  });

  test('handles concurrent WebSocket connections', async ({ page }) => {
    const connections: WebSocket[] = [];

    for (let i = 0; i < 50; i++) {
      const ws = new WebSocket('ws://localhost:3000/api/ws');
      connections.push(ws);
    }

    // Wait for all to connect
    await Promise.all(
      connections.map(
        (ws) => new Promise((resolve) => (ws.onopen = resolve))
      )
    );

    expect(connections.every((ws) => ws.readyState === WebSocket.OPEN)).toBe(true);

    // Cleanup
    connections.forEach((ws) => ws.close());
  });
});
```

---

## Testable Outcomes

Wave 9 is testable when:

### All Flows Reliable

```
1. Run full E2E test suite: 100% pass rate
2. Run integration tests: 100% pass rate
3. Run contract tests: 100% pass rate
4. Manual QA of all flows: No blockers
```

### Errors Handled

```
1. Disconnect wallet mid-transaction: Graceful error, retry option
2. Network timeout: Clear error message, auto-retry
3. Invalid input: Validation errors shown
4. Contract revert: Error displayed, state preserved
```

### Performance Targets Met

```
1. Landing page: LCP < 2.5s, FID < 100ms, CLS < 0.1
2. Dashboard load: < 3s first load, < 1s cached
3. API responses: p95 < 200ms
4. WebSocket latency: < 100ms
```

### Accessibility Audit

```
1. Lighthouse Accessibility: > 90
2. axe-core: 0 violations
3. Keyboard navigation: All features accessible
4. Screen reader: All content readable
```

---

## Commands

```bash
# Install test dependencies
npm install -D vitest @testing-library/react playwright @axe-core/playwright

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run accessibility audit
npm run test:a11y

# Run load tests
npm run test:load

# Run all tests
npm run test:all

# Lighthouse audit
npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html
```

---

## Dependencies Added

```json
{
  "devDependencies": {
    "vitest": "^1.x",
    "@testing-library/react": "^14.x",
    "@testing-library/user-event": "^14.x",
    "playwright": "^1.x",
    "@axe-core/playwright": "^4.x"
  },
  "dependencies": {
    "@sentry/nextjs": "^7.x"
  }
}
```

---

## Exit Criteria

Wave 9 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | Contract tests 100% | All pass |
| 2 | E2E tests 100% | All pass |
| 3 | Integration tests 100% | All pass |
| 4 | Error boundaries work | Errors caught |
| 5 | Loading states everywhere | No blank screens |
| 6 | Notifications working | Toast system functional |
| 7 | Lighthouse > 90 | All categories |
| 8 | Accessibility audit pass | 0 violations |
| 9 | Mobile responsive | All breakpoints |
| 10 | Sentry configured | Errors tracked |
| 11 | Security review complete | Checklist passed |
| 12 | Load test pass | Performance targets |

---

## Next Wave Preview

**Wave 10: Mainnet Launch** will deploy to production:
- Mainnet contract deployment
- Production environment setup
- CI/CD pipeline
- Monitoring dashboard
- Rate limiting and security headers
- Documentation and runbooks
