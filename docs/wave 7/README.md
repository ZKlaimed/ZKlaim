# Wave 7: Database & Indexer

**Objective:** Off-chain data layer for performance, querying, and real-time updates.

**Theme:** Production infrastructure - fast reads, reliable writes

**Depends on:** Wave 6

---

## Overview

Wave 7 adds the data infrastructure needed for a production application. While blockchain provides truth, querying it directly is slow. We add PostgreSQL for fast reads, an indexer to sync chain state, Redis for caching, and Bull for background jobs.

This wave is primarily infrastructure - contracts receive bug fixes from integration testing.

---

## Deliverables

### Layer: Contracts

| Deliverable | Purpose |
|-------------|---------|
| Bug fixes | Issues discovered during Waves 2-6 |
| Gas optimizations | Reduce transaction costs |
| Test coverage | Additional edge case tests |

No new contracts in this wave - focus on hardening existing contracts.

### Layer: Frontend/Backend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Prisma schema | `prisma/schema.prisma` | Database models |
| Prisma client | `lib/db.ts` | Database singleton |
| Blockchain indexer | `lib/indexer/` | Sync chain to DB |
| Redis cache | `lib/cache/` | Performance caching |
| Bull queue | `lib/queue/` | Background job processing |
| Full API routes | `pages/api/v1/` | REST API endpoints |
| WebSocket server | `lib/ws/` | Real-time updates |

```bash
# Install dependencies
npm install prisma @prisma/client ioredis bull
npm install -D @types/bull
```

#### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User account (linked to wallet)
model User {
  id            String    @id @default(cuid())
  walletAddress String    @unique
  email         String?   @unique
  name          String?

  policies      Policy[]
  claims        Claim[]
  positions     PoolPosition[]
  attestations  Attestation[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Attestation record (cached from chain)
model Attestation {
  id              String   @id @default(cuid())
  onChainId       String   @unique

  userId          String
  user            User     @relation(fields: [userId], references: [id])

  attestorId      String
  attestationType Int
  claimsHash      String
  expiresAt       DateTime

  isRevoked       Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId, attestationType])
}

// Policy record (cached from chain)
model Policy {
  id              String       @id @default(cuid())
  onChainId       String       @unique
  policyNumber    String       @unique

  userId          String
  user            User         @relation(fields: [userId], references: [id])

  coverageType    CoverageType
  coverageAmount  Decimal
  premiumAmount   Decimal
  deductible      Decimal      @default(0)

  status          PolicyStatus @default(ACTIVE)
  riskTier        RiskTier     @default(MEDIUM)

  effectiveDate   DateTime
  expirationDate  DateTime

  poolId          String
  pool            Pool         @relation(fields: [poolId], references: [id])

  // Coverage-specific data
  flightCoverage  Json?
  weatherCoverage Json?

  proofHash       String?
  metadata        Json?

  claims          Claim[]

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([userId, status])
  @@index([poolId, status])
  @@index([expirationDate])
}

// Claim record (cached from chain)
model Claim {
  id            String      @id @default(cuid())
  onChainId     String      @unique
  claimNumber   String      @unique

  policyId      String
  policy        Policy      @relation(fields: [policyId], references: [id])

  userId        String
  user          User        @relation(fields: [userId], references: [id])

  claimType     ClaimType
  status        ClaimStatus @default(SUBMITTED)

  claimedAmount  Decimal
  approvedAmount Decimal?

  description   String?
  evidence      Json?
  oracleData    Json?

  submittedAt   DateTime    @default(now())
  processedAt   DateTime?
  paidAt        DateTime?

  payoutTxHash  String?

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([userId, status])
  @@index([policyId])
}

