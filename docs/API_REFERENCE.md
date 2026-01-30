# API Reference

## Overview

The ZK-Underwrite API provides RESTful endpoints for interacting with the protocol. The API handles off-chain operations while blockchain interactions are performed through the Aleo SDK.

**Base URL:** `/api/v1`

## Authentication

### Methods

- **JWT tokens** via NextAuth.js for session management
- **Wallet signature verification** for sensitive operations
- **Rate limiting** per user/IP

### Headers

```
Authorization: Bearer <jwt_token>
X-Wallet-Address: <aleo_address>
X-Signature: <wallet_signature>  // For sensitive operations
```

## Response Format

All responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `AUTH_INVALID` | Invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

---

## Policies

### List User's Policies

```
GET /api/v1/policies
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (active, expired, cancelled) |
| `coverageType` | string | Filter by coverage type |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "pol_abc123",
      "aleoId": "field_hash",
      "coverageType": "FLIGHT_DELAY",
      "coverageAmount": "50000",
      "premium": "1250",
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-02-01T00:00:00Z",
      "status": "ACTIVE",
      "triggerParams": {
        "flightNumber": "AA123",
        "delayThresholdMinutes": 180
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### Get Policy Details

```
GET /api/v1/policies/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "pol_abc123",
    "aleoId": "field_hash",
    "coverageType": "FLIGHT_DELAY",
    "coverageAmount": "50000",
    "premium": "1250",
    "deductible": "0",
    "startBlock": 1000000,
    "endBlock": 1100000,
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-02-01T00:00:00Z",
    "status": "ACTIVE",
    "triggerParams": {
      "flightNumber": "AA123",
      "flightDate": "2025-01-15",
      "delayThresholdMinutes": 180
    },
    "pool": {
      "id": "pool_flight",
      "name": "Flight Delay Pool"
    },
    "createTxId": "aleo_tx_hash"
  }
}
```

### Create Policy

```
POST /api/v1/policies
```

**Request Body:**

```typescript
interface CreatePolicyRequest {
  coverageType: 'flight' | 'weather' | 'auto' | 'health';
  coverageAmount: string;  // BigInt as string
  durationBlocks: number;
  triggerParams: {
    // Flight delay
    flightNumber?: string;
    flightDate?: string;
    delayThresholdMinutes?: number;

    // Weather
    location?: { lat: number; lng: number };
    measurementType?: 'rainfall' | 'temperature' | 'wind';
    threshold?: number;
  };
  eligibilityProof?: {
    proof: string;  // Base64 encoded
    publicInputs: string[];
  };
  poolId: string;
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "policyId": "pol_abc123",
    "transactionId": "aleo_tx_pending",
    "status": "pending",
    "estimatedConfirmation": 10,
    "policy": {
      "id": "pol_abc123",
      "coverageType": "FLIGHT_DELAY",
      "coverageAmount": "50000",
      "startBlock": 1000000,
      "endBlock": 1100000,
      "premium": "1250",
      "status": "PENDING"
    }
  }
}
```

### Renew Policy

```
POST /api/v1/policies/:id/renew
```

**Request Body:**

```json
{
  "extensionBlocks": 100000,
  "additionalPremium": "1250"
}
```

### Cancel Policy

```
POST /api/v1/policies/:id/cancel
```

**Response:**

```json
{
  "success": true,
  "data": {
    "policyId": "pol_abc123",
    "refundAmount": "625",
    "transactionId": "aleo_tx_hash"
  }
}
```

---

## Claims

### List User's Claims

```
GET /api/v1/claims
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `policyId` | string | Filter by policy |
| `page` | number | Page number |
| `limit` | number | Items per page |

### Get Claim Details

```
GET /api/v1/claims/:id
```

### Submit Claim

```
POST /api/v1/claims
```

**Request Body:**

```typescript
interface SubmitClaimRequest {
  policyId: string;
  claimType: 'parametric' | 'traditional';

  // For parametric claims
  oracleDataId?: string;

  // For traditional claims
  claimAmount?: string;
  evidenceHash?: string;
  description?: string;

  // Proof of policy ownership
  ownershipProof: {
    proof: string;
    challenge: string;
  };
}
```

**Response (Parametric):**

```json
{
  "success": true,
  "data": {
    "claimId": "clm_xyz789",
    "transactionId": "aleo_tx_hash",
    "status": "paid",
    "payoutAmount": "50000",
    "payoutTxId": "aleo_payout_tx"
  }
}
```

**Response (Traditional):**

