# Wave 3: Oracle Bridge

**Objective:** External data feeds for parametric insurance - the backbone of automated claims.

**Theme:** Real-world data on-chain

**Depends on:** Wave 2

---

## Overview

Wave 3 brings external data onto the blockchain. The Oracle Bridge contract allows authorized oracles to submit verified data (flight status, weather events) that will trigger automatic claim payouts. This is the foundation of parametric insurance.

By the end of Wave 3: Oracle submits flight delay → data visible on-chain and in UI.

---

## Deliverables

### Layer: Contracts

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| `oracle_bridge.aleo` | `contracts/oracle_bridge/src/main.leo` | Oracle data submission and verification |
| Oracle tests | `contracts/oracle_bridge/tests/` | Unit tests |
| Deployment script | `scripts/deploy-oracle.sh` | Testnet deployment |

#### Contract: oracle_bridge.aleo

```leo
// contracts/oracle_bridge/src/main.leo
program oracle_bridge.aleo {

    // Records (private)
    record OracleSubmission {
        owner: address,
        oracle_id: field,
        data_type: u8,
        identifier_hash: field,
        data_hash: field,
        value: u64,
        timestamp: u64,
    }

    // Mappings (public)
    mapping authorized_oracles: field => OracleInfo;
    mapping oracle_data: field => DataRecord;     // key_hash => latest data
    mapping submission_count: field => u64;       // oracle_id => count

    // Structs
    struct OracleInfo {
        oracle_address: address,
        name_hash: field,
        data_types: u8,        // Bitmask of allowed data types
        is_active: bool,
        reputation_score: u64,
        created_at: u64,
    }

    struct DataRecord {
        oracle_id: field,
        data_type: u8,
        identifier_hash: field,
        data_hash: field,
        value: u64,
        timestamp: u64,
        block_height: u64,
    }

    // Data types
    const DATA_TYPE_FLIGHT: u8 = 1u8;
    const DATA_TYPE_WEATHER: u8 = 2u8;
    const DATA_TYPE_PRICE: u8 = 4u8;

    // === Admin Functions ===

    // Authorize a new oracle provider
    transition authorize_oracle(
        oracle_id: field,
        oracle_address: address,
        name_hash: field,
        allowed_data_types: u8
    ) {
        // In production, add admin check
        return then finalize(oracle_id, oracle_address, name_hash, allowed_data_types);
    }

    finalize authorize_oracle(
        oracle_id: field,
        oracle_address: address,
        name_hash: field,
        allowed_data_types: u8
    ) {
        let info: OracleInfo = OracleInfo {
            oracle_address: oracle_address,
            name_hash: name_hash,
            data_types: allowed_data_types,
            is_active: true,
            reputation_score: 100u64,
            created_at: block.height as u64,
        };
        Mapping::set(authorized_oracles, oracle_id, info);
    }

    // Revoke oracle authorization
    transition revoke_oracle(oracle_id: field) {
        return then finalize(oracle_id);
    }

    finalize revoke_oracle(oracle_id: field) {
        let info: OracleInfo = Mapping::get(authorized_oracles, oracle_id);
        let updated: OracleInfo = OracleInfo {
            oracle_address: info.oracle_address,
            name_hash: info.name_hash,
            data_types: info.data_types,
            is_active: false,
            reputation_score: info.reputation_score,
            created_at: info.created_at,
        };
        Mapping::set(authorized_oracles, oracle_id, updated);
    }

    // === Oracle Functions ===

    // Submit oracle data (flight status, weather event, etc.)
    transition submit_data(
        oracle_id: field,
        data_type: u8,
        identifier_hash: field,  // e.g., hash of "UA1234_2024-06-01"
        data_hash: field,        // hash of full data payload
        value: u64,              // numeric value (delay minutes, severity, etc.)
        timestamp: u64
    ) -> OracleSubmission {
        // Create submission record for oracle's records
        let submission: OracleSubmission = OracleSubmission {
            owner: self.caller,
            oracle_id: oracle_id,
            data_type: data_type,
            identifier_hash: identifier_hash,
            data_hash: data_hash,
            value: value,
            timestamp: timestamp,
        };

        // Compute storage key
        let key_hash: field = BHP256::hash_to_field(
            OracleKeyInput { data_type: data_type, identifier_hash: identifier_hash }
        );

        return submission then finalize(oracle_id, data_type, identifier_hash, data_hash, value, timestamp, key_hash);
    }

    finalize submit_data(
        oracle_id: field,
        data_type: u8,
        identifier_hash: field,
        data_hash: field,
        value: u64,
        timestamp: u64,
        key_hash: field
    ) {
        // Verify oracle is authorized
        let oracle: OracleInfo = Mapping::get(authorized_oracles, oracle_id);
        assert(oracle.is_active);

        // Verify oracle is allowed to submit this data type
        let allowed: bool = (oracle.data_types & data_type) != 0u8;
        assert(allowed);

        // Store data record
        let record: DataRecord = DataRecord {
            oracle_id: oracle_id,
            data_type: data_type,
            identifier_hash: identifier_hash,
            data_hash: data_hash,
            value: value,
            timestamp: timestamp,
            block_height: block.height as u64,
        };
        Mapping::set(oracle_data, key_hash, record);

        // Increment submission count
        let count: u64 = Mapping::get_or_use(submission_count, oracle_id, 0u64);
        Mapping::set(submission_count, oracle_id, count + 1u64);
    }

    // Verify data exists and matches expected values
    transition verify_data(
        data_type: u8,
        identifier_hash: field,
        expected_min_value: u64,
        expected_max_timestamp_age: u64
    ) {
        let key_hash: field = BHP256::hash_to_field(
            OracleKeyInput { data_type: data_type, identifier_hash: identifier_hash }
        );

        return then finalize(key_hash, expected_min_value, expected_max_timestamp_age);
    }

    finalize verify_data(
        key_hash: field,
        expected_min_value: u64,
        expected_max_timestamp_age: u64
    ) {
        // Get stored data
        let data: DataRecord = Mapping::get(oracle_data, key_hash);

        // Verify value meets minimum
        assert(data.value >= expected_min_value);

        // Verify data is fresh enough
        let age: u64 = block.height as u64 - data.block_height;
        assert(age <= expected_max_timestamp_age);
    }

    // Helper struct for key computation
    struct OracleKeyInput {
        data_type: u8,
        identifier_hash: field,
    }
}
```

