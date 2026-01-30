# Wave 5: Policy Purchase Flow

**Objective:** Implement complete policy purchase wizard.

**Track:** A (Frontend)
**Depends on:** Wave 4

---

## Deliverables

### 1. Additional shadcn Components

```bash
npx shadcn@latest add stepper calendar popover command
```

**Components:**
- `stepper` - Multi-step wizard navigation
- `calendar` - Date picker
- `popover` - Floating content panels
- `command` - Command palette / search

### 2. Policy Wizard

```
components/policy/wizard/
├── index.tsx              # Wizard container & state
├── step-coverage.tsx      # Step 1: Select coverage type
├── step-configure.tsx     # Step 2: Configure parameters
├── step-attestation.tsx   # Step 3: Attestation selection
├── step-proof.tsx         # Step 4: ZK proof generation (mock)
├── step-review.tsx        # Step 5: Review summary
├── step-confirm.tsx       # Step 6: Confirm & pay
└── wizard-nav.tsx         # Navigation controls
```

### 3. Coverage Components

```
components/policy/
├── coverage-card.tsx      # Coverage type selection card
├── flight-form.tsx        # Flight delay configuration
├── weather-form.tsx       # Weather event configuration
├── premium-calculator.tsx # Premium estimate display
├── policy-card.tsx        # Policy summary card
├── policy-detail.tsx      # Full policy view
├── policy-status.tsx      # Status badge component
├── policy-actions.tsx     # Policy action buttons
└── index.ts               # Barrel export
```

### 4. Policy Pages

| Page | Path | Purpose |
|------|------|---------|
| New Policy | `pages/dashboard/policies/new.tsx` | Policy wizard |
| Policy Detail | `pages/dashboard/policies/[id].tsx` | Single policy view |

### 5. Hooks & Stores

| File | Purpose |
|------|---------|
| `hooks/use-policies.ts` | Fetch user policies |
| `hooks/use-policy.ts` | Fetch single policy |
| `hooks/use-create-policy.ts` | Create policy mutation |
| `hooks/use-premium-estimate.ts` | Get premium quote |
| `stores/policy-wizard-store.ts` | Wizard state management |

---

## Wizard Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Policy Purchase Wizard                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ① ─────── ② ─────── ③ ─────── ④ ─────── ⑤ ─────── ⑥          │
│  Coverage  Configure  Attest   Proof    Review   Confirm        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Select Coverage Type                                    │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ ✈️ Flight    │  │ 🌪️ Weather   │                             │
│  │ Delay        │  │ Event        │                             │
│  │              │  │              │                             │
│  │ Auto payout  │  │ Hurricane,   │                             │
│  │ for delays   │  │ tornado, etc │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
│                              [Next →]                            │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Coverage Type
- Display coverage cards (Flight Delay, Weather Event)
- Show key benefits for each
- Allow only one selection

### Step 2: Configure Parameters
**Flight Delay:**
- Flight number input (with validation)
- Departure/arrival airports
- Flight date selector
- Delay threshold (120, 180, 240 min)
- Coverage amount slider

**Weather Event:**
- Location selector (map or search)
- Event type dropdown
- Threshold configuration
- Coverage period dates
- Coverage amount slider

### Step 3: Attestation
- Explain what attestations are needed
- Show available attestation providers
- Mock attestation selection
- Display placeholder for future integration

### Step 4: ZK Proof Generation
- Explain proof generation process
- Show mock progress indicator
- Display "proof generated" status
- (Actual proof generation in Wave 9)

### Step 5: Review
- Summary of all selections
- Premium breakdown
- Coverage details
- Terms acceptance checkbox

### Step 6: Confirm & Pay
- Final confirmation
- Mock transaction submission
- Success/failure feedback
- Redirect to policy detail page

---

## Wizard State Management

