# Wave 8: Governance

**Objective:** Decentralized protocol management through on-chain governance.

**Theme:** Community-controlled parameters and upgrades

**Depends on:** Wave 7

---

## Overview

Wave 8 adds the final smart contract: governance. LP token holders can create proposals, vote on changes, and execute approved modifications to protocol parameters. This completes the smart contract suite.

By the end: Create proposal → vote → execute → parameter changed.

---

## Deliverables

### Layer: Contracts

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| `governance.aleo` | `contracts/governance/src/main.leo` | Protocol governance |
| Governance tests | `contracts/governance/tests/` | Unit tests |
| Deployment script | `scripts/deploy-governance.sh` | Testnet deployment |

#### Contract: governance.aleo

```leo
// contracts/governance/src/main.leo
program governance.aleo {

    // Import for voting power calculation
    import risk_pool.aleo;

    // Records (private)
    record VoteReceipt {
        owner: address,
        proposal_id: field,
        vote_power: u64,
        vote_for: bool,
        timestamp: u64,
    }

    // Mappings (public)
    mapping proposals: field => ProposalData;
    mapping proposal_votes: field => VoteTally;
    mapping has_voted: field => bool;          // hash(proposal_id, voter) => voted
    mapping protocol_parameters: field => u64;  // param_name_hash => value
    mapping emergency_pause: u8 => bool;        // 0 => is_paused

    // Structs
    struct ProposalData {
        id: field,
        proposer: address,
        proposal_type: u8,
        target_param: field,        // Parameter name hash or contract address
        proposed_value: u64,        // New value
        description_hash: field,
        created_at: u64,
        voting_ends_at: u64,
        execution_delay: u64,
        status: u8,
    }

    struct VoteTally {
        votes_for: u64,
        votes_against: u64,
        total_voters: u32,
    }

    // Proposal types
    const TYPE_PARAMETER_CHANGE: u8 = 1u8;
    const TYPE_POOL_CONFIG: u8 = 2u8;
    const TYPE_ORACLE_CONFIG: u8 = 3u8;
    const TYPE_EMERGENCY: u8 = 4u8;

    // Proposal status
    const STATUS_ACTIVE: u8 = 1u8;
    const STATUS_PASSED: u8 = 2u8;
    const STATUS_REJECTED: u8 = 3u8;
    const STATUS_EXECUTED: u8 = 4u8;
    const STATUS_CANCELLED: u8 = 5u8;

    // Governance parameters
    const MIN_VOTING_PERIOD: u64 = 86400u64;      // 1 day minimum
    const MAX_VOTING_PERIOD: u64 = 604800u64;     // 7 days maximum
    const MIN_QUORUM_BPS: u64 = 1000u64;          // 10% quorum
    const EXECUTION_DELAY: u64 = 172800u64;       // 2 day delay
    const MIN_PROPOSAL_THRESHOLD: u64 = 100000000u64; // 100 tokens to propose

    // === Proposal Creation ===

    // Create a new governance proposal
    transition create_proposal(
        proposal_id: field,
        proposal_type: u8,
        target_param: field,
        proposed_value: u64,
        description_hash: field,
        voting_period: u64
    ) {
        // Verify voting period is within bounds
        assert(voting_period >= MIN_VOTING_PERIOD);
        assert(voting_period <= MAX_VOTING_PERIOD);

        return then finalize(
            proposal_id,
            self.caller,
            proposal_type,
            target_param,
            proposed_value,
            description_hash,
            voting_period
        );
    }

    finalize create_proposal(
        proposal_id: field,
        proposer: address,
        proposal_type: u8,
        target_param: field,
        proposed_value: u64,
        description_hash: field,
        voting_period: u64
    ) {
        // Ensure proposal doesn't exist
        let exists: bool = Mapping::contains(proposals, proposal_id);
        assert(!exists);

        // Verify proposer has minimum tokens
        // In production: cross-program call to check LP balance
        // let balance: u64 = risk_pool.aleo/get_user_lp_balance(proposer);
        // assert(balance >= MIN_PROPOSAL_THRESHOLD);

        let current_time: u64 = block.height as u64;

        let proposal: ProposalData = ProposalData {
            id: proposal_id,
            proposer: proposer,
            proposal_type: proposal_type,
            target_param: target_param,
            proposed_value: proposed_value,
            description_hash: description_hash,
            created_at: current_time,
            voting_ends_at: current_time + voting_period,
            execution_delay: EXECUTION_DELAY,
            status: STATUS_ACTIVE,
        };

        Mapping::set(proposals, proposal_id, proposal);

        // Initialize vote tally
        let tally: VoteTally = VoteTally {
            votes_for: 0u64,
            votes_against: 0u64,
            total_voters: 0u32,
        };
        Mapping::set(proposal_votes, proposal_id, tally);
    }

    // === Voting ===

    // Cast vote on a proposal
    transition vote(
        proposal_id: field,
        vote_for: bool,
        vote_power: u64    // LP token balance at snapshot
    ) -> VoteReceipt {
        let receipt: VoteReceipt = VoteReceipt {
            owner: self.caller,
            proposal_id: proposal_id,
            vote_power: vote_power,
            vote_for: vote_for,
            timestamp: 0u64,
        };

        let voter_hash: field = BHP256::hash_to_field(VoterKey {
            proposal_id: proposal_id,
            voter: self.caller,
        });

        return receipt then finalize(proposal_id, voter_hash, vote_for, vote_power);
    }

    finalize vote(
        proposal_id: field,
        voter_hash: field,
        vote_for: bool,
        vote_power: u64
    ) {
        // Verify proposal exists and is active
        let proposal: ProposalData = Mapping::get(proposals, proposal_id);
        assert_eq(proposal.status, STATUS_ACTIVE);

        // Verify voting period hasn't ended
        let current_time: u64 = block.height as u64;
        assert(current_time < proposal.voting_ends_at);

        // Verify voter hasn't voted
        let already_voted: bool = Mapping::get_or_use(has_voted, voter_hash, false);
        assert(!already_voted);

        // Record vote
        Mapping::set(has_voted, voter_hash, true);

        // Update tally
        let tally: VoteTally = Mapping::get(proposal_votes, proposal_id);
        let new_tally: VoteTally = VoteTally {
            votes_for: vote_for ? tally.votes_for + vote_power : tally.votes_for,
            votes_against: vote_for ? tally.votes_against : tally.votes_against + vote_power,
            total_voters: tally.total_voters + 1u32,
        };
        Mapping::set(proposal_votes, proposal_id, new_tally);
    }

    // === Proposal Resolution ===

    // Finalize voting and determine outcome
    transition finalize_proposal(proposal_id: field) {
        return then finalize(proposal_id);
    }

    finalize finalize_proposal(proposal_id: field) {
        let proposal: ProposalData = Mapping::get(proposals, proposal_id);

        // Verify proposal is active
        assert_eq(proposal.status, STATUS_ACTIVE);

        // Verify voting period has ended
        let current_time: u64 = block.height as u64;
        assert(current_time >= proposal.voting_ends_at);

        // Get vote tally
        let tally: VoteTally = Mapping::get(proposal_votes, proposal_id);

        // Calculate total votes
        let total_votes: u64 = tally.votes_for + tally.votes_against;

        // Check quorum (10% of total LP supply)
        // In production: get total LP supply from risk_pool
        // let total_supply: u64 = risk_pool.aleo/get_total_lp_supply();
        // let quorum_needed: u64 = total_supply * MIN_QUORUM_BPS / 10000u64;
        // For MVP: assume quorum met if > 0 votes

        // Determine outcome
        let passed: bool = tally.votes_for > tally.votes_against && total_votes > 0u64;

        let new_status: u8 = passed ? STATUS_PASSED : STATUS_REJECTED;

        let updated: ProposalData = ProposalData {
            id: proposal.id,
            proposer: proposal.proposer,
            proposal_type: proposal.proposal_type,
            target_param: proposal.target_param,
            proposed_value: proposal.proposed_value,
            description_hash: proposal.description_hash,
            created_at: proposal.created_at,
            voting_ends_at: proposal.voting_ends_at,
            execution_delay: proposal.execution_delay,
            status: new_status,
        };

        Mapping::set(proposals, proposal_id, updated);
    }

    // Execute a passed proposal
    transition execute_proposal(proposal_id: field) {
        return then finalize(proposal_id);
    }

    finalize execute_proposal(proposal_id: field) {
        let proposal: ProposalData = Mapping::get(proposals, proposal_id);

        // Verify proposal passed
        assert_eq(proposal.status, STATUS_PASSED);

        // Verify execution delay has passed
        let current_time: u64 = block.height as u64;
        let execution_time: u64 = proposal.voting_ends_at + proposal.execution_delay;
        assert(current_time >= execution_time);

        // Execute based on proposal type
        if proposal.proposal_type == TYPE_PARAMETER_CHANGE {
            Mapping::set(protocol_parameters, proposal.target_param, proposal.proposed_value);
        }

        // Mark as executed
        let updated: ProposalData = ProposalData {
            id: proposal.id,
            proposer: proposal.proposer,
            proposal_type: proposal.proposal_type,
            target_param: proposal.target_param,
            proposed_value: proposal.proposed_value,
            description_hash: proposal.description_hash,
            created_at: proposal.created_at,
            voting_ends_at: proposal.voting_ends_at,
            execution_delay: proposal.execution_delay,
            status: STATUS_EXECUTED,
        };

        Mapping::set(proposals, proposal_id, updated);
    }

    // Cancel a proposal (proposer only, before voting ends)
    transition cancel_proposal(proposal_id: field) {
        return then finalize(proposal_id, self.caller);
    }

    finalize cancel_proposal(proposal_id: field, caller: address) {
        let proposal: ProposalData = Mapping::get(proposals, proposal_id);

        // Verify caller is proposer
        assert_eq(proposal.proposer, caller);

        // Verify proposal is still active
        assert_eq(proposal.status, STATUS_ACTIVE);

        let updated: ProposalData = ProposalData {
            id: proposal.id,
            proposer: proposal.proposer,
            proposal_type: proposal.proposal_type,
            target_param: proposal.target_param,
            proposed_value: proposal.proposed_value,
            description_hash: proposal.description_hash,
            created_at: proposal.created_at,
            voting_ends_at: proposal.voting_ends_at,
            execution_delay: proposal.execution_delay,
            status: STATUS_CANCELLED,
        };

        Mapping::set(proposals, proposal_id, updated);
    }

    // === Emergency Functions ===

    // Emergency pause (requires multisig in production)
    transition emergency_pause() {
        return then finalize();
    }

    finalize emergency_pause() {
        // In production: verify caller is in multisig
        Mapping::set(emergency_pause, 0u8, true);
    }

    // Resume from emergency pause
    transition emergency_resume() {
        return then finalize();
    }

    finalize emergency_resume() {
        // In production: verify caller is in multisig
        Mapping::set(emergency_pause, 0u8, false);
    }

    // Helper struct for voter key
    struct VoterKey {
        proposal_id: field,
        voter: address,
    }
}
```

