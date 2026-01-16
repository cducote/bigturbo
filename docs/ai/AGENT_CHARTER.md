# Agent Charter

This document defines how the 10 Claude Code subagents are used in this project.

## The Team (10 Agents)

| Agent | Primary Responsibility |
|-------|----------------------|
| **fullstack-developer** | Implements end-to-end features (Next.js + Clerk + Stripe + Postgres) |
| **api-designer** | API contracts, server actions/route handlers shapes, error models |
| **sql-pro** | Migrations, indexes, query performance, data fixes |
| **code-reviewer** | Correctness, maintainability, architecture smells |
| **qa-expert** | Tests, test plans, regression coverage |
| **security-auditor** | Authz/tenant isolation, secrets, input validation, webhooks, payment integrity |
| **devops-engineer** | Env vars, deployment, observability, runbooks |
| **dependency-manager** | Upgrades, lockfiles, CVEs, bundle weight, breaking changes |
| **documentation-engineer** | User docs, support docs, runbook polish |
| **refactoring-specialist** | Cleanup passes (no behavior change) |

---

## Agent Output Requirements

Every agent must produce a **structured handoff** that includes:

1. **Summary** — What was done (1-2 sentences)
2. **Changes** — List of files modified/created with brief descriptions
3. **Decisions Made** — Any design decisions or tradeoffs chosen
4. **Open Questions** — Anything that needs human input or clarification
5. **Next Steps** — What the next agent or human should do
6. **Blockers** — Anything preventing progress (if applicable)

---

## Escalation Rules

### When to pull in `security-auditor`:
- Any change to authentication or authorization logic
- Changes to Clerk middleware or org/user permissions
- Any new API endpoint that handles sensitive data
- Database changes involving PII or tenant boundaries

### When to pull in `devops-engineer`:
- New environment variables required
- Changes to deployment configuration
- New external service integrations
- Database migration rollout planning
- Monitoring/alerting requirements

### When to pull in `documentation-engineer`:
- User-facing behavior changes
- New features that need documentation
- Breaking changes requiring migration guides
- Runbook updates for ops/support

### When to pull in `sql-pro`:
- Schema changes or migrations
- Query performance concerns
- Index optimization needed
- Data backfill requirements

---

## Stop Rules

Agents should **STOP and request human decision** when:

### General
- The task is ambiguous or requirements are unclear
- Multiple valid approaches exist with significant tradeoffs
- The change would break backwards compatibility
- Estimated scope significantly exceeds original task

### Security-specific
- A potential security vulnerability is discovered
- Unsure about correct authorization model
- PII handling is involved with unclear requirements

### Data-specific
- Destructive data operations are required
- Migrations could cause data loss
- Backfill operations affect production data

### Infrastructure-specific
- Cost implications are unclear
- Third-party service limits might be exceeded
- Downtime might be required

### Business-specific
- Product requirements conflict with technical constraints
- Legal/compliance implications are unclear
- Third-party licensing issues arise

---

## Handoff Protocol

1. **Before starting**: Read the handoff from the previous agent
2. **During work**: Keep notes on decisions and blockers
3. **After completing**: Write a structured handoff using the format above
4. **If blocked**: Immediately escalate with context, don't spin

---

## Agent Invocation

Agents are stored in `.claude/agents/` and can be invoked by referencing their name when working with Claude Code.

```
Example: "As the security-auditor, review this authentication flow..."
```

See [WORKFLOWS.md](./WORKFLOWS.md) for standard sequences of agent invocations.