### Layer: Frontend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Oracle helpers | `lib/aleo/oracle.ts` | Oracle contract interactions |
| Flight API | `lib/oracles/aviationstack.ts` | Flight data provider |
| Weather API | `lib/oracles/openweathermap.ts` | Weather data provider |
| Oracle status UI | `components/oracle/oracle-status.tsx` | Display oracle data |
| Flight status | `components/oracle/flight-status.tsx` | Flight delay info |
| Weather alerts | `components/oracle/weather-alerts.tsx` | Weather event info |
| Admin dashboard | `pages/admin/oracles.tsx` | Oracle management |

#### Flight Data API Integration

```typescript
// lib/oracles/aviationstack.ts
const AVIATIONSTACK_URL = 'http://api.aviationstack.com/v1/flights';

export interface FlightStatus {
  flightNumber: string;
  airline: string;
  status: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'diverted';
  departure: {
    airport: string;
    scheduled: Date;
    actual: Date | null;
    delay: number | null; // minutes
  };
  arrival: {
    airport: string;
    scheduled: Date;
    actual: Date | null;
    delay: number | null;
  };
}

export async function getFlightStatus(
  flightNumber: string,
  date: string
): Promise<FlightStatus> {
  const response = await fetch(
    `${AVIATIONSTACK_URL}?access_key=${process.env.AVIATIONSTACK_API_KEY}&flight_iata=${flightNumber}&flight_date=${date}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch flight status');
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error('Flight not found');
  }

  const flight = data.data[0];

  return {
    flightNumber: flight.flight.iata,
    airline: flight.airline.name,
    status: flight.flight_status,
    departure: {
      airport: flight.departure.iata,
      scheduled: new Date(flight.departure.scheduled),
      actual: flight.departure.actual ? new Date(flight.departure.actual) : null,
      delay: flight.departure.delay,
    },
    arrival: {
      airport: flight.arrival.iata,
      scheduled: new Date(flight.arrival.scheduled),
      actual: flight.arrival.actual ? new Date(flight.arrival.actual) : null,
      delay: flight.arrival.delay,
    },
  };
}

// Calculate delay in minutes
export function calculateDelay(flight: FlightStatus): number {
  if (flight.departure.delay !== null) {
    return flight.departure.delay;
  }

  if (flight.departure.actual && flight.departure.scheduled) {
    const diffMs = flight.departure.actual.getTime() - flight.departure.scheduled.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  }

  return 0;
}
```

#### Weather API Integration

```typescript
// lib/oracles/openweathermap.ts
const OWM_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherAlert {
  event: string;
  sender: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  start: Date;
  end: Date;
  description: string;
}

export interface WeatherData {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    description: string;
  };
  alerts: WeatherAlert[];
}