```typescript
// stores/policy-wizard-store.ts
interface PolicyWizardState {
  // Current step
  currentStep: number;
  totalSteps: 6;

  // Step 1: Coverage
  coverageType: CoverageType | null;

  // Step 2: Configuration
  coverageAmount: number;
  deductible: number;
  flightConfig: FlightConfig | null;
  weatherConfig: WeatherConfig | null;

  // Step 3: Attestation
  selectedAttestation: string | null;

  // Step 4: Proof
  proofStatus: 'idle' | 'generating' | 'complete' | 'error';
  proofData: ProofData | null;

  // Step 5: Review
  termsAccepted: boolean;
  premiumQuote: PremiumQuote | null;

  // Step 6: Confirm
  transactionStatus: 'idle' | 'pending' | 'success' | 'error';
  policyId: string | null;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCoverageType: (type: CoverageType) => void;
  setFlightConfig: (config: FlightConfig) => void;
  setWeatherConfig: (config: WeatherConfig) => void;
  generateProof: () => Promise<void>;
  submitPolicy: () => Promise<void>;
  reset: () => void;
}
```

---

## Premium Calculator

```typescript
interface PremiumCalculation {
  basePremium: number;        // Base rate for coverage type
  coverageMultiplier: number; // Based on coverage amount
  riskAdjustment: number;     // Based on risk factors
  durationAdjustment: number; // Based on coverage period
  discounts: Discount[];      // Early bird, loyalty, etc.
  fees: Fee[];                // Platform fee, gas estimate
  totalPremium: number;       // Final premium
}

// Example calculation for flight delay
function calculateFlightPremium(config: FlightConfig): PremiumCalculation {
  const basePremium = 50; // $50 base
  const coverageMultiplier = config.coverageAmount / 1000 * 0.05; // 5% per $1000
  const riskAdjustment = getAirlineRisk(config.flightNumber);
  // ...
}
```

---

## Flight Form Validation

```typescript
const flightFormSchema = z.object({
  flightNumber: z
    .string()
    .regex(/^[A-Z]{2}\d{1,4}$/, 'Invalid flight format (e.g., UA1234)'),
  departureAirport: z
    .string()
    .length(3, 'Must be 3-letter IATA code'),
  arrivalAirport: z
    .string()
    .length(3, 'Must be 3-letter IATA code'),
  departureDate: z
    .date()
    .min(new Date(), 'Must be a future date'),
  delayThreshold: z
    .number()
    .min(30)
    .max(480),
  coverageAmount: z
    .number()
    .min(100)
    .max(10000),
});
```

---

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/policies` | POST | Create new policy |
| `/api/v1/policies/quote` | POST | Get premium quote |
| `/api/v1/attestations` | GET | List available attestations |
| `/api/v1/airports/search` | GET | Search airports |
| `/api/v1/flights/validate` | POST | Validate flight number |

---

## Testing Checklist

- [ ] Wizard progresses through all 6 steps
- [ ] Form validation on each step
- [ ] Cannot proceed without completing required fields
- [ ] Back navigation preserves state
- [ ] Premium calculator updates in real-time
- [ ] Flight number validation works
- [ ] Date picker restricts to future dates
- [ ] Coverage amount slider works
- [ ] Review step shows all data correctly
- [ ] Policy saves to database
- [ ] Policy appears in dashboard
- [ ] Success toast notification
- [ ] Error handling for failed submission

---

## Commands

```bash
# Install shadcn components
npx shadcn@latest add stepper calendar popover command

# Run dev server
npm run dev
```

---

## Dependencies Added

```json
{
  "dependencies": {
    // No new dependencies - using existing shadcn/zod/react-query
  }
}
```

---

## Exit Criteria

Wave 5 is complete when:
1. All 4 shadcn components installed
2. Policy wizard navigates through all 6 steps
3. Flight delay form validates correctly
4. Weather event form validates correctly
5. Premium calculator shows estimates
6. Policy saves to database
7. Policy detail page displays correctly
8. Policy appears in dashboard policies list
9. Form validation prevents invalid submissions
10. Responsive on mobile devices
