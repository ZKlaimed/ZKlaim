# Wave 4: Database & API Foundation

**Objective:** Set up PostgreSQL, Prisma ORM, and core API routes.

**Track:** A (Frontend)
**Depends on:** Wave 3

---

## Deliverables

### 1. Database Setup

```bash
npm install prisma @prisma/client zod
npx prisma init
```

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `.env` | Database connection string |
| `.env.example` | Environment template |

### 2. Prisma Schema Models

```
prisma/schema.prisma
├── User              # User accounts
├── Policy            # Insurance policies
├── Claim             # Insurance claims
├── Pool              # Liquidity pools
├── PoolPosition      # LP positions
├── OracleData        # Oracle submissions
└── Attestation       # Identity attestations
```

### 3. API Routes Structure

```
pages/api/v1/
├── policies/
│   ├── index.ts          # GET (list), POST (create)
│   ├── [id].ts           # GET, PATCH, DELETE
│   ├── [id]/renew.ts     # POST - renew policy
│   └── [id]/cancel.ts    # POST - cancel policy
├── claims/
│   ├── index.ts          # GET (list), POST (create)
│   ├── [id].ts           # GET, PATCH
│   └── [id]/evidence.ts  # POST - upload evidence
└── pools/
    ├── index.ts          # GET (list)
    ├── [id].ts           # GET pool details
    ├── [id]/stats.ts     # GET pool statistics
    ├── [id]/deposit.ts   # POST - deposit liquidity
    ├── [id]/withdraw.ts  # POST - withdraw liquidity
    └── positions.ts      # GET user positions
```

### 4. API Utilities

| File | Purpose |
|------|---------|
| `lib/api/response.ts` | Standardized API responses |
| `lib/api/errors.ts` | Error handling utilities |
| `lib/api/validation.ts` | Request validation helpers |
| `lib/api/auth.ts` | API authentication middleware |

### 5. Validation Schemas (Zod)

```
lib/validations/
├── policy.ts         # Policy validation schemas
├── claim.ts          # Claim validation schemas
├── pool.ts           # Pool validation schemas
└── common.ts         # Shared validation schemas
```

### 6. Database Client

| File | Purpose |
|------|---------|
| `lib/db.ts` | Prisma client singleton |
| `lib/db/policies.ts` | Policy database operations |
| `lib/db/claims.ts` | Claim database operations |
| `lib/db/pools.ts` | Pool database operations |

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  walletAddress String    @unique
  email         String?   @unique
  name          String?

  policies      Policy[]
  claims        Claim[]
  positions     PoolPosition[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Policy {
  id              String       @id @default(cuid())
  policyNumber    String       @unique
  onChainId       String?

  userId          String
  user            User         @relation(fields: [userId], references: [id])

  coverageType    CoverageType
  coverageAmount  Decimal
  deductible      Decimal      @default(0)
  premiumAmount   Decimal

  status          PolicyStatus @default(DRAFT)
  riskTier        RiskTier     @default(MEDIUM)
  riskScore       Int          @default(50)

  effectiveDate   DateTime
  expirationDate  DateTime

  poolId          String
  pool            Pool         @relation(fields: [poolId], references: [id])

  flightCoverage  Json?        // FlightCoverage object
  weatherCoverage Json?        // WeatherCoverage object

  proofHash       String?
  attestationId   String?
  metadata        Json?

  claims          Claim[]

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  deletedAt       DateTime?
}

model Claim {
  id            String      @id @default(cuid())
  claimNumber   String      @unique
  onChainId     String?

  policyId      String
  policy        Policy      @relation(fields: [policyId], references: [id])

  userId        String
  user          User        @relation(fields: [userId], references: [id])

  claimType     ClaimType
  status        ClaimStatus @default(SUBMITTED)

  claimAmount   Decimal
  approvedAmount Decimal?

  description   String?
  evidence      Json?       // Evidence array
  oracleData    Json?       // OracleData object

  submittedAt   DateTime    @default(now())
  processedAt   DateTime?
  paidAt        DateTime?

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Pool {
  id              String     @id @default(cuid())
  name            String
  description     String?

  coverageTypes   CoverageType[]
  status          PoolStatus @default(ACTIVE)

  totalDeposits   Decimal    @default(0)
  totalWithdrawals Decimal   @default(0)
  totalPremiums   Decimal    @default(0)
  totalPayouts    Decimal    @default(0)

  minDeposit      Decimal    @default(100)
  maxUtilization  Decimal    @default(0.8)

  policies        Policy[]
  positions       PoolPosition[]

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

model PoolPosition {
  id            String   @id @default(cuid())

  poolId        String
  pool          Pool     @relation(fields: [poolId], references: [id])

  userId        String
  user          User     @relation(fields: [userId], references: [id])

  depositAmount Decimal
  lpTokens      Decimal

  depositedAt   DateTime @default(now())

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([poolId, userId])
}

model OracleData {
  id          String   @id @default(cuid())

  source      String   // Oracle provider name
  dataType    String   // "flight", "weather", etc.
  identifier  String   // Flight number, location, etc.

  data        Json     // Raw oracle data
  signature   String?  // Oracle signature

  timestamp   DateTime
  expiresAt   DateTime?

  createdAt   DateTime @default(now())

  @@index([dataType, identifier, timestamp])
}

model Attestation {
  id            String   @id @default(cuid())

  attestorId    String
  subjectHash   String   // Hash of user identity

  attestationType String
  claims        Json     // Attested claims

  signature     String
  expiresAt     DateTime?
  revokedAt     DateTime?

  createdAt     DateTime @default(now())

  @@index([subjectHash, attestationType])
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

---

## API Response Format

### Success Response
```typescript
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 100,
    "totalPages": 5
  }
}
```

### Error Response
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "coverageAmount": ["Must be greater than 0"]
    }
  }
}
```

---

## Zod Validation Example

```typescript
// lib/validations/policy.ts
import { z } from 'zod';

export const createPolicySchema = z.object({
  coverageType: z.enum(['FLIGHT_DELAY', 'WEATHER_EVENT']),
  coverageAmount: z.number().positive(),
  deductible: z.number().min(0).optional(),
  effectiveDate: z.string().datetime(),
  durationDays: z.number().int().min(1).max(365),

  flightCoverage: z.object({
    flightNumber: z.string().regex(/^[A-Z]{2}\d{1,4}$/),
    departureAirport: z.string().length(3),
    arrivalAirport: z.string().length(3),
    scheduledDeparture: z.string().datetime(),
    delayThresholdMinutes: z.number().int().min(30),
  }).optional(),

  weatherCoverage: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    locationName: z.string(),
    eventType: z.enum(['HURRICANE', 'TORNADO', 'FLOOD', ...]),
    threshold: z.number().positive(),
  }).optional(),
});
```

---

## Testing Checklist

- [ ] PostgreSQL database running
- [ ] Prisma migrations run successfully
- [ ] Seed data creates test records
- [ ] All API endpoints return proper responses
- [ ] Validation rejects invalid data with clear errors
- [ ] Authentication required for protected endpoints
- [ ] Pagination works correctly
- [ ] Filtering and sorting work
- [ ] Error responses are consistent

---

## Commands

```bash
# Install dependencies
npm install prisma @prisma/client zod

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
```

---

## Environment Variables

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/zklaim?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "prisma": "^5.x"
  }
}
```

---

## Exit Criteria

Wave 4 is complete when:
1. PostgreSQL database running and connected
2. All Prisma models created and migrated
3. Database seed script works
4. All CRUD API endpoints functional
5. Zod validation on all inputs
6. Proper error handling and responses
7. API authentication working
8. Prisma Studio accessible
