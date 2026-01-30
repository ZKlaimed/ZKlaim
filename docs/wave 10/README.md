# Wave 10: Mainnet Launch

**Objective:** Production deployment and go-live.

**Theme:** Ship it

**Depends on:** Wave 9

---

## Overview

Wave 10 is the culmination of all previous waves. We deploy contracts to mainnet, configure production infrastructure, set up monitoring, and launch the protocol. This wave is about operational excellence and a smooth launch.

---

## Deliverables

### Layer: Contracts

| Deliverable | Purpose |
|-------------|---------|
| Mainnet deployment | Deploy all 6 contracts to Aleo mainnet |
| State initialization | Create pools, register oracles, set parameters |
| Monitoring | On-chain activity tracking |
| Emergency procedures | Documented pause/unpause process |

#### Mainnet Deployment Script

```bash
#!/bin/bash
# scripts/deploy-mainnet.sh

set -e

echo "=== ZKLAIM Mainnet Deployment ==="
echo "WARNING: This will deploy to MAINNET!"
read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled"
    exit 1
fi

# Load environment
source .env.mainnet

# Verify balances
echo "Checking deployer balance..."
BALANCE=$(leo balance --network mainnet)
echo "Deployer balance: $BALANCE"

if [ "$BALANCE" -lt "100000000" ]; then
    echo "ERROR: Insufficient balance for deployment"
    exit 1
fi

# Deploy in dependency order
echo ""
echo "=== Deploying Layer 0 (No Dependencies) ==="

echo "Deploying attestation_registry.aleo..."
cd contracts/attestation_registry
leo deploy --network mainnet --private-key $DEPLOYER_PRIVATE_KEY
ATTESTATION_REGISTRY_ADDRESS=$(leo address)
echo "Deployed: $ATTESTATION_REGISTRY_ADDRESS"
cd ../..

echo "Deploying oracle_bridge.aleo..."
cd contracts/oracle_bridge
leo deploy --network mainnet --private-key $DEPLOYER_PRIVATE_KEY
ORACLE_BRIDGE_ADDRESS=$(leo address)
echo "Deployed: $ORACLE_BRIDGE_ADDRESS"
cd ../..

echo "Deploying risk_pool.aleo..."
cd contracts/risk_pool
leo deploy --network mainnet --private-key $DEPLOYER_PRIVATE_KEY
RISK_POOL_ADDRESS=$(leo address)
echo "Deployed: $RISK_POOL_ADDRESS"
cd ../..

echo ""
echo "=== Deploying Layer 1 (Depends on Layer 0) ==="

echo "Deploying policy_registry.aleo..."
cd contracts/policy_registry
leo deploy --network mainnet --private-key $DEPLOYER_PRIVATE_KEY
POLICY_REGISTRY_ADDRESS=$(leo address)
echo "Deployed: $POLICY_REGISTRY_ADDRESS"
cd ../..

echo ""
echo "=== Deploying Layer 2 (Depends on Layer 1) ==="

echo "Deploying claims_engine.aleo..."
cd contracts/claims_engine
leo deploy --network mainnet --private-key $DEPLOYER_PRIVATE_KEY
CLAIMS_ENGINE_ADDRESS=$(leo address)
echo "Deployed: $CLAIMS_ENGINE_ADDRESS"
cd ../..

echo ""
echo "=== Deploying Layer 3 (Depends on All) ==="

echo "Deploying governance.aleo..."
cd contracts/governance
leo deploy --network mainnet --private-key $DEPLOYER_PRIVATE_KEY
GOVERNANCE_ADDRESS=$(leo address)
echo "Deployed: $GOVERNANCE_ADDRESS"
cd ../..

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Contract Addresses:"
echo "  attestation_registry: $ATTESTATION_REGISTRY_ADDRESS"
echo "  oracle_bridge:        $ORACLE_BRIDGE_ADDRESS"
echo "  risk_pool:            $RISK_POOL_ADDRESS"
echo "  policy_registry:      $POLICY_REGISTRY_ADDRESS"
echo "  claims_engine:        $CLAIMS_ENGINE_ADDRESS"
echo "  governance:           $GOVERNANCE_ADDRESS"
echo ""
echo "Save these addresses to .env.production"
```

#### State Initialization Script

