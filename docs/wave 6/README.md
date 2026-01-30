# Wave 6: Claims System

**Objective:** Build claims submission and tracking system.

**Track:** A (Frontend)
**Depends on:** Wave 5

---

## Deliverables

### 1. File Upload Setup

```bash
npm install @uploadthing/react uploadthing
```

| File | Purpose |
|------|---------|
| `lib/upload.ts` | Upload configuration |
| `pages/api/uploadthing.ts` | Upload API route |

### 2. Claims Pages

| Page | Path | Purpose |
|------|------|---------|
| New Claim | `pages/dashboard/claims/new.tsx` | Submit claim form |
| Claim Detail | `pages/dashboard/claims/[id].tsx` | Single claim view |

### 3. Claims Components

```
components/claims/
├── claim-form.tsx           # Claim submission form
├── claim-card.tsx           # Claim summary card
├── claim-detail.tsx         # Full claim view
├── claim-status.tsx         # Status badge/indicator
├── claim-timeline.tsx       # Claim progress timeline
├── evidence-upload.tsx      # File upload component
├── evidence-list.tsx        # Uploaded evidence display
├── payout-info.tsx          # Payout details display
└── index.ts                 # Barrel export
```

### 4. Parametric Claim Components

```
components/claims/parametric/
├── parametric-trigger.tsx   # Auto-trigger display
├── oracle-data-display.tsx  # Oracle data visualization
├── flight-status.tsx        # Flight delay status
├── weather-status.tsx       # Weather event status
└── index.ts                 # Barrel export
```

### 5. Traditional Claim Components

```
components/claims/traditional/
├── traditional-form.tsx     # Detailed claim form
├── adjuster-request.tsx     # Request human review
├── selective-disclosure.tsx # ZK selective disclosure
└── index.ts                 # Barrel export
```

### 6. Claims Hooks

| File | Purpose |
|------|---------|
| `hooks/use-claims.ts` | Fetch user claims |
| `hooks/use-claim.ts` | Fetch single claim |
| `hooks/use-submit-claim.ts` | Submit claim mutation |
| `hooks/use-claim-status.ts` | Poll claim status |

---

## Claim Types

### Parametric Claims (MVP Focus)
Automatic claims triggered by oracle data:
- **Flight Delay:** Oracle confirms delay > threshold
- **Weather Event:** Oracle confirms event occurred

```typescript
interface ParametricClaim {
  type: 'parametric';
  policyId: string;
  triggeredBy: 'oracle' | 'user';  // Usually oracle
  oracleData: {
    source: string;
    timestamp: Date;
    data: FlightOracleData | WeatherOracleData;
    signature: string;
  };
  autoApproved: boolean;
  payoutAmount: number;
}
```

### Traditional Claims (Future)
User-initiated claims requiring review:
- Evidence upload
- Optional human adjuster
- Selective disclosure of supporting data

```typescript
interface TraditionalClaim {
  type: 'traditional';
  policyId: string;
  description: string;
  evidence: Evidence[];
  selectiveDisclosure?: {
    proofHash: string;
    disclosedFields: string[];
  };
  adjusterRequested: boolean;
  status: ClaimStatus;
}
```

---

## Claim Flow (Parametric)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Parametric Claim Flow                         │
└─────────────────────────────────────────────────────────────────┘

  Policy Active           Oracle Event          Auto-Process
       │                       │                     │
       ▼                       ▼                     ▼
  ┌─────────┐           ┌─────────────┐       ┌───────────┐
  │ Flight  │  delay    │   Oracle    │ verify│  Claims   │
  │ Departs │ ─────────►│   Reports   │──────►│  Engine   │
  │         │  > 2hrs   │   Delay     │       │           │
  └─────────┘           └─────────────┘       └─────────┬─┘
                                                        │
                                              ┌─────────▼─────────┐
                                              │                   │
                                              │   Auto-Approve    │
                                              │   & Queue Payout  │
                                              │                   │
                                              └─────────┬─────────┘
                                                        │
  ┌─────────────┐                             ┌─────────▼─────────┐
  │   User      │◄────────────────────────────│   Notify User     │
  │   Dashboard │     Claim Approved!         │   of Payout       │
  └─────────────┘                             └───────────────────┘
```

---

## Claim Status Timeline

```typescript
const claimStatuses: ClaimTimelineStep[] = [
  {
    status: 'submitted',
    label: 'Claim Submitted',
    description: 'Your claim has been received',
    timestamp: claim.submittedAt,
    completed: true,
  },
  {
    status: 'validating',
    label: 'Validating',
    description: 'Checking policy and oracle data',
    timestamp: claim.validatingAt,
    completed: claim.status !== 'submitted',
  },
  {
    status: 'approved',
    label: 'Approved',
    description: 'Claim meets payout criteria',
    timestamp: claim.approvedAt,
    completed: ['approved', 'paid'].includes(claim.status),
  },
  {
    status: 'paid',
    label: 'Paid',
    description: 'Funds transferred to your wallet',
    timestamp: claim.paidAt,
    completed: claim.status === 'paid',
  },
];
```

---

## Evidence Upload

```typescript
// components/claims/evidence-upload.tsx
interface EvidenceUploadProps {
  claimId: string;
  onUploadComplete: (evidence: Evidence) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

interface Evidence {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  description?: string;
}

// Accepted file types
const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

---

## Oracle Data Display

```typescript
// Flight delay oracle data
interface FlightOracleData {
  flightNumber: string;
  scheduledDeparture: Date;
  actualDeparture: Date | null;
  delayMinutes: number;
  status: 'on_time' | 'delayed' | 'cancelled';
  source: 'aviationstack' | 'flightaware';
  fetchedAt: Date;
}

// Weather event oracle data
interface WeatherOracleData {
  location: { lat: number; lng: number; name: string };
  eventType: WeatherEventType;
  severity: number;
  measurements: {
    windSpeed?: number;
    rainfall?: number;
    temperature?: number;
  };
  source: 'openweathermap' | 'noaa';
  fetchedAt: Date;
}
```

---

## Claim Form (Traditional)

```typescript
const claimFormSchema = z.object({
  policyId: z.string(),
  description: z.string().min(50).max(2000),
  incidentDate: z.date(),
  estimatedLoss: z.number().positive(),
  evidence: z.array(z.object({
    fileId: z.string(),
    description: z.string().optional(),
  })).min(1),
  declaration: z.boolean().refine(val => val === true, {
    message: 'You must declare this information is accurate',
  }),
});
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/claims` | GET | List user claims |
| `/api/v1/claims` | POST | Submit new claim |
| `/api/v1/claims/[id]` | GET | Get claim details |
| `/api/v1/claims/[id]/evidence` | POST | Upload evidence |
| `/api/v1/claims/[id]/status` | GET | Get current status |
| `/api/uploadthing` | POST | Handle file uploads |

---

## Testing Checklist

- [ ] Claim form validates required fields
- [ ] File upload works (images, PDFs)
- [ ] Upload progress indicator shows
- [ ] Uploaded files display correctly
- [ ] Claim saves to database
- [ ] Claim appears in dashboard
- [ ] Claim detail page shows all info
- [ ] Status timeline updates correctly
- [ ] Oracle data displays (mock)
- [ ] Payout info shows when approved
- [ ] Error handling for upload failures
- [ ] Mobile responsive forms

---

## Commands

```bash
# Install dependencies
npm install @uploadthing/react uploadthing

# Run dev server
npm run dev
```

---

## Dependencies Added

```json
{
  "dependencies": {
    "@uploadthing/react": "^6.x",
    "uploadthing": "^6.x"
  }
}
```

---

## Exit Criteria

Wave 6 is complete when:
1. File upload working with uploadthing
2. Claim submission form validates and saves
3. Evidence upload and display working
4. Claim detail page shows all information
5. Status timeline component working
6. Oracle data display (with mock data)
7. Claims list in dashboard
8. Parametric claim components built
9. Traditional claim components built (basic)
10. All responsive on mobile
