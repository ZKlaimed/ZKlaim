# Wave 10: Production Launch Prep

**Objective:** Final polish, testing, monitoring, and production deployment.

**Track:** Final Integration
**Depends on:** Wave 9

---

## Deliverables

### 1. Oracle Integration

```bash
npm install @sendgrid/mail
```

| File | Purpose |
|------|---------|
| `lib/oracles/index.ts` | Oracle service orchestrator |
| `lib/oracles/aviationstack.ts` | Flight data provider |
| `lib/oracles/openweathermap.ts` | Weather data provider |
| `lib/oracles/scheduler.ts` | Oracle polling scheduler |

**API Routes:**
| Route | Purpose |
|-------|---------|
| `pages/api/v1/oracles/flight/[flightNumber].ts` | Get flight status |
| `pages/api/v1/oracles/weather/[location].ts` | Get weather data |
| `pages/api/cron/oracle-update.ts` | Scheduled oracle updates |

### 2. Notifications

| File | Purpose |
|------|---------|
| `lib/notifications/index.ts` | Notification orchestrator |
| `lib/notifications/email.ts` | Email notifications (SendGrid) |
| `lib/notifications/push.ts` | Browser push notifications |
| `lib/notifications/templates/` | Email templates |

### 3. Real-time & Caching

```bash
npm install ioredis
```

| File | Purpose |
|------|---------|
| `pages/api/ws.ts` | WebSocket endpoint |
| `lib/ws/index.ts` | WebSocket server |
| `lib/ws/rooms.ts` | Room management |
| `hooks/use-realtime.ts` | Real-time data hook |
| `lib/cache/redis.ts` | Redis client |
| `lib/cache/policies.ts` | Policy caching |
| `lib/cache/pools.ts` | Pool caching |

### 4. Security & Monitoring

```bash
npm install @sentry/nextjs
```

| File | Purpose |
|------|---------|
| `middleware.ts` | Rate limiting, security headers |
| `lib/monitoring/sentry.ts` | Error tracking |
| `lib/monitoring/analytics.ts` | Usage analytics |
| `pages/api/health.ts` | Health check endpoint |

### 5. Testing Suite

```bash
npm install -D vitest @testing-library/react playwright
```

| Directory | Purpose |
|-----------|---------|
| `tests/unit/` | Unit tests |
| `tests/integration/` | Integration tests |
| `tests/e2e/` | End-to-end tests |
| `vitest.config.ts` | Vitest configuration |
| `playwright.config.ts` | Playwright configuration |

### 6. CI/CD

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Continuous Integration |
| `.github/workflows/deploy.yml` | Deployment pipeline |

### 7. Final Polish

| Task | Files |
|------|-------|
| Loading states | All pages |
| Error boundaries | `components/common/error-boundary.tsx` |
| 404 page | `pages/404.tsx` |
| 500 page | `pages/500.tsx` |
| SEO meta tags | All pages |
| Favicon | `public/favicon.ico` |
| Social sharing | `public/og-image.png` |

---

## Oracle Integration

### Flight Data (AviationStack)
```typescript
// lib/oracles/aviationstack.ts
const AVIATIONSTACK_URL = 'http://api.aviationstack.com/v1/flights';

export async function getFlightStatus(
  flightNumber: string,
  date: string
): Promise<FlightStatus> {
  const response = await fetch(
    `${AVIATIONSTACK_URL}?access_key=${API_KEY}&flight_iata=${flightNumber}`
  );

  const data = await response.json();
  const flight = data.data[0];

  return {
    flightNumber: flight.flight.iata,
    status: flight.flight_status,
    scheduledDeparture: new Date(flight.departure.scheduled),
    actualDeparture: flight.departure.actual
      ? new Date(flight.departure.actual)
      : null,
    delayMinutes: calculateDelay(flight),
  };
}
```