```bash
#!/bin/bash
# scripts/initialize-mainnet.sh

set -e

source .env.mainnet

echo "=== Initializing Protocol State ==="

# Create Flight Delay Pool
echo "Creating Flight Delay Pool..."
leo execute risk_pool.aleo create_pool \
    "flight_pool_mainnet001field" \
    "$(echo -n 'Flight Delay Pool' | sha256sum | cut -c1-64)field" \
    "1u8" \
    "100000000u64" \
    "8000u64" \
    --network mainnet \
    --private-key $DEPLOYER_PRIVATE_KEY

# Create Weather Event Pool
echo "Creating Weather Event Pool..."
leo execute risk_pool.aleo create_pool \
    "weather_pool_mainnet001field" \
    "$(echo -n 'Weather Event Pool' | sha256sum | cut -c1-64)field" \
    "2u8" \
    "500000000u64" \
    "7500u64" \
    --network mainnet \
    --private-key $DEPLOYER_PRIVATE_KEY

# Authorize Flight Oracle
echo "Authorizing Flight Oracle..."
leo execute oracle_bridge.aleo authorize_oracle \
    "flight_oracle_001field" \
    "$FLIGHT_ORACLE_ADDRESS" \
    "$(echo -n 'AviationStack Oracle' | sha256sum | cut -c1-64)field" \
    "1u8" \
    --network mainnet \
    --private-key $DEPLOYER_PRIVATE_KEY

# Authorize Weather Oracle
echo "Authorizing Weather Oracle..."
leo execute oracle_bridge.aleo authorize_oracle \
    "weather_oracle_001field" \
    "$WEATHER_ORACLE_ADDRESS" \
    "$(echo -n 'OpenWeatherMap Oracle' | sha256sum | cut -c1-64)field" \
    "2u8" \
    --network mainnet \
    --private-key $DEPLOYER_PRIVATE_KEY

# Register Initial Attestor
echo "Registering Identity Attestor..."
leo execute attestation_registry.aleo register_attestor \
    "attestor_001field" \
    "$ATTESTOR_ADDRESS" \
    "$(echo -n 'ZKLAIM Identity Attestor' | sha256sum | cut -c1-64)field" \
    --network mainnet \
    --private-key $DEPLOYER_PRIVATE_KEY

echo ""
echo "=== Initialization Complete ==="
```

### Layer: Frontend/Backend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| CI/CD pipeline | `.github/workflows/` | Automated deployment |
| Monitoring dashboard | `pages/admin/monitoring.tsx` | System health |
| Rate limiting | `middleware.ts` | API protection |
| Security headers | `next.config.mjs` | HTTP security |
| Documentation | `docs/` | User and developer guides |

#### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: '20'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Unit tests
        run: npm run test

      - name: Build
        run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main' || github.event.inputs.environment == 'staging'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_ALEO_NETWORK: testnet
          NEXT_PUBLIC_API_URL: ${{ secrets.STAGING_API_URL }}

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prebuilt'

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, e2e, deploy-staging]
    if: github.event.inputs.environment == 'production'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_ALEO_NETWORK: mainnet
          NEXT_PUBLIC_API_URL: ${{ secrets.PRODUCTION_API_URL }}

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prebuilt --prod'

      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'ZKLAIM deployed to production'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

#### Security Headers

```javascript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.explorer.aleo.org wss:;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

#### Rate Limiting Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMITS = {
  '/api/v1/policies': 20,     // 20 requests per minute
  '/api/v1/claims': 10,       // 10 requests per minute
  '/api/v1/pools': 60,        // 60 requests per minute
  default: 100,               // 100 requests per minute
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  for (const [key, value] of Object.entries(getSecurityHeaders())) {
    response.headers.set(key, value);
  }

  // Skip rate limiting for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return response;
  }

  // Rate limiting
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;
  const key = `${ip}:${path}`;

  const limit = getPathLimit(path);
  const now = Date.now();

  const current = rateLimitMap.get(key);

  if (current && current.resetAt > now) {
    if (current.count >= limit) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((current.resetAt - now) / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(current.resetAt),
          },
        }
      );
    }
    current.count++;
  } else {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }

  const remaining = limit - (rateLimitMap.get(key)?.count || 0);
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));

  return response;
}

function getPathLimit(path: string): number {
  for (const [pattern, limit] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(pattern)) return limit;
  }
  return RATE_LIMITS.default;
}

function getSecurityHeaders() {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

#### Monitoring Dashboard

```typescript
// pages/admin/monitoring.tsx
import { useQuery } from '@tanstack/react-query';
import { RootLayout } from '@/components/layout/root-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Server, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export default function MonitoringPage() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => fetch('/api/health').then((r) => r.json()),
    refetchInterval: 30000, // Every 30 seconds
  });

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => fetch('/api/admin/metrics').then((r) => r.json()),
    refetchInterval: 60000, // Every minute
  });

  return (
    <RootLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">System Monitoring</h1>

        {/* Health Status */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <HealthCard
            title="Database"
            icon={<Database className="h-5 w-5" />}
            status={health?.checks?.database}
          />
          <HealthCard
            title="Redis"
            icon={<Server className="h-5 w-5" />}
            status={health?.checks?.redis}
          />
          <HealthCard
            title="Aleo Network"
            icon={<Zap className="h-5 w-5" />}
            status={health?.checks?.aleo}
          />
          <HealthCard
            title="Indexer"
            icon={<Activity className="h-5 w-5" />}
            status={health?.checks?.indexer}
          />
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <MetricCard
            title="Active Policies"
            value={metrics?.activePolicies || 0}
          />
          <MetricCard
            title="Claims (24h)"
            value={metrics?.claimsLast24h || 0}
          />
          <MetricCard
            title="Total TVL"
            value={`$${(metrics?.totalTVL || 0).toLocaleString()}`}
          />
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.alerts?.length === 0 ? (
              <p className="text-muted-foreground">No recent alerts</p>
            ) : (
              <ul className="space-y-2">
                {metrics?.alerts?.map((alert: any, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>{alert.message}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </RootLayout>
  );
}

function HealthCard({
  title,
  icon,
  status,
}: {
  title: string;
  icon: React.ReactNode;
  status: boolean | undefined;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          {status === undefined ? (
            <Badge variant="secondary">Unknown</Badge>
          ) : status ? (
            <Badge className="bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              Healthy
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Down
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
```

#### Health Check Endpoint

```typescript
// pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/cache';
import { aleoClient } from '@/lib/aleo/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const checks = {
    database: false,
    redis: false,
    aleo: false,
    indexer: false,
  };

  const startTime = Date.now();

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (e) {
    console.error('Database health check failed:', e);
  }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = true;
  } catch (e) {
    console.error('Redis health check failed:', e);
  }

  // Check Aleo network
  try {
    await aleoClient.getLatestHeight();
    checks.aleo = true;
  } catch (e) {
    console.error('Aleo health check failed:', e);
  }

  // Check indexer (is it caught up?)
  try {
    const state = await prisma.indexerState.findUnique({
      where: { id: 'main' },
    });
    const currentHeight = await aleoClient.getLatestHeight();

    if (state && currentHeight - state.lastBlockHeight < 10) {
      checks.indexer = true;
    }
  } catch (e) {
    console.error('Indexer health check failed:', e);
  }

  const healthy = Object.values(checks).every(Boolean);
  const responseTime = Date.now() - startTime;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    checks,
    version: process.env.NEXT_PUBLIC_VERSION || 'unknown',
  });
}
```

### Layer: Integration

| Deliverable | Purpose |
|-------------|---------|
| Mainnet addresses | Production contract addresses |
| Production env | All secrets configured |
| Rollback procedures | Documented recovery |
| Runbook | Operational procedures |

---

## Production Checklist

### Pre-Launch

```markdown
# Pre-Launch Checklist

## Infrastructure
- [ ] Production database provisioned and backed up
- [ ] Redis cluster configured
- [ ] CDN configured
- [ ] SSL certificates installed
- [ ] DNS configured
- [ ] Monitoring dashboards set up
- [ ] Alerting configured (PagerDuty/Slack)

## Security
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] CORS configured correctly
- [ ] API keys rotated
- [ ] Private keys secured (hardware wallet or KMS)
- [ ] Penetration testing completed
- [ ] Bug bounty program launched

## Contracts
- [ ] All contracts audited
- [ ] Mainnet deployment tested on testnet
- [ ] State initialization tested
- [ ] Emergency pause tested
- [ ] Multisig configured for admin functions

## Operations
- [ ] Runbook documented
- [ ] On-call rotation set up
- [ ] Incident response plan documented
- [ ] Rollback procedure documented
- [ ] Communication channels set up

## Legal
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie consent implemented
- [ ] Regulatory compliance reviewed
```

### Launch Day

```markdown
# Launch Day Checklist

## Pre-Deploy (T-4 hours)
- [ ] Team assembled and available
- [ ] Communication channels open
- [ ] Monitoring dashboards visible
- [ ] Rollback tested one final time

## Deploy (T-0)
- [ ] Deploy contracts to mainnet
- [ ] Verify contract addresses
- [ ] Initialize protocol state
- [ ] Deploy frontend to production
- [ ] Verify health checks pass
- [ ] Smoke test all flows

## Post-Deploy (T+1 hour)
- [ ] Monitor error rates
- [ ] Monitor transaction success rates
- [ ] Monitor API latency
- [ ] Check social channels for issues
- [ ] Document any issues

## Post-Launch (T+24 hours)
- [ ] Full metrics review
- [ ] User feedback collected
- [ ] Known issues documented
- [ ] Post-mortem if needed
```

---

## Testable Outcomes

Wave 10 is testable when:

### Production Smoke Test

```
1. Visit https://zklaim.xyz
2. Connect Leo Wallet (mainnet)
3. View pools (real TVL)
4. Create test policy (real transaction)
5. Verify policy appears
6. View governance proposals
7. Check mobile responsiveness
```

### Mainnet Verification

```
1. All 6 contracts deployed and verified
2. Contract addresses documented
3. Initial state correct (pools, oracles, attestors)
4. Cross-program calls work
5. Gas costs as expected
```

### Operational Verification

```
1. Health endpoint returns healthy
2. Indexer within 10 blocks of head
3. API p95 < 200ms
4. Error rate < 0.1%
5. Alerts firing correctly
```

---

## Environment Variables (Production)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/zklaim_prod

# Redis
REDIS_URL=redis://user:pass@host:6379

# Aleo (Mainnet)
NEXT_PUBLIC_ALEO_NETWORK=mainnet
ALEO_NETWORK_URL=https://api.explorer.aleo.org/v1/mainnet
ALEO_DEPLOYER_PRIVATE_KEY=[STORED IN KMS]

# Oracle Keys
FLIGHT_ORACLE_PRIVATE_KEY=[STORED IN KMS]
WEATHER_ORACLE_PRIVATE_KEY=[STORED IN KMS]

# APIs
AVIATIONSTACK_API_KEY=xxx
OPENWEATHERMAP_API_KEY=xxx
SENDGRID_API_KEY=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Auth
NEXTAUTH_SECRET=[GENERATED]
NEXTAUTH_URL=https://zklaim.xyz

# Contract Addresses
NEXT_PUBLIC_ATTESTATION_REGISTRY=xxx
NEXT_PUBLIC_ORACLE_BRIDGE=xxx
NEXT_PUBLIC_RISK_POOL=xxx
NEXT_PUBLIC_POLICY_REGISTRY=xxx
NEXT_PUBLIC_CLAIMS_ENGINE=xxx
NEXT_PUBLIC_GOVERNANCE=xxx
```

---

## Commands

```bash
# Deploy contracts to mainnet
./scripts/deploy-mainnet.sh

# Initialize state
./scripts/initialize-mainnet.sh

# Deploy frontend to production
npm run deploy:production

# Verify deployment
./scripts/verify-mainnet.sh

# Monitor
npm run monitor
```

---

## Exit Criteria

Wave 10 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | All contracts on mainnet | Addresses documented |
| 2 | State initialized | Pools, oracles, attestors exist |
| 3 | Frontend on production | https://zklaim.xyz works |
| 4 | CI/CD pipeline green | Auto-deploy working |
| 5 | Monitoring active | Dashboards visible |
| 6 | Alerting configured | Test alerts received |
| 7 | Health check passes | /api/health returns healthy |
| 8 | Rate limiting active | 429s returned on abuse |
| 9 | Security headers set | Headers verified |
| 10 | Documentation complete | Runbook, API docs, user guide |
| 11 | Smoke test passes | Full flow on mainnet |
| 12 | Go/no-go decision | Team sign-off |

---

## Post-Launch

After successful launch:

1. **Monitor closely** for 72 hours
2. **Collect user feedback** and prioritize fixes
3. **Document lessons learned**
4. **Plan Phase 2** features (auto insurance, health insurance)
5. **Celebrate!**

---

## Congratulations

You've built a privacy-preserving insurance protocol on Aleo. From Wave 1's foundation to Wave 10's mainnet launch, each wave delivered an integrated vertical slice with both frontend and smart contract work.

Key achievements:
- 6 smart contracts deployed
- Full insurance lifecycle (attest → insure → claim → payout)
- ZK proofs for privacy
- Parametric auto-claims via oracles
- Decentralized governance
- Production-ready infrastructure

What started as a plan is now a running protocol. Well done.