```json
{
  "success": true,
  "data": {
    "claimId": "clm_xyz789",
    "status": "pending",
    "estimatedReviewTime": 48,
    "requiredDocuments": ["police_report", "repair_estimate"]
  }
}
```

### Upload Claim Evidence

```
POST /api/v1/claims/:id/evidence
```

**Request:** Multipart form data

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Evidence file |
| `type` | string | Document type |
| `description` | string | Optional description |

---

## Pools

### List All Pools

```
GET /api/v1/pools
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "pool_flight",
      "name": "Flight Delay Pool",
      "coverageType": "FLIGHT_DELAY",
      "totalDeposits": "2400000",
      "totalCoverage": "8200000",
      "currentApy": 8.2,
      "utilizationRate": 34.2,
      "isActive": true
    }
  ]
}
```

### Get Pool Details

```
GET /api/v1/pools/:id
```

### Get Pool Statistics

```
GET /api/v1/pools/:id/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalDeposits": "2400000",
    "totalCoverage": "8200000",
    "totalPremiums": "180000",
    "totalClaimsPaid": "75000",
    "activePolicies": 1247,
    "historicalLossRatio": 0.42,
    "currentApy": 8.2,
    "utilizationRate": 34.2,
    "reserveRatio": 2.9
  }
}
```

### Deposit to Pool

```
POST /api/v1/pools/:id/deposit
```

**Request Body:**

```json
{
  "amount": "10000"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transactionId": "aleo_tx_hash",
    "depositAmount": "10000",
    "lpTokensReceived": "9850",
    "position": {
      "totalDeposited": "10000",
      "totalLpTokens": "9850",
      "currentValue": "10000"
    }
  }
}
```

### Withdraw from Pool

```
POST /api/v1/pools/:id/withdraw
```

**Request Body:**

```json
{
  "lpTokenAmount": "5000"
}
```

### Get User's Pool Positions

```
GET /api/v1/pools/:id/positions
```

---

## Oracles

### Get Flight Status

```
GET /api/v1/oracles/flight/:flightNumber
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Flight date (YYYY-MM-DD) |

**Response:**

```json
{
  "success": true,
  "data": {
    "flightNumber": "AA123",
    "flightDate": "2025-01-15",
    "scheduledDeparture": "2025-01-15T10:00:00Z",
    "actualDeparture": "2025-01-15T14:30:00Z",
    "delayMinutes": 270,
    "status": "delayed",
    "source": "aviationstack",
    "oracleDataId": "oracle_data_id"
  }
}
```

### Get Weather Data

```
GET /api/v1/oracles/weather/:location
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `type` | string | Measurement type (rainfall, temperature, wind) |
| `date` | string | Date (YYYY-MM-DD) |

### Subscribe to Oracle Updates

```
POST /api/v1/oracles/subscribe
```

**Request Body:**

```json
{
  "type": "flight",
  "params": {
    "flightNumber": "AA123",
    "flightDate": "2025-01-15"
  },
  "webhookUrl": "https://example.com/webhook"
}
```

---

## Attestations

### List Attestation Providers

```
GET /api/v1/attestations/providers
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "provider_dmv",
      "name": "State DMV",
      "type": "dmv",
      "trustScore": 0.95,
      "isActive": true
    }
  ]
}
```

### Verify Attestation

```
POST /api/v1/attestations/verify
```

**Request Body:**

```json
{
  "providerId": "provider_dmv",
  "attestationData": "base64_encoded_data",
  "signature": "provider_signature"
}
```

### Request New Attestation

```
POST /api/v1/attestations/request
```

**Request Body:**

```json
{
  "providerId": "provider_dmv",
  "attestationType": "driving_record",
  "subjectData": {
    "licenseNumber": "encrypted_data"
  }
}
```

---

## WebSocket Events

Connect to `/api/v1/ws` for real-time updates.

### Events

| Event | Description |
|-------|-------------|
| `policy:created` | Policy creation confirmed |
| `policy:expired` | Policy has expired |
| `claim:submitted` | Claim submitted |
| `claim:approved` | Claim approved |
| `claim:paid` | Claim payout completed |
| `oracle:update` | New oracle data available |
| `pool:update` | Pool statistics updated |

### Subscribe

```javascript
// Connect to WebSocket
const ws = new WebSocket('/api/v1/ws');

// Subscribe to events
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['policy:*', 'claim:*']
}));

// Handle events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.payload);
};
```

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| Public endpoints | 100 req/min |
| Authenticated endpoints | 300 req/min |
| WebSocket connections | 5 per user |

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp
