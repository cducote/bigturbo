# BigTurbo — Multi-Agent SaaS Workflow

A structured multi-agent workflow system for building SaaS applications with **Next.js**, **Neon/Postgres**, **Stripe**, and **Clerk**.

## What is this?

This repo provides a team of 10 specialized AI agents and operational workflows for building and maintaining SaaS applications. Instead of using a single AI assistant for everything, tasks are routed through specialized agents with clear ownership and handoff protocols.

## The Agent Team

| Agent | Responsibility |
|-------|---------------|
| **fullstack-developer** | End-to-end feature implementation |
| **api-designer** | API contracts, server actions, error models |
| **sql-pro** | Migrations, indexes, query performance |
| **code-reviewer** | Code quality, architecture review |
| **qa-expert** | Tests, test plans, regression coverage |
| **security-auditor** | Auth, tenant isolation, payment security |
| **devops-engineer** | Deployment, observability, runbooks |
| **dependency-manager** | Updates, CVEs, bundle optimization |
| **documentation-engineer** | User docs, support docs |
| **refactoring-specialist** | Code cleanup (no behavior changes) |

## Workflows

Four standard workflows for different types of work:

- **Loop A: Feature Delivery** — Full feature implementation with all agents
- **Loop B: Bugfix** — Streamlined bug reproduction and fix
- **Loop C: Migration** — Database schema changes with expand/contract pattern
- **Loop D: Maintenance** — Weekly updates, cleanup, and health checks

## Project Structure

```
.claude/
├── agents/          # 10 specialized agent definitions
│   ├── fullstack-developer.md
│   ├── api-designer.md
│   ├── sql-pro.md
│   ├── code-reviewer.md
│   ├── qa-expert.md
│   ├── security-auditor.md
│   ├── devops-engineer.md
│   ├── dependency-manager.md
│   ├── documentation-engineer.md
│   └── refactoring-specialist.md
└── commands/        # Quick-start workflow commands
    ├── feature.md
    ├── bugfix.md
    ├── migration.md
    └── maintenance.md

docs/ai/
├── AGENT_CHARTER.md    # Agent ownership & rules
├── HANDOFF_TEMPLATE.md # Standard handoff format
├── WORKFLOWS.md        # Detailed workflow definitions
└── CHECKLISTS.md       # Clerk/Stripe/Next.js checklists
```

## Quick Start

1. **For a new feature**: Use the handoff template in `docs/ai/HANDOFF_TEMPLATE.md`
2. **Follow the workflow**: See `docs/ai/WORKFLOWS.md` for the agent sequence
3. **Check the checklists**: Review `docs/ai/CHECKLISTS.md` before shipping

---

## Tutorials

### How to Use an Agent

When working with an AI assistant (Claude, Copilot, ChatGPT, etc.), reference the agent file:

```
I want you to act as the api-designer agent. 
Here are your instructions: [paste contents of .claude/agents/api-designer.md]

Now help me with: [your task]
```

Or if your AI tool supports file references:

```
Using the agent defined in .claude/agents/api-designer.md, 
design an API for user subscription management.
```

---

### Tutorial: Loop A — Feature Delivery

**Scenario**: You want to add a "Team Invitations" feature where users can invite others to their organization.

#### Step 1: Write the Handoff

Create a handoff document describing your feature:

```markdown
## Context
**Problem:** Users need to invite team members to their organization
**Area:** Clerk orgs, email sending, invite acceptance flow

## Acceptance Criteria
- [ ] Org admin can send email invites
- [ ] Invitee receives email with magic link
- [ ] Clicking link adds user to org
- [ ] Invite expires after 7 days

## Constraints
**Non-goals:** Bulk invites, CSV import

## Design Notes
**Clerk:** Organization invitations API
**Data:** invitations table (org_id, email, token, expires_at, accepted_at)
**API:** POST /api/invites, GET /api/invites/accept?token=xxx
```

#### Step 2: Run Through the Agents

**Agent 1 — api-designer:**
```
Using the api-designer agent, design the API for team invitations.

[paste your handoff]
```

Wait for the API design, then:

**Agent 2 — fullstack-developer:**
```
Using the fullstack-developer agent, implement this API design:

[paste the API design from previous step]
```

**Agent 3 — code-reviewer:**
```
Using the code-reviewer agent, review this implementation:

[paste the code or describe the changes]
```

**Agent 4 — qa-expert:**
```
Using the qa-expert agent, write tests for the team invitations feature:

[describe what was implemented]
```

**Agent 5 — security-auditor:**
```
Using the security-auditor agent, review the invitation flow for security issues:

- Invite tokens are stored in DB
- Emails are sent to arbitrary addresses
- Token acceptance adds user to org
```

**Agent 6 — devops-engineer:**
```
Using the devops-engineer agent, prepare the rollout plan:

- New env vars needed: RESEND_API_KEY
- New DB table: invitations
```

**Agent 7 — documentation-engineer:**
```
Using the documentation-engineer agent, write user-facing docs for team invitations.
```

#### Step 3: Ship It

Run through the [Clerk checklist](docs/ai/CHECKLISTS.md) before deploying.

---

### Tutorial: Loop B — Bugfix

**Scenario**: Users report that subscription status shows "active" even after they cancel.

#### Step 1: Describe the Bug

```markdown
## Bug
**Expected:** After canceling, subscription shows "canceled"
**Actual:** Subscription still shows "active"
**Repro:** Cancel subscription in Stripe dashboard, check app

## Affected Area
Stripe webhook handler, subscription status display
```

#### Step 2: Run Through the Agents

**Agent 1 — qa-expert:**
```
Using the qa-expert agent, help me reproduce this bug and write a failing test:

[paste bug description]
```

**Agent 2 — fullstack-developer:**
```
Using the fullstack-developer agent, fix this bug:

[paste bug description + failing test]
```

**Agent 3 — code-reviewer:**
```
Using the code-reviewer agent, review this bugfix:

[describe the fix]
```

**Agent 4 — qa-expert:**
```
Using the qa-expert agent, verify the fix and add regression tests:

[describe what was fixed]
```

#### Step 3: Verify with Stripe Checklist

Since this involves webhooks, check:
- [ ] Webhook signature verified
- [ ] `customer.subscription.updated` event handled
- [ ] Idempotency (duplicate events don't break state)

---

### Tutorial: Loop C — Migration

**Scenario**: You need to add a `usage_count` column to track API usage per organization.

#### Step 1: Describe the Migration

```markdown
## Schema Change
**Table:** organizations
**New Column:** usage_count (integer, default 0)
**Reason:** Track API calls for usage-based billing

## Data Impact
~500 existing orgs, all should start at 0
```

#### Step 2: Run Through the Agents

**Agent 1 — sql-pro:**
```
Using the sql-pro agent, write the migration for adding usage tracking:

[paste schema change description]
```

Output example:
```sql
-- Migration: add_usage_count_to_organizations
ALTER TABLE organizations 
ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_organizations_usage_count 
ON organizations(usage_count);
```

**Agent 2 — devops-engineer:**
```
Using the devops-engineer agent, plan the deployment:

- Adding non-nullable column with default
- ~500 rows affected
- Need to deploy code that uses this column after migration
```

**Agent 3 — fullstack-developer:**
```
Using the fullstack-developer agent, implement the usage tracking:

- Increment usage_count on each API call
- Display usage in dashboard
```

**Agent 4 — qa-expert:**
```
Using the qa-expert agent, test the migration:

- Test on empty DB
- Test on DB with existing orgs
- Test the increment logic
```

**Agent 5 — security-auditor:**
```
Using the security-auditor agent, verify tenant isolation:

- usage_count should only be visible to org members
- Increment should only happen for authenticated requests
```

#### Step 3: Deploy

1. Run migration in staging
2. Deploy code that uses new column
3. Verify in staging
4. Run migration in production
5. Deploy to production

---

### Tutorial: Loop D — Maintenance

**Scenario**: Weekly maintenance before a release.

#### Step 1: Define Scope

```markdown
## Maintenance Scope
- Check for dependency updates
- Address any CVEs
- Clean up unused code
- Fix flaky tests
```

#### Step 2: Run Through the Agents

**Agent 1 — dependency-manager:**
```
Using the dependency-manager agent, check for updates:

Current stack: Next.js 14, React 18, Stripe SDK, Clerk SDK
Last update: 2 weeks ago
```

**Agent 2 — refactoring-specialist:**
```
Using the refactoring-specialist agent, identify cleanup opportunities:

Focus areas:
- Remove unused imports
- Consolidate duplicate code
- Fix TypeScript any types
```

**Agent 3 — code-reviewer:**
```
Using the code-reviewer agent, review the maintenance changes:

[list the updates and refactoring done]
```

**Agent 4 — qa-expert:**
```
Using the qa-expert agent, run regression tests and identify flaky tests.
```

**Agent 5 — devops-engineer:**
```
Using the devops-engineer agent, check CI/CD health:

- Build times
- Flaky test patterns  
- Cache effectiveness
```

**Agent 6 — documentation-engineer:**
```
Using the documentation-engineer agent, check docs freshness:

- README accurate?
- API docs current?
- Any new features undocumented?
```

#### Step 3: Commit and Ship

All maintenance changes should be:
- Zero behavior change (refactoring only)
- All tests passing
- No new CVEs

---

## Tips for Success

1. **One agent at a time** — Complete each step before moving to the next
2. **Save the outputs** — Each agent's output feeds into the next
3. **Skip when appropriate** — Not every feature needs security-auditor
4. **Use the checklists** — Especially for Stripe/Clerk/auth work
5. **Ask for clarification** — Agents should stop when requirements are unclear

## Stack

- **Next.js** (App Router) — React framework
- **Neon/Postgres** — Serverless Postgres database
- **Stripe** — Payments and subscriptions
- **Clerk** — Authentication and user management

## Documentation

- [Agent Charter](docs/ai/AGENT_CHARTER.md) — Who does what, escalation rules, stop rules
- [Handoff Template](docs/ai/HANDOFF_TEMPLATE.md) — Standard format for task handoffs
- [Workflows](docs/ai/WORKFLOWS.md) — Step-by-step agent sequences
- [Checklists](docs/ai/CHECKLISTS.md) — Stack-specific security and quality checks

## Agent Source

Agents are sourced from [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents).