// Liquidity pool (cached from chain)
model Pool {
  id              String     @id @default(cuid())
  onChainId       String     @unique
  name            String
  description     String?

  coverageTypes   CoverageType[]
  status          PoolStatus @default(ACTIVE)

  // Cached balances (updated by indexer)
  totalDeposits   Decimal    @default(0)
  totalWithdrawals Decimal   @default(0)
  totalPremiums   Decimal    @default(0)
  totalPayouts    Decimal    @default(0)
  currentBalance  Decimal    @default(0)
  lpTokenSupply   Decimal    @default(0)

  minDeposit      Decimal    @default(100)
  maxUtilization  Decimal    @default(0.8)

  policies        Policy[]
  positions       PoolPosition[]
  history         PoolSnapshot[]

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

// LP position (cached from chain)
model PoolPosition {
  id            String   @id @default(cuid())
  onChainId     String   @unique

  poolId        String
  pool          Pool     @relation(fields: [poolId], references: [id])

  userId        String
  user          User     @relation(fields: [userId], references: [id])

  depositAmount Decimal
  lpTokens      Decimal
  currentValue  Decimal

  depositedAt   DateTime @default(now())

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([poolId, userId])
  @@index([userId])
}

// Pool historical snapshots for charts
model PoolSnapshot {
  id          String   @id @default(cuid())
  poolId      String
  pool        Pool     @relation(fields: [poolId], references: [id])

  tvl         Decimal
  apy         Decimal
  utilization Decimal

  timestamp   DateTime @default(now())

  @@index([poolId, timestamp])
}

// Oracle data (cached from chain)
model OracleData {
  id            String   @id @default(cuid())
  onChainKey    String   @unique

  oracleId      String
  dataType      Int
  identifier    String

  value         BigInt
  dataHash      String
  rawData       Json?

  blockHeight   BigInt
  timestamp     DateTime

  createdAt     DateTime @default(now())

  @@index([dataType, identifier])
  @@index([timestamp])
}

// Blockchain sync state
model IndexerState {
  id              String   @id @default("main")
  lastBlockHeight BigInt   @default(0)
  lastBlockHash   String?
  lastSyncedAt    DateTime @default(now())
}

// Enums
enum CoverageType {
  FLIGHT_DELAY
  WEATHER_EVENT
  AUTO_COLLISION
  HEALTH_BASIC
}

enum PolicyStatus {
  DRAFT
  PENDING_PROOF
  PENDING_PAYMENT
  ACTIVE
  EXPIRED
  CANCELLED
  CLAIMED
  SUSPENDED
}

enum RiskTier {
  LOW
  MEDIUM
  HIGH
  VERY_HIGH
}

enum ClaimType {
  PARAMETRIC
  TRADITIONAL
}

enum ClaimStatus {
  SUBMITTED
  VALIDATING
  ORACLE_PENDING
  APPROVED
  REJECTED
  PAID
  APPEALED
}

enum PoolStatus {
  ACTIVE
  PAUSED
  DEPRECATED
}
```

#### Blockchain Indexer

```typescript
// lib/indexer/index.ts
import { prisma } from '@/lib/db';
import { aleoClient } from '@/lib/aleo/client';
import { indexerQueue } from '@/lib/queue';

const PROGRAMS_TO_INDEX = [
  'attestation_registry.aleo',
  'oracle_bridge.aleo',
  'risk_pool.aleo',
  'policy_registry.aleo',
  'claims_engine.aleo',
];

export class BlockchainIndexer {
  private isRunning = false;
  private pollInterval = 10000; // 10 seconds

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('Starting blockchain indexer...');

    while (this.isRunning) {
      try {
        await this.syncBlocks();
      } catch (error) {
        console.error('Indexer error:', error);
      }

      await sleep(this.pollInterval);
    }
  }

  stop() {
    this.isRunning = false;
  }

  async syncBlocks() {
    // Get current state
    const state = await prisma.indexerState.findUnique({
      where: { id: 'main' },
    });

    const lastSyncedHeight = state?.lastBlockHeight ?? BigInt(0);
    const currentHeight = await aleoClient.getLatestHeight();

    if (currentHeight <= lastSyncedHeight) {
      return; // Already synced
    }

    console.log(`Syncing blocks ${lastSyncedHeight + 1n} to ${currentHeight}`);

    // Process blocks in batches
    const BATCH_SIZE = 100;
    let startHeight = lastSyncedHeight + 1n;

    while (startHeight <= currentHeight) {
      const endHeight = startHeight + BigInt(BATCH_SIZE) - 1n;
      const actualEnd = endHeight > currentHeight ? currentHeight : endHeight;

      await this.processBlockRange(startHeight, actualEnd);

      startHeight = actualEnd + 1n;
    }

    // Update state
    await prisma.indexerState.upsert({
      where: { id: 'main' },
      update: {
        lastBlockHeight: currentHeight,
        lastSyncedAt: new Date(),
      },
      create: {
        id: 'main',
        lastBlockHeight: currentHeight,
        lastSyncedAt: new Date(),
      },
    });
  }

  async processBlockRange(start: bigint, end: bigint) {
    // Fetch transactions in range
    for (let height = start; height <= end; height++) {
      const block = await aleoClient.getBlock(Number(height));

      if (!block.transactions) continue;

      for (const tx of block.transactions) {
        await this.processTransaction(tx, height);
      }
    }
  }

  async processTransaction(tx: AleoTransaction, blockHeight: bigint) {
    // Check if transaction involves our programs
    const programId = tx.deployment?.program || tx.execution?.transitions?.[0]?.program;

    if (!programId || !PROGRAMS_TO_INDEX.includes(programId)) {
      return;
    }

    // Queue for processing
    await indexerQueue.add('process-transaction', {
      txId: tx.id,
      programId,
      blockHeight: blockHeight.toString(),
      transitions: tx.execution?.transitions || [],
    });
  }
}