### Layer: Frontend

| Deliverable | Files | Purpose |
|-------------|-------|---------|
| Governance helpers | `lib/aleo/governance.ts` | Governance contract interactions |
| Proposals list | `pages/governance/index.tsx` | Browse proposals |
| Proposal detail | `pages/governance/[id].tsx` | View and vote |
| Create proposal | `pages/governance/new.tsx` | Submit proposal |
| Vote modal | `components/governance/vote-modal.tsx` | Voting UI |
| Admin panel | `pages/admin/index.tsx` | Emergency controls |

#### Governance Contract Helpers

```typescript
// lib/aleo/governance.ts
import { aleoClient, programManager } from './client';
import { generateProposalId, hashField } from './utils';

export interface Proposal {
  id: string;
  proposer: string;
  proposalType: number;
  targetParam: string;
  proposedValue: bigint;
  descriptionHash: string;
  createdAt: bigint;
  votingEndsAt: bigint;
  executionDelay: bigint;
  status: number;
}

export interface VoteTally {
  votesFor: bigint;
  votesAgainst: bigint;
  totalVoters: number;
}

export const PROPOSAL_TYPES = {
  PARAMETER_CHANGE: 1,
  POOL_CONFIG: 2,
  ORACLE_CONFIG: 3,
  EMERGENCY: 4,
} as const;

export const PROPOSAL_STATUS = {
  ACTIVE: 1,
  PASSED: 2,
  REJECTED: 3,
  EXECUTED: 4,
  CANCELLED: 5,
} as const;

export const STATUS_LABELS: Record<number, string> = {
  [PROPOSAL_STATUS.ACTIVE]: 'Active',
  [PROPOSAL_STATUS.PASSED]: 'Passed',
  [PROPOSAL_STATUS.REJECTED]: 'Rejected',
  [PROPOSAL_STATUS.EXECUTED]: 'Executed',
  [PROPOSAL_STATUS.CANCELLED]: 'Cancelled',
};

// Create a new proposal
export async function createProposal(
  wallet: WalletAdapter,
  params: {
    proposalType: number;
    targetParam: string;
    proposedValue: bigint;
    description: string;
    votingPeriodDays: number;
  }
): Promise<{ txId: string; proposalId: string }> {
  const proposalId = await generateProposalId();
  const descriptionHash = await hashField(params.description);
  const targetParamHash = await hashField(params.targetParam);
  const votingPeriod = BigInt(params.votingPeriodDays * 86400);

  const tx = await programManager.buildTransaction(
    'governance.aleo',
    'create_proposal',
    [
      proposalId,
      `${params.proposalType}u8`,
      targetParamHash,
      `${params.proposedValue}u64`,
      descriptionHash,
      `${votingPeriod}u64`,
    ]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return {
    txId: result.transactionId,
    proposalId,
  };
}

// Vote on a proposal
export async function vote(
  wallet: WalletAdapter,
  proposalId: string,
  voteFor: boolean,
  votePower: bigint
): Promise<{ txId: string }> {
  const tx = await programManager.buildTransaction(
    'governance.aleo',
    'vote',
    [proposalId, voteFor.toString(), `${votePower}u64`]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return { txId: result.transactionId };
}

// Get proposal data
export async function getProposal(proposalId: string): Promise<Proposal | null> {
  try {
    const data = await aleoClient.getProgramMapping(
      'governance.aleo',
      'proposals',
      proposalId
    );
    return data ? parseProposalData(data) : null;
  } catch {
    return null;
  }
}

// Get vote tally
export async function getVoteTally(proposalId: string): Promise<VoteTally | null> {
  try {
    const data = await aleoClient.getProgramMapping(
      'governance.aleo',
      'proposal_votes',
      proposalId
    );
    return data ? parseVoteTally(data) : null;
  } catch {
    return null;
  }
}

// Check if user has voted
export async function hasUserVoted(
  proposalId: string,
  userAddress: string
): Promise<boolean> {
  const voterKey = await hashField(`${proposalId}${userAddress}`);
  try {
    const data = await aleoClient.getProgramMapping(
      'governance.aleo',
      'has_voted',
      voterKey
    );
    return data === 'true';
  } catch {
    return false;
  }
}

// Get user's voting power (LP tokens)
export async function getVotingPower(
  wallet: WalletAdapter
): Promise<bigint> {
  const positions = await getUserPositions(wallet);
  return positions.reduce((total, pos) => total + pos.lpTokens, BigInt(0));
}

// Finalize proposal
export async function finalizeProposal(
  wallet: WalletAdapter,
  proposalId: string
): Promise<{ txId: string }> {
  const tx = await programManager.buildTransaction(
    'governance.aleo',
    'finalize_proposal',
    [proposalId]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return { txId: result.transactionId };
}

// Execute proposal
export async function executeProposal(
  wallet: WalletAdapter,
  proposalId: string
): Promise<{ txId: string }> {
  const tx = await programManager.buildTransaction(
    'governance.aleo',
    'execute_proposal',
    [proposalId]
  );

  const signedTx = await wallet.signTransaction(tx);
  const result = await aleoClient.submitTransaction(signedTx);

  return { txId: result.transactionId };
}
```