### Weather Data (OpenWeatherMap)
```typescript
// lib/oracles/openweathermap.ts
const OWM_URL = 'https://api.openweathermap.org/data/2.5';

export async function getWeatherAlert(
  lat: number,
  lon: number
): Promise<WeatherAlert | null> {
  const response = await fetch(
    `${OWM_URL}/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );

  const data = await response.json();

  if (data.alerts && data.alerts.length > 0) {
    return {
      event: data.alerts[0].event,
      severity: data.alerts[0].severity,
      start: new Date(data.alerts[0].start * 1000),
      end: new Date(data.alerts[0].end * 1000),
    };
  }

  return null;
}
```

### Oracle Scheduler
```typescript
// lib/oracles/scheduler.ts
import cron from 'node-cron';

export function startOracleScheduler() {
  // Check flights every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    const activePolicies = await getActiveFlightPolicies();

    for (const policy of activePolicies) {
      const status = await getFlightStatus(
        policy.flightCoverage.flightNumber,
        policy.flightCoverage.departureDate
      );

      if (status.delayMinutes >= policy.flightCoverage.delayThreshold) {
        await triggerParametricClaim(policy, status);
      }
    }
  });

  // Check weather every hour
  cron.schedule('0 * * * *', async () => {
    const activePolicies = await getActiveWeatherPolicies();

    for (const policy of activePolicies) {
      const alert = await getWeatherAlert(
        policy.weatherCoverage.location.latitude,
        policy.weatherCoverage.location.longitude
      );

      if (alert && meetsThreshold(alert, policy.weatherCoverage)) {
        await triggerParametricClaim(policy, alert);
      }
    }
  });
}
```

---

## Email Notifications

```typescript
// lib/notifications/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(params: EmailParams) {
  const { to, template, data } = params;

  const html = await renderTemplate(template, data);

  await sgMail.send({
    to,
    from: 'notifications@zklaim.xyz',
    subject: getSubject(template, data),
    html,
  });
}

// Templates
export const EMAIL_TEMPLATES = {
  POLICY_PURCHASED: 'policy-purchased',
  CLAIM_SUBMITTED: 'claim-submitted',
  CLAIM_APPROVED: 'claim-approved',
  CLAIM_PAID: 'claim-paid',
  POLICY_EXPIRING: 'policy-expiring',
};
```

---

## Security Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting with sliding window
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? 'anonymous';
    const limit = rateLimits.get(ip);
    const now = Date.now();

    if (limit && limit.resetAt > now && limit.count >= 100) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    rateLimits.set(ip, {
      count: (limit?.resetAt ?? 0) > now ? limit!.count + 1 : 1,
      resetAt: now + 60000, // 1 minute window
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Testing Suite

### Unit Tests (Vitest)
```typescript
// tests/unit/premium-calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePremium } from '@/lib/premium';

describe('Premium Calculator', () => {
  it('calculates flight delay premium correctly', () => {
    const premium = calculatePremium({
      coverageType: 'flight_delay',
      coverageAmount: 1000,
      durationDays: 1,
      riskFactors: { airline: 'UA' },
    });

    expect(premium.totalPremium).toBeGreaterThan(0);
    expect(premium.totalPremium).toBeLessThan(premium.coverageAmount * 0.1);
  });

  it('applies discounts correctly', () => {
    const premium = calculatePremium({
      coverageType: 'flight_delay',
      coverageAmount: 1000,
      durationDays: 1,
      discountCodes: ['EARLY10'],
    });

    expect(premium.discounts).toHaveLength(1);
    expect(premium.discounts[0].amount).toBe(premium.basePremium * 0.1);
  });
});
```

### Integration Tests
```typescript
// tests/integration/policy-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from './helpers';