export const indexer = new BlockchainIndexer();
```

#### Transaction Handlers

```typescript
// lib/indexer/handlers/policy-handler.ts
import { prisma } from '@/lib/db';
import { parsePolicyFromTransition } from '@/lib/aleo/policy';

export async function handlePolicyCreated(data: {
  txId: string;
  blockHeight: string;
  transition: AleoTransition;
}) {
  const policy = parsePolicyFromTransition(data.transition);

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { walletAddress: policy.owner },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { walletAddress: policy.owner },
    });
  }

  // Create policy record
  await prisma.policy.create({
    data: {
      onChainId: policy.policyId,
      policyNumber: generatePolicyNumber(),
      userId: user.id,
      coverageType: mapCoverageType(policy.coverageType),
      coverageAmount: policy.coverageAmount,
      premiumAmount: policy.premiumAmount,
      status: 'ACTIVE',
      effectiveDate: new Date(Number(policy.effectiveDate) * 1000),
      expirationDate: new Date(Number(policy.expirationDate) * 1000),
      poolId: policy.poolId,
      proofHash: policy.proofHash,
    },
  });

  console.log(`Indexed policy: ${policy.policyId}`);
}

export async function handlePolicyCancelled(data: {
  txId: string;
  policyId: string;
}) {
  await prisma.policy.update({
    where: { onChainId: data.policyId },
    data: { status: 'CANCELLED' },
  });
}

export async function handlePolicyExpired(data: {
  txId: string;
  policyId: string;
}) {
  await prisma.policy.update({
    where: { onChainId: data.policyId },
    data: { status: 'EXPIRED' },
  });
}

export async function handlePolicyClaimed(data: {
  txId: string;
  policyId: string;
}) {
  await prisma.policy.update({
    where: { onChainId: data.policyId },
    data: { status: 'CLAIMED' },
  });
}
```

#### Redis Cache Layer

```typescript
// lib/cache/index.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache TTLs
const TTL = {
  POOL_STATS: 60,        // 1 minute
  USER_POLICIES: 30,     // 30 seconds
  ORACLE_DATA: 300,      // 5 minutes
  POOL_HISTORY: 3600,    // 1 hour
};

// Pool stats cache
export async function getCachedPoolStats(poolId: string) {
  const cached = await redis.get(`pool:${poolId}:stats`);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedPoolStats(poolId: string, stats: object) {
  await redis.setex(`pool:${poolId}:stats`, TTL.POOL_STATS, JSON.stringify(stats));
}

// User policies cache
export async function getCachedUserPolicies(userId: string) {
  const cached = await redis.get(`user:${userId}:policies`);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedUserPolicies(userId: string, policies: object[]) {
  await redis.setex(`user:${userId}:policies`, TTL.USER_POLICIES, JSON.stringify(policies));
}

// Invalidation
export async function invalidatePoolCache(poolId: string) {
  await redis.del(`pool:${poolId}:stats`);
  await redis.del(`pool:${poolId}:history`);
}

export async function invalidateUserCache(userId: string) {
  const keys = await redis.keys(`user:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

#### Bull Queue for Background Jobs

```typescript
// lib/queue/index.ts
import Queue from 'bull';
import { redis } from '@/lib/cache';

// Indexer queue - processes blockchain events
export const indexerQueue = new Queue('indexer', {
  redis: process.env.REDIS_URL,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Notification queue - sends emails, push notifications
export const notificationQueue = new Queue('notifications', {
  redis: process.env.REDIS_URL,
});

// Oracle queue - fetches and submits oracle data
export const oracleQueue = new Queue('oracle', {
  redis: process.env.REDIS_URL,
});

// Process indexer jobs
indexerQueue.process('process-transaction', async (job) => {
  const { programId, transitions } = job.data;

  for (const transition of transitions) {
    const handler = getTransitionHandler(programId, transition.function);
    if (handler) {
      await handler(job.data);
    }
  }
});

// Process notification jobs
notificationQueue.process('send-email', async (job) => {
  const { to, template, data } = job.data;
  await sendEmail(to, template, data);
});

notificationQueue.process('send-push', async (job) => {
  const { userId, title, body } = job.data;
  await sendPushNotification(userId, title, body);
});
```

#### Full API Routes

```typescript
// pages/api/v1/policies/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getCachedUserPolicies, setCachedUserPolicies } from '@/lib/cache';
import { getSession } from '@/lib/auth';
import { createPolicySchema } from '@/lib/validations/policy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return getPolicies(req, res, session.user.id);
  }

  if (req.method === 'POST') {
    return createPolicy(req, res, session.user.id);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getPolicies(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { status, page = '1', limit = '20' } = req.query;

  // Check cache
  const cacheKey = `${status || 'all'}_${page}_${limit}`;
  const cached = await getCachedUserPolicies(`${userId}:${cacheKey}`);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  // Query database
  const where = {
    userId,
    ...(status && { status: status as PolicyStatus }),
  };

  const [policies, total] = await Promise.all([
    prisma.policy.findMany({
      where,
      include: { pool: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    }),
    prisma.policy.count({ where }),
  ]);

  const result = {
    policies,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  };

  // Cache result
  await setCachedUserPolicies(`${userId}:${cacheKey}`, result);

  return res.json({ success: true, data: result });
}

async function createPolicy(req: NextApiRequest, res: NextApiResponse, userId: string) {
  // Validate request body
  const parsed = createPolicySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
    });
  }

  const { coverageType, coverageAmount, poolId, ...rest } = parsed.data;

  // Create pending policy (will be confirmed when blockchain tx confirms)
  const policy = await prisma.policy.create({
    data: {
      onChainId: '', // Set when confirmed
      policyNumber: generatePolicyNumber(),
      userId,
      coverageType,
      coverageAmount,
      premiumAmount: rest.premiumAmount,
      status: 'PENDING_PAYMENT',
      effectiveDate: new Date(rest.effectiveDate),
      expirationDate: new Date(rest.expirationDate),
      poolId,
      flightCoverage: rest.flightCoverage,
      weatherCoverage: rest.weatherCoverage,
    },
  });

  return res.status(201).json({ success: true, data: policy });
}
```

#### WebSocket for Real-Time Updates

```typescript
// lib/ws/index.ts
import { WebSocketServer, WebSocket } from 'ws';
import { redis } from '@/lib/cache';

const wss = new WebSocketServer({ noServer: true });

// Track connections by user
const userConnections = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    ws.close();
    return;
  }

  // Track connection
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(ws);

  ws.on('close', () => {
    userConnections.get(userId)?.delete(ws);
  });

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case 'subscribe':
        await handleSubscribe(ws, userId, message.channel);
        break;
      case 'unsubscribe':
        await handleUnsubscribe(ws, userId, message.channel);
        break;
    }
  });
});