export async function getWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const response = await fetch(
    `${OWM_URL}/onecall?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=imperial`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();

  return {
    location: {
      lat,
      lon,
      name: data.timezone,
    },
    current: {
      temp: data.current.temp,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_speed,
      description: data.current.weather[0]?.description || 'Unknown',
    },
    alerts: (data.alerts || []).map((alert: any) => ({
      event: alert.event,
      sender: alert.sender_name,
      severity: mapSeverity(alert.tags),
      start: new Date(alert.start * 1000),
      end: new Date(alert.end * 1000),
      description: alert.description,
    })),
  };
}

function mapSeverity(tags: string[]): WeatherAlert['severity'] {
  if (tags?.includes('Extreme')) return 'extreme';
  if (tags?.includes('Severe')) return 'severe';
  if (tags?.includes('Moderate')) return 'moderate';
  return 'minor';
}

export const WEATHER_EVENT_THRESHOLDS = {
  HURRICANE: { minWindSpeed: 74 }, // mph
  TORNADO: { minWindSpeed: 65 },
  FLOOD: { minRainfall: 4 }, // inches in 24h
  EXTREME_HEAT: { minTemp: 105 }, // Fahrenheit
  EXTREME_COLD: { maxTemp: 0 },
};
```

#### Oracle Contract Helpers

```typescript
// lib/aleo/oracle.ts
import { aleoClient, programManager } from './client';
import { hashField } from './utils';

export const DATA_TYPES = {
  FLIGHT: 1,
  WEATHER: 2,
  PRICE: 4,
} as const;

export interface OracleDataRecord {
  oracleId: string;
  dataType: number;
  identifierHash: string;
  dataHash: string;
  value: bigint;
  timestamp: bigint;
  blockHeight: bigint;
}

