# Development Guide

## Prerequisites

### Required Software

- **Node.js** 18.x or higher
- **npm** or **pnpm** (preferred)
- **Git**
- **Leo CLI** (for smart contract development)

### Optional Tools

- **Docker** (for local database)
- **VS Code** with recommended extensions

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/zklaim.git
cd zklaim
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/zklaim"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Aleo
ALEO_NETWORK="testnet"
ALEO_PRIVATE_KEY="your-private-key"

# External APIs
AVIATIONSTACK_API_KEY="your-key"
OPENWEATHERMAP_API_KEY="your-key"
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
zklaim/
├── pages/                  # Next.js pages
│   ├── _app.js            # App wrapper
│   ├── _document.js       # HTML document
│   ├── index.js           # Landing page
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and libraries
│   └── utils.js          # Helper functions
├── hooks/                 # Custom React hooks
├── stores/               # State management (Zustand)
├── types/                # TypeScript types
├── styles/               # Stylesheets
│   └── globals.css       # Global styles
├── public/               # Static assets
├── docs/                 # Documentation
└── contracts/            # Leo smart contracts (planned)
```

## Development Workflow

### Adding shadcn/ui Components

Use the CLI to add components:

```bash
# Add a button component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add card dialog form
```

Components will be added to `components/ui/`.

### Creating New Pages

Add new pages in the `pages/` directory:

```jsx
// pages/dashboard.js
export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </div>
  );
}
```

### Creating API Routes

Add API routes in `pages/api/`:

```javascript
// pages/api/policies/index.js
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // List policies
    return res.json({ success: true, data: [] });
  }

  if (req.method === 'POST') {
    // Create policy
    return res.json({ success: true, data: {} });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

### Creating Custom Hooks

```typescript
// hooks/use-policy.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePolicy(policyId: string) {
  return useQuery({
    queryKey: ['policy', policyId],
    queryFn: () => fetchPolicy(policyId),
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}
```

## Code Style

### TypeScript (Recommended)

Migrate JavaScript files to TypeScript:

```typescript
// types/policy.ts
export interface Policy {
  id: string;
  coverageType: CoverageType;
  coverageAmount: bigint;
  premium: bigint;
  status: PolicyStatus;
}

export type CoverageType = 'flight' | 'weather' | 'auto' | 'health';
export type PolicyStatus = 'pending' | 'active' | 'claimed' | 'expired';
```

### Component Structure

```tsx
// components/policy-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Policy } from '@/types/policy';

interface PolicyCardProps {
  policy: Policy;
  onSelect?: (id: string) => void;
}

export function PolicyCard({ policy, onSelect }: PolicyCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md" onClick={() => onSelect?.(policy.id)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{policy.coverageType}</span>
          <Badge>{policy.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Coverage: ${policy.coverageAmount.toString()}</p>
      </CardContent>
    </Card>
  );
}
```

### Styling with Tailwind

Use Tailwind utility classes:

```tsx
// Good
<div className="flex items-center gap-4 p-6 bg-background rounded-lg shadow">

// Avoid custom CSS when possible
```

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$10.00');
  });
});
```

### Component Tests

```typescript
// tests/components/policy-card.test.tsx
import { render, screen } from '@testing-library/react';
import { PolicyCard } from '@/components/policy-card';

describe('PolicyCard', () => {
  it('renders policy information', () => {
    const policy = {
      id: '1',
      coverageType: 'flight',
      status: 'active',
    };

    render(<PolicyCard policy={policy} />);

    expect(screen.getByText('flight')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/policy-purchase.test.ts
import { test, expect } from '@playwright/test';

test('user can purchase a policy', async ({ page }) => {
  await page.goto('/policies/new');

  await page.selectOption('#coverage-type', 'flight');
  await page.fill('#coverage-amount', '500');
  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## Database Setup

### Local PostgreSQL with Docker

```bash
# Start PostgreSQL
docker run --name zklaim-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Connect
psql postgresql://postgres:password@localhost:5432/postgres
```

### Prisma Commands

```bash
# Generate client
npx prisma generate

# Push schema to database
npx prisma db push

# Create migration
npx prisma migrate dev --name init

# Open Prisma Studio
npx prisma studio
```

## Smart Contract Development

### Install Leo CLI

```bash
curl -sSf https://raw.githubusercontent.com/AleoHQ/leo/master/install.sh | sh
```

### Create New Contract

```bash
cd contracts
leo new my_contract
```

### Build Contract

```bash
cd contracts/my_contract
leo build
```

### Run Tests

```bash
leo test
```

### Deploy to Testnet

```bash
leo deploy --network testnet
```

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Linting & Formatting
npm run lint         # Run ESLint
npm run format       # Run Prettier

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests

# Database
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio

# Contracts (when implemented)
npm run contracts:build   # Build all contracts
npm run contracts:test    # Test all contracts
npm run contracts:deploy  # Deploy to testnet
```

## Debugging

### VS Code Launch Config

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Logging

Use structured logging in API routes:

```javascript
console.log(JSON.stringify({
  level: 'info',
  message: 'Policy created',
  policyId: policy.id,
  timestamp: new Date().toISOString(),
}));
```

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t zklaim .
docker run -p 3000:3000 zklaim
```

## Troubleshooting

### Common Issues

**Module not found:**
```bash
rm -rf node_modules .next
npm install
```

**Prisma client not generated:**
```bash
npx prisma generate
```

**Port already in use:**
```bash
lsof -i :3000
kill -9 <PID>
```

### Getting Help

- Check the project documentation in `/docs`
- Review the project spec in `ZKLAIM_PROJECT_SPEC.md`
- Use MCP tools (context7, firecrawl) for external documentation