// Broadcast to user
export function broadcastToUser(userId: string, event: string, data: object) {
  const connections = userConnections.get(userId);
  if (!connections) return;

  const message = JSON.stringify({ event, data, timestamp: Date.now() });

  for (const ws of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

// Broadcast events
export function notifyPolicyCreated(userId: string, policy: object) {
  broadcastToUser(userId, 'policy:created', policy);
}

export function notifyClaimProcessed(userId: string, claim: object) {
  broadcastToUser(userId, 'claim:processed', claim);
}

export function notifyPayoutReceived(userId: string, payout: object) {
  broadcastToUser(userId, 'payout:received', payout);
}
```

### Layer: Integration

| Deliverable | Purpose |
|-------------|---------|
| Events sync to DB | Chain state in PostgreSQL |
| API reads from DB | Fast queries |
| Real-time WebSocket | Instant updates |
| Cache layer | Sub-second responses |

---

## Testable Outcomes

Wave 7 is testable when:

### Performance Test: Transaction Indexed in Seconds

```
1. Submit a policy creation transaction
2. Transaction confirms on chain
3. Indexer detects transaction (~10 seconds)
4. Policy appears in database
5. API returns policy
6. WebSocket broadcasts event
7. UI updates in real-time
```

### Query Performance Test

```
1. Create 100 test policies
2. Query policies via API
3. First query: < 200ms (DB)
4. Second query: < 50ms (cache)
5. Filter by status: < 100ms
6. Pagination works correctly
```

### Real-Time Test

```
1. Connect WebSocket client
2. Subscribe to policy events
3. Create policy from another session
4. WebSocket receives event < 2 seconds after chain confirmation
5. UI updates without refresh
```

---

## Commands

```bash
# Install dependencies
npm install prisma @prisma/client ioredis bull

# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate client
npx prisma generate

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio

# Start Redis (local development)
redis-server

# Start indexer worker
npm run worker:indexer

# Run frontend
npm run dev
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zklaim?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "ioredis": "^5.x",
    "bull": "^4.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "@types/bull": "^4.x"
  }
}
```

---

## Exit Criteria

Wave 7 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | Prisma schema migrated | `npx prisma migrate` succeeds |
| 2 | Indexer syncs blocks | Chain state in DB |
| 3 | Transactions indexed | < 30 second latency |
| 4 | API queries work | All endpoints return data |
| 5 | Cache layer works | Cache hit rate > 80% |
| 6 | WebSocket connects | Real-time events flow |
| 7 | Background jobs run | Bull queues process |
| 8 | API < 200ms | Performance target met |
| 9 | Contract bug fixes | All issues from Waves 2-6 |
| 10 | Integration tests pass | Full system works |

---

## Next Wave Preview

**Wave 8: Governance** will add decentralized protocol management:
- Deploy `governance.aleo` contract
- Proposal creation and voting
- Parameter update execution
- Emergency pause functionality