#### Proposal List Page

```typescript
// pages/governance/index.tsx
import { useQuery } from '@tanstack/react-query';
import { RootLayout } from '@/components/layout/root-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Plus, Vote, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PROPOSAL_STATUS, STATUS_LABELS } from '@/lib/aleo/governance';
import { formatDistanceToNow } from 'date-fns';

export default function GovernancePage() {
  const { data: proposals, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => fetchProposals(),
  });

  const activeProposals = proposals?.filter((p) => p.status === PROPOSAL_STATUS.ACTIVE) || [];
  const pastProposals = proposals?.filter((p) => p.status !== PROPOSAL_STATUS.ACTIVE) || [];

  return (
    <RootLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Governance</h1>
            <p className="text-muted-foreground">
              Vote on protocol changes and improvements
            </p>
          </div>
          <Link href="/governance/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeProposals.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastProposals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeProposals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No active proposals
                </CardContent>
              </Card>
            ) : (
              activeProposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </RootLayout>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal & { tally: VoteTally } }) {
  const totalVotes = proposal.tally.votesFor + proposal.tally.votesAgainst;
  const forPercentage = totalVotes > 0
    ? Number((proposal.tally.votesFor * BigInt(100)) / totalVotes)
    : 0;

  const votingEndsAt = new Date(Number(proposal.votingEndsAt) * 1000);
  const isActive = proposal.status === PROPOSAL_STATUS.ACTIVE;
  const timeLeft = isActive ? formatDistanceToNow(votingEndsAt, { addSuffix: true }) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">{proposal.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            by {proposal.proposer.slice(0, 8)}...{proposal.proposer.slice(-6)}
          </p>
        </div>
        <Badge variant={getStatusVariant(proposal.status)}>
          {STATUS_LABELS[proposal.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{proposal.description}</p>

        {/* Vote Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-600">For: {forPercentage}%</span>
            <span className="text-red-600">Against: {100 - forPercentage}%</span>
          </div>
          <div className="relative h-2 rounded-full bg-red-200 overflow-hidden">
            <div
              className="absolute h-full bg-green-600"
              style={{ width: `${forPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {proposal.tally.totalVoters} votes cast
          </p>
        </div>

        {/* Time / Actions */}
        <div className="flex items-center justify-between">
          {isActive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Ends {timeLeft}</span>
            </div>
          )}

          <Link href={`/governance/${proposal.id}`}>
            <Button variant={isActive ? 'default' : 'outline'}>
              {isActive ? (
                <>
                  <Vote className="mr-2 h-4 w-4" />
                  Vote
                </>
              ) : (
                'View Details'
              )}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusVariant(status: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case PROPOSAL_STATUS.ACTIVE:
      return 'default';
    case PROPOSAL_STATUS.PASSED:
    case PROPOSAL_STATUS.EXECUTED:
      return 'secondary';
    case PROPOSAL_STATUS.REJECTED:
      return 'destructive';
    default:
      return 'outline';
  }
}
```

#### Vote Modal

```typescript
// components/governance/vote-modal.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletStore } from '@/stores/wallet-store';
import { vote, getVotingPower } from '@/lib/aleo/governance';
import { TransactionStatus } from '@/components/transactions/tx-status';
import { ThumbsUp, ThumbsDown, Loader2, Info } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface VoteModalProps {
  proposalId: string;
  proposalTitle: string;
  open: boolean;
  onClose: () => void;
}