describe('Policy Purchase Flow', () => {
  let client: TestClient;

  beforeAll(async () => {
    client = await createTestClient();
    await client.authenticate();
  });

  it('creates a policy successfully', async () => {
    const quote = await client.post('/api/v1/policies/quote', {
      coverageType: 'flight_delay',
      coverageAmount: 1000,
    });

    expect(quote.success).toBe(true);
    expect(quote.data.totalPremium).toBeGreaterThan(0);

    const policy = await client.post('/api/v1/policies', {
      ...quote.data,
      flightNumber: 'UA1234',
      departureDate: '2024-06-01',
    });

    expect(policy.success).toBe(true);
    expect(policy.data.status).toBe('active');
  });
});
```

### E2E Tests (Playwright)
```typescript
// tests/e2e/purchase-policy.spec.ts
import { test, expect } from '@playwright/test';

test('user can purchase a flight delay policy', async ({ page }) => {
  // Connect wallet
  await page.goto('/');
  await page.click('[data-testid="connect-wallet"]');
  await page.click('[data-testid="mock-wallet"]'); // Use mock for E2E

  // Start policy wizard
  await page.goto('/dashboard/policies/new');

  // Step 1: Select coverage
  await page.click('[data-testid="coverage-flight-delay"]');
  await page.click('[data-testid="next-step"]');

  // Step 2: Configure
  await page.fill('[data-testid="flight-number"]', 'UA1234');
  await page.fill('[data-testid="coverage-amount"]', '1000');
  await page.click('[data-testid="next-step"]');

  // ... continue through steps

  // Verify success
  await expect(page.locator('[data-testid="policy-created"]')).toBeVisible();
});
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

---

## Health Check Endpoint

```typescript
// pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/cache/redis';
import { aleoClient } from '@/lib/aleo/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const checks = {
    database: false,
    redis: false,
    aleo: false,
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {}

  try {
    // Check Redis
    await redis.ping();
    checks.redis = true;
  } catch {}

  try {
    // Check Aleo network
    await aleoClient.getLatestHeight();
    checks.aleo = true;
  } catch {}

  const healthy = Object.values(checks).every(Boolean);

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  });
}
```

---

## Final Checklist

### Performance
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 90
- [ ] Lighthouse Best Practices > 90
- [ ] Lighthouse SEO > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.9s

### Security
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (React/sanitization)
- [ ] CSRF protection
- [ ] Secrets not in code

### Reliability
- [ ] Error boundaries on all pages
- [ ] Graceful degradation for offline
- [ ] Health check endpoint working
- [ ] Sentry error tracking
- [ ] Database backups configured

### Testing
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Manual QA checklist complete

### Documentation
- [ ] API documentation complete
- [ ] User guide/FAQ
- [ ] Developer onboarding guide
- [ ] Runbook for operations

---

## Commands

```bash
# Install dependencies
npm install @sentry/nextjs @sendgrid/mail
npm install -D vitest @testing-library/react playwright

# Run tests
npm run test          # Unit tests
npm run test:e2e      # E2E tests

# Build & analyze
npm run build
npm run analyze       # Bundle analysis

# Deploy
npm run deploy:staging
npm run deploy:production
```

---

## Environment Variables (Production)

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Aleo
ALEO_NETWORK_URL=https://api.explorer.aleo.org/v1/mainnet
ALEO_PRIVATE_KEY=...

# Oracles
AVIATIONSTACK_API_KEY=...
OPENWEATHERMAP_API_KEY=...

# Notifications
SENDGRID_API_KEY=...

# Monitoring
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://zklaim.xyz
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "@sentry/nextjs": "^7.x",
    "@sendgrid/mail": "^7.x"
  },
  "devDependencies": {
    "vitest": "^1.x",
    "@testing-library/react": "^14.x",
    "playwright": "^1.x"
  }
}
```

---

## Exit Criteria

Wave 10 is complete when:
1. Oracle integration working (flight + weather)
2. Email notifications sending
3. Rate limiting active
4. Security headers configured
5. Sentry error tracking
6. All tests passing (unit, integration, E2E)
7. Lighthouse scores > 90
8. CI/CD pipeline green
9. Production environment ready
10. Documentation complete
11. Health check endpoint working
12. Manual QA sign-off