// Submit oracle data to chain
export async function submitOracleData(
  wallet: WalletAdapter,
  params: {
    oracleId: string;
    dataType: number;
    identifier: string; // e.g., "UA1234_2024-06-01"
    data: object; // Full data payload
    value: bigint; // Numeric value (delay minutes, etc.)
  }
): Promise<{ txId: string }> {
  const identifierHash = await hashField(params.identifier);
  const dataHash = await hashField(JSON.stringify(params.data));
  const timestamp = BigInt(Math.floor(Date.now() / 1000));

  const tx = await programManager.buildTransaction(
    'oracle_bridge.aleo',
    'submit_data',
    [
      params.oracleId,
      `${params.dataType}u8`,
      identifierHash,
      dataHash,
      `${params.value}u64`,
      `${timestamp}u64`,
    ]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return { txId: result.transactionId };
}

// Get oracle data from chain
export async function getOracleData(
  dataType: number,
  identifier: string
): Promise<OracleDataRecord | null> {
  const identifierHash = await hashField(identifier);
  const keyHash = await hashField(`${dataType}${identifierHash}`);

  try {
    const data = await aleoClient.getProgramMapping(
      'oracle_bridge.aleo',
      'oracle_data',
      keyHash
    );

    if (!data) return null;

    return parseOracleDataRecord(data);
  } catch {
    return null;
  }
}

// Verify oracle data meets requirements
export async function verifyOracleData(
  dataType: number,
  identifier: string,
  minValue: bigint,
  maxAge: bigint
): Promise<boolean> {
  const identifierHash = await hashField(identifier);

  try {
    await programManager.execute(
      'oracle_bridge.aleo',
      'verify_data',
      [
        `${dataType}u8`,
        identifierHash,
        `${minValue}u64`,
        `${maxAge}u64`,
      ]
    );
    return true;
  } catch {
    return false;
  }
}
```

#### Oracle Status Component

```typescript
// components/oracle/oracle-status.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

interface OracleStatusProps {
  oracleId: string;
  name: string;
}

export function OracleStatus({ oracleId, name }: OracleStatusProps) {
  const { data: oracle, isLoading } = useQuery({
    queryKey: ['oracle', oracleId],
    queryFn: () => fetchOracleInfo(oracleId),
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{name}</CardTitle>
        </div>
        <Badge variant={oracle?.isActive ? 'default' : 'destructive'}>
          {oracle?.isActive ? (
            <>
              <CheckCircle className="mr-1 h-3 w-3" />
              Active
            </>
          ) : (
            <>
              <XCircle className="mr-1 h-3 w-3" />
              Inactive
            </>
          )}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Submissions:</span>
            <span className="ml-2 font-medium">{oracle?.submissionCount || 0}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Reputation:</span>
            <span className="ml-2 font-medium">{oracle?.reputationScore || 0}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last update: {oracle?.lastUpdate || 'Never'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Flight Status Component

```typescript
// components/oracle/flight-status.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plane, Clock, AlertTriangle } from 'lucide-react';
import { getFlightStatus, calculateDelay } from '@/lib/oracles/aviationstack';
import { getOracleData, DATA_TYPES } from '@/lib/aleo/oracle';

export function FlightStatusChecker() {
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchParams, setSearchParams] = useState<{ flight: string; date: string } | null>(null);

  const { data: flightData, isLoading: apiLoading } = useQuery({
    queryKey: ['flight-api', searchParams?.flight, searchParams?.date],
    queryFn: () => getFlightStatus(searchParams!.flight, searchParams!.date),
    enabled: !!searchParams,
  });

  const { data: onChainData, isLoading: chainLoading } = useQuery({
    queryKey: ['flight-chain', searchParams?.flight, searchParams?.date],
    queryFn: () => getOracleData(DATA_TYPES.FLIGHT, `${searchParams!.flight}_${searchParams!.date}`),
    enabled: !!searchParams,
  });

  const handleSearch = () => {
    if (flightNumber && date) {
      setSearchParams({ flight: flightNumber.toUpperCase(), date });
    }
  };

  const delay = flightData ? calculateDelay(flightData) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Flight Status Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <div className="flex gap-2">
          <Input
            placeholder="Flight (e.g., UA1234)"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            className="flex-1"
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
          <Button onClick={handleSearch}>Check</Button>
        </div>

        {/* Results */}
        {(apiLoading || chainLoading) && <Skeleton className="h-32 w-full" />}

        {flightData && (
          <div className="space-y-4">
            {/* API Data */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{flightData.flightNumber}</span>
                <Badge variant={delay > 120 ? 'destructive' : delay > 0 ? 'secondary' : 'default'}>
                  {flightData.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">From:</span>
                  <span className="ml-2">{flightData.departure.airport}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">To:</span>
                  <span className="ml-2">{flightData.arrival.airport}</span>
                </div>
              </div>

              {delay > 0 && (
                <div className="mt-2 flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Delay: {delay} minutes</span>
                </div>
              )}
            </div>

            {/* On-Chain Data */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">On-Chain Oracle Data</span>
              </div>

              {onChainData ? (
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Recorded Delay:</span>
                    <span className="ml-2 font-medium">{onChainData.value.toString()} minutes</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Block Height:</span>
                    <span className="ml-2">{onChainData.blockHeight.toString()}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No on-chain data yet. Oracle will submit when flight status is confirmed.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Layer: Integration

| Deliverable | Purpose |
|-------------|---------|
| Backend oracle service | Polls APIs, submits to chain |
| API routes | `/api/v1/oracles/flight/[flightNumber]`, `/api/v1/oracles/weather/[location]` |
| Cron job | Scheduled oracle updates |
| Data verification | Compare API data with on-chain data |

#### Oracle Backend Service

```typescript
// lib/oracles/oracle-service.ts
import { getFlightStatus, calculateDelay } from './aviationstack';
import { getWeatherData } from './openweathermap';
import { submitOracleData, DATA_TYPES } from '@/lib/aleo/oracle';
import { getOracleWallet } from '@/lib/wallet/oracle-wallet';

export class OracleService {
  private wallet = getOracleWallet();
  private oracleId: string;

  constructor(oracleId: string) {
    this.oracleId = oracleId;
  }

  async submitFlightData(flightNumber: string, date: string): Promise<string> {
    // Fetch from API
    const flight = await getFlightStatus(flightNumber, date);
    const delay = calculateDelay(flight);

    // Submit to chain
    const { txId } = await submitOracleData(this.wallet, {
      oracleId: this.oracleId,
      dataType: DATA_TYPES.FLIGHT,
      identifier: `${flightNumber}_${date}`,
      data: flight,
      value: BigInt(delay),
    });

    console.log(`Flight data submitted: ${flightNumber} delay=${delay}min tx=${txId}`);
    return txId;
  }

  async submitWeatherData(lat: number, lon: number): Promise<string> {
    // Fetch from API
    const weather = await getWeatherData(lat, lon);

    // Determine severity value (0-100)
    let severityValue = 0;
    if (weather.alerts.length > 0) {
      const maxSeverity = weather.alerts.reduce((max, alert) => {
        const values = { minor: 25, moderate: 50, severe: 75, extreme: 100 };
        return Math.max(max, values[alert.severity]);
      }, 0);
      severityValue = maxSeverity;
    }

    // Submit to chain
    const identifier = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
    const { txId } = await submitOracleData(this.wallet, {
      oracleId: this.oracleId,
      dataType: DATA_TYPES.WEATHER,
      identifier,
      data: weather,
      value: BigInt(severityValue),
    });

    console.log(`Weather data submitted: ${identifier} severity=${severityValue} tx=${txId}`);
    return txId;
  }
}
```

#### API Routes

```typescript
// pages/api/v1/oracles/flight/[flightNumber].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFlightStatus, calculateDelay } from '@/lib/oracles/aviationstack';
import { getOracleData, DATA_TYPES } from '@/lib/aleo/oracle';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { flightNumber, date } = req.query;

  if (!flightNumber || !date) {
    return res.status(400).json({ error: 'Missing flightNumber or date' });
  }

  try {
    // Fetch from API
    const flight = await getFlightStatus(flightNumber as string, date as string);
    const delay = calculateDelay(flight);

    // Fetch on-chain data
    const onChainData = await getOracleData(
      DATA_TYPES.FLIGHT,
      `${flightNumber}_${date}`
    );

    res.status(200).json({
      success: true,
      data: {
        api: { ...flight, delayMinutes: delay },
        onChain: onChainData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

---

## Testable Outcomes

Wave 3 is testable when:

### E2E Test: Oracle submits flight delay → data visible on-chain and in UI

```
1. Start oracle service (or use test endpoint)
2. Trigger flight data submission for a known delayed flight
3. Wait for transaction confirmation
4. Query on-chain data via oracle_bridge.aleo
5. Verify data matches API data
6. View flight status in UI component
7. Verify UI shows both API and on-chain data
```

### Contract Tests

```bash
cd contracts/oracle_bridge
leo test

# Expected output:
# ✓ test_authorize_oracle
# ✓ test_submit_data
# ✓ test_verify_data
# ✓ test_revoke_oracle
# All tests passed!
```

### Integration Test

```typescript
// tests/integration/oracle.test.ts
import { describe, it, expect } from 'vitest';
import { OracleService } from '@/lib/oracles/oracle-service';
import { getOracleData, DATA_TYPES } from '@/lib/aleo/oracle';
import { waitForTx } from './helpers';

describe('Oracle Integration', () => {
  const oracle = new OracleService('test_oracle_001field');

  it('submits and retrieves flight data', async () => {
    // Submit data
    const txId = await oracle.submitFlightData('UA1234', '2024-06-01');
    await waitForTx(txId);

    // Retrieve data
    const data = await getOracleData(DATA_TYPES.FLIGHT, 'UA1234_2024-06-01');

    expect(data).not.toBeNull();
    expect(data?.dataType).toBe(DATA_TYPES.FLIGHT);
  });

  it('verifies flight delay meets threshold', async () => {
    const isValid = await verifyOracleData(
      DATA_TYPES.FLIGHT,
      'UA1234_2024-06-01',
      BigInt(120), // min 120 minutes delay
      BigInt(100)  // max 100 blocks old
    );

    expect(isValid).toBe(true);
  });
});
```

---

## Commands

```bash
# Build and test contract
cd contracts/oracle_bridge
leo build
leo test

# Deploy to testnet
leo deploy --network testnet

# Set environment variables
export AVIATIONSTACK_API_KEY=your_key
export OPENWEATHERMAP_API_KEY=your_key

# Run frontend
npm run dev

# Test oracle submission (via API)
curl -X POST http://localhost:3000/api/admin/oracle/submit-flight \
  -H "Content-Type: application/json" \
  -d '{"flightNumber": "UA1234", "date": "2024-06-01"}'
```

---

## Environment Variables

```env
# Oracle APIs
AVIATIONSTACK_API_KEY=your_aviationstack_key
OPENWEATHERMAP_API_KEY=your_openweathermap_key

# Oracle Identity (for submitting to chain)
ORACLE_PRIVATE_KEY=your_oracle_private_key
ORACLE_ID=your_oracle_id_field
```

---

## Exit Criteria

Wave 3 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | Contract compiles | `leo build` succeeds |
| 2 | Contract tests pass | `leo test` all green |
| 3 | Contract deployed | Transaction confirmed |
| 4 | Flight API works | Returns flight status |
| 5 | Weather API works | Returns weather data |
| 6 | Oracle submits data | Transaction confirms |
| 7 | Data readable on-chain | Mapping query returns data |
| 8 | UI shows flight status | Component renders data |
| 9 | UI shows weather alerts | Component renders alerts |
| 10 | Admin can manage oracles | Authorize/revoke works |

---

## Next Wave Preview

**Wave 4: Risk Pool** will add liquidity management:
- Deploy `risk_pool.aleo` contract
- Pool list and detail pages
- Deposit and withdraw flows
- LP token minting
- Test: Deposit → receive LP tokens → view position → withdraw
