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