export function VoteModal({
  proposalId,
  proposalTitle,
  open,
  onClose,
}: VoteModalProps) {
  const { wallet } = useWalletStore();
  const queryClient = useQueryClient();

  const [selectedVote, setSelectedVote] = useState<boolean | null>(null);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const { data: votingPower } = useQuery({
    queryKey: ['voting-power', wallet?.address],
    queryFn: () => getVotingPower(wallet!),
    enabled: !!wallet && open,
  });

  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!wallet || selectedVote === null || !votingPower) {
        throw new Error('Missing required data');
      }
      return vote(wallet, proposalId, selectedVote, votingPower);
    },
    onSuccess: ({ txId }) => {
      setPendingTxId(txId);
    },
  });

  const handleTxConfirmed = () => {
    queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] });
    queryClient.invalidateQueries({ queryKey: ['has-voted', proposalId] });
    setTimeout(onClose, 2000);
  };

  const hasVotingPower = votingPower && votingPower > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cast Your Vote</DialogTitle>
          <DialogDescription>
            {proposalTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Voting Power */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your voting power: {formatNumber(votingPower || BigInt(0))} LP tokens
            </AlertDescription>
          </Alert>

          {!hasVotingPower && (
            <Alert variant="destructive">
              <AlertDescription>
                You need LP tokens to vote. Deposit liquidity to gain voting power.
              </AlertDescription>
            </Alert>
          )}

          {/* Vote Options */}
          {hasVotingPower && !pendingTxId && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={selectedVote === true ? 'default' : 'outline'}
                className={selectedVote === true ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setSelectedVote(true)}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                For
              </Button>
              <Button
                variant={selectedVote === false ? 'default' : 'outline'}
                className={selectedVote === false ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={() => setSelectedVote(false)}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Against
              </Button>
            </div>
          )}

          {/* Transaction Status */}
          {pendingTxId && (
            <TransactionStatus
              txId={pendingTxId}
              onConfirmed={handleTxConfirmed}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => voteMutation.mutate()}
            disabled={
              selectedVote === null ||
              !hasVotingPower ||
              voteMutation.isPending ||
              !!pendingTxId
            }
          >
            {voteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Vote'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Layer: Integration

| Deliverable | Purpose |
|-------------|---------|
| LP holders vote | Voting power from pool positions |
| Proposal passes | Majority vote determines outcome |
| Execution updates parameter | On-chain state changes |
| Protocol reflects change | Parameter update takes effect |

---

## Testable Outcomes

Wave 8 is testable with this end-to-end flow:

### E2E Test: Create Proposal → Vote → Execute → Parameter Changed

```
1. Connect wallet with LP tokens (from Wave 4)
2. Navigate to /governance/new
3. Create parameter change proposal
4. Wait for transaction confirmation
5. Vote on proposal (from same or different wallet)
6. Wait for voting period to end
7. Finalize proposal (anyone can call)
8. Wait for execution delay
9. Execute proposal
10. Verify parameter updated on-chain
```

### Contract Tests

```bash
cd contracts/governance
leo test

# Expected:
# ✓ test_create_proposal
# ✓ test_vote
# ✓ test_finalize_proposal_passed
# ✓ test_finalize_proposal_rejected
# ✓ test_execute_proposal
# ✓ test_cancel_proposal
# ✓ test_emergency_pause
# All tests passed!
```

### Integration Test

```typescript
// tests/integration/governance.test.ts
import { describe, it, expect } from 'vitest';
import { createProposal, vote, getProposal, getVoteTally } from '@/lib/aleo/governance';
import { deposit } from '@/lib/aleo/pool';
import { createTestWallet, waitForTx, advanceTime } from './helpers';

describe('Governance Integration', () => {
  let wallet: TestWallet;

  beforeAll(async () => {
    wallet = await createTestWallet();
    // Deposit to get voting power
    const { txId } = await deposit(wallet, 'flight_pool_001field', BigInt(1000_000_000));
    await waitForTx(txId);
  });

  it('creates and votes on proposal', async () => {
    // Create proposal
    const { txId: createTxId, proposalId } = await createProposal(wallet, {
      proposalType: 1,
      targetParam: 'min_deposit',
      proposedValue: BigInt(500_000_000),
      description: 'Reduce minimum deposit to 500',
      votingPeriodDays: 1,
    });
    await waitForTx(createTxId);

    // Verify proposal created
    const proposal = await getProposal(proposalId);
    expect(proposal?.status).toBe(1); // ACTIVE

    // Vote
    const { txId: voteTxId } = await vote(wallet, proposalId, true, BigInt(1000_000_000));
    await waitForTx(voteTxId);

    // Verify vote recorded
    const tally = await getVoteTally(proposalId);
    expect(tally?.votesFor).toBe(BigInt(1000_000_000));
  });
});
```

---

## Commands

```bash
# Build and test contract
cd contracts/governance
leo build
leo test

# Deploy to testnet
leo deploy --network testnet

# Run frontend
npm run dev
```

---

## Exit Criteria

Wave 8 is complete when:

| # | Criteria | Verification |
|---|----------|--------------|
| 1 | Contract compiles | `leo build` succeeds |
| 2 | Contract tests pass | `leo test` all green |
| 3 | Contract deployed | Transaction confirmed |
| 4 | Proposal creation works | Proposal on-chain |
| 5 | Voting works | Vote tallies update |
| 6 | Finalization works | Status updates |
| 7 | Execution works | Parameter changes |
| 8 | Governance UI complete | All pages functional |
| 9 | Vote modal works | Voting flow smooth |
| 10 | All 6 contracts deployed | Full protocol live |

---

## Next Wave Preview

**Wave 9: Polish & Security** will prepare for production:
- Security hardening and comprehensive tests
- Landing page redesign
- Error boundaries and loading states
- Mobile and accessibility audit
- E2E test suite
